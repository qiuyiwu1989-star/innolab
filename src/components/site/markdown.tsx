import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

export function cleanMarkdownBody(raw: string): string {
  let body = raw;
  body = body.replace(/^#\s+.+\n+/, "");
  body = body.replace(
    /##\s*(?:Meta|元信息)\s*\n[\s\S]*?(?=\n##|\n---|$)/,
    "",
  );
  body = body.replace(/^一句话定义[：:].+$\n*/m, "");
  body = body.replace(/^\s*---\s*\n+/, "");
  return body.trim();
}

// 暗色主题 markdown 组件映射（标准间距 — 用于方法/关于等长文页面）
const components = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-bone" {...p} />
  ),
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-14 mb-4 scroll-mt-24 border-b border-fog-2 pb-3 text-xl font-bold tracking-tight text-bone"
      {...p}
    />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-10 mb-3 scroll-mt-24 text-lg font-semibold text-bone" {...p} />
  ),
  h4: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mt-6 mb-2 scroll-mt-24 text-base font-semibold text-bone" {...p} />
  ),
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-4 leading-7 text-ash" {...p} />
  ),
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="my-4 list-disc space-y-1.5 pl-6 leading-7 text-ash marker:text-volt"
      {...p}
    />
  ),
  ol: (p: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol
      className="my-4 list-decimal space-y-1.5 pl-6 leading-7 text-ash marker:text-volt marker:font-semibold"
      {...p}
    />
  ),
  li: (p: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1" {...p} />
  ),
  blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 border-l-2 border-volt bg-soot px-5 py-3 italic text-bone"
      {...p}
    />
  ),
  code: (p: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = String(p.className || "").startsWith("language-");
    if (isBlock) return <code {...p} />;
    return (
      <code
        className="rounded bg-graphite px-1.5 py-0.5 font-mono text-[0.85em] text-volt"
        {...p}
      />
    );
  },
  pre: (p: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-5 overflow-x-auto rounded-lg border border-fog-2 bg-soot p-4 font-mono text-[0.85em] leading-6 text-ash"
      {...p}
    />
  ),
  table: (p: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-fog-2">
      <table className="w-full border-collapse text-sm" {...p} />
    </div>
  ),
  thead: (p: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-soot" {...p} />
  ),
  th: (p: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border-b border-fog-2 px-4 py-2.5 text-left font-semibold text-bone"
      {...p}
    />
  ),
  td: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="border-b border-fog-1 px-4 py-2.5 align-top text-ash"
      {...p}
    />
  ),
  hr: () => <hr className="my-10 border-fog-2" />,
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-volt underline decoration-volt/30 underline-offset-2 transition hover:decoration-volt"
      {...p}
    />
  ),
  strong: (p: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-bone" {...p} />
  ),
  em: (p: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-bone" {...p} />
  ),
};

// compact 版本 — 用于 demo 分析输出（减少段间距，保持分节清晰）
const compactComponents = {
  ...components,
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-8 mb-3 border-b border-fog-2 pb-2 text-base font-bold tracking-tight text-bone first:mt-0"
      {...p}
    />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-5 mb-2 text-sm font-semibold text-bone" {...p} />
  ),
  h4: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mt-3 mb-1 text-sm font-semibold text-ash" {...p} />
  ),
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-2.5 leading-7 text-ash" {...p} />
  ),
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="my-2.5 list-disc space-y-1 pl-5 leading-7 text-ash marker:text-volt"
      {...p}
    />
  ),
  ol: (p: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol
      className="my-2.5 list-decimal space-y-1 pl-5 leading-7 text-ash marker:text-volt marker:font-semibold"
      {...p}
    />
  ),
};

export function Markdown({
  source,
  compact,
}: {
  source: string;
  compact?: boolean;
}) {
  return (
    <div className="text-[15px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={compact ? compactComponents : components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
