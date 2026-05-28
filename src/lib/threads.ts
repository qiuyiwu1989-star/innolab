// InnoLab thread 模型 — 让分析可以续写。
// localStorage only（无后端） — auth/DB 留到 v2.0。

const STORAGE_KEY = "innolab.threads.v1";
const MAX_THREADS = 8;
const MAX_MSG_PER_THREAD = 12;

export interface ThreadMessage {
  id: string;
  prompt: string;
  output: string;
  ts: string;
  /** 这条消息是哪类后续 */
  followUpKind?: "deeper" | "angle" | "method" | null;
}

export interface Thread {
  id: string;
  /** 起始领域 */
  domain: string;
  /** 起始 prompt（用于历史栏展示） */
  rootPrompt: string;
  messages: ThreadMessage[];
  startedAt: string;
  updatedAt: string;
}

function isClient(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function safeParse(raw: string | null): Thread[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(isValidThread) : [];
  } catch {
    return [];
  }
}

function isValidThread(x: unknown): x is Thread {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as Thread).id === "string" &&
    Array.isArray((x as Thread).messages)
  );
}

function persist(threads: Thread[]) {
  if (!isClient()) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(threads.slice(0, MAX_THREADS)),
    );
  } catch {
    /* quota — ignore */
  }
}

/* ───── 读 ───── */

export function readThreads(): Thread[] {
  if (!isClient()) return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function getThread(id: string): Thread | undefined {
  return readThreads().find((t) => t.id === id);
}

/* ───── 写 ───── */

export function startThread(opts: {
  prompt: string;
  domain: string;
  output: string;
}): Thread {
  const now = new Date().toISOString();
  const t: Thread = {
    id: makeId("thr"),
    domain: opts.domain,
    rootPrompt: opts.prompt,
    startedAt: now,
    updatedAt: now,
    messages: [
      {
        id: makeId("msg"),
        prompt: opts.prompt,
        output: opts.output,
        ts: now,
      },
    ],
  };
  const all = readThreads();
  persist([t, ...all]);
  return t;
}

export function appendToThread(
  threadId: string,
  msg: {
    prompt: string;
    output: string;
    followUpKind?: "deeper" | "angle" | "method" | null;
  },
): Thread | null {
  const all = readThreads();
  const idx = all.findIndex((t) => t.id === threadId);
  if (idx < 0) return null;
  const t = all[idx];
  const message: ThreadMessage = {
    id: makeId("msg"),
    prompt: msg.prompt,
    output: msg.output,
    ts: new Date().toISOString(),
    followUpKind: msg.followUpKind ?? null,
  };
  const updated: Thread = {
    ...t,
    updatedAt: message.ts,
    messages: [...t.messages, message].slice(-MAX_MSG_PER_THREAD),
  };
  const next = [updated, ...all.filter((_, i) => i !== idx)];
  persist(next);
  return updated;
}

export function removeThread(id: string) {
  const next = readThreads().filter((t) => t.id !== id);
  persist(next);
}

export function clearAllThreads() {
  if (!isClient()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/* ───── 上下文构建 — 给 AI 后端用 ───── */

/** 把前面消息压缩成精要 — 用于 prompt 续写时的 prior context */
export function buildPriorSummary(thread: Thread, maxChars = 1500): string {
  if (thread.messages.length === 0) return "";
  // 取最近 2 条
  const recent = thread.messages.slice(-2);
  const parts: string[] = [];
  for (const m of recent) {
    parts.push(`【之前问】${m.prompt}`);
    // 只取每条 output 的 "关键判断" + "推演结论" 段，这是最浓的精华
    const condensed = extractEssence(m.output);
    parts.push(`【InnoLab 的回答精要】${condensed}`);
  }
  const joined = parts.join("\n\n");
  return joined.length > maxChars
    ? joined.slice(0, maxChars) + "..."
    : joined;
}

/** 从完整 markdown 输出里提取"关键判断 + 推演结论" */
function extractEssence(output: string): string {
  const judgmentMatch = output.match(/##\s*关键判断\s*\n+([\s\S]*?)(?=\n##|$)/);
  const verdictMatch = output.match(/##\s*推演结论\s*\n+([\s\S]*?)(?=\n##|$)/);
  const parts: string[] = [];
  if (judgmentMatch) parts.push(`关键判断：${judgmentMatch[1].trim()}`);
  if (verdictMatch) parts.push(`推演结论：${verdictMatch[1].trim()}`);
  if (parts.length === 0) {
    // fallback：截取最后 600 字
    return output.slice(-600);
  }
  return parts.join("\n");
}

/** 从输出里抽取被引用的方法 ID（用于"深入方法"按钮） */
export function extractMethodIds(output: string): string[] {
  const matches = output.match(/###\s+([A-Z]{2}\d{2})/g) ?? [];
  const ids = matches.map((m) => m.replace(/###\s+/, "").trim());
  // 去重保序
  return Array.from(new Set(ids));
}
