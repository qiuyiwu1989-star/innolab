// 案例库解析器
import fs from "node:fs";
import path from "node:path";

export interface CaseIndexEntry {
  id: string;
  title: string;
  domain: string[];
  tags: string[];
  related_methods: string[]; // 方法 ID 列表，eg ["ST06","GN02"]
  summary: string;
  added_date: string;
  file: string | null; // 相对于 cases/ 的路径，null 表示仅索引、无详情
  wiki_obj_token?: string;
  /**
   * 案例真实性：
   *   "real" = 邱懿武真实做过的项目/咨询（可作可信「引用源」对外展示）
   *   "demo" = 方法应用的虚拟演示场景（公司名/数字为示意，不冒充真实）
   * 默认全部 demo（保守诚实），真实案例由主人逐个点名升级为 real。
   */
  authenticity?: "real" | "demo";
}

/** 分析流程节点：还原一次完整的 InnoLab 推演 */
export interface CaseAnalysisFlow {
  /** 这个分析的背景一句话 */
  context?: string;
  /** 问题重构 */
  reframe: string;
  /** 调用的方法链（按顺序） */
  method_chain: {
    id: string;
    title: string;
    /** 为什么调它 */
    reasoning: string;
    /** 它揭示了什么 */
    reveals: string;
  }[];
  /** 综合判断 — 一段话 */
  key_judgment: string;
  /** 推演结论 — 行动项 */
  verdict: {
    kind: "do" | "dont";
    text: string;
  }[];
  /** 建议下一步 */
  next_step?: string;
}

export interface CaseDetail extends CaseIndexEntry {
  key_facts?: string[];
  insight?: string;
  applicable_to?: string;
  source?: string;
  added_by?: string;
  /** 新：完整分析流程的可视化数据 */
  analysis_flow?: CaseAnalysisFlow;
  // 允许其他扩展字段
  [key: string]: unknown;
}

const CASES_ROOT = path.join(process.cwd(), "cases");

let _index: CaseIndexEntry[] | null = null;
let _details: Map<string, CaseDetail> | null = null;

export function getCaseIndex(): CaseIndexEntry[] {
  if (_index) return _index;
  const raw = fs.readFileSync(
    path.join(CASES_ROOT, "case-index.json"),
    "utf8",
  );
  const parsed = JSON.parse(raw);
  _index = (parsed.cases ?? []) as CaseIndexEntry[];
  return _index;
}

/** 把所有详情文件加载进缓存（约 10 个文件，启动时一次性 OK） */
function loadDetails(): Map<string, CaseDetail> {
  if (_details) return _details;
  const map = new Map<string, CaseDetail>();
  for (const entry of getCaseIndex()) {
    if (!entry.file) {
      // 没详情文件：用索引项当详情
      map.set(entry.id, { ...entry });
      continue;
    }
    try {
      const filepath = path.join(CASES_ROOT, entry.file);
      const raw = fs.readFileSync(filepath, "utf8");
      const detail = JSON.parse(raw) as CaseDetail;
      // 合并：索引项做兜底，文件内容优先
      map.set(entry.id, { ...entry, ...detail });
    } catch (err) {
      console.warn(`[cases] failed to load ${entry.file}:`, err);
      map.set(entry.id, { ...entry });
    }
  }
  _details = map;
  return map;
}

export function getCaseById(id: string): CaseDetail | undefined {
  return loadDetails().get(id);
}

export function getAllCases(): CaseDetail[] {
  // 保持索引顺序；fallback 时把 CaseIndexEntry 拓宽成 CaseDetail
  const details = loadDetails();
  return getCaseIndex().map(
    (e) => details.get(e.id) ?? ({ ...e } as CaseDetail),
  );
}

/** 找出所有使用了给定 method ID 的案例 */
export function getCasesByMethodId(methodId: string): CaseDetail[] {
  return getAllCases().filter((c) =>
    (c.related_methods ?? []).includes(methodId.toUpperCase()),
  );
}

/** 收集全部 domain 标签做筛选 */
export function getAllDomains(): string[] {
  const set = new Set<string>();
  for (const c of getAllCases()) {
    for (const d of c.domain ?? []) set.add(d);
  }
  return Array.from(set).sort();
}

/**
 * 列表页专用：analysis_flow 只保留 key_judgment。
 *
 * 为什么要有它：完整的 analysis_flow 是整份推演过程，76 个案例加起来 247KB。
 * 列表页只显示 key_judgment 一行，把全量传给客户端组件时那 247KB 会被序列化进页面 ——
 * /cases 曾因此 gzip 后仍有 344KB、加载 19 秒。数据要跨到客户端组件时用这个。
 */
// 注意：不能写成 Omit<CaseDetail, "analysis_flow">。CaseDetail 带索引签名
// [key: string]: unknown，Omit 作用在这种类型上会把具名属性全塌陷成 unknown
// （domain / tags 会变成 {}）。所以从没有索引签名的 CaseIndexEntry 起手。
export type CaseListItem = CaseIndexEntry & {
  analysis_flow?: { key_judgment?: string };
};

export function getAllCasesLite(): CaseListItem[] {
  return getAllCases().map((c) => {
    const { analysis_flow, ...rest } = c;
    return {
      ...(rest as CaseIndexEntry),
      analysis_flow: analysis_flow
        ? { key_judgment: analysis_flow.key_judgment }
        : undefined,
    };
  });
}
