// InnoLab 远程 MCP 端点 —— https://innolab.cc/mcp
//
// 把邱懿武的战略推演能力做成「可被任何 agent 用 URL 调用」的 MCP 服务。
// 传输：Streamable HTTP，无状态 JSON（POST 一个 JSON-RPC 2.0 请求 → 一个 JSON 响应）。
// 不用会话/SSE，便于在 pm2/serverless 后端横向扩展，也最简单可靠。
//
// 鉴权（私有优先）：调用方必须带正确的 MCP key，否则 401。
//   · 请求头 Authorization: Bearer <key>   （Claude Desktop / 支持自定义头的客户端）
//   · 或 URL query ?key=<key>              （只能填 URL 的连接器；私有链接，可接受）
// 配置（服务器 .env.local，勿进 Git）：
//   INNOLAB_MCP_KEY=<随机长串>                    单 key，标签取 INNOLAB_MCP_LABEL 或默认「邱懿武」
//   INNOLAB_MCP_KEYS="k1=邱懿武;k2=造物云"        多 key=标签（分号分隔），优先于单 key
//   未配置任何 key → 端点返回 503（绝不默认开放）。

import { toolDefs, callTool, type ToolContext } from "@/lib/mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 深度推演可能较久；自托管 pm2 无 60s 限制

const SERVER_INFO = {
  name: "innolab",
  title: "InnoLab · 邱懿武战略推演",
  version: "1.0.0",
};

const INSTRUCTIONS =
  "InnoLab 是邱懿武的战略创新方法体系（6 引擎 86 方法 + 案例库）做成的推演能力。" +
  "面对战略/产品/商业模式/AI 转型/组织增长类难题时，用 innolab_analyze 做深度推演；" +
  "用 innolab_list_methods / innolab_get_method 探索方法；innolab_list_cases 找先例；" +
  "innolab_sediment 把新洞察回流。给的信息越具体，推演越有用。";

const SUPPORTED_PROTOCOL = "2025-06-18";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

// 深度推演可长达 2-3 分钟。若客户端接受 SSE，则把 tools/call 走事件流：
// 每 ~10s 吐一次保活/进度，避免 nginx proxy_read_timeout 掐断，也避免客户端因静默而超时；
// 结果作为最后一个 data 事件返回。非 SSE 客户端回落阻塞 JSON（nginx 已放宽到 300s）。
const SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
  ...CORS_HEADERS,
};

/* ───── 鉴权 ───── */

function loadKeys(): Map<string, string> | null {
  const multi = process.env.INNOLAB_MCP_KEYS?.trim();
  const single = process.env.INNOLAB_MCP_KEY?.trim();
  const map = new Map<string, string>();
  if (multi) {
    for (const pair of multi.split(";")) {
      const t = pair.trim();
      if (!t) continue;
      const eq = t.indexOf("=");
      if (eq > 0) map.set(t.slice(0, eq).trim(), t.slice(eq + 1).trim() || "MCP");
    }
  } else if (single) {
    map.set(single, process.env.INNOLAB_MCP_LABEL?.trim() || "邱懿武");
  }
  return map.size ? map : null;
}

/** 返回调用方标签；null=未配置(503)；undefined=鉴权失败(401) */
function authenticate(req: Request): { label: string } | null | undefined {
  const keys = loadKeys();
  if (!keys) return null; // 未配置
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const url = new URL(req.url);
  const qkey = url.searchParams.get("key")?.trim() ?? "";
  const provided = bearer || qkey;
  if (!provided) return undefined;
  const label = keys.get(provided);
  return label ? { label } : undefined;
}

/* ───── JSON-RPC 辅助 ───── */

type Id = string | number | null;

function rpcResult(id: Id, result: unknown) {
  return json({ jsonrpc: "2.0", id, result });
}
function rpcError(id: Id, code: number, message: string, httpStatus = 200) {
  return json({ jsonrpc: "2.0", id, error: { code, message } }, httpStatus);
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

/**
 * tools/call 的 SSE 版本：立刻回连接、每 10s 吐保活/进度、最后把结果作为 data 事件返回。
 * 保活让字节持续流动 → nginx 不掐、客户端不因静默超时。
 */
function streamToolCall(
  id: Id,
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
  params: Record<string, unknown> | undefined,
): Response {
  const meta = (params?._meta ?? {}) as Record<string, unknown>;
  const progressToken = meta.progressToken as string | number | undefined;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const write = (s: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(s));
        } catch {
          closed = true;
        }
      };
      const sendEvent = (obj: unknown) => write(`data: ${JSON.stringify(obj)}\n\n`);

      write(": connected\n\n"); // 立刻首字节，握手更快

      let ticks = 0;
      const ticker = setInterval(() => {
        ticks++;
        if (progressToken !== undefined) {
          sendEvent({
            jsonrpc: "2.0",
            method: "notifications/progress",
            params: {
              progressToken,
              progress: ticks,
              message: `InnoLab 推演生成中…（约 ${ticks * 10}s）`,
            },
          });
        } else {
          write(`: keep-alive ${ticks}\n\n`);
        }
      }, 10000);

      try {
        const result = await callTool(name, args, ctx);
        sendEvent({ jsonrpc: "2.0", id, result });
      } catch (err) {
        sendEvent({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : "internal error",
          },
        });
      } finally {
        clearInterval(ticker);
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

/* ───── HTTP 方法 ───── */

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// 无状态服务不提供 GET 的 server→client SSE 流
export function GET() {
  return json(
    { error: "InnoLab MCP：请用 POST 发送 JSON-RPC 2.0 请求。" },
    405,
  );
}

export async function POST(req: Request) {
  // 1. 鉴权
  const auth = authenticate(req);
  if (auth === null) {
    return json(
      { error: "MCP 未配置（服务器缺 INNOLAB_MCP_KEY）。" },
      503,
    );
  }
  if (auth === undefined) {
    return new Response(
      JSON.stringify({ error: "未授权：请提供有效的 MCP key（Authorization: Bearer 或 ?key=）。" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "WWW-Authenticate": 'Bearer realm="innolab-mcp"',
          ...CORS_HEADERS,
        },
      },
    );
  }
  const ctx: ToolContext = { label: auth.label };

  // 2. 解析 JSON-RPC
  let msg: { jsonrpc?: string; id?: Id; method?: string; params?: Record<string, unknown> };
  try {
    msg = await req.json();
  } catch {
    return rpcError(null, -32700, "Parse error: 请求体不是合法 JSON");
  }
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return rpcError(msg?.id ?? null, -32600, "Invalid Request: 需要 JSON-RPC 2.0 格式");
  }

  const { method, params } = msg;
  const id = (msg.id ?? null) as Id;
  const isNotification = msg.id === undefined || msg.id === null;

  // 3. 路由
  // 通知（无 id）：initialized / cancelled 等 —— 无需响应
  if (isNotification) {
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }

  switch (method) {
    case "initialize": {
      const clientProto =
        typeof params?.protocolVersion === "string" ? params.protocolVersion : "";
      return rpcResult(id, {
        protocolVersion: clientProto || SUPPORTED_PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, { tools: toolDefs() });

    case "tools/call": {
      const name = typeof params?.name === "string" ? params.name : "";
      const args =
        params?.arguments && typeof params.arguments === "object"
          ? (params.arguments as Record<string, unknown>)
          : {};
      if (!name) return rpcError(id, -32602, "Invalid params: 缺少工具名 name");

      // 客户端接受 SSE → 走事件流（保活 + 进度），避免长推演被超时掐断
      const accept = req.headers.get("accept") ?? "";
      if (accept.includes("text/event-stream")) {
        return streamToolCall(id, name, args, ctx, params);
      }
      // 回落：阻塞 JSON（依赖 nginx 300s 超时）
      const result = await callTool(name, args, ctx);
      return rpcResult(id, result);
    }

    // 未实现但常被探测的能力：返回空列表而非报错，兼容性更好
    case "resources/list":
      return rpcResult(id, { resources: [] });
    case "prompts/list":
      return rpcResult(id, { prompts: [] });

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
