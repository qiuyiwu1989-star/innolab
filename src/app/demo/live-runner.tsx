"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  RotateCcw,
  Send,
  Sparkles,
  X,
  CornerDownLeft,
} from "lucide-react";
import { Markdown } from "@/components/site/markdown";
import { cn } from "@/lib/utils";

type Phase = "idle" | "streaming" | "done" | "error";

interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

interface ErrorState {
  message: string;
  reason?: "rate_limit" | "config" | "api" | "unknown";
}

/** 按领域组织的预设问题 — 同时作为流量分流和数据采集锚点 */
const DOMAINS = [
  { key: "all", label: "全部" },
  { key: "ai-transform", label: "AI 转型" },
  { key: "product", label: "产品" },
  { key: "ip-content", label: "IP / 内容" },
  { key: "org", label: "组织" },
  { key: "strategy", label: "战略" },
] as const;
type DomainKey = (typeof DOMAINS)[number]["key"];

const SUGGESTIONS: { label: string; tag: string; domain: DomainKey }[] = [
  // AI 转型
  { label: "AI 转型该从哪里开始？", tag: "企业 AI", domain: "ai-transform" },
  {
    label: "我们 AI 转型一年没效果，问题在哪？",
    tag: "AI 自查",
    domain: "ai-transform",
  },
  {
    label: "每个环节加 AI vs 从零重设计流程？",
    tag: "流程改造",
    domain: "ai-transform",
  },
  // 产品
  { label: "我的产品定位是什么？", tag: "产品定义", domain: "product" },
  {
    label: "怎么判断 MVP 已经被验证了？",
    tag: "MVP",
    domain: "product",
  },
  {
    label: "我该不该砍掉这个功能？",
    tag: "产品取舍",
    domain: "product",
  },
  // IP / 内容
  { label: "我该做 IP 产品吗？", tag: "IP 商业化", domain: "ip-content" },
  {
    label: "我的 IP 护城河该怎么建？",
    tag: "IP 四层",
    domain: "ip-content",
  },
  {
    label: "文创爆款怎么持续生新的？",
    tag: "老瓶新装",
    domain: "ip-content",
  },
  // 组织
  { label: "怎么搭建双轨人才体系？", tag: "人才", domain: "org" },
  { label: "我团队卡在 L2 怎么办？", tag: "L2-L4", domain: "org" },
  {
    label: "招 AI 团队还是全员培训？",
    tag: "组织选择",
    domain: "org",
  },
  // 战略
  {
    label: "怎么判断一个赛道还有没有机会？",
    tag: "赛道判断",
    domain: "strategy",
  },
  {
    label: "守线攻线资源该怎么分配？",
    tag: "攻守矩阵",
    domain: "strategy",
  },
  {
    label: "现在该不该启动这次转型？",
    tag: "决策时点",
    domain: "strategy",
  },
];

export function LiveRunner() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [remaining, setRemaining] = useState<{ ip?: number; global?: number }>(
    {},
  );
  const [activeDomain, setActiveDomain] = useState<DomainKey>("all");
  const [pickedFromDomain, setPickedFromDomain] = useState<DomainKey | "free">(
    "free",
  );

  const visibleSuggestions =
    activeDomain === "all"
      ? SUGGESTIONS
      : SUGGESTIONS.filter((s) => s.domain === activeDomain);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // 卸载时取消请求
  useEffect(() => () => abortRef.current?.abort(), []);

  // 流式时自动滚到底部
  useEffect(() => {
    if (phase === "streaming") {
      outputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [output, phase]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setOutput("");
    setSubmittedPrompt("");
    setUsage(null);
    setError(null);
  }, []);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || phase === "streaming") return;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setSubmittedPrompt(trimmed);
      setOutput("");
      setUsage(null);
      setError(null);
      setPhase("streaming");

      setTimeout(() => {
        outputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            // 数据采集：用户走了哪个领域的入口
            source: pickedFromDomain,
            domain: activeDomain,
          }),
          signal: ctrl.signal,
        });

        // 限流头先读出来
        const rg = res.headers.get("X-RateLimit-Remaining-Global");
        const ri = res.headers.get("X-RateLimit-Remaining-Ip");
        setRemaining({
          global: rg ? Number(rg) : undefined,
          ip: ri ? Number(ri) : undefined,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setPhase("error");
          setError({
            message: data.error ?? `请求失败：HTTP ${res.status}`,
            reason: res.status === 429 ? "rate_limit" : "api",
          });
          return;
        }
        if (!res.body) {
          setPhase("error");
          setError({ message: "服务端没返回流式响应。", reason: "api" });
          return;
        }

        // —— SSE 解析 ——
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by \n\n; each line starts with "data: "
          let sepIdx;
          while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
            const rawEvent = buffer.slice(0, sepIdx);
            buffer = buffer.slice(sepIdx + 2);

            for (const line of rawEvent.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const json = line.slice(5).trim();
              if (!json) continue;

              try {
                const ev = JSON.parse(json);
                if (ev.type === "delta") {
                  setOutput((prev) => prev + ev.text);
                } else if (ev.type === "usage") {
                  setUsage({
                    input: ev.input,
                    output: ev.output,
                    cacheRead: ev.cacheRead,
                    cacheWrite: ev.cacheWrite,
                  });
                } else if (ev.type === "error") {
                  setError({ message: ev.message, reason: "api" });
                  setPhase("error");
                  return;
                } else if (ev.type === "done") {
                  setPhase("done");
                  return;
                }
              } catch {
                /* skip malformed */
              }
            }
          }
        }

        // 流自然结束（没有 done 事件 — 也算完成）
        setPhase((p) => (p === "streaming" ? "done" : p));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // 用户主动取消
          return;
        }
        setPhase("error");
        setError({
          message:
            err instanceof Error
              ? err.message
              : "网络出错。检查连接后再试。",
          reason: "unknown",
        });
      }
    },
    [phase],
  );

  return (
    <div className="relative">
      {/* —— 输入区（idle 时显示）—— */}
      {phase === "idle" && (
        <section>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(prompt);
            }}
          >
            <div className="rounded-xl border border-fog-2 bg-soot p-4 transition focus-within:border-volt">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submit(prompt);
                  }
                }}
                placeholder="输入一个真实商业问题，例：我该做 IP 产品吗？"
                rows={4}
                className="w-full resize-none bg-transparent text-base text-bone outline-none placeholder:text-dust"
              />
              <div className="mt-3 flex items-center justify-between border-t border-fog-1 pt-3">
                <span className="flex items-center gap-2 text-[11px] text-dust">
                  <Cpu className="size-3" />
                  Claude Sonnet 4.6 · 74 方法可用
                  {remaining.ip !== undefined && (
                    <span className="ml-2 text-ash">
                      今日剩 {remaining.ip} 次
                    </span>
                  )}
                </span>
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-volt px-3 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="size-3" />
                  分析
                  <kbd className="numeral hidden rounded bg-ink/20 px-1 text-[10px] sm:inline">
                    ⌘↵
                  </kbd>
                </button>
              </div>
            </div>
          </form>

          {/* 领域分流 + 建议问题 */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <div className="text-xs uppercase tracking-widest text-dust">
                按领域选问题
              </div>
              <div className="numeral text-xs text-dust">
                {visibleSuggestions.length} 个
              </div>
            </div>
            {/* 领域 chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setActiveDomain(d.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    activeDomain === d.key
                      ? "border-volt bg-volt text-ink"
                      : "border-fog-2 bg-soot text-ash hover:border-fog-3 hover:text-bone",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {visibleSuggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setPrompt(s.label);
                    setPickedFromDomain(s.domain);
                    submit(s.label);
                  }}
                  className="group flex items-start gap-3 rounded-lg border border-fog-2 bg-soot p-4 text-left transition hover:border-volt hover:bg-graphite"
                >
                  <CornerDownLeft className="mt-0.5 size-4 shrink-0 text-volt opacity-60 transition group-hover:opacity-100" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-bone">
                      {s.label}
                    </div>
                  </div>
                  <span className="ml-auto shrink-0 rounded border border-fog-2 px-1.5 py-0.5 text-[10px] text-ash">
                    {s.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-xs text-dust">
            v0.1 限免使用，全站每天 50 次、单用户每天 5 次。
            想要更多 / 接入你自己的 API key，
            <Link href="/#waitlist" className="text-volt hover:underline">
              加入候补 v1.0
            </Link>
            。
          </p>
        </section>
      )}

      {/* —— 运行 / 完成 / 错误：共用输出区 —— */}
      {phase !== "idle" && (
        <section ref={outputRef}>
          {/* 用户问题回显 */}
          <div className="rounded-xl border border-fog-2 bg-soot p-5">
            <div className="text-xs uppercase tracking-widest text-dust">
              你问的
            </div>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div className="text-lg font-semibold text-bone sm:text-xl">
                {submittedPrompt}
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-fog-2 px-2.5 py-1 text-[11px] text-ash transition hover:border-fog-3 hover:text-bone"
              >
                {phase === "streaming" ? (
                  <>
                    <X className="size-3" />
                    停止
                  </>
                ) : (
                  <>
                    <RotateCcw className="size-3" />
                    换问题
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 状态条 */}
          <div className="mt-6 flex items-center gap-3 text-xs text-ash">
            {phase === "streaming" && (
              <>
                <span className="relative flex size-2 items-center justify-center">
                  <span className="absolute size-2 animate-ping rounded-full bg-volt opacity-75" />
                  <span className="size-2 rounded-full bg-volt" />
                </span>
                <span>InnoLab 正在调度方法链 · 流式推演中…</span>
              </>
            )}
            {phase === "done" && (
              <>
                <span className="size-2 rounded-full bg-volt" />
                <span>完成</span>
                {usage && (
                  <span className="ml-2 numeral text-dust">
                    {usage.input + usage.cacheWrite + usage.cacheRead} in /{" "}
                    {usage.output} out
                    {usage.cacheRead > 0 && (
                      <span className="ml-1 text-volt">
                        ({Math.round((usage.cacheRead / (usage.input + usage.cacheRead || 1)) * 100)}% cached)
                      </span>
                    )}
                  </span>
                )}
              </>
            )}
            {phase === "error" && (
              <>
                <span className="size-2 rounded-full bg-rose-500" />
                <span>出错了</span>
              </>
            )}
          </div>

          {/* 推演输出 */}
          {output && (
            <article className="mt-6 rounded-xl border border-fog-2 bg-soot p-6 sm:p-8">
              <Markdown source={output} />
              {phase === "streaming" && (
                <span className="ml-1 inline-block size-2 translate-y-0.5 animate-pulse rounded-sm bg-volt" />
              )}
            </article>
          )}

          {/* 错误态 */}
          {phase === "error" && error && (
            <div
              className={cn(
                "mt-6 rounded-xl border p-6",
                error.reason === "rate_limit"
                  ? "border-volt bg-volt/[0.04]"
                  : "border-fog-3 bg-soot",
              )}
            >
              <div className="flex items-start gap-3">
                <Sparkles
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    error.reason === "rate_limit"
                      ? "text-volt"
                      : "text-ash",
                  )}
                />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-bone">
                    {error.reason === "rate_limit"
                      ? "今日配额用完了"
                      : "调用失败"}
                  </h3>
                  <p className="mt-2 text-sm text-ash">{error.message}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {error.reason === "rate_limit" ? (
                      <Link
                        href="/#waitlist"
                        className="inline-flex items-center gap-1.5 rounded-md bg-volt px-4 py-2 text-xs font-semibold text-ink hover:brightness-110"
                      >
                        加入候补 v1.0
                        <ArrowRight className="size-3" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => submit(submittedPrompt)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-volt px-4 py-2 text-xs font-semibold text-ink hover:brightness-110"
                      >
                        重试
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-4 py-2 text-xs text-bone hover:border-volt"
                    >
                      换问题
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 完成态 — CTA */}
          {phase === "done" && (
            <div className="mt-12 rounded-xl border border-volt bg-volt/[0.04] p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="numeral text-xs uppercase tracking-widest text-volt">
                    Live · v0.1
                  </div>
                  <h3 className="display mt-2 text-2xl text-bone sm:text-3xl">
                    再问一个？或者预约 v1.0。
                  </h3>
                  <p className="mt-3 text-sm text-ash">
                    今天还剩 {remaining.ip ?? "?"} 次。v1.0 上线后会有私有记忆库、自定义引擎、批量分析等能力。
                  </p>
                </div>
                <Link
                  href="/#waitlist"
                  className="inline-flex shrink-0 items-center gap-2 self-start rounded-md bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 sm:self-center"
                >
                  加入候补
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-fog-2 pt-6">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-3 py-1.5 text-xs text-bone hover:border-volt"
                >
                  <RotateCcw className="size-3" />
                  再问一个
                </button>
                <Link
                  href="/methods"
                  className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-3 py-1.5 text-xs text-bone hover:border-volt"
                >
                  浏览方法库
                </Link>
                <Link
                  href="/cases"
                  className="inline-flex items-center gap-1.5 rounded-md border border-fog-3 px-3 py-1.5 text-xs text-bone hover:border-volt"
                >
                  看真实案例
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
