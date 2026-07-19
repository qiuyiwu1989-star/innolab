# InnoLab MCP：把「战略推演能力」做成可被调用的原语

> 状态：Phase 1（私有优先）已实现 · 日期 2026-07

## 0. 为什么做

InnoLab 真正的资产不是网站，是**那套 6 引擎 83 方法的战略推演能力**。网站只是它的一个界面。
MCP 让这套能力从界面里解耦出来，变成一个**可被任何 agent 用 URL 调用的原语**：

- 网站 `/demo` = 人来自助的界面
- Consultant Mode（规划中）= 邱懿武现场调用它
- **MCP `/mcp` = 任何 agent（自己的或别人的）调用它**
- 飞轮 = 所有这些调用都把数据沉淀回来（越用越聪明）

MCP 还顺手补上了飞轮缺的那根油管：`innolab_analyze` **每次被调用都沉淀回 Supabase**，
喂数据不再只依赖真人来网站，而是机器程序化调用。

## 1. 定位：私有优先

第一批调用者是**邱懿武自己的生态**（自己的 Claude、deepagent、造物云其它项目），不是满世界公开。
所以鉴权就是一把 key：

- 不配 key → `/mcp` 返回 503（**绝不默认开放**）
- 配 `INNOLAB_MCP_KEY` → 调用方须带正确 key，否则 401

对外开放（OAuth / 限流 / 防滥用 / IP 输出治理）是 Phase 2，按需再上。

## 2. 传输与协议

- 端点：`https://innolab.cc/mcp`
- 传输：**Streamable HTTP，无状态 JSON**——POST 一个 JSON-RPC 2.0 请求 → 一个 JSON 响应。
  不用会话/SSE：最简单、可靠、易横向扩展。
- 协议版本：`2025-06-18`（`initialize` 时回显客户端请求的版本）
- 实现：手写 JSON-RPC 路由（`src/app/mcp/route.ts`），零额外依赖，完全可 curl 测。
- 支持的方法：`initialize` / `ping` / `tools/list` / `tools/call` /
  `resources/list`（空）/ `prompts/list`（空）/ 通知（如 `notifications/initialized`）→ 202。

### 鉴权两种传法
- 请求头 `Authorization: Bearer <key>`（Claude Desktop / 支持自定义头的客户端）
- URL query `?key=<key>`（只能填 URL 的连接器；私有链接，可接受）

## 3. 工具清单（`src/lib/mcp/tools.ts`）

| 工具 | 作用 | 写? |
|---|---|---|
| `innolab_analyze` | 跑一次深度战略推演（核心能力）。支持 `domain` / `emphasis_methods`（指定强调的方法）/ `client_name`（为 X 定制）。**每次调用沉淀回飞轮**。 | 写（沉淀） |
| `innolab_list_methods` | 列/筛 83 方法（id·标题·引擎·层级·一句话） | 只读 |
| `innolab_get_method` | 取某方法完整卡片 + 人类讲解版 | 只读 |
| `innolab_list_cases` | 列/筛案例库（按方法/领域/关键词） | 只读 |
| `innolab_sediment` | 把外部洞察/案例沉淀回飞轮（候选，待人工晋升） | 写 |

工具层复用现有引擎（`innolab-engine.ts` 新增 `analyzeToText` 非流式包装 + `emphasisMethods`/`clientName` 注入）、
方法库、案例库、飞轮沉淀（`appendConversation`，`source=mcp` / `mcp-sediment`）。

## 4. 配置（服务器 .env.local，勿进 Git）

```
INNOLAB_MCP_KEY=<随机长串>          # 单 key
INNOLAB_MCP_LABEL=邱懿武            # 该 key 的调用方标签（写进沉淀记录）
# 或多 key=标签：
INNOLAB_MCP_KEYS="k1=邱懿武;k2=造物云"
```

改完 `pm2 restart innolab --update-env` 生效。

## 5. 怎么连

- **Claude Desktop / 支持远程 MCP 的客户端**：加一个 remote/HTTP MCP server，
  URL `https://innolab.cc/mcp`，鉴权头 `Authorization: Bearer <key>`。
- **只能填 URL 的连接器**：用 `https://innolab.cc/mcp?key=<key>`。
- **自测**：`curl -s -X POST https://innolab.cc/mcp -H 'Authorization: Bearer <key>'
  -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`

## 6. Phase 2（按需，勿提前造）

- 对外开放：OAuth + 限流 + 防滥用；推演 IP 输出治理（署名/脱敏）。
- 结构化输出：给工具加 `outputSchema` + `structuredContent`。
- 与飞轮 Phase 2（pgvector 语义检索）合流：MCP 调用量成为检索燃料。
