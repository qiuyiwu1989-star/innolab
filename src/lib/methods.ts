// 方法卡解析器 - 在构建时读取 methods/**.md 并提取结构化数据
// 之所以不用 gray-matter：方法卡用 ## Meta / ## 元信息 段落而非 YAML frontmatter
import fs from "node:fs";
import path from "node:path";
import type { EngineKey } from "./engines";

export interface Method {
  /** 文件名（不含扩展名），用作 URL slug */
  slug: string;
  /** 子目录名（如 cognition/strategy），用于二级路径 */
  engineDir: string;
  /** ID, eg CG01 ST06 */
  id: string;
  /** 引擎 key */
  engine: EngineKey;
  /** 引擎英文名（首字母大写） */
  engineLabel: string;
  /** 层级 L1-L5 */
  layer: "L1" | "L2" | "L3" | "L4" | "L5" | "—";
  /** 来源类型：classic / original / hybrid 等 */
  origin: string;
  /** 来源说明（书/作者） */
  source: string;
  /** 中文标题 */
  titleCn: string;
  /** 英文标题 */
  titleEn: string;
  /** 一句话定义 */
  oneliner: string;
  /** 原文 markdown */
  raw: string;
}

const ID_TO_ENGINE: Record<string, { key: EngineKey; label: string }> = {
  CG: { key: "cognition", label: "Cognition" },
  ST: { key: "strategy", label: "Strategy" },
  GN: { key: "generation", label: "Generation" },
  DC: { key: "decision", label: "Decision" },
  PD: { key: "product", label: "Product" },
  EV: { key: "evolution", label: "Evolution" },
};

const ENGINE_DIR_TO_KEY: Record<string, EngineKey> = {
  cognition: "cognition",
  strategy: "strategy",
  generation: "generation",
  decision: "decision",
  product: "product",
  evolution: "evolution",
};

const METHODS_ROOT = path.join(process.cwd(), "methods");

/** 递归找出所有 .md 文件 */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    // 排除 *.guide.md（人类讲解版，单独加载，不当作方法卡）
    else if (
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      !entry.name.endsWith(".guide.md")
    )
      out.push(full);
  }
  return out;
}

/** 从 H1 行解析中英文标题：`# 中文（English）` */
function parseTitle(line: string): { titleCn: string; titleEn: string } {
  const cleaned = line.replace(/^#\s+/, "").trim();
  // 支持半角和全角括号
  const match = cleaned.match(/^(.+?)[（(]([^）)]+)[）)]\s*$/);
  if (match) {
    return { titleCn: match[1].trim(), titleEn: match[2].trim() };
  }
  return { titleCn: cleaned, titleEn: "" };
}

/** 在 markdown 中找一句话定义，覆盖 3 种写法 */
function parseOneliner(raw: string): string {
  // 1. "一句话定义：..."
  const m1 = raw.match(/一句话定义[：:]\s*(.+?)(?=\n\n|\n#|$)/s);
  if (m1) return m1[1].replace(/\n/g, " ").trim();

  // 2. "## Definition" 或 "## Definition（一句话定义）" 之后第一个非空段
  const m2 = raw.match(
    /##\s*Definition(?:[（(][^）)]*[）)])?\s*\n+([^\n#]+(?:\n[^\n#]+)*)/,
  );
  if (m2) return m2[1].replace(/\n/g, " ").trim();

  // 3. 第一个 --- 之后的第一段（fallback）
  const afterDivider = raw.split(/\n---\n/)[1] ?? "";
  const firstPara = afterDivider
    .split("\n\n")
    .find((p) => p.trim() && !p.startsWith("#"));
  if (firstPara) return firstPara.replace(/\n/g, " ").trim().slice(0, 200);

  return "";
}

/** 解析 ## Meta / ## 元信息 段中的 bullet 字段 */
function parseMeta(raw: string): Record<string, string> {
  const metaMatch = raw.match(
    /##\s*(?:Meta|元信息)\s*\n([\s\S]*?)(?=\n##|\n---|\n#|$)/,
  );
  if (!metaMatch) return {};

  const meta: Record<string, string> = {};
  const lines = metaMatch[1].split("\n");
  for (const line of lines) {
    // - Key: Value  /  - 中文键：值
    const kv = line.match(/^-\s*([^:：]+)[：:]\s*(.+)$/);
    if (kv) {
      const key = kv[1].trim();
      const val = kv[2].trim();
      meta[key] = val;
      // 同时存小写规范化版本
      meta[key.toLowerCase()] = val;
    }
  }
  return meta;
}

let _cache: Method[] | null = null;

export function getAllMethods(): Method[] {
  if (_cache) return _cache;

  const files = walk(METHODS_ROOT);
  const methods: Method[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      const rel = path.relative(METHODS_ROOT, file);
      const parts = rel.split(path.sep);
      const slug = parts[parts.length - 1].replace(/\.md$/, "");
      const engineDir = parts[0]; // 第一段是引擎目录

      // H1
      const h1Match = raw.match(/^#\s+(.+)$/m);
      if (!h1Match) continue;
      const { titleCn, titleEn } = parseTitle(h1Match[0]);

      // Meta
      const meta = parseMeta(raw);
      const id = (meta["id"] || "").toUpperCase();
      const prefix = id.slice(0, 2);
      const engineInfo = ID_TO_ENGINE[prefix];

      // 引擎：优先 ID 前缀，否则 fallback 到目录
      const engine =
        engineInfo?.key ?? ENGINE_DIR_TO_KEY[engineDir] ?? "cognition";
      const engineLabel =
        engineInfo?.label ?? engineDir[0].toUpperCase() + engineDir.slice(1);

      // Layer
      const rawLayer = (meta["layer"] || "").toUpperCase().match(/L[1-5]/);
      const layer = (rawLayer?.[0] ?? "—") as Method["layer"];

      methods.push({
        slug,
        engineDir,
        id: id || "—",
        engine,
        engineLabel,
        layer,
        origin: meta["origin"] || "",
        source: meta["source"] || meta["来源"] || meta["source"] || "",
        titleCn,
        titleEn,
        oneliner: parseOneliner(raw),
        raw,
      });
    } catch (err) {
      console.warn(`[methods] failed to parse ${file}:`, err);
    }
  }

  // 按 ID 排序：先引擎前缀，再编号
  methods.sort((a, b) => a.id.localeCompare(b.id));
  _cache = methods;
  return methods;
}

export function getMethodBySlug(slug: string): Method | undefined {
  return getAllMethods().find((m) => m.slug === slug);
}

/**
 * 取某方法的「人类讲解版」（说明书/论文式，给人看）。
 * 存在 methods/<engineDir>/<slug>.guide.md 则返回其内容，否则 null。
 */
export function getMethodGuide(
  engineDir: string,
  slug: string,
): string | null {
  try {
    const p = path.join(METHODS_ROOT, engineDir, `${slug}.guide.md`);
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, "utf8").trim();
    return raw || null;
  } catch {
    return null;
  }
}

export function getMethodsByEngine(engine: EngineKey): Method[] {
  return getAllMethods().filter((m) => m.engine === engine);
}

/**
 * 列表页专用：去掉 raw 的方法卡。
 *
 * 为什么要有它：Method.raw 是整张卡的 markdown 原文，86 张加起来 321KB。
 * 列表页把 getAllMethods() 直接传给客户端组件时，这 321KB 会被序列化进页面，
 * 而列表根本不显示正文 —— /methods 曾因此 gzip 后仍有 361KB、加载 12 秒。
 * 凡是数据要跨到客户端组件的地方，用这个，别用 getAllMethods()。
 */
export type MethodLite = Omit<Method, "raw">;

export function getAllMethodsLite(): MethodLite[] {
  return getAllMethods().map(({ raw: _raw, ...rest }) => rest);
}
