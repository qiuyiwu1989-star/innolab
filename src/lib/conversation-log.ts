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
