"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Building2,
  FileInput,
  Inbox,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/inbox",      label: "Inbox",       icon: Inbox },
  { href: "/import",     label: "Import",      icon: FileInput },
  { href: "/properties", label: "Properties",  icon: Building2 },
  { href: "/settings",   label: "Settings",    icon: Settings },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-900">AI Co-Host</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <p className="text-xs text-slate-400">AI Co-Host · MVP</p>
      </div>
    </aside>
  );
}

/* Mobile top bar — shown below lg breakpoint */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-900">AI Co-Host</span>
      </div>
      <nav className="flex gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
