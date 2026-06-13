"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { LiveRunner } from "@/app/demo/live-runner";
import type { MethodMeta } from "@/components/demo/method-chain-viz";

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

const LS_PASSCODE = "innolab.access.passcode";
const LS_LABEL = "innolab.access.label";
const LS_USERKEY = "innolab.access.userkey";
const LS_NAME = "innolab.access.name";

export function AccessGate({ methodsIndex, casesIndex }: AccessGateProps) {
  const [ready, setReady] = useState(false);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [userKey, setUserKey] = useState("");
  const [name, setName] = useState("");

  // 表单态
  const [inputCode, setInputCode] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputContact, setInputContact] = useState("");
  const [inputCompany, setInputCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 个性化记忆：欢迎横幅文案 + 注入推演的上下文摘要
  const [memoryFocus, setMemoryFocus] = useState<string[]>([]);
  const [memoryCount, setMemoryCount] = useState(0);
  const [memoryContext, setMemoryContext] = useState("");

  // 恢复本地授权
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_PASSCODE);
      if (saved) {
        setPasscode(saved);
        setLabel(localStorage.getItem(LS_LABEL) ?? "");
        setUserKey(localStorage.getItem(LS_USERKEY) ?? "");
        setName(localStorage.getItem(LS_NAME) ?? "");
      }
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  // 已授权 + 有 userKey → 拉取这个人的「记忆」
  useEffect(() => {
    const uk = userKey.trim();
    if (!passcode || !uk) return;
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
  }, [passcode, userKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = inputCode.trim();
    const nm = inputName.trim();
    const contact = inputContact.trim();
    if (!code || !nm || !contact) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: code,
          name: nm,
          contact,
          company: inputCompany.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        try {
          localStorage.setItem(LS_PASSCODE, code);
          localStorage.setItem(LS_LABEL, data.label ?? "");
          localStorage.setItem(LS_USERKEY, data.userKey ?? "");
          localStorage.setItem(LS_NAME, data.name ?? nm);
        } catch {
          /* noop */
        }
        setPasscode(code);
        setLabel(data.label ?? "");
        setUserKey(data.userKey ?? "");
        setName(data.name ?? nm);
      } else {
        setError(data.error ?? "验证失败，请重试。");
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
    setInputCode("");
  }

  if (!ready) return <div className="h-64" aria-hidden />;

  // 已授权 → 推演工作台
  if (passcode) {
    const hasMemory = memoryCount > 0;
    return (
      <div>
        <div className="mb-4 flex items-center justify-between rounded-lg border border-fog-2 bg-soot px-4 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-volt">
            <ShieldCheck className="size-3.5" />
            {name ? `${name} · ` : ""}已授权 · 推演不限次
          </span>
          <button
            type="button"
            onClick={signOut}
            className="text-dust transition hover:text-ash"
          >
            退出
          </button>
        </div>

        {/* 个性化记忆横幅 —— 明示「我记得你」 */}
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
          clientToken={passcode}
          userKey={userKey}
          memoryContext={memoryContext}
        />
      </div>
    );
  }

  // 未授权 → 留资闸门
  const canSubmit =
    !!inputCode.trim() && !!inputName.trim() && !!inputContact.trim();

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-fog-2 bg-soot p-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-volt/40 bg-volt/[0.05] px-3 py-1 text-[11px] font-medium text-volt">
        <Lock className="size-3" />
        授权访问
      </div>
      <h2 className="display mt-5 text-2xl text-bone sm:text-3xl">
        战略推演工作台
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ash">
        这是邱懿武战略咨询的专属推演工具。凭授权暗号 + 留下联系方式即可长期不限次使用。
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="password"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="授权暗号"
          autoComplete="off"
          className="w-full rounded-lg border border-fog-2 bg-ink px-4 py-3 text-sm text-bone outline-none transition focus:border-volt placeholder:text-dust"
        />
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
          placeholder="公司 / 行业（选填）"
          className="w-full rounded-lg border border-fog-2 bg-ink px-4 py-3 text-sm text-bone outline-none transition focus:border-volt placeholder:text-dust"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "验证中…" : "进入工作台"}
          {!submitting && <ArrowRight className="size-4" />}
        </button>
        <p className="text-[11px] leading-relaxed text-dust">
          联系方式仅用于邱懿武本人回访，不会公开或他用。
        </p>
      </form>

      <div className="mt-6 border-t border-fog-1 pt-5 text-xs text-dust">
        没有暗号？InnoLab 是邱懿武咨询服务的一部分 ——{" "}
        <Link href="/about" className="text-volt hover:underline">
          联系邱懿武获取访问
        </Link>
        。
      </div>
    </div>
  );
}
