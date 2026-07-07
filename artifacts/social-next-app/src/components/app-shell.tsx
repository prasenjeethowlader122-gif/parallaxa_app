"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Home", href: "/feed", icon: "home" },
  { label: "Explore", href: "/explore", icon: "search" },
  { label: "Notifications", href: "/notifications", icon: "notifications" },
  { label: "Messages", href: "/messages", icon: "chat" },
  { label: "Profile", href: "/profile", icon: "person" },
];

const SECONDARY_NAV = [
  { label: "Bookmarks", href: "/bookmarks", icon: "bookmark" },
  { label: "Settings", href: "/settings", icon: "settings" },
  { label: "About", href: "/about", icon: "info" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const isAuthPage = ["/login", "/register", "/forgot-password", "/splash"].includes(pathname);

  if (isAuthPage) return <>{children}</>;

  const SidebarContent = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border mb-2 lg:hidden">
        <button
          onClick={() => onSelect?.()}
          className="-ml-2 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <span className="material-symbols-outlined !text-[22px]">arrow_back</span>
        </button>
        <img src="/text-logo-dark.svg" className="h-[26px] dark:hidden" alt="Parallaxa" />
        <img src="/text-logo.svg" className="h-[26px] hidden dark:block" alt="Parallaxa" />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onSelect?.()}
              className={cn(
                "flex items-center gap-5 px-3 py-3 rounded-full transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-foreground hover:bg-muted/50"
              )}
            >
              <span className={cn(
                "material-symbols-outlined !text-[26px]",
                isActive && "fill-1"
              )}>{item.icon}</span>
              <span className={cn(
                "text-[20px]",
                isActive ? "font-[700]" : "font-[500]"
              )}>{item.label}</span>
            </Link>
          );
        })}

        <div className="my-6 border-t border-border" />

        {SECONDARY_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onSelect?.()}
              className={cn(
                "flex items-center gap-5 px-3 py-3 rounded-full transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-foreground hover:bg-muted/50"
              )}
            >
              <span className={cn(
                "material-symbols-outlined !text-[26px]",
                isActive && "fill-1"
              )}>{item.icon}</span>
              <span className={cn(
                "text-[20px]",
                isActive ? "font-[800]" : "font-[500]"
              )}>{item.label}</span>
            </Link>
          );
        })}

        <div className="mt-4 px-3">
          <Button
            className="w-full h-[54px] rounded-full text-[18px] font-[700] bg-primary text-white hover:bg-primary/90 shadow-none"
            onClick={() => {
              onSelect?.();
              router.push("/create-post");
            }}
          >
            Post
          </Button>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-5 px-3 py-3 w-full rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <span className="material-symbols-outlined !text-[26px]">logout</span>
          <span className="text-[20px] font-[500]">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[300px] border-r border-border flex-col shrink-0">
         <div className="px-5 py-6 mb-4">
            <img src="/text-logo-dark.svg" className="h-[26px] dark:hidden" alt="Parallaxa" />
            <img src="/text-logo.svg" className="h-[26px] hidden dark:block" alt="Parallaxa" />
         </div>
         <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-[56px] border-b border-border flex items-center justify-between px-4 sticky top-0 bg-background z-30 shrink-0">
          <div className="flex items-center gap-1">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full -ml-2">
                  <span className="material-symbols-outlined !text-[22px]">menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[300px] border-none">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SidebarContent onSelect={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <img src="/text-logo-dark.svg" className="h-[26px] dark:hidden ml-1" alt="Parallaxa" />
            <img src="/text-logo.svg" className="h-[26px] hidden dark:block ml-1" alt="Parallaxa" />
          </div>

          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => router.push('/explore')}>
              <span className="material-symbols-outlined !text-[22px]">search</span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => router.push('/notifications')}>
              <span className="material-symbols-outlined !text-[22px]">notifications</span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => router.push('/messages')}>
              <span className="material-symbols-outlined !text-[22px]">chat</span>
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full lg:border-x lg:border-border min-h-full bg-background">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
