"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronRight, Beaker, ArrowRight, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "innolab.onboarded.v1";

// ── 3 步引导内容 ────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "what",
    badge: "01 / 03",
    title: "InnoLab 是战略推演引擎",
    subtitle: "不是 AI 问答机器",
    body: (
      <div className="space-y-3 text-sm text-ash leading-relaxed">
        <p>
          普通 AI：你问 → 它答 → 你关掉。
        </p>
        <p>
          InnoLab：你的问题进入
          <span className="text-bone font-medium"> 77 个方法框架</span>的弹药库。
          引擎选出最匹配的方法链，系统性推演出
          <span className="text-bone font-medium"> 问题重构 → 方法链 → 关键判断 → 推演结论</span>。
        </p>
        <p className="text-dust text-xs">
          背后：认知 / 战略 / 生成 / 决策 / 产品 / 进化 六个引擎协同运作。
        </p>
      </div>
    ),
    visual: (
      <div className="flex items-center gap-2 flex-wrap text-[11px]">
        {[
          { id: "CG14", label: "认知", color: "text-amber-300 border-amber-400/40" },
          { id: "ST06", label: "战略", color: "text-sky-300 border-sky-400/40" },
          { id: "GN03", label: "生成", color: "text-emerald-300 border-emerald-400/40" },
          { id: "DC04", label: "决策", color: "text-rose-300 border-rose-400/40" },
        ].map((m, i, arr) => (
          <span key={m.id} className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                "rounded border bg-ink px-2 py-1 numeral font-bold",
                m.color,
              )}
            >
              {m.id}
            </span>
            {i < arr.length - 1 && (
              <ArrowRight className="size-3 text-dust" />
            )}
          </span>
        ))}
        <span className="flex items-center gap-1.5 shrink-0">
          <ArrowRight className="size-3 text-volt" />
          <span className="rounded border border-volt/40 bg-volt/[0.06] px-2 py-1 text-volt">
            推演结论
          </span>
        </span>
      </div>
    ),
  },
  {
    id: "question",
    badge: "02 / 03",
    title: "问得越具体，推演越精准",
    subtitle: "一个好问题的样子",
    body: (
      <div className="space-y-3">
        <div className="rounded-lg border border-rose-400/30 bg-rose-400/[0.04] p-3">
          <div className="text-[10px] text-rose-400 uppercase tracking-widest mb-1.5">
            ✗ 太模糊
          </div>
          <div className="text-sm text-ash">
            「我该怎么做 AI 转型？」
          </div>
        </div>
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/[0.04] p-3">
          <div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-1.5">
            ✓ 具体有效
          </div>
          <div className="text-sm text-ash">
            「我们是 200 人制造业，年营收 3 亿，产品是工业配件。
            AI 转型一年，用了 5 个工具但都没跑起来——问题在哪？」
          </div>
        </div>
        <p className="text-[11px] text-dust">
          关键要素：行业 / 规模 / 现状痛点 / 已试过什么 / 你真正要决策的是什么。
        </p>
      </div>
    ),
    visual: null,
  },
  {
    id: "thread",
    badge: "03 / 03",
    title: "越问越深 — 多轮对话才是精华",
    subtitle: "分析完成后有四种继续方式",
    body: (
      <div className="space-y-3 text-sm text-ash leading-relaxed">
        <p>
          每次分析完成，InnoLab 带着前文判断继续你的问题——不是从头想：
        </p>
        <ul className="space-y-2">
          {[
            {
              icon: <span className="text-volt font-bold text-[11px]">⚡</span>,
              label: "一键追问",
              desc: "InnoLab 会建议 3 个下一步问题，点击直接触发",
            },
            {
              icon: <MessageSquarePlus className="size-3.5 text-volt" />,
              label: "自由追问",
              desc: "输入任何补充问题，引擎带着你的背景回答",
            },
            {
              icon: <span className="text-volt text-[11px]">↺</span>,
              label: "换角度",
              desc: "用户 / 竞品 / 风险 / 数据 四个视角",
            },
            {
              icon: <span className="text-volt text-[11px]">⊕</span>,
              label: "深入某方法",
              desc: "点方法卡片，要该方法的具体执行步骤",
            },
          ].map((item) => (
            <li
              key={item.label}
              className="flex items-start gap-2 rounded-lg border border-fog-2 bg-ink px-3 py-2"
            >
              <span className="mt-0.5 shrink-0">{item.icon}</span>
              <div>
                <div className="text-xs font-medium text-bone">{item.label}</div>
                <div className="text-[11px] text-dust">{item.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ),
    visual: null,
  },
] as const;

// ── 组件 ────────────────────────────────────────────────────────────────────

export function OnboardTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {
      /* localStorage 不可用则不显示 */
    }
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  // 键盘导航
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "Enter" || e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, dismiss, next]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    /* 遮罩层 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      {/* 面板 */}
      <div className="relative w-full max-w-md rounded-2xl border border-fog-3 bg-soot shadow-2xl">
        {/* 关闭 */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-md text-dust transition hover:bg-fog-2 hover:text-bone"
          aria-label="跳过引导"
        >
          <X className="size-4" />
        </button>

        {/* 头部品牌 */}
        <div className="flex items-center gap-2 border-b border-fog-2 px-6 py-4">
          <Beaker className="size-4 text-volt" />
          <span className="text-sm font-medium text-bone">InnoLab</span>
          <span className="ml-auto numeral text-[10px] text-dust">
            {current.badge}
          </span>
        </div>

        {/* 内容 */}
        <div className="px-6 py-5">
          <div className="text-[11px] uppercase tracking-widest text-volt mb-2">
            {current.subtitle}
          </div>
          <h2 className="text-xl font-semibold text-bone leading-snug mb-4">
            {current.title}
          </h2>

          {/* 正文 */}
          <div>{current.body}</div>

          {/* 可选视觉元素 */}
          {current.visual && (
            <div className="mt-4 rounded-lg border border-fog-2 bg-ink p-3">
              {current.visual}
            </div>
          )}
        </div>

        {/* 底部按钮区 */}
        <div className="flex items-center gap-3 border-t border-fog-2 px-6 py-4">
          {/* 步骤指示器 */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition",
                  i === step ? "bg-volt" : "bg-fog-2",
                )}
              />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="text-xs text-dust hover:text-ash transition"
            >
              跳过
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-md bg-volt px-4 py-2 text-xs font-semibold text-ink transition hover:brightness-110"
            >
              {isLast ? "开始使用" : "下一步"}
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
