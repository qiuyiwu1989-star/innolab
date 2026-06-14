"use client";

import { useState } from "react";
import { BookOpen, Bot } from "lucide-react";
import { Markdown } from "./markdown";
import { MethodModules } from "./method-modules";

// 方法详情页双频道：
//   📖 讲解（给人看）—— 论文/说明书式，流式排版，默认
//   🤖 标准模组（给 AI 看）—— 9 段结构化模组卡（也是喂给推演的规格）

export function MethodChannels({
  guide,
  body,
}: {
  guide: string;
  body: string;
}) {
  const [tab, setTab] = useState<"guide" | "module">("guide");

  const tabCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
      active ? "bg-volt/15 text-volt" : "text-dust hover:text-ash"
    }`;

  return (
    <div>
      <div className="mb-7 inline-flex gap-1 rounded-lg border border-fog-2 bg-soot p-1">
        <button
          type="button"
          onClick={() => setTab("guide")}
          className={tabCls(tab === "guide")}
        >
          <BookOpen className="size-4" /> 讲解
        </button>
        <button
          type="button"
          onClick={() => setTab("module")}
          className={tabCls(tab === "module")}
        >
          <Bot className="size-4" /> 标准模组
        </button>
      </div>

      {tab === "guide" ? (
        <>
          <Markdown source={guide} />
          <p className="mt-10 border-t border-fog-2 pt-5 text-xs text-dust">
            想看这套方法喂给 AI 的执行规格？点上方「标准模组」。
          </p>
        </>
      ) : (
        <>
          <p className="mb-5 rounded-lg border border-fog-2 bg-soot/50 px-4 py-3 text-xs text-dust">
            下面是「给 AI 看」的标准模组——9 段结构化规格，也是 InnoLab 推演时调用这套方法的执行依据。想读人话讲解请点上方「讲解」。
          </p>
          <MethodModules body={body} />
        </>
      )}
    </div>
  );
}
