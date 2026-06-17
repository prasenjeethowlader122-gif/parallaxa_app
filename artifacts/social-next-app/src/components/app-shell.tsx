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
  { label: "Home", href: "/feed", icon: Home },
  { label: "Explore", href: "/explore", icon: Search },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Messages", href: "/messages", icon: Mail },
  { label: "Profile", href: "/profile", icon: User },
];

const SECONDARY_NAV = [
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "About", href: "/about", icon: Info },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const isAuthPage = ["/login", "/register", "/forgot-password", "/splash"].includes(pathname);

  if (isAuthPage) return <>{children}</>;

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
          P
        </div>
        <span className="text-2xl font-bold tracking-tight">Parallaxa</span>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-full transition-colors",
                isActive
                  ? "bg-slate-100 font-bold text-slate-900"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="my-6 border-t border-slate-100" />

      <nav className="space-y-1">
        {SECONDARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-full transition-colors",
                isActive
                  ? "bg-slate-100 font-bold text-slate-900"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Button
          className="w-full h-14 rounded-full text-lg font-bold shadow-lg shadow-blue-500/20"
          onClick={() => router.push("/create-post")}
        >
          <PlusCircle className="mr-2" size={20} />
          Post
        </Button>

        <button
          onClick={logout}
          className="flex items-center gap-4 px-4 py-3 mt-4 w-full rounded-full text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={24} />
          <span className="text-lg font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-slate-100 flex-col overflow-y-auto">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-slate-100 flex items-center justify-between px-4 sticky top-0 bg-white z-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu size={22} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="font-bold text-xl">Parallaxa</div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search size={22} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell size={22} />
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/30">
          <div className="max-w-2xl mx-auto w-full lg:border-x lg:border-slate-100 min-h-full bg-white">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
