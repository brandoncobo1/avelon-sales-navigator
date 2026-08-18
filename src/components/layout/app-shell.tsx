"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

// The live Call Navigator (/call/[callId]) is a full-bleed, distraction-free
// screen by design — it renders its own top bar and owns the whole viewport.
// Every other screen gets the persistent sidebar/nav chrome.
function isFocusedCallRoute(pathname: string) {
  return /^\/call\/(?!new$)[^/]+$/.test(pathname);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const focused = isFocusedCallRoute(pathname);

  if (focused) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
        <div className="fixed bottom-0 left-0 right-0 md:hidden">
          <MobileNav />
        </div>
      </div>
    </div>
  );
}
