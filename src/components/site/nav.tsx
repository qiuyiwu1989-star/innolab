import Link from "next/link";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-mist bg-paper/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="block size-6 rounded-md bg-gradient-to-br from-cobalt via-violet to-flare transition group-hover:rotate-6" />
          <span className="font-semibold tracking-tight">InnoLab</span>
          <span className="hidden text-xs text-ink/40 sm:inline">
            · 邱懿武的创新实验室
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/methods">方法</NavLink>
          <NavLink href="/cases">案例</NavLink>
          <NavLink href="/about">关于</NavLink>
          <a
            href="https://github.com/qiuyiwu1989-star/innolab"
            target="_blank"
            rel="noopener"
            className="ml-2 rounded-full border border-mist px-3 py-1.5 text-xs font-medium transition hover:border-ink"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
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
      className="rounded-full px-3 py-1.5 transition hover:bg-mist/60"
    >
      {children}
    </Link>
  );
}
