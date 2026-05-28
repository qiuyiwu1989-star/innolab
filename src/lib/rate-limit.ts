// 极简限流：内存兜底（每个 serverless 实例独立）。
// 真正生产用 Upstash Redis 替换，接口保持不变。
//
// 默认配额：
//   - 全站每日 50 次（防止 API 费用失控）
//   - 单 IP 每日 5 次（防止单人刷屏）

const WINDOW_MS = 24 * 60 * 60 * 1000;

const GLOBAL_DAILY = Number(process.env.INNOLAB_DAILY_QUOTA_GLOBAL ?? 50);
const PER_IP_DAILY = Number(process.env.INNOLAB_DAILY_QUOTA_PER_IP ?? 5);

interface Bucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, Bucket>();
let globalBucket: Bucket = { count: 0, resetAt: Date.now() + WINDOW_MS };

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

export function checkAndConsume(ip: string): RateLimitResult {
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
        ip: Math.max(0, PER_IP_DAILY - ipBucket.count),
      },
      resetAt: globalBucket.resetAt,
    };
  }
  if (ipBucket.count >= PER_IP_DAILY) {
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
  return {
    allowed: true,
    remaining: {
      global: Math.max(0, GLOBAL_DAILY - globalBucket.count),
      ip: Math.max(0, PER_IP_DAILY - ipBucket.count),
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
