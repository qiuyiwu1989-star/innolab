import type { Metadata } from "next";
import { getAllCases, getAllDomains } from "@/lib/cases";
import { CasesExplorer } from "./cases-explorer";

export const metadata: Metadata = {
  title: "案例库",
  description:
    "InnoLab 收录的真实案例 — 教育、AI 产品、企业转型、IP 商业化。每个案例都标注关联的 InnoLab 方法。",
};

export default function CasesPage() {
  const cases = getAllCases();
  const domains = getAllDomains();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <div className="text-xs font-medium uppercase tracking-wider text-ink/40">
          Cases · 案例库
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          {cases.length} 个真实案例
        </h1>
        <p className="mt-4 max-w-2xl text-ink/70">
          方法论的价值在于被用过。每个案例都标注了它用了 InnoLab
          的哪几个方法，点开能看到具体的判断、数据和坑。
        </p>
      </header>

      <CasesExplorer cases={cases} domains={domains} />
    </div>
  );
}
