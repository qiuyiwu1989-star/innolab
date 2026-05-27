import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/**
 * 渲染方法卡内容。出于设计需要，把已经在 hero 区域呈现的部分剥掉：
 *  - 第一个 H1（标题）
 *  - ## Meta / ## 元信息 整块
 *  - 紧跟其后的 "一句话定义" 段
 *  - 文档最前的 --- 分隔符
 */
export function cleanMarkdownBody(raw: string): string {
  let body = raw;

  // 去掉首个 H1 行（连同其后的空白行）
  body = body.replace(/^#\s+.+\n+/, "");

  // 去掉 ## Meta / ## 元信息 段（到下一个 ## 或 --- 或 EOF 为止）
  body = body.replace(
    /##\s*(?:Meta|元信息)\s*\n[\s\S]*?(?=\n##|\n---|$)/,
    "",
  );

  // 去掉 "一句话定义：...." 单行
  body = body.replace(/^一句话定义[：:].+$\n*/m, "");

  // 文档最前的 --- 分隔符
  body = body.replace(/^\s*---\s*\n+/, "");

  return body.trim();
}

const components = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-10 mb-4 text-2xl font-bold tracking-tight" {...p} />
  ),
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-12 mb-4 scroll-mt-20 border-b border-mist pb-2 text-xl font-bold tracking-tight"
      {...p}
    />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-8 mb-3 scroll-mt-20 text-lg font-semibold" {...p} />
  ),
  h4: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mt-6 mb-2 scroll-mt-20 text-base font-semibold" {...p} />
  ),
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-4 leading-7 text-ink/85" {...p} />
  ),
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="my-4 list-disc space-y-1.5 pl-6 leading-7 text-ink/85 marker:text-cobalt"
      {...p}
    />
  ),
  ol: (p: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol
      className="my-4 list-decimal space-y-1.5 pl-6 leading-7 text-ink/85 marker:text-cobalt marker:font-semibold"
      {...p}
    />
  ),
  li: (p: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1" {...p} />
  ),
  blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 border-l-4 border-cobalt bg-cobalt/5 px-5 py-3 italic text-ink/80"
      {...p}
    />
  ),
  code: (p: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = String(p.className || "").startsWith("language-");
    if (isBlock) return <code {...p} />;
    return (
      <code
        className="rounded bg-mist/70 px-1.5 py-0.5 font-mono text-[0.875em] text-ink"
        {...p}
      />
    );
  },
  pre: (p: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-5 overflow-x-auto rounded-xl border border-mist bg-ink p-4 font-mono text-[0.85em] leading-6 text-paper"
      {...p}
    />
  ),
  table: (p: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-mist">
      <table className="w-full border-collapse text-sm" {...p} />
    </div>
  ),
  thead: (p: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-mist/40" {...p} />
  ),
  th: (p: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border-b border-mist px-4 py-2.5 text-left font-semibold"
      {...p}
    />
  ),
  td: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="border-b border-mist px-4 py-2.5 align-top text-ink/80"
      {...p}
    />
  ),
  hr: () => <hr className="my-10 border-mist" />,
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-cobalt underline decoration-cobalt/30 underline-offset-2 transition hover:decoration-cobalt"
      {...p}
    />
  ),
  strong: (p: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-ink" {...p} />
  ),
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className="text-[15px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
