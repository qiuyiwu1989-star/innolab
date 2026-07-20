"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-200",
        scrolled
          ? "border-b border-fog-2 bg-ink/90 backdrop-blur"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-baseline gap-1">
          <span className="text-base font-semibold tracking-tight text-bone">
            InnoLab
          </span>
          <span className="size-1.5 translate-y-[-1px] rounded-full bg-volt transition group-hover:scale-150" />
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <NavLink href="/methods">方法库</NavLink>
          <NavLink href="/cases">案例</NavLink>
          <NavLink href="/demo">Demo</NavLink>
          <NavLink href="/about">关于</NavLink>
          <NavLink href="/mcp-guide">MCP</NavLink>
          <NavLink href="/me">我的</NavLink>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("innolab:open-cmdk"))
            }
            className="ml-2 inline-flex items-center gap-2 rounded-md border border-fog-2 bg-soot px-2.5 py-1.5 text-xs text-dust transition hover:border-fog-3 hover:text-bone"
            aria-label="搜索"
          >
            <Search className="size-3.5" />
            <span>搜索</span>
            <kbd className="numeral rounded border border-fog-2 px-1 text-[10px]">
              ⌘K
            </kbd>
          </button>
          <ThemeToggle className="ml-1" />
          <Link
            href="/about"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-volt px-4 py-1.5 text-xs font-medium text-ink transition hover:brightness-110"
          >
            联系咨询
          </Link>
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-1.5 text-bone"
            aria-label={open ? "关闭菜单" : "打开菜单"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-fog-2 bg-ink md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 text-sm">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event("innolab:open-cmdk"));
              }}
              className="flex items-center gap-2 rounded-md border border-fog-2 bg-soot px-3 py-2.5 text-sm text-dust"
            >
              <Search className="size-4" />
              搜索方法 / 案例 / 页面
            </button>
            <MobileLink href="/methods" onClick={() => setOpen(false)}>
              方法库
            </MobileLink>
            <MobileLink href="/cases" onClick={() => setOpen(false)}>
              案例
            </MobileLink>
            <MobileLink href="/demo" onClick={() => setOpen(false)}>
              Demo · 试用
            </MobileLink>
            <MobileLink href="/about" onClick={() => setOpen(false)}>
              关于
            </MobileLink>
            <MobileLink href="/mcp-guide" onClick={() => setOpen(false)}>
              MCP · 对接
            </MobileLink>
            <MobileLink href="/me" onClick={() => setOpen(false)}>
              我的
            </MobileLink>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-volt px-4 py-2.5 text-center text-sm font-semibold text-ink"
            >
              联系咨询
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-ash transition hover:text-bone"
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-md px-3 py-3 text-base text-bone hover:bg-graphite"
    >
      {children}
    </Link>
  );
}
