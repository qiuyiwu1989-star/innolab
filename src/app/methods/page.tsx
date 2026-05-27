import type { Metadata } from "next";
import { getAllMethods } from "@/lib/methods";
import { MethodsExplorer } from "./methods-explorer";

export const metadata: Metadata = {
  title: "方法库",
  description:
    "InnoLab 收录的 74 个战略 · 产品 · 认知方法论。按引擎和认知层级浏览、筛选、搜索。",
};

export default function MethodsPage() {
  const methods = getAllMethods();
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
      <header className="mb-12">
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          Methods · 方法库
        </div>
        <h1 className="display mt-3 text-4xl text-bone sm:text-6xl">
          {methods.length} 个方法
        </h1>
        <p className="mt-4 max-w-2xl text-base text-ash sm:text-lg">
          每张方法卡标注了它工作的引擎、认知层级和来源。挑你需要的层级、挑你正在的环节、挑你能听懂的来源——再点开看怎么用。
        </p>
      </header>
      <MethodsExplorer methods={methods} />
    </div>
  );
}
