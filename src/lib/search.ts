import { getAllMethods } from "./methods";
import { getAllCases } from "./cases";
import { engines } from "./engines";

export type SearchItem =
  | {
      type: "method";
      id: string;
      title: string;
      sub: string;
      engineCn: string;
      layer: string;
      href: string;
      keywords: string;
    }
  | {
      type: "case";
      id: string;
      title: string;
      sub: string;
      href: string;
      keywords: string;
    }
  | {
      type: "page";
      id: string;
      title: string;
      sub: string;
      href: string;
      keywords: string;
    }
  | {
      type: "engine";
      id: string;
      title: string;
      sub: string;
      href: string;
      keywords: string;
    };

const STATIC_PAGES: SearchItem[] = [
  {
    type: "page",
    id: "home",
    title: "首页",
    sub: "InnoLab — AI 创新战略咨询师",
    href: "/",
    keywords: "home 首页 hero landing",
  },
  {
    type: "page",
    id: "methods-index",
    title: "方法库",
    sub: "74 个方法 · 筛选 · 搜索",
    href: "/methods",
    keywords: "methods 方法库 全部方法",
  },
  {
    type: "page",
    id: "cases-index",
    title: "案例库",
    sub: "10 个真实案例",
    href: "/cases",
    keywords: "cases 案例库 真实案例",
  },
  {
    type: "page",
    id: "demo",
    title: "Demo · 试用",
    sub: "看一眼 v1.0 怎么工作",
    href: "/demo",
    keywords: "demo 试用 try v1 ai 咨询师",
  },
  {
    type: "page",
    id: "about",
    title: "关于",
    sub: "InnoLab · 邱懿武",
    href: "/about",
    keywords: "about 关于 邱懿武 qiu",
  },
  {
    type: "page",
    id: "waitlist",
    title: "加入候补 v1.0",
    sub: "AI 战略咨询师 Beta 通知",
    href: "/#waitlist",
    keywords: "waitlist 候补 beta v1.0",
  },
];

export function getSearchIndex(): SearchItem[] {
  const methods = getAllMethods().map(
    (m): SearchItem => ({
      type: "method",
      id: m.id,
      title: m.titleCn,
      sub: m.oneliner || m.titleEn || "",
      engineCn:
        engines.find((e) => e.key === m.engine)?.cn ?? m.engineLabel,
      layer: m.layer,
      href: `/methods/${m.slug}`,
      keywords: `${m.id} ${m.titleCn} ${m.titleEn} ${m.engineLabel} ${m.layer} ${m.oneliner} ${m.source}`,
    }),
  );

  const cases = getAllCases()
    .filter((c) => c.file !== null)
    .map(
      (c): SearchItem => ({
        type: "case",
        id: c.id,
        title: c.title,
        sub: c.summary,
        href: `/cases/${c.id}`,
        keywords: `${c.id} ${c.title} ${c.summary} ${(c.tags ?? []).join(" ")} ${(c.domain ?? []).join(" ")} ${(c.related_methods ?? []).join(" ")}`,
      }),
    );

  const engineLandings = engines.map(
    (e): SearchItem => ({
      type: "engine",
      id: e.code,
      title: `${e.cn} 引擎`,
      sub: `${e.role} · ${e.count} 个方法`,
      href: `/methods/engine/${e.key}`,
      keywords: `${e.code} ${e.cn} ${e.en} engine ${e.oneliner} ${e.role}`,
    }),
  );

  return [...STATIC_PAGES, ...engineLandings, ...methods, ...cases];
}
