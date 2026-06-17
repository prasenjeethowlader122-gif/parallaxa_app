"use client";

import { AppShell } from "@/components/app-shell";

export default function RootPage({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
