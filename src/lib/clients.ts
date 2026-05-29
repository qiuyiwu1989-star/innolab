// 咨询客户专属访问配置 — InnoLab 作为「咨询交付增强」的核心机制。
//
// 定位：InnoLab 是邱懿武咨询服务的增值件。签下一个咨询客户后，给他一个专属令牌，
// 凭令牌从 /c/<token> 进入：① 顶部显示「<公司> · 专属」标识 ② 推演不限次（豁免限流）。
//
// 配置方式（生产）：在服务器 .env.local 设置 INNOLAB_CLIENTS，格式：
//   INNOLAB_CLIENTS="vip-acme=Acme科技;vip-boyu=博宇资本"
//   （多个客户用分号分隔，token=公司名）
//
// 不配置时：仅内置一个测试客户 demo-vip（"测试客户"），用于验证机制。
// token 只在服务端校验，不在前端 HTML 暴露其他客户的 token —— 一个客户只知道自己的链接。

export interface Client {
  /** URL 令牌，作为 /c/<token> 的路径，也作为请求头校验值 */
  token: string;
  /** 公司/客户名，显示在专属页顶部 */
  name: string;
}

/** 内置兜底客户（仅当环境变量未配置时生效，用于本地/演示验证） */
const FALLBACK_CLIENTS: Client[] = [
  { token: "demo-vip", name: "测试客户" },
];

let _cache: Map<string, Client> | null = null;

function parseEnv(raw: string): Client[] {
  const out: Client[] = [];
  for (const pair of raw.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const token = trimmed.slice(0, eq).trim();
    const name = trimmed.slice(eq + 1).trim();
    if (token && name) out.push({ token, name });
  }
  return out;
}

function loadClients(): Map<string, Client> {
  if (_cache) return _cache;
  const raw = process.env.INNOLAB_CLIENTS?.trim();
  const list = raw ? parseEnv(raw) : FALLBACK_CLIENTS;
  _cache = new Map(list.map((c) => [c.token, c]));
  return _cache;
}

/** 校验令牌，返回客户信息或 null */
export function getClientByToken(token: string | null | undefined): Client | null {
  if (!token) return null;
  return loadClients().get(token.trim()) ?? null;
}

/** 列出所有客户令牌（用于 generateStaticParams 预渲染专属页） */
export function getAllClientTokens(): string[] {
  return Array.from(loadClients().keys());
}
