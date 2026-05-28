// InnoLab demo 历史 — 纯 localStorage，不需要后端。
// 存最近 10 个分析结果，让用户能"回去看"。

const STORAGE_KEY = "innolab.demo.history.v1";
const MAX_ITEMS = 10;

export interface HistoryItem {
  /** 短 ID（时间戳 + 随机） */
  id: string;
  /** 用户原始 prompt */
  prompt: string;
  /** 来源领域（all / ai-transform / ...） */
  domain: string;
  /** AI 输出的完整 markdown */
  output: string;
  /** 完成时间戳 (ISO) */
  ts: string;
}

function isClient(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeParse(raw: string | null): HistoryItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter(isValid);
    return [];
  } catch {
    return [];
  }
}

function isValid(x: unknown): x is HistoryItem {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as HistoryItem).id === "string" &&
    typeof (x as HistoryItem).prompt === "string" &&
    typeof (x as HistoryItem).output === "string" &&
    typeof (x as HistoryItem).ts === "string"
  );
}

export function readHistory(): HistoryItem[] {
  if (!isClient()) return [];
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function appendToHistory(item: Omit<HistoryItem, "id" | "ts">): HistoryItem {
  const full: HistoryItem = {
    ...item,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toISOString(),
  };
  if (!isClient()) return full;
  try {
    const existing = readHistory();
    // 去重：同 prompt 替换为新输出（避免历史堆满重复）
    const filtered = existing.filter(
      (h) => h.prompt.trim() !== full.prompt.trim(),
    );
    const next = [full, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota exceeded or other — silently ignore */
  }
  return full;
}

export function removeFromHistory(id: string) {
  if (!isClient()) return;
  try {
    const next = readHistory().filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

export function clearHistory() {
  if (!isClient()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/** 生成可分享链接：URL with ?q= prefill */
export function buildShareUrl(prompt: string, domain?: string): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams();
  params.set("q", prompt);
  if (domain && domain !== "all") params.set("d", domain);
  const base = `${window.location.origin}/demo`;
  return `${base}?${params.toString()}`;
}
