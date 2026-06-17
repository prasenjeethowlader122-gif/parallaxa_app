"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@workspace/api-client-react";
import { PostCard } from "@/components/feed/post-card";
import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FeedPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["feed"],
    queryFn: () => getFeed({ limit: 50 }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-slate-500 font-medium">Curating your feed...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="h-14 flex items-center justify-between px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
        <h1 className="text-xl font-extrabold tracking-tight">For You</h1>
        <Sparkles className="w-5 h-5 text-blue-500" />
      </div>

      <div className="p-4 border-b border-slate-100 hidden lg:block">
        <Link href="/create-post">
           <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 flex items-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
                What's happening?
              </div>
              <Button className="rounded-full font-bold">Post</Button>
           </div>
        </Link>
      </div>

      {data?.posts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
             <Sparkles className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Welcome to your feed!</h2>
          <p className="text-slate-500 max-w-xs">
            Follow some people or explore trending topics to see what's happening.
          </p>
          <Button asChild className="mt-6 rounded-full font-bold" variant="outline">
            <Link href="/explore">Explore</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col">
          {data?.posts?.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`}>
               <PostCard post={post} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
