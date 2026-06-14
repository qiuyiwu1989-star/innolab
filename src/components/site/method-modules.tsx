import { Markdown } from "./markdown";

// 把方法正文按 ## 板块切分，每段渲染成独立「模组卡」。
// 让方法详情页看起来像一套标准模块化产品，而不是一篇长文。

interface ModuleBlock {
  title: string;
  content: string;
}

function splitModules(body: string): ModuleBlock[] {
  const lines = body.split("\n");
  const mods: ModuleBlock[] = [];
  let cur: { title: string; content: string[] } | null = null;
  const intro: string[] = [];
  let inFence = false; // 代码块内的 `## ` 是模板内容，不是真板块标题

  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const h2 = inFence ? null : line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      if (cur)
        mods.push({ title: cur.title, content: cur.content.join("\n").trim() });
      cur = { title: h2[1].trim(), content: [] };
    } else if (cur) {
      cur.content.push(line);
    } else {
      intro.push(line);
    }
  }
  if (cur)
    mods.push({ title: cur.title, content: cur.content.join("\n").trim() });

  // 「一句话定义」板块已在 Hero 顶部展示，卡片里不重复
  const filtered = mods.filter(
    (m) =>
      !/^(definition|一句话定义)/i.test(m.title) && (m.content || m.title),
  );

  const introText = intro.join("\n").trim();
  if (introText) filtered.unshift({ title: "", content: introText });
  return filtered;
}

export function MethodModules({ body }: { body: string }) {
  const modules = splitModules(body);

  // 没有清晰的 ## 分段（旧格式/极简卡）→ 退回普通文档渲染，保证不破版
  if (modules.filter((m) => m.title).length < 2) {
    return <Markdown source={body} />;
  }

  let n = 0;
  return (
    <div className="space-y-5">
      {modules.map((m, i) => {
        if (!m.title) {
          return (
            <div key={i} className="text-ash">
              <Markdown source={m.content} />
            </div>
          );
        }
        n += 1;
        return (
          <section
            key={i}
            className="rounded-xl border border-fog-2 bg-soot/40 p-5 transition hover:border-fog-1 sm:p-6"
          >
            <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold tracking-tight text-bone">
              <span className="numeral inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-volt/30 bg-volt/10 text-xs text-volt">
                {String(n).padStart(2, "0")}
              </span>
              {m.title}
            </h2>
            {m.content && <Markdown source={m.content} />}
          </section>
        );
      })}
    </div>
  );
}
