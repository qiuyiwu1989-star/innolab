"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { getSupabaseBrowser, supabaseConfigured } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr || !pw) return;
    if (pw.length < 6) {
      setError("密码至少 6 位。");
      return;
    }
    const sb = getSupabaseBrowser();
    if (!sb) {
      setError("登录暂未开启，请稍后再试。");
      return;
    }
    setBusy(true);
    setError("");

    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({ email: addr, password: pw });
      setBusy(false);
      if (error) {
        setError(error.message || "注册失败，请重试。");
        return;
      }
      // 关掉「邮箱确认」时 signUp 直接给会话 → 进「我的」
      if (data.session) {
        router.replace("/me");
      } else {
        setError(
          "注册成功，但后台仍要求邮箱确认。请去邮箱点确认链接，或让管理员关闭邮箱确认。",
        );
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({
        email: addr,
        password: pw,
      });
      setBusy(false);
      if (error) {
        setError(
          error.message?.includes("Invalid")
            ? "账号或密码不对。"
            : error.message || "登录失败，请重试。",
        );
        return;
      }
      router.replace("/me");
    }
  }

  return (
    <article className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="numeral text-xs uppercase tracking-widest text-volt">
        {mode === "login" ? "登录" : "注册"} · InnoLab
      </div>
      <h1 className="display mt-3 text-4xl text-bone">
        {mode === "login" ? "登录，找回你的推演" : "注册一个账号"}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ash">
        用账号（邮箱）+ 密码即可，
        <strong className="text-bone">无需邮箱验证</strong>。登录后能跨设备看到你自己做过的推演。
      </p>

      {!supabaseConfigured ? (
        <div className="mt-8 rounded-xl border border-fog-2 bg-soot p-5 text-sm text-dust">
          登录功能正在开启中，稍后再来。你现在仍可
          <Link href="/demo" className="text-volt hover:underline">
            {" "}免费试用推演
          </Link>
          。
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-fog-2 bg-ink px-4 focus-within:border-volt">
            <Mail className="size-4 shrink-0 text-dust" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="账号（邮箱）"
              autoComplete="email"
              className="w-full bg-transparent py-3 text-sm text-bone outline-none placeholder:text-dust"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-fog-2 bg-ink px-4 focus-within:border-volt">
            <Lock className="size-4 shrink-0 text-dust" />
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={mode === "signup" ? "设置密码（至少 6 位）" : "密码"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full bg-transparent py-3 text-sm text-bone outline-none placeholder:text-dust"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!email.trim() || !pw || busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "处理中…" : mode === "login" ? "登录" : "注册并进入"}
            {!busy && <ArrowRight className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="w-full text-center text-xs text-dust transition hover:text-ash"
          >
            {mode === "login" ? "没有账号？注册一个" : "已有账号？去登录"}
          </button>
        </form>
      )}
    </article>
  );
}
