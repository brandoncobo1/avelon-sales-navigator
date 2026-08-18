"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Phone, Workflow, History, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/call/new", label: "Call", icon: Phone },
  { href: "/builder", label: "Builder", icon: Workflow },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex md:hidden border-t border-white/10 bg-[#0d0f14]">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("/").slice(0, 2).join("/"));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150",
              active ? "text-indigo-300" : "text-white/50",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
