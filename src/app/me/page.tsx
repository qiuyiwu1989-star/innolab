"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LogOut,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Share2,
  KeyRound,
} from "lucide-react";
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
  const [token, setToken] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) return setState({ k: "unconfigured" });
    const sb = getSupabaseBrowser();
    if (!sb) return setState({ k: "unconfigured" });
    const { data: sess } = await sb.auth.getSession();
    const t = sess.session?.access_token;
    if (!t) return setState({ k: "guest" });
    setToken(t);
    try {
      const res = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: t }),
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

  const setProfile = (p: { name: string; company: string }) =>
    setState({
      k: "data",
      data: {
        ...data,
        profile: {
          name: p.name,
          company: p.company,
          contact: data.profile?.contact ?? data.email,
        },
      },
    });

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
        <ProfileCard
          token={token}
          profile={data.profile}
          onSaved={setProfile}
        />
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
                    <div className="mt-4 border-t border-fog-2 pt-3">
                      <ShareButton item={h} />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 账号安全 */}
      <PasswordSection />
    </article>
  );
}

/* ---------- 资料卡：只读 ⇄ 内联编辑 ---------- */
function ProfileCard({
  token,
  profile,
  onSaved,
}: {
  token: string | null;
  profile: MeData["profile"];
  onSaved: (p: { name: string; company: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [company, setCompany] = useState(profile?.company ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = () => {
    setName(profile?.name ?? "");
    setCompany(profile?.company ?? "");
    setErr(null);
    setEditing(true);
  };

  async function save() {
    if (!name.trim()) return setErr("称呼不能为空");
    if (!token) return setErr("会话已过期，请刷新");
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, name, company }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        onSaved({ name: json.profile.name, company: json.profile.company });
        setEditing(false);
      } else {
        setErr(json.error ?? "保存失败");
      }
    } catch {
      setErr("网络异常，稍后再试");
    } finally {
      setSaving(false);
    }
  }

  const empty = !profile?.name && !profile?.company;

  return (
    <div className="rounded-xl border border-fog-2 bg-soot/40 p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-widest text-dust">资料</div>
        {!editing && (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-1 text-[11px] text-dust transition hover:text-volt"
          >
            <Pencil className="size-3" />
            {empty ? "补全" : "编辑"}
          </button>
        )}
      </div>

      {!editing ? (
        <div className="mt-2 space-y-1 text-sm text-ash">
          <div>
            称呼：<span className="text-bone">{profile?.name || "—"}</span>
          </div>
          <div>
            公司 / 行业：
            <span className="text-bone">{profile?.company || "—"}</span>
          </div>
          {empty && (
            <p className="mt-2 text-[11px] leading-relaxed text-dust">
              补全后，邱懿武回访时更懂你的处境。
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="怎么称呼你"
            className="w-full rounded-md border border-fog-2 bg-ink/40 px-3 py-2 text-sm text-bone outline-none placeholder:text-dust focus:border-volt"
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            maxLength={60}
            placeholder="公司 / 行业（选填）"
            className="w-full rounded-md border border-fog-2 bg-ink/40 px-3 py-2 text-sm text-bone outline-none placeholder:text-dust focus:border-volt"
          />
          {err && <p className="text-[11px] text-red-400">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-md bg-volt px-3 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
            >
              <Check className="size-3.5" />
              {saving ? "保存中…" : "保存"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-md border border-fog-2 px-3 py-1.5 text-xs text-dust transition hover:text-ash"
            >
              <X className="size-3.5" />
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 单条历史 → 生成公开分享链接 ---------- */
function ShareButton({ item }: { item: HistoryItem }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  async function share() {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: item.prompt,
          output: item.output,
          domain: item.domain,
        }),
      });
      const json = await res.json();
      if (json.url) {
        await navigator.clipboard.writeText(
          `${window.location.origin}${json.url}`,
        );
        setStatus("done");
        setTimeout(() => setStatus("idle"), 2400);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2400);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2400);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-md border border-fog-2 px-3 py-1.5 text-xs text-ash transition hover:border-volt hover:text-bone"
    >
      <Share2 className="size-3.5" />
      {status === "loading"
        ? "生成中…"
        : status === "done"
          ? "链接已复制"
          : status === "error"
            ? "失败，重试"
            : "分享这份分析"}
    </button>
  );
}

/* ---------- 修改密码 ---------- */
function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setMsg(null);
    if (pw.length < 6) return setMsg({ ok: false, text: "密码至少 6 位" });
    if (pw !== pw2) return setMsg({ ok: false, text: "两次输入不一致" });
    const sb = getSupabaseBrowser();
    if (!sb) return setMsg({ ok: false, text: "服务未就绪" });
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message || "修改失败" });
    } else {
      setMsg({ ok: true, text: "密码已更新" });
      setPw("");
      setPw2("");
      setTimeout(() => setOpen(false), 1400);
    }
  }

  return (
    <section className="mt-10 border-t border-fog-2 pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-dust transition hover:text-ash"
      >
        <KeyRound className="size-3.5" />
        修改密码
        {open ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </button>
      {open && (
        <div className="mt-3 max-w-sm space-y-2">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="新密码（至少 6 位）"
            className="w-full rounded-md border border-fog-2 bg-ink/40 px-3 py-2 text-sm text-bone outline-none placeholder:text-dust focus:border-volt"
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="再输一遍"
            className="w-full rounded-md border border-fog-2 bg-ink/40 px-3 py-2 text-sm text-bone outline-none placeholder:text-dust focus:border-volt"
          />
          {msg && (
            <p
              className={`text-[11px] ${msg.ok ? "text-volt" : "text-red-400"}`}
            >
              {msg.text}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md bg-volt px-3 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "更新中…" : "更新密码"}
          </button>
        </div>
      )}
    </section>
  );
}
