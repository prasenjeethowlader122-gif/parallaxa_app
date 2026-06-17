"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getSavedPosts } from "@workspace/api-client-react";
import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, Loader2, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BookmarksPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => getSavedPosts({ limit: 50 }),
  });

  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 flex items-center justify-between px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
               <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-extrabold tracking-tight">Bookmarks</h1>
         </div>
         <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal size={20} />
         </Button>
      </div>

      <div className="flex flex-col">
         {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
         ) : data?.posts?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Bookmark className="w-8 h-8 text-blue-500" />
               </div>
               <h2 className="text-3xl font-extrabold mb-2">Save posts for later</h2>
               <p className="text-slate-500 max-w-xs">
                  Don't let the good ones fly away! Bookmark posts to easily find them again in the future.
               </p>
            </div>
         ) : (
            data?.posts?.map((post) => (
               <Link key={post.id} href={`/post/${post.id}`}>
                  <PostCard post={post} />
               </Link>
            ))
         )}
      </div>
    </div>
  );
}
