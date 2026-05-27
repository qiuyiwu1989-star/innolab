import type { Metadata } from "next";
import { getAllCases, getAllDomains } from "@/lib/cases";
import { CasesExplorer } from "./cases-explorer";

export const metadata: Metadata = {
  title: "案例库",
  description:
    "InnoLab 收录的真实案例 — 教育、AI 产品、企业转型、IP 商业化。每个案例标注关联方法。",
};

export default function CasesPage() {
  const cases = getAllCases();
  const domains = getAllDomains();
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
      <header className="mb-12">
        <div className="numeral text-xs uppercase tracking-widest text-volt">
          Cases · 案例库
        </div>
        <h1 className="display mt-3 text-4xl text-bone sm:text-6xl">
          {cases.length} 个真实案例
        </h1>
        <p className="mt-4 max-w-2xl text-base text-ash sm:text-lg">
          方法论的价值在于被用过。每个案例标注了它用了 InnoLab 的哪几个方法 ——
          点开看具体的判断、数据和坑。
        </p>
      </header>
      <CasesExplorer cases={cases} domains={domains} />
    </div>
  );
}
