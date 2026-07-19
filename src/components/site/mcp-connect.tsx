"use client";

// MCP 对接助手（/mcp-guide 页用）。
// 关键：key 只在浏览器本地替换进连接串，绝不上传、也不写进公开页面 HTML。
// 空着时显示占位符 <你的KEY>；粘贴后连接串实时拼好、可一键复制。

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const ENDPOINT = "https://innolab.cc/mcp";
const PLACEHOLDER = "<你的KEY>";

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* 剪贴板不可用时静默——用户可手动选中复制 */
        }
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-fog-2 bg-soot px-2.5 py-1 text-xs text-dust transition-colors hover:border-volt hover:text-volt"
      aria-label="复制"
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? "已复制" : "复制"}
    </button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="numeral text-xs uppercase tracking-widest text-dust">
          {label}
        </span>
        <CopyButton text={value} />
      </div>
      <pre className="overflow-x-auto rounded-lg border border-fog-2 bg-ink px-3.5 py-3 text-xs leading-relaxed text-ash">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export function McpConnect() {
  const [key, setKey] = useState("");
  const k = key.trim() || PLACEHOLDER;

  const connectorUrl = `${ENDPOINT}?key=${k}`;
  const curl = `curl -N -X POST ${ENDPOINT} \\
  -H "Authorization: Bearer ${k}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

  return (
    <div className="rounded-2xl border border-fog-2 bg-soot/40 p-5 sm:p-6">
      <label className="block">
        <span className="numeral text-xs uppercase tracking-widest text-volt">
          ① 粘贴你的 MCP key
        </span>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="ilmcp_…（只在本页替换，不上传、不保存）"
          spellCheck={false}
          autoComplete="off"
          className="mt-2 w-full rounded-lg border border-fog-2 bg-ink px-3.5 py-2.5 font-mono text-sm text-bone placeholder:text-dust/60 focus:border-volt focus:outline-none"
        />
      </label>
      <p className="mt-2 text-xs text-dust">
        key 是私有凭证，只有你有（存在服务器 <code className="text-ash">.env.local</code>）。
        这里输入的值只在你浏览器里替换进下面的连接串，<strong className="text-ash">不会发送到任何服务器</strong>。
      </p>

      <div className="mt-6 space-y-5">
        <Field
          label="② A · claude.ai 连接器（只能填 URL 的客户端）"
          value={connectorUrl}
        />
        <div>
          <div className="numeral mb-1.5 text-xs uppercase tracking-widest text-dust">
            ② B · Claude Desktop / 能设请求头的 agent
          </div>
          <div className="space-y-2">
            <Field label="URL" value={ENDPOINT} />
            <Field label="请求头 Header" value={`Authorization: Bearer ${k}`} />
          </div>
        </div>
        <Field label="③ 命令行自测（应返回 5 个工具）" value={curl} />
      </div>
    </div>
  );
}
