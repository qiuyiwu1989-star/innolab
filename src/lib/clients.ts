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
//
// 另有「通用暗号」机制（合作伙伴自助注册）：
//   INNOLAB_PASSCODES="innolab2026,partner-x"（逗号分隔，可多个）
//   在 /demo 工作台输暗号即可长期不限次。token / 暗号 都只在服务端校验。

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

/** 内置兜底暗号（仅当 INNOLAB_PASSCODES 未配置时生效） */
const FALLBACK_PASSCODES: string[] = ["innolab2026"];

let _cache: Map<string, Client> | null = null;
let _passcodeCache: Set<string> | null = null;

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

function loadPasscodes(): Map<string, string> {
  if (_passcodeCache) return _passcodeCache;
  const raw = process.env.INNOLAB_PASSCODES?.trim();
  const map = new Map<string, string>();
  if (raw) {
    // 逗号分隔，每项 "code=身份"；无 "=" 时身份回退为"授权用户"
    for (const item of raw.split(",")) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const code = trimmed.slice(0, eq).trim();
        const name = trimmed.slice(eq + 1).trim();
        if (code) map.set(code, name || "授权用户");
      } else {
        map.set(trimmed, "授权用户");
      }
    }
  } else {
    for (const [k, v] of Object.entries(FALLBACK_PASSCODES)) map.set(k, v);
  }
  _passcodeCache = map;
  return _passcodeCache;
}

/**
 * 统一访问校验：传入的值既可能是 VIP 客户令牌，也可能是通用暗号。
 * 返回授权标签（公司名 / "授权用户"）或 null（未授权）。
 * /api/analyze 和 /api/access 用它决定是否放行 + 豁免限流。
 */
export function validateAccess(
  token: string | null | undefined,
): { label: string } | null {
  if (!token) return null;
  const t = token.trim();
  if (!t) return null;
  const client = loadClients().get(t);
  if (client) return { label: client.name };
  const passName = loadPasscodes().get(t);
  if (passName) return { label: passName };
  return null;
}
