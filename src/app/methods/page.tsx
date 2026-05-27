import type { Metadata } from "next";
import { getAllMethods } from "@/lib/methods";
import { MethodsExplorer } from "./methods-explorer";

export const metadata: Metadata = {
  title: "方法库",
  description:
    "InnoLab 收录的 75 个战略、产品、认知方法论。按引擎和认知层级浏览、筛选、搜索。",
};

export default function MethodsPage() {
  const methods = getAllMethods();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <div className="text-xs font-medium uppercase tracking-wider text-ink/40">
          Methods · 方法库
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          {methods.length} 个方法，
          <br className="sm:hidden" />6 大引擎，5 层认知
        </h1>
        <p className="mt-4 max-w-2xl text-ink/70">
          每张方法卡都标注了它工作的引擎、认知层级和来源。
          挑你需要的层级，挑你正在的环节，挑你能听懂的来源——然后再点开看怎么用。
        </p>
      </header>

      <MethodsExplorer methods={methods} />
    </div>
  );
}
