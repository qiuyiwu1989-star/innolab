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
}

export interface CaseDetail extends CaseIndexEntry {
  key_facts?: string[];
  insight?: string;
  applicable_to?: string;
  source?: string;
  added_by?: string;
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
