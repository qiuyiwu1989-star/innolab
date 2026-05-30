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

/**
 * 访问门禁 —— InnoLab 推演为授权专属。
 * 未授权：显示暗号输入（= 注册，留称呼/公司）。
 * 已授权：渲染 LiveRunner，并把暗号作为 clientToken 透传（豁免限流、不限次）。
 */
export function AccessGate({ methodsIndex, casesIndex }: AccessGateProps) {
  const [ready, setReady] = useState(false);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [label, setLabel] = useState<string>("");

  // 表单态
  const [inputCode, setInputCode] = useState("");
  const [inputName, setInputName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 恢复本地授权
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_PASSCODE);
      const savedLabel = localStorage.getItem(LS_LABEL) ?? "";
      if (saved) {
        setPasscode(saved);
        setLabel(savedLabel);
      }
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = inputCode.trim();
    if (!code) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code, name: inputName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        try {
          localStorage.setItem(LS_PASSCODE, code);
          localStorage.setItem(LS_LABEL, data.label ?? "");
        } catch {
          /* noop */
        }
        setPasscode(code);
        setLabel(data.label ?? "");
      } else {
        setError(data.error ?? "暗号不正确，请重试。");
      }
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  function signOut() {
    try {
      localStorage.removeItem(LS_PASSCODE);
      localStorage.removeItem(LS_LABEL);
    } catch {
      /* noop */
    }
    setPasscode(null);
    setLabel("");
    setInputCode("");
  }

  // 避免 SSR/CSR 闪烁：localStorage 读完前不渲染
  if (!ready) {
    return <div className="h-64" aria-hidden />;
  }

  // 已授权 → 推演工作台
  if (passcode) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between rounded-lg border border-fog-2 bg-soot px-4 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-volt">
            <ShieldCheck className="size-3.5" />
            已授权{label ? ` · ${label}` : ""} · 推演不限次
          </span>
          <button
            type="button"
            onClick={signOut}
            className="text-dust transition hover:text-ash"
          >
            退出
          </button>
        </div>
        <LiveRunner
          methodsIndex={methodsIndex}
          casesIndex={casesIndex}
          clientToken={passcode}
        />
      </div>
    );
  }

  // 未授权 → 暗号门禁
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
        这是邱懿武战略咨询的专属推演工具。输入授权暗号即可长期使用。
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
          placeholder="你的称呼 / 公司（选填）"
          className="w-full rounded-lg border border-fog-2 bg-ink px-4 py-3 text-sm text-bone outline-none transition focus:border-volt placeholder:text-dust"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={!inputCode.trim() || submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-volt px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "验证中…" : "进入工作台"}
          {!submitting && <ArrowRight className="size-4" />}
        </button>
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
