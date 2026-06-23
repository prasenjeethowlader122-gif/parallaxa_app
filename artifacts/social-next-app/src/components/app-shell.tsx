"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Home,
  Search,
  Bell,
  Mail,
  User,
  Bookmark,
  Settings,
  Info,
  LogOut,
  PlusCircle,
  Menu,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

  const isAuthPage = ["/login", "/register", "/forgot-password", "/splash"].includes(pathname);

  if (isAuthPage) return <>{children}</>;

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4 bg-background">
      <div className="flex items-center gap-3 px-2 mb-8">
        <img src="/parallaxa-logo.svg" className="w-10 h-10 dark:hidden" alt="Logo" />
        <img src="/parallaxa-logo-white.svg" className="w-10 h-10 hidden dark:block" alt="Logo" />
        <img src="/text-logo-dark.svg" className="h-6 dark:hidden" alt="Parallaxa" />
        <img src="/text-logo.svg" className="h-6 hidden dark:block" alt="Parallaxa" />
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-5 px-4 py-3 rounded-full transition-colors",
                isActive
                  ? "font-extrabold text-foreground"
                  : "text-foreground font-medium hover:bg-muted/50"
              )}
            >
              <span className={cn(
                "material-symbols-outlined !text-[26px]",
                isActive && "fill-1"
              )}>{item.icon}</span>
              <span className="text-[20px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="my-6 border-t border-slate-100" />

      <nav className="space-y-1">
        {SECONDARY_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-5 px-4 py-3 rounded-full transition-colors",
                isActive
                  ? "font-extrabold text-foreground"
                  : "text-foreground font-medium hover:bg-muted/50"
              )}
            >
              <span className={cn(
                "material-symbols-outlined !text-[26px]",
                isActive && "fill-1"
              )}>{item.icon}</span>
              <span className="text-[20px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Button
          className="w-full h-14 rounded-full text-[18px] font-extrabold shadow-lg shadow-primary/20"
          onClick={() => router.push("/create-post")}
        >
          Post
        </Button>

        <button
          onClick={logout}
          className="flex items-center gap-5 px-4 py-3 mt-4 w-full rounded-full text-destructive hover:bg-destructive/5 transition-colors group"
        >
          <span className="material-symbols-outlined !text-[26px]">logout</span>
          <span className="text-[20px] font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
      <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[300px] border-r border-border flex-col overflow-y-auto">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-border flex items-center justify-between px-4 sticky top-0 bg-background z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <span className="material-symbols-outlined !text-[22px]">menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px]">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <img src="/text-logo-dark.svg" className="h-[26px] dark:hidden" alt="Parallaxa" />
          <img src="/text-logo.svg" className="h-[26px] hidden dark:block" alt="Parallaxa" />

          <div className="flex items-center gap-0.5">
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
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="max-w-2xl mx-auto w-full lg:border-x lg:border-border min-h-full bg-background shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
