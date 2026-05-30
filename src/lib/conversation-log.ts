// 对话落盘 — 飞轮燃料。把每次完整推演（prompt + output + 授权人 + 领域 + 时间）
// 追加写到服务器 JSONL 文件。用于：① 懂用户画像 ② 迭代引擎 ③ 沉淀成新案例。
//
// 零数据库、零依赖：append-only JSONL，每行一条 JSON。
// 文件位置：项目根 data/conversations.jsonl（不进 git；pm2 长进程可持续写）。
// 隐私：仅授权用户（暗号/VIP）能触发推演，属熟人场景；不存原始 IP，只存哈希。

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "conversations.jsonl");
const CANDIDATE_FILE = path.join(DATA_DIR, "candidate-cases.jsonl");

export interface ConversationRecord {
  ts: string;
  /** 授权标签：公司名 / "授权用户" */
  access_label: string;
  /** 领域过滤 key */
  domain: string;
  /** 来源：free / 某领域 key */
  source: string;
  /** 是否是续问（多轮） */
  is_follow_up: boolean;
  follow_up_kind: string | null;
  /** 用户问题原文 */
  prompt: string;
  /** AI 推演完整输出 */
  output: string;
  prompt_length: number;
  output_length: number;
  /** 哈希 IP（去重/防滥用用，不可还原） */
  ip_hash: string;
  /** 是否完整完成（含推演结论/追问方向）；中断片段为 false */
  completed?: boolean;
  /** 留资派生的稳定用户标识 → 按人归属画像（可能为空，旧数据/未留资） */
  user_key?: string;
}

/**
 * 追加一条对话记录到 JSONL。失败不抛错（不能因为日志写失败影响用户拿到推演结果）。
 */
export function appendConversation(rec: ConversationRecord): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, JSON.stringify(rec) + "\n", "utf8");
  } catch {
    /* 写失败静默 —— 飞轮燃料丢一条不影响业务 */
  }
}

/** 读取最近 N 条对话记录（倒序，最新在前）。供 /admin 看板用。 */
export function readRecentConversations(limit = 100): ConversationRecord[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const raw = fs.readFileSync(LOG_FILE, "utf8");
    const lines = raw.split("\n").filter((l) => l.trim());
    const recs: ConversationRecord[] = [];
    // 从尾部往前取 limit 条
    for (let i = lines.length - 1; i >= 0 && recs.length < limit; i--) {
      try {
        recs.push(JSON.parse(lines[i]) as ConversationRecord);
      } catch {
        /* 跳过损坏行 */
      }
    }
    return recs;
  } catch {
    return [];
  }
}

/** 统计：总对话数 + 按领域/授权人聚合。供看板概览。 */
export function conversationStats(): {
  total: number;
  byDomain: Record<string, number>;
  byLabel: Record<string, number>;
} {
  const byDomain: Record<string, number> = {};
  const byLabel: Record<string, number> = {};
  let total = 0;
  try {
    if (!fs.existsSync(LOG_FILE)) return { total: 0, byDomain, byLabel };
    const raw = fs.readFileSync(LOG_FILE, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line) as ConversationRecord;
        total += 1;
        byDomain[r.domain] = (byDomain[r.domain] ?? 0) + 1;
        byLabel[r.access_label] = (byLabel[r.access_label] ?? 0) + 1;
      } catch {
        /* skip */
      }
    }
  } catch {
    /* noop */
  }
  return { total, byDomain, byLabel };
}

// ── 洞察层：领域热度 + 高频关键词 + 完成率 ──────────────────────────────

const KEYWORD_STOPWORDS = new Set([
  "我们", "我想", "我的", "公司", "怎么", "如何", "应该", "可以", "没有",
  "现在", "已经", "但是", "还是", "这个", "那个", "什么", "为什么", "是否",
  "一个", "这样", "他们", "自己", "需要", "问题", "感觉", "比较", "关于",
  "来说", "或者", "因为", "所以", "这些", "那些", "就是", "不是", "如果",
  "产品", "战略", "团队", "用户", "市场", "怎样", "目前", "想做", "做的",
]);

/**
 * 洞察层聚合 —— 直接告诉运营者「大家都在愁什么」：
 *  - keywords: 高频关键词（从 prompt 提取 2-6 字中文 / 英文词，去停用词）
 *  - byDomainSorted: 领域热度降序
 *  - completionRate: 完整推演占比
 *  - followUpRate: 续问占比（用户愿意深聊 = 价值信号）
 */
export function conversationInsights(topK = 24) {
  const recs = readRecentConversations(100000);
  const total = recs.length;
  const kw: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  let completed = 0;
  let followUps = 0;

  for (const r of recs) {
    byDomain[r.domain] = (byDomain[r.domain] ?? 0) + 1;
    if (r.completed) completed += 1;
    if (r.is_follow_up) followUps += 1;
    // 关键词：中文 2-6 字片段 + 英文/数字词 ≥2
    const tokens = (r.prompt ?? "").match(/[一-龥]{2,6}|[a-zA-Z0-9]{2,}/g) ?? [];
    const seen = new Set<string>(); // 同一条 prompt 内同词只计一次
    for (const t of tokens) {
      const k = t.toLowerCase();
      if (KEYWORD_STOPWORDS.has(t) || k.length < 2) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      kw[k] = (kw[k] ?? 0) + 1;
    }
  }

  const keywords = Object.entries(kw)
    .filter(([, n]) => n >= 2) // 至少 2 条提到才算"高频"
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([word, count]) => ({ word, count }));

  const byDomainSorted = Object.entries(byDomain)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => ({ domain, count }));

  return {
    total,
    keywords,
    byDomainSorted,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    followUpRate: total ? Math.round((followUps / total) * 100) : 0,
  };
}

// ── 画像层：按人（user_key）聚合提问史 ──────────────────────────────────

import { readRegistrations } from "./registration-log";
import type { Registration } from "./registration-log";

export interface UserProfile {
  user_key: string;
  name: string;
  company: string;
  contact: string;
  contact_type: string;
  /** 总提问数 */
  count: number;
  /** 关注领域（降序） */
  domains: { domain: string; count: number }[];
  /** 最近一次活跃时间 */
  lastActive: string;
  /** 首次活跃时间 */
  firstActive: string;
  /** 该用户的全部对话（最新在前） */
  conversations: ConversationRecord[];
}

/**
 * 按 user_key 聚合出用户画像列表（关联注册留资信息）。
 * 没有 user_key 的旧/匿名对话归到一个 "anonymous" 桶。
 */
export function conversationProfiles(): UserProfile[] {
  const recs = readRecentConversations(100000); // 已是最新在前
  const regs = new Map<string, Registration>();
  for (const r of readRegistrations()) regs.set(r.user_key, r);

  const byUser = new Map<string, ConversationRecord[]>();
  for (const c of recs) {
    const key = c.user_key || "anonymous";
    if (!byUser.has(key)) byUser.set(key, []);
    byUser.get(key)!.push(c);
  }

  const profiles: UserProfile[] = [];
  for (const [key, convs] of byUser.entries()) {
    const reg = regs.get(key);
    const domainCount: Record<string, number> = {};
    for (const c of convs) {
      domainCount[c.domain] = (domainCount[c.domain] ?? 0) + 1;
    }
    const domains = Object.entries(domainCount)
      .sort((a, b) => b[1] - a[1])
      .map(([domain, count]) => ({ domain, count }));
    // convs 已最新在前
    profiles.push({
      user_key: key,
      name: reg?.name ?? (key === "anonymous" ? "匿名/早期" : "（未留资）"),
      company: reg?.company ?? "",
      contact: reg?.contact ?? "",
      contact_type: reg?.contact_type ?? "",
      count: convs.length,
      domains,
      lastActive: convs[0]?.ts ?? "",
      firstActive: convs[convs.length - 1]?.ts ?? "",
      conversations: convs,
    });
  }
  // 按活跃度（提问数）降序
  return profiles.sort((a, b) => b.count - a.count);
}

// ── 候选案例（飞轮第②圈：把高价值真实推演沉淀成案例库素材）──────────────

/** 已标记为候选案例的对话 ts 集合（去重用） */
export function candidateTsSet(): Set<string> {
  const set = new Set<string>();
  try {
    if (!fs.existsSync(CANDIDATE_FILE)) return set;
    const raw = fs.readFileSync(CANDIDATE_FILE, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line) as ConversationRecord;
        if (r.ts) set.add(r.ts);
      } catch {
        /* skip */
      }
    }
  } catch {
    /* noop */
  }
  return set;
}

/**
 * 把某条对话（按 ts 唯一定位）标记为候选案例：复制整条记录到 candidate-cases.jsonl。
 * 返回 true=成功标记，false=未找到或已存在。
 */
export function markCandidateByTs(ts: string): boolean {
  if (!ts) return false;
  if (candidateTsSet().has(ts)) return false; // 已标记
  const all = readRecentConversations(100000);
  const rec = all.find((r) => r.ts === ts);
  if (!rec) return false;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(CANDIDATE_FILE, JSON.stringify(rec) + "\n", "utf8");
    return true;
  } catch {
    return false;
  }
}

/** 候选案例数量 */
export function candidateCount(): number {
  return candidateTsSet().size;
}
