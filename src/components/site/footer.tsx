import Link from "next/link";
import { Github, Activity } from "lucide-react";
import { getBuildInfo } from "@/lib/build-info";

/**
 * 全站 footer — 含版本 / 构建时间 / 健康状态链接 / 关键导航。
 * server 组件，构建时把版本信息编译进 HTML。
 */
export function SiteFooter() {
  const { shortSha, builtAt, version } = getBuildInfo();
  // 简化显示：年月日
  const builtDate = builtAt.slice(0, 10);

  return (
    <footer className="border-t border-fog-1 py-10 mt-auto">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* —— 品牌 + 简介 —— */}
          <div className="max-w-md">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-bone">InnoLab</span>
              <span className="size-1.5 translate-y-[-1px] rounded-full bg-volt" />
              <span className="ml-2 text-xs text-dust">© 2026</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ash">
              用 83 个方法论分析你的真实商业问题。
              <br />
              邱懿武 ·{" "}
              <a
                href="https://qiuyiwu.com"
                target="_blank"
                rel="noopener"
                className="text-ash hover:text-volt"
              >
                qiuyiwu.com
              </a>
            </p>
          </div>

          {/* —— 站内导航 —— */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ash">
            <Link href="/methods" className="hover:text-bone">
              方法
            </Link>
            <Link href="/cases" className="hover:text-bone">
              案例
            </Link>
            <Link href="/demo" className="hover:text-bone">
              Demo
            </Link>
            <Link href="/about" className="hover:text-bone">
              关于
            </Link>
          </nav>

          {/* —— 状态 + 版本 —— */}
          <div className="flex flex-col items-start gap-2 text-xs sm:items-end">
            <div className="flex items-center gap-3">
              <a
                href="/api/health"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-ash transition hover:text-volt"
                title="健康检查"
              >
                <Activity className="size-3" />
                <span>状态</span>
              </a>
              <a
                href="https://github.com/qiuyiwu1989-star/innolab"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-ash transition hover:text-volt"
              >
                <Github className="size-3" />
                <span>GitHub</span>
              </a>
            </div>
            <div className="numeral text-[10px] text-dust">
              v{version} · {shortSha} · 构建于 {builtDate}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
