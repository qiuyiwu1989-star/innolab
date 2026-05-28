import type { Metadata } from "next";
import { getAllCases, getAllDomains } from "@/lib/cases";
import { CasesExplorer } from "./cases-explorer";

export const metadata: Metadata = {
  title: "案例库",
  description:
    "InnoLab 33 个真实商业案例 — 4S 店新能源转型、供应链 SaaS 出海、企微社群运营失效、医疗 SaaS 采购、跨境电商品类扩张、消费金融增长、K12 AI 转型、制造业 AI 停摆。每个案例完整复原分析流程与关键判断。",
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
