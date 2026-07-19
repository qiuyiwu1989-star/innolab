// 限流 — 内存 + 文件持久化（pm2/Node 长进程；Vercel serverless 用 Upstash 替换）。
//
// 公开化后的三档配额（哑铃战略的获取端护栏）：
//   - 匿名（未留资）：单 IP 每日 1 次（免费尝一发，用完引导留资）
//   - 已留资：单 IP 每日 5 次
//   - VIP 令牌 / 暗号：不限次（unlimitedResult，不走此逻辑）
//   - 全站每日 150 次（成本硬顶，防 API 费用失控）
// 均可用 env 覆盖：INNOLAB_DAILY_QUOTA_GLOBAL / _PER_IP / INNOLAB_FREE_ANON_PER_IP
//
// 持久化：每次写后异步刷盘到 rate-limit-state.json，pm2 重启后恢复计数。

import fs from "node:fs";
import path from "node:path";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const GLOBAL_DAILY = Number(process.env.INNOLAB_DAILY_QUOTA_GLOBAL ?? 150);
/** 已留资用户单 IP 每日额度 */
export const PER_IP_DAILY = Number(process.env.INNOLAB_DAILY_QUOTA_PER_IP ?? 5);
/** 匿名（未留资）单 IP 每日免费额度 */
export const ANON_PER_IP_DAILY = Number(
  process.env.INNOLAB_FREE_ANON_PER_IP ?? 1,
);

// 持久化状态文件路径（在项目根目录，不进 git）
const STATE_FILE = path.join(process.cwd(), "rate-limit-state.json");

interface Bucket {
  count: number;
  resetAt: number;
}

interface PersistedState {
  global: Bucket;
  ips: Record<string, Bucket>;
}

// ── 初始化（加载持久化状态）────────────────────────────────────────────────

function loadState(): PersistedState {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      global: parsed.global ?? { count: 0, resetAt: Date.now() + WINDOW_MS },
      ips: parsed.ips ?? {},
    };
  } catch {
    // 文件不存在或损坏 — 从零开始
    return {
      global: { count: 0, resetAt: Date.now() + WINDOW_MS },
      ips: {},
    };
  }
}

const _state = loadState();
let globalBucket: Bucket = _state.global;
const ipBuckets = new Map<string, Bucket>(
  Object.entries(_state.ips)
);

// ── 持久化（异步写，不阻塞请求）──────────────────────────────────────────────

let _saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave() {
  if (_saveTimer) return; // 去抖：100ms 内只写一次
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    // 只保留 resetAt 还没过期的 IP，清理旧数据（防文件膨胀）
    const now = Date.now();
    const ips: Record<string, Bucket> = {};
    for (const [ip, b] of ipBuckets.entries()) {
      if (b.resetAt > now) ips[ip] = b;
    }
    const payload: PersistedState = { global: globalBucket, ips };
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(payload));
    } catch {
      /* 写失败不影响业务，下次 reload 会重置 */
    }
  }, 100);
}

// ── 核心逻辑 ────────────────────────────────────────────────────────────────

function maybeReset(bucket: Bucket): Bucket {
  if (Date.now() >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = Date.now() + WINDOW_MS;
  }
  return bucket;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: "global_exhausted" | "ip_exhausted";
  remaining: { global: number; ip: number };
  resetAt: number;
}

/**
 * 咨询客户专属：豁免限流。
 * 客户已为咨询付费，InnoLab 是其交付增强工具，不应受公开配额限制。
 * 返回一个永远 allowed 的结果，remaining 用 -1 表示「不限次」。
 */
export function unlimitedResult(): RateLimitResult {
  return {
    allowed: true,
    remaining: { global: -1, ip: -1 },
    resetAt: Date.now() + WINDOW_MS,
  };
}

/**
 * 消耗一次配额。
 * @param ip 客户端 IP
 * @param perIpLimit 该请求适用的单 IP 每日上限（匿名传 ANON_PER_IP_DAILY，已留资传 PER_IP_DAILY）
 */
export function checkAndConsume(
  ip: string,
  perIpLimit: number = PER_IP_DAILY,
): RateLimitResult {
  globalBucket = maybeReset(globalBucket);
  const ipBucket = maybeReset(
    ipBuckets.get(ip) ?? { count: 0, resetAt: Date.now() + WINDOW_MS },
  );
  ipBuckets.set(ip, ipBucket);

  if (globalBucket.count >= GLOBAL_DAILY) {
    return {
      allowed: false,
      reason: "global_exhausted",
      remaining: {
        global: 0,
        ip: Math.max(0, perIpLimit - ipBucket.count),
      },
      resetAt: globalBucket.resetAt,
    };
  }
  if (ipBucket.count >= perIpLimit) {
    return {
      allowed: false,
      reason: "ip_exhausted",
      remaining: {
        global: Math.max(0, GLOBAL_DAILY - globalBucket.count),
        ip: 0,
      },
      resetAt: ipBucket.resetAt,
    };
  }

  globalBucket.count += 1;
  ipBucket.count += 1;

  // 异步持久化（不阻塞响应）
  scheduleSave();

  return {
    allowed: true,
    remaining: {
      global: Math.max(0, GLOBAL_DAILY - globalBucket.count),
      ip: Math.max(0, perIpLimit - ipBucket.count),
    },
    resetAt: ipBucket.resetAt,
  };
}

/** 从 Vercel / 标准代理头里提取客户端 IP */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anonymous";
}
