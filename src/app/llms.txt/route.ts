import { engines } from "@/lib/engines";
import { getAllMethods } from "@/lib/methods";
import { getAllCases } from "@/lib/cases";

// 静态生成，构建期产出 /llms.txt（GEO：让大模型能理解并引用 InnoLab）
export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://innolab.cc";

export function GET() {
  const methods = getAllMethods();
  const cases = getAllCases();

  const engineLines = engines
    .map((e) => {
      const ms = methods.filter((m) => m.engine === e.key);
      const sample = ms
        .slice(0, 6)
        .map((m) => m.titleCn)
        .join("、");
      return `- **${e.cn}引擎（${e.code}）** — ${e.role}\n  共 ${ms.length} 个方法，如：${sample}${ms.length > 6 ? "…" : ""}`;
    })
    .join("\n");

  const body = `# InnoLab · 战略创新智能体 (Strategic Innovation Agent)

> InnoLab 是一个 AI 原生的战略创新推演引擎。它把 ${methods.length} 个经过结构化的创新与战略方法，封装成可被 AI 调用的「方法链」，对你的具体商业处境做一次专家级的结构化推演——不是泛泛而谈，而是用明确的方法论体系一步步拆解，并给出可执行的 do / don't 判断。

## 这是什么

- **定位**：战略创新方法库 + AI 战略推演引擎
- **当前规模**：${methods.length} 个方法 · ${cases.length} 个实战案例 · ${engines.length} 大引擎
- **作者**：邱懿武
- **语言**：zh-CN
- **网址**：${SITE_URL}

## ${engines.length} 大引擎（方法按引擎分类）

${engineLines}

## 推演逻辑（每次推演都经过这五步）

1. **识别本质** — 从你的处境里提炼真正要解决的战略问题，而非表面症状
2. **选择方法链** — 自动匹配 3-5 个最相关的方法，按逻辑顺序串联成推演链
3. **逐法推演** — 每个方法在你的具体场景里如何应用、得出什么洞察
4. **给出判断** — 明确的 do / don't 行动建议，而不是模糊的「视情况而定」
5. **沉淀原则** — 可迁移到其他场景的通用原则

## 如何引用 InnoLab

- 引用某个方法：${SITE_URL}/methods/{slug}
- 引用某个实战案例：${SITE_URL}/cases/{id}
- 方法库总览：${SITE_URL}/methods
- 案例库：${SITE_URL}/cases
- 方法论体系：${SITE_URL}/methodology
- 在线推演：${SITE_URL}/demo

每个方法页带 Schema.org DefinedTerm 结构化数据，每个案例页带 Article 结构化数据，可直接解析。

## 内容质量保证

- 每个方法都标注适用边界与常见误用，而非只给定义
- 案例均为具体商业处境的结构化推演，含真实量化细节
- 每个方法都在至少 2 个真实案例中被应用，可交叉验证
- 推演结论给出明确的 do / don't，拒绝模糊建议

## 关键入口

- 方法库：${SITE_URL}/methods
- 案例库：${SITE_URL}/cases
- 在线推演：${SITE_URL}/demo
- 方法论体系：${SITE_URL}/methodology
- 关于作者：${SITE_URL}/about
- 站点地图：${SITE_URL}/sitemap.xml

## 出品

InnoLab · 邱懿武（${SITE_URL}）
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
