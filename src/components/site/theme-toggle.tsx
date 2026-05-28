"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 三态主题切换：明 / 系统 / 暗
 * - 显示当前模式的图标
 * - 点击在 light → system → dark → light 间循环
 * - 避免 hydration 闪烁：首次渲染只占位
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 没 mount 之前渲染占位，避免 hydration 不一致
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="主题切换"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md border border-fog-2 bg-soot text-ash",
          className,
        )}
      >
        <Monitor className="size-4" />
      </button>
    );
  }

  const cycle = () => {
    if (theme === "light") setTheme("system");
    else if (theme === "system") setTheme("dark");
    else setTheme("light");
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label =
    theme === "light"
      ? "亮色"
      : theme === "dark"
        ? "暗色"
        : `跟随系统（当前 ${resolvedTheme === "dark" ? "暗" : "亮"}）`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`主题：${label}，点击切换`}
      title={label}
      className={cn(
        "group inline-flex size-8 items-center justify-center rounded-md border border-fog-2 bg-soot text-ash transition hover:border-fog-3 hover:text-bone",
        className,
      )}
    >
      <Icon className="size-4 transition group-active:scale-90" />
    </button>
  );
}
