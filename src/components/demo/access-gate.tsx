"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, X, ArrowRight } from "lucide-react";
import { LiveRunner } from "@/app/demo/live-runner";
import type { MethodMeta } from "@/components/demo/method-chain-viz";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface CaseSnippet {
  id: string;
  title: string;
  summary: string;
  domain: string[];
  related_methods: string[];
}

interface AccessGateProps {
  methodsIndex: Record<string, MethodMeta>;
  casesIndex: CaseSnippet[];
}

const LS_PASSCODE = "innolab.access.passcode"; // 仅 VIP/暗号（不限次）
const LS_LABEL = "innolab.access.label";
const LS_USERKEY = "innolab.access.userkey"; // 留资派生标识（决定额度档 + 记忆归属）
const LS_NAME = "innolab.access.name";

/**
 * 公开化后的门面（B：免费试 + 留资转化）。
 * 不再拦截入口——任何人直接就能用 LiveRunner（匿名走每日免费额度）。
 * 额度用尽 / 主动登记时，弹留资卡收集称呼+联系方式（可选暗号）：
 *   - 无暗号 → 已登记（每日 5 次）；有有效暗号 → VIP 不限次。
 * 顶部状态条始终把「深度价值在 1:1 咨询」摆在眼前。
 */
export function AccessGate({ methodsIndex, casesIndex }: AccessGateProps) {
  const [ready, setReady] = useState(false);
  const [passcode, setPasscode] = useState<string | null>(null); // 有值=VIP不限次
  const [label, setLabel] = useState("");
  const [userKey, setUserKey] = useState("");
  const [name, setName] = useState("");

  // 留资弹窗
  const [showRegister, setShowRegister] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputContact, setInputContact] = useState("");
  const [inputCompany, setInputCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 个性化记忆
  const [memoryFocus, setMemoryFocus] = useState<string[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [memoryContext, setMemoryContext] = useState("");

  // 恢复本地身份
  useEffect(() => {
    try {
      const pc = localStorage.getItem(LS_PASSCODE);
      if (pc) setPasscode(pc);
      setUserKey(localStorage.getItem(LS_USERKEY) ?? "");
      setName(localStorage.getItem(LS_NAME) ?? "");
      setLabel(localStorage.getItem(LS_LABEL) ?? "");
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  // 用账号登录了 → 用 auth:uid 作为推演归属（覆盖留资 key，让推演记进「我的」）
  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (alive && uid) setUserKey(`auth:${uid}`);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 有 userKey（已登记 / VIP 登记过 / 已登录）→ 拉取该用户「记忆」
  useEffect(() => {
    const uk = userKey.trim();
    if (!uk) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userKey: uk }),
        });
        const m = await res.json().catch(() => ({}));
        if (alive && m?.hasMemory) {
          setMemoryFocus(m.focusLabels ?? []);
          setMemoryCount(m.count ?? 0);
          setMemoryContext(m.contextSummary ?? "");
        }
      } catch {
        /* 记忆拉取失败不影响使用 */
      }
    })();
    return () => {
      alive = false;
    };
  }, [userKey]);

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    const nm = inputName.trim();
    const contact = inputContact.trim();
    const code = inputCode.trim();
    if (!nm || !contact) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: code || undefined,
          name: nm,
          contact,
          company: inputCompany.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        try {
          if (code && data.unlimited) localStorage.setItem(LS_PASSCODE, code);
          localStorage.setItem(LS_USERKEY, data.userKey ?? "");
          localStorage.setItem(LS_NAME, data.name ?? nm);
          localStorage.setItem(LS_LABEL, data.label ?? "");
        } catch {
          /* noop */
        }
        if (code && data.unlimited) setPasscode(code);
        setUserKey(data.userKey ?? "");
        setName(data.name ?? nm);
        setLabel(data.label ?? "");
        setShowRegister(false);
        setInputCode("");
      } else {
        setError(data.error ?? "提交失败，请重试。");
      }
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  function signOut() {
    try {
      [LS_PASSCODE, LS_LABEL, LS_USERKEY, LS_NAME].forEach((k) =>
        localStorage.removeItem(k),
      );
    } catch {
      /* noop */
    }
    setPasscode(null);
    setLabel("");
    setUserKey("");
    setName("");
    setMemoryCount(0);
    setMemoryFocus([]);
    setMemoryContext("");
  }

  if (!ready) return <div className="h-64" aria-hidden />;

  const isVip = !!passcode;
  const isRegistered = !!userKey;
  const hasMemory = memoryCount > 0;

  return (
    <div>
      {/* —— 状态条：始终把「1:1 咨询」摆在眼前 —— */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-fog-2 bg-soot px-4 py-2 text-xs">
        {isVip ? (
          <span className="inline-flex items-center gap-1.5 text-volt">
            <ShieldCheck className="size-3.5" />
            {name ? `${name} · ` : ""}
            {label ? `${label} · ` : ""}已授权 · 推演不限次
          </span>
        ) : isRegistered ? (
          <span className="inline-flex items-center gap-1.5 text-ash">
            <ShieldCheck className="size-3.5 text-volt/70" />
            {name ? `${name} · ` : ""}已登记 · 今日可用 5 次
          </span>
        ) : (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-dust">
            <span className="inline-flex items-center gap-1.5 text-ash">
              <span className="size-1.5 rounded-full bg-volt" />
              免费体验中
            </span>
            <span>·</span>
            <span>深度价值在邱懿武 1:1 咨询</span>
          </span>
        )}

        <span className="inline-flex items-center gap-3">
          {!isVip && (
            <Link
              href="/about"
              className="inline-flex items-center gap-1 text-volt transition hover:brightness-110"
            >
              约 1:1 深聊
              <ArrowRight className="size-3" />
            </Link>
          )}
          {isVip || isRegistered ? (
            <button
              type="button"
              onClick={signOut}
              className="text-dust transition hover:text-ash"
            >
              退出
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="text-dust transition hover:text-ash"
            >
              登记 / 有暗号
            </button>
          )}
        </span>
      </div>

      {/* —— 个性化记忆横幅 —— */}
      {hasMemory && (
        <div className="mb-4 rounded-lg border border-volt/30 bg-volt/[0.05] px-4 py-3 text-sm">
          <div className="font-medium text-bone">
            欢迎回来{name ? `，${name}` : ""} 👋
          </div>
          <div className="mt-1 text-xs text-ash">
            这是你第 {memoryCount + 1} 次来。
            {memoryFocus.length > 0 && (
              <>
                {" "}记得你一直在关注{" "}
                <span className="text-volt">{memoryFocus.join(" / ")}</span>
                ——这次的推演我会带上你之前的思路。
              </>
            )}
          </div>
        </div>
      )}

      <LiveRunner
        methodsIndex={methodsIndex}
        casesIndex={casesIndex}
        clientToken={passcode ?? ""}
        userKey={userKey}
        isRegistered={isRegistered}
        onRegisterRequest={() => setShowRegister(true)}
        memoryContext={memoryContext}
      />

      {/* —— 留资弹窗（转化卡，非入口墙）—— */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-fog-2 bg-soot p-7">
            <button
              type="button"
              onClick={() => setShowRegister(false)}
              className="absolute right-4 top-4 text-dust transition hover:text-ash"
              aria-label="关闭"
            >
              <X className="size-4" />
            </button>

            <h2 className="display text-2xl text-bone">留个联系方式，继续用</h2>
            <p className="mt-3 text-sm leading-relaxed text-ash">
              InnoLab 的深度推演免费给你试。留下称呼和联系方式即可继续使用；
              真正值钱的判断，邱懿武会亲自和你 1:1 深聊。
            </p>

            <form onSubmit={submitRegister} className="mt-6 space-y-3">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="你的称呼 *"
                className="w-full rounded-lg border border-fog-2 bg-ink px-4 py-3 text-sm text-bone outline-none transition focus:border-volt placeholder:text-dust"
              />
              <input
                type="text"
                value={inputContact}
                onChange={(e) => setInputContact(e.target.value)}
                placeholder="手机号或邮箱 *（二选一）"
                autoComplete="off"
                className="w-full rounded-lg border border-fog-2 bg-ink px-4 py-3 text-sm text-bone outline-none transition focus:border-volt placeholder:text-dust"
              />
              <input
                type="text"
                value={inputCompany}
                onChange={(e) => setInputCompany(e.target.value)}
                placeholder="公司 / 行业（选填，帮邱懿武更懂你）"
                className="w-full rounded-lg border border-fog-2 bg-ink px-4 py-3 text-sm text-bone outline-none transition focus:border-volt placeholder:text-dust"
              />
              <input
                type="password"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="授权暗号（选填 · 有邱懿武给的暗号则不限次）"
                autoComplete="off"
                className="w-full rounded-lg border border-fog-2 bg-ink px-4 py-3 text-sm text-bone outline-none transition focus:border-volt placeholder:text-dust"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={!inputName.trim() || !inputContact.trim() || submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "提交中…" : "开始 / 继续推演"}
                {!submitting && <ArrowRight className="size-4" />}
              </button>
              <p className="text-[11px] leading-relaxed text-dust">
                联系方式仅用于邱懿武本人回访，不会公开或他用。
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
