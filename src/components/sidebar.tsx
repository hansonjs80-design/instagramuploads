"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  FilePlus2,
  FolderSearch2,
  Images,
  LayoutDashboard,
  LibraryBig,
  Settings,
  ShieldCheck,
  Send,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "New Content", href: "/content/new", icon: FilePlus2 },
  { label: "Library", href: "/library", icon: LibraryBig },
  { label: "Instagram", href: "/instagram", icon: Images },
  { label: "Blog", href: "/blog", icon: BookOpenText },
  { label: "Sources", href: "/sources", icon: FolderSearch2 },
  { label: "Published", href: "/published", icon: Send },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="desktop-sidebar sticky top-0 h-screen flex-col border-r border-[#dce6e3] bg-[#f9fbfa]/95 px-4 py-5 backdrop-blur">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <span className="grid size-10 place-items-center rounded-xl bg-[#176b63] text-white shadow-sm">
          <ShieldCheck size={20} strokeWidth={2.2} />
        </span>
        <span>
          <span className="block text-[0.95rem] font-extrabold tracking-[-0.035em]">Exercise Content</span>
          <span className="block text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#758481]">Studio</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1.5" aria-label="주요 메뉴">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.82rem] font-bold transition ${
                active
                  ? "bg-[#dff1ed] text-[#0d5d55]"
                  : "text-[#60706e] hover:bg-white hover:text-[#203635]"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.4 : 1.9} />
              {item.label}
              {active ? <span className="ml-auto size-1.5 rounded-full bg-[#176b63]" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-[#d7e5e1] bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-[0.72rem] font-extrabold text-[#245d57]">
          <ShieldCheck size={15} />
          Source first
        </div>
        <p className="m-0 text-[0.7rem] leading-5 text-[#71817f]">
          분석은 새롭게, 출처는 정확하게. 게시 전 임상 검토를 잊지 마세요.
        </p>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="mobile-header sticky top-0 z-30 items-center justify-between border-b border-[#dce6e3] bg-[#f9fbfa]/95 px-4 py-3 backdrop-blur">
      <Link href="/" className="flex items-center gap-2 font-extrabold tracking-[-0.03em]">
        <span className="grid size-8 place-items-center rounded-lg bg-[#176b63] text-white">
          <ShieldCheck size={17} />
        </span>
        Exercise Content Studio
      </Link>
      <Link href="/content/new" className="btn-quiet !min-h-9 !px-3">
        <FilePlus2 size={15} /> 새 자료
      </Link>
    </header>
  );
}
