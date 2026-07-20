"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { getSupabaseBrowser, supabaseConfigured } from "@/lib/supabase-browser";
import { Markdown } from "@/components/site/markdown";

interface HistoryItem {
  ts: string;
  domain: string;
  prompt: string;
  output: string;
}
interface MeData {
  email: string;
  profile: { name: string; company: string; contact: string } | null;
  memory: { count: number; focusLabels: string[] };
  history: HistoryItem[];
}

const DOMAIN_LABELS: Record<string, string> = {
  "ai-transform": "AI 转型",
  product: "产品",
  "ip-content": "IP / 内容",
  org: "组织",
  strategy: "战略",
  free: "自由",
  all: "综合",
  unknown: "—",
};

type State =
  | { k: "loading" }
  | { k: "unconfigured" }
  | { k: "guest" }
  | { k: "data"; data: MeData };

export default function MePage() {
  const [state, setState] = useState<State>({ k: "loading" });
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setState({ k: "unconfigured" });
    const sb = getSupabaseBrowser();
    if (!sb) return setState({ k: "unconfigured" });
    const { data: sess } = await sb.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return setState({ k: "guest" });
    try {
      const res = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token }),
      });
      const json = await res.json();
      if (res.ok && json.ok) setState({ k: "data", data: json as MeData });
      else setState({ k: "guest" });
    } catch {
      setState({ k: "guest" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function signOut() {
    await getSupabaseBrowser()?.auth.signOut();
    setState({ k: "guest" });
  }

  if (state.k === "loading") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-fog-2 border-t-volt" />
      </div>
    );
  }

  if (state.k === "unconfigured" || state.k === "guest") {
    return (
      <article className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-16">
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          我的 · InnoLab
        </div>
        <h1 className="display mt-3 text-3xl text-bone">登录后，这里是你的</h1>
        <p className="mt-4 text-sm leading-relaxed text-ash">
          登录就能跨设备看到你做过的每一次推演、你的背景资料，以及 InnoLab 记住的关于你的判断脉络。
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110"
        >
          邮箱登录
          <ArrowRight className="size-4" />
        </Link>
        <Link href="/demo" className="mt-4 text-xs text-dust hover:text-ash">
          先免费试用 →
        </Link>
      </article>
    );
  }

  const { data } = state;
  const name = data.profile?.name;

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {/* 头 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="numeral text-xs uppercase tracking-widest text-volt">
            我的 · InnoLab
          </div>
          <h1 className="display mt-2 text-3xl text-bone">
            {name ? `${name}，你好` : "你好"}
          </h1>
          <p className="mt-2 text-sm text-dust">{data.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center gap-1.5 rounded-md border border-fog-2 px-3 py-1.5 text-xs text-dust transition hover:border-fog-3 hover:text-ash"
        >
          <LogOut className="size-3.5" />
          退出登录
        </button>
      </div>

      {/* 资料 + 记忆 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-fog-2 bg-soot/40 p-5">
          <div className="text-[11px] uppercase tracking-widest text-dust">资料</div>
          <div className="mt-2 space-y-1 text-sm text-ash">
            <div>称呼：<span className="text-bone">{name || "—"}</span></div>
            <div>公司 / 行业：<span className="text-bone">{data.profile?.company || "—"}</span></div>
          </div>
        </div>
        <div className="rounded-xl border border-fog-2 bg-soot/40 p-5">
          <div className="text-[11px] uppercase tracking-widest text-dust">InnoLab 记得你</div>
          <div className="mt-2 text-sm text-ash">
            已为你推演 <span className="numeral text-volt">{data.memory.count}</span> 次。
            {data.memory.focusLabels.length > 0 && (
              <>
                {" "}你一直在关注{" "}
                <span className="text-bone">{data.memory.focusLabels.join(" / ")}</span>。
              </>
            )}
          </div>
        </div>
      </div>

      {/* 历史推演 */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-bone">
            我的推演（{data.history.length}）
          </h2>
          <Link href="/demo" className="text-xs text-volt hover:underline">
            开一发新的 →
          </Link>
        </div>

        {data.history.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-fog-2 bg-soot/40 p-6 text-sm text-dust">
            还没有推演记录。用当前登录邮箱去
            <Link href="/demo" className="text-volt hover:underline"> 工作台 </Link>
            跑一发，就会出现在这里。
            <br />
            <span className="text-[11px]">
              （若你之前用别的邮箱/手机留资，那些历史归在那个身份下。）
            </span>
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.history.map((h, i) => (
              <li
                key={i}
                className="overflow-hidden rounded-lg border border-fog-2 bg-soot/40"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-soot"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-bone">{h.prompt}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-dust">
                      <span className="rounded border border-fog-2 px-1.5 py-0.5">
                        {DOMAIN_LABELS[h.domain] ?? h.domain}
                      </span>
                      <span className="numeral">
                        {new Date(h.ts).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  </div>
                  {expanded === i ? (
                    <ChevronUp className="mt-0.5 size-4 shrink-0 text-dust" />
                  ) : (
                    <ChevronDown className="mt-0.5 size-4 shrink-0 text-dust" />
                  )}
                </button>
                {expanded === i && (
                  <div className="border-t border-fog-2 px-4 py-4">
                    <Markdown source={h.output} compact />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
