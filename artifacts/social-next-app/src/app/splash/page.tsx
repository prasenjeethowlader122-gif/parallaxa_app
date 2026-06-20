"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Loader2 } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();
  const { isLoading, token } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (token) {
        router.replace("/feed");
      } else {
        router.replace("/login");
      }
    }
  }, [isLoading, token, router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
        <img
          src="/parallaxa-logo.svg"
          className="w-24 h-24 relative z-10 animate-bounce dark:hidden"
          alt="Logo"
        />
        <img
          src="/parallaxa-logo-white.svg"
          className="w-24 h-24 relative z-10 animate-bounce hidden dark:block"
          alt="Logo"
        />
      </div>
      <div className="mt-8 flex flex-col items-center">
        <img src="/text-logo-dark.svg" className="h-10 dark:hidden" alt="Parallaxa" />
        <img src="/text-logo.svg" className="h-10 hidden dark:block" alt="Parallaxa" />
        <Loader2 className="mt-6 h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
