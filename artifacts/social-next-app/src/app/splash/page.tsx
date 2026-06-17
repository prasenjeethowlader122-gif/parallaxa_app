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
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
      <div className="w-20 h-20 bg-blue-500 rounded-[24px] flex items-center justify-center text-white font-bold text-4xl shadow-2xl shadow-blue-500/30 animate-pulse">
        P
      </div>
      <div className="mt-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Parallaxa</h1>
        <Loader2 className="mt-4 h-6 w-6 animate-spin text-slate-300" />
      </div>
    </div>
  );
}
