"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getExplorePosts } from "@workspace/api-client-react";
import { PostCard } from "@/components/feed/post-card";
import { Loader2, Search, TrendingUp, Users, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["explore"],
    queryFn: () => getExplorePosts({ limit: 30 }),
  });

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search Parallaxa"
            className="pl-12 h-11 bg-slate-100 border-none rounded-full focus-visible:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="w-full h-12 bg-transparent border-b border-slate-100 rounded-none p-0">
          <TabsTrigger value="trending" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent font-bold">Trending</TabsTrigger>
          <TabsTrigger value="news" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent font-bold">News</TabsTrigger>
          <TabsTrigger value="sports" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent font-bold">Sports</TabsTrigger>
          <TabsTrigger value="entertainment" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent font-bold">Entertainment</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="mt-0">
           <div className="p-4 border-b border-slate-100">
              <h2 className="text-xl font-extrabold tracking-tight mb-4">Trends for you</h2>
              <div className="space-y-6">
                 {[
                    { tag: "#ParallaxaLaunch", posts: "125K" },
                    { tag: "Spring Boot 3.4", posts: "82.4K" },
                    { tag: "Flutter vs NextJS", posts: "45.1K" },
                    { tag: "#OpenSource", posts: "22K" },
                 ].map((trend, i) => (
                    <div key={i} className="flex justify-between items-start group cursor-pointer">
                       <div>
                          <p className="text-xs text-slate-500 font-medium">Trending</p>
                          <p className="font-bold text-[15px] group-hover:underline">{trend.tag}</p>
                          <p className="text-xs text-slate-500">{trend.posts} posts</p>
                       </div>
                       <div className="text-slate-400">···</div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="flex flex-col">
              {isLoading ? (
                 <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                 </div>
              ) : (
                 data?.map((post) => (
                    <Link key={post.id} href={`/post/${post.id}`}>
                       <PostCard post={post} />
                    </Link>
                 ))
              )}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
