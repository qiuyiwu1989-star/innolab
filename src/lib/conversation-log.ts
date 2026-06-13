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
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.jsonl");

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

// ── 个性化记忆（飞轮第①圈：让产品「记得」回头用户，越用越懂这个人）──────────

const DOMAIN_LABEL: Record<string, string> = {
  "ai-transform": "AI 转型",
  product: "产品",
  "ip-content": "IP / 内容",
  org: "组织",
  strategy: "战略",
  all: "综合",
  free: "自由",
  unknown: "战略",
};

export interface UserMemory {
  /** 是否有可用记忆（来过且有历史） */
  hasMemory: boolean;
  name: string;
  /** 关注领域的可读标签，最多 3 个，如 ["战略","产品"] */
  focusLabels: string[];
  /** 历史提问次数 */
  count: number;
  /** 注入推演上下文的「记忆摘要」——最近 2 次的问题 + 判断精华 */
  contextSummary: string;
}

/**
 * 按 user_key 取该用户的「记忆」：用于
 *   ① 顶部「欢迎回来 X，记得你在关注…」横幅
 *   ② 推演时作为上下文注入，让 AI 真的记得他之前在想什么
 * 取最近 2 次推演（含完整判断/落地段）做精华，避免过长 + 串味。
 */
export function getMemoryForUser(userKey: string): UserMemory {
  const empty: UserMemory = {
    hasMemory: false,
    name: "",
    focusLabels: [],
    count: 0,
    contextSummary: "",
  };
  if (!userKey || !userKey.trim()) return empty;

  const all = readRecentConversations(100000); // 最新在前
  const mine = all.filter((c) => c.user_key === userKey);
  if (mine.length === 0) {
    // 没有对话历史，但可能注册过 → 至少认得名字
    const reg = readRegistrations().find((r) => r.user_key === userKey);
    if (!reg) return empty;
    return { ...empty, hasMemory: false, name: reg.name };
  }

  const reg = readRegistrations().find((r) => r.user_key === userKey);
  const name = reg?.name ?? "";

  // 关注领域 top 3
  const domainCount: Record<string, number> = {};
  for (const c of mine) domainCount[c.domain] = (domainCount[c.domain] ?? 0) + 1;
  const focusLabels = Object.entries(domainCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d]) => DOMAIN_LABEL[d] ?? d)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  // 最近 2 次推演的「问题 + 判断/落地精华」做记忆摘要（注入用）
  const recent = mine.slice(0, 2);
  const parts = recent.map((c) => {
    const out = c.output ?? "";
    const judge =
      out.match(/##\s*(?:我的判断|关键判断)\s*\n+([\s\S]*?)(?=\n##|$)/)?.[1] ??
      "";
    const summary = judge.trim().slice(0, 200);
    return `· 上次问："${(c.prompt ?? "").slice(0, 60)}"${summary ? `\n  当时的核心判断：${summary}` : ""}`;
  });

  return {
    hasMemory: true,
    name,
    focusLabels,
    count: mine.length,
    contextSummary: parts.join("\n"),
  };
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

// ── 质量层（飞轮第③圈：用 👍/👎 反馈反推优化引擎）──────────────

export interface FeedbackRecord {
  ts: string;
  kind: "up" | "down";
  /** 被评价的问题（前 500 字）*/
  prompt: string;
  domain?: string;
  /** 👎 时用户的吐槽，最有价值 */
  note?: string;
  ip_hash?: string;
}

/** 落盘一条反馈 */
export function appendFeedback(rec: FeedbackRecord): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(FEEDBACK_FILE, JSON.stringify(rec) + "\n", "utf8");
  } catch {
    /* 落盘失败不影响业务 */
  }
}

/** 读全部反馈 */
export function readFeedback(): FeedbackRecord[] {
  try {
    if (!fs.existsSync(FEEDBACK_FILE)) return [];
    return fs
      .readFileSync(FEEDBACK_FILE, "utf8")
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        try {
          return JSON.parse(l) as FeedbackRecord;
        } catch {
          return null;
        }
      })
      .filter((r): r is FeedbackRecord => !!r);
  } catch {
    return [];
  }
}

/**
 * 质量层汇总：总赞/踩数 + 所有 👎（含吐槽,按时间倒序）。
 * 👎 是迭代引擎最直接的信号 —— 哪些 prompt 答得差、用户嫌哪里不对。
 */
export function feedbackQuality(): {
  up: number;
  down: number;
  downs: FeedbackRecord[];
} {
  const all = readFeedback();
  const up = all.filter((f) => f.kind === "up").length;
  const down = all.filter((f) => f.kind === "down").length;
  const downs = all
    .filter((f) => f.kind === "down")
    .sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return { up, down, downs };
}

// ── 方法使用统计（方法库的飞轮：哪些方法常用、哪些是僵尸、缺什么方法）──────────

/** 从一段推演 output 里提取实际用到的方法 ID（兼容「## 本次方法」行 + ### 标题） */
function extractMethodIdsFromOutput(output: string): string[] {
  const ids: string[] = [];
  const tag = output.match(/##\s*本次方法\s*\n+([\s\S]*?)(?=\n##|$)/);
  if (tag) ids.push(...(tag[1].match(/[A-Z]{2}\d{2}/g) ?? []));
  ids.push(
    ...(output.match(/###\s+([A-Z]{2}\d{2})/g) ?? []).map((m) =>
      m.replace(/###\s+/, "").trim(),
    ),
  );
  return Array.from(new Set(ids));
}

export interface MethodUsage {
  /** 全部方法 ID → 被真实推演调用的次数（含 0） */
  counts: { id: string; titleCn: string; count: number }[];
  /** 从未被调用的「僵尸方法」 */
  zombies: { id: string; titleCn: string }[];
  /** 推演调用过、但方法库里不存在的 ID（AI 可能引用了不存在的方法 → 需排查/补充） */
  unknownIds: string[];
  totalRuns: number;
}

/**
 * 统计方法被真实推演调用的次数。
 * 入参 allMethods 由调用方传入（避免 lib 层互相 import 造成耦合）。
 */
export function methodUsageStats(
  allMethods: { id: string; titleCn: string }[],
): MethodUsage {
  const known = new Map(allMethods.map((m) => [m.id, m.titleCn]));
  const count = new Map<string, number>();
  const unknown = new Set<string>();

  const convs = readRecentConversations(100000);
  let totalRuns = 0;
  for (const c of convs) {
    const ids = extractMethodIdsFromOutput(c.output ?? "");
    if (ids.length === 0) continue;
    totalRuns += 1;
    for (const id of ids) {
      if (known.has(id)) count.set(id, (count.get(id) ?? 0) + 1);
      else unknown.add(id);
    }
  }

  const counts = allMethods
    .map((m) => ({ id: m.id, titleCn: m.titleCn, count: count.get(m.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const zombies = counts
    .filter((c) => c.count === 0)
    .map((c) => ({ id: c.id, titleCn: c.titleCn }));

  return { counts, zombies, unknownIds: Array.from(unknown), totalRuns };
}
