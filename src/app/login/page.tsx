"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, Check } from "lucide-react";
import { getSupabaseBrowser, supabaseConfigured } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    const sb = getSupabaseBrowser();
    if (!sb) {
      setError("登录暂未开启，请稍后再试。");
      return;
    }
    setBusy(true);
    setError("");
    const { error } = await sb.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setError(error.message || "发送失败，请重试。");
    else setSent(true);
  }

  return (
    <article className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="numeral text-xs uppercase tracking-widest text-volt">
        登录 · InnoLab
      </div>
      <h1 className="display mt-3 text-4xl text-bone">
        登录，找回你的推演
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ash">
        用邮箱登录——我们给你发一封带链接的邮件，点开即登录，
        <strong className="text-bone">无需密码</strong>。用你之前留资的同一邮箱，
        就能接上你过去的推演历史。
      </p>

      {!supabaseConfigured ? (
        <div className="mt-8 rounded-xl border border-fog-2 bg-soot p-5 text-sm text-dust">
          登录功能正在开启中，稍后再来。你现在仍可
          <Link href="/demo" className="text-volt hover:underline">
            {" "}免费试用推演
          </Link>
          。
        </div>
      ) : sent ? (
        <div className="mt-8 rounded-2xl border border-volt/40 bg-volt/[0.05] p-6">
          <div className="inline-flex items-center gap-2 text-volt">
            <Check className="size-5" />
            <span className="font-semibold">邮件已发出</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ash">
            去邮箱 <strong className="text-bone">{email}</strong> 点开那封
            「登录 InnoLab」的邮件即可。没收到？看下垃圾邮件，或
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-volt hover:underline"
            >
              {" "}换个邮箱重发
            </button>
            。
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-fog-2 bg-ink px-4 focus-within:border-volt">
            <Mail className="size-4 shrink-0 text-dust" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="你的邮箱"
              autoComplete="email"
              className="w-full bg-transparent py-3 text-sm text-bone outline-none placeholder:text-dust"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!email.trim() || busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "发送中…" : "发送登录链接"}
            {!busy && <ArrowRight className="size-4" />}
          </button>
          <p className="text-[11px] leading-relaxed text-dust">
            登录只为让你跨设备看到自己的推演历史与背景。不发广告。
          </p>
        </form>
      )}
    </article>
  );
}
