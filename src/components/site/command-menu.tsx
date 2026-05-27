"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, ArrowRight, Hash, Folder, Sparkles, FileText } from "lucide-react";
import type { SearchItem } from "@/lib/search";
import { cn } from "@/lib/utils";

export function CommandMenu({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // 全局快捷键 + 自定义事件触发
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("innolab:open-cmdk" as any, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("innolab:open-cmdk" as any, onOpen);
    };
  }, []);

  const select = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const group = (type: SearchItem["type"]) =>
    items.filter((i) => i.type === type);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-in fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-[15%] z-[101] w-[92vw] max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border border-fog-3 bg-ink shadow-2xl"
          >
            <Command
              className="flex flex-col"
              filter={(value, search) => {
                if (!search) return 1;
                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                return 0;
              }}
            >
              <div className="flex items-center gap-3 border-b border-fog-2 px-5 py-4">
                <Search className="size-4 text-dust" />
                <Command.Input
                  autoFocus
                  placeholder="搜索方法 · 案例 · 页面 …  例：蓝海、CG14、教育"
                  className="flex-1 bg-transparent text-sm text-bone outline-none placeholder:text-dust"
                />
                <kbd className="numeral hidden rounded border border-fog-2 px-1.5 py-0.5 text-[10px] text-dust sm:inline-block">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-10 text-center text-sm text-dust">
                  没有匹配项
                </Command.Empty>

                <Section title="页面" group={group("page")} select={select} icon="page" />
                <Section title="引擎" group={group("engine")} select={select} icon="engine" />
                <Section title="案例" group={group("case")} select={select} icon="case" />
                <Section title="方法" group={group("method")} select={select} icon="method" />
              </Command.List>

              <div className="flex items-center justify-between border-t border-fog-2 px-5 py-2.5 text-[11px] text-dust">
                <div className="flex items-center gap-3">
                  <span>
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd> 移动
                  </span>
                  <span>
                    <Kbd>↵</Kbd> 选择
                  </span>
                </div>
                <span>InnoLab Command</span>
              </div>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}

function Section({
  title,
  group,
  select,
  icon,
}: {
  title: string;
  group: SearchItem[];
  select: (href: string) => void;
  icon: "page" | "method" | "case" | "engine";
}) {
  if (group.length === 0) return null;
  return (
    <Command.Group
      heading={
        <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-dust">
          {title}
        </div>
      }
    >
      {group.map((i) => (
        <Command.Item
          key={`${i.type}-${i.id}-${i.href}`}
          value={`${i.title} ${i.keywords}`}
          onSelect={() => select(i.href)}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
            "data-[selected=true]:bg-graphite",
          )}
        >
          <IconBox kind={icon} item={i} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              {i.type === "method" && (
                <span className="numeral text-xs text-volt">{i.id}</span>
              )}
              {i.type === "case" && (
                <span className="numeral text-xs text-dust">{i.id}</span>
              )}
              {i.type === "engine" && (
                <span className="numeral text-xs text-volt">{i.id}</span>
              )}
              <span className="truncate text-bone">{i.title}</span>
            </div>
            {i.sub && (
              <div className="truncate text-xs text-dust">{i.sub}</div>
            )}
          </div>
          {i.type === "method" && (
            <span className="numeral hidden shrink-0 text-[10px] text-dust sm:inline-block">
              {(i as Extract<SearchItem, { type: "method" }>).engineCn} ·{" "}
              {(i as Extract<SearchItem, { type: "method" }>).layer}
            </span>
          )}
          <ArrowRight className="size-3.5 shrink-0 text-dust" />
        </Command.Item>
      ))}
    </Command.Group>
  );
}

function IconBox({ kind }: { kind: string; item: SearchItem }) {
  const Icon =
    kind === "page"
      ? FileText
      : kind === "method"
        ? Hash
        : kind === "case"
          ? Folder
          : Sparkles;
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-fog-2 bg-soot">
      <Icon className="size-4 text-ash" />
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="numeral mx-0.5 rounded border border-fog-2 px-1 py-px text-[10px]">
      {children}
    </kbd>
  );
}
