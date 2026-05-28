// 解析 InnoLab 结构化日志（pm2 logs / vercel logs / 任何 stdout 输出）。
// 不依赖外部数据库，按时间窗口扫文件。
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface AnalyzeEvent {
  ts: string; // ISO 8601
  event: "analyze.request" | string;
  domain?: string;
  source?: string;
  prompt_length?: number;
  ip_hash?: string;
  allowed?: boolean;
  reason?: string;
  remaining_global?: number;
  remaining_ip?: number;
}

/** 解析一行 pm2 输出，提取嵌入的 JSON 事件（如果有） */
function parseLine(line: string): AnalyzeEvent | null {
  // pm2 stdout 行形如：`2|innolab  | {"app":"innolab",...}`
  // 也可能是纯 JSON（直接 console.log）
  const jsonStart = line.indexOf("{");
  if (jsonStart < 0) return null;
  const tail = line.slice(jsonStart);
  try {
    const parsed = JSON.parse(tail);
    if (parsed && typeof parsed === "object" && "event" in parsed) {
      return parsed as AnalyzeEvent;
    }
    return null;
  } catch {
    return null;
  }
}

/** 候选日志路径，按顺序尝试 */
function getCandidatePaths(): string[] {
  const fromEnv = process.env.INNOLAB_LOG_PATH;
  if (fromEnv) return [fromEnv];
  return [
    path.join(os.homedir(), ".pm2", "logs", "innolab-out.log"),
    path.join(os.homedir(), ".pm2", "logs", "innolab-out-2.log"),
    // Vercel 不写文件，本地兜底
    "/tmp/innolab-events.log",
  ];
}

/**
 * 读最近 N 行（avoiding loading huge files into memory）。
 * 用 fs.readFileSync 加 stat 控制规模。
 */
function tailLines(filePath: string, maxBytes = 5 * 1024 * 1024): string[] {
  try {
    const stat = fs.statSync(filePath);
    const size = stat.size;
    const start = Math.max(0, size - maxBytes);
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    return buf.toString("utf8").split("\n");
  } catch {
    return [];
  }
}

/**
 * 读取近期分析事件。
 * - 自动发现日志文件
 * - 限制扫描规模（最多 5MB 尾部）
 * - 过滤出 analyze.request 事件
 */
export function readRecentEvents(): {
  events: AnalyzeEvent[];
  source: string | null;
} {
  const candidates = getCandidatePaths();
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const lines = tailLines(filePath);
    const events: AnalyzeEvent[] = [];
    for (const line of lines) {
      const ev = parseLine(line);
      if (ev && ev.event === "analyze.request") {
        events.push(ev);
      }
    }
    return { events, source: filePath };
  }
  return { events: [], source: null };
}

/** 时间桶 — 按天聚合 */
export function bucketByDay(events: AnalyzeEvent[]): {
  date: string;
  total: number;
  allowed: number;
  blocked: number;
}[] {
  const buckets = new Map<
    string,
    { total: number; allowed: number; blocked: number }
  >();
  for (const ev of events) {
    const day = ev.ts.slice(0, 10); // YYYY-MM-DD
    const b = buckets.get(day) ?? { total: 0, allowed: 0, blocked: 0 };
    b.total += 1;
    if (ev.allowed === false) b.blocked += 1;
    else b.allowed += 1;
    buckets.set(day, b);
  }
  return Array.from(buckets.entries())
    .map(([date, b]) => ({ date, ...b }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function bucketByDomain(events: AnalyzeEvent[]): {
  domain: string;
  count: number;
}[] {
  const map = new Map<string, number>();
  for (const ev of events) {
    const d = ev.domain ?? "unknown";
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
}

export function uniqueIps(events: AnalyzeEvent[]): number {
  const set = new Set<string>();
  for (const ev of events) {
    if (ev.ip_hash) set.add(ev.ip_hash);
  }
  return set.size;
}

export function eventsInLast(
  events: AnalyzeEvent[],
  ms: number,
): AnalyzeEvent[] {
  const cutoff = Date.now() - ms;
  return events.filter((e) => {
    const t = new Date(e.ts).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}
