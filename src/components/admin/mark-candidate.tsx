"use client";

import { useState } from "react";
import { Bookmark, Check } from "lucide-react";

interface Props {
  token: string;
  ts: string;
  alreadyMarked: boolean;
}

/** 看板里每条对话的「标记为候选案例」按钮 —— 飞轮第②圈 */
export function MarkCandidate({ token, ts, alreadyMarked }: Props) {
  const [marked, setMarked] = useState(alreadyMarked);
  const [busy, setBusy] = useState(false);

  async function mark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (marked || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ts }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) setMarked(true);
    } catch {
      /* noop */
    } finally {
      setBusy(false);
    }
  }

  if (marked) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-volt/40 bg-volt/[0.06] px-2 py-0.5 text-[10px] text-volt">
        <Check className="size-3" />
        候选案例
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={mark}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded border border-fog-2 px-2 py-0.5 text-[10px] text-ash transition hover:border-volt hover:text-volt disabled:opacity-50"
    >
      <Bookmark className="size-3" />
      {busy ? "标记中…" : "标记为候选案例"}
    </button>
  );
}
