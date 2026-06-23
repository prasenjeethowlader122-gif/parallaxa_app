"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFeed, getExplorePosts } from "@workspace/api-client-react";
import { PostCard } from "@/components/feed/post-card";
import { StoryBar } from "@/components/feed/story-bar";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function FeedPage() {
  return (
    <div className="flex flex-col">
      <StoryBar />

      <Tabs defaultValue="public" className="w-full">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md z-20 border-b border-border">
          <TabsList className="w-full h-12 bg-transparent rounded-none p-0">
            <TabsTrigger
              value="public"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-bold text-[15px] transition-all"
            >
              For You
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-bold text-[15px] transition-all"
            >
              Following
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-bold text-[15px] transition-all"
            >
              Trending
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="public" className="mt-0">
          <FeedList queryKey="feed" fetchFn={() => getFeed({ limit: 50 })} />
        </TabsContent>
        <TabsContent value="following" className="mt-0">
          <FeedList queryKey="following-feed" fetchFn={() => getFeed({ limit: 50 })} />
        </TabsContent>
        <TabsContent value="trending" className="mt-0">
          <FeedList queryKey="trending-feed" fetchFn={() => getExplorePosts({ limit: 50 })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeedList({ queryKey, fetchFn }: { queryKey: string; fetchFn: () => Promise<any> }) {
  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: fetchFn,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-medium">Curating your feed...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b border-border hidden lg:block">
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
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
             <Loader2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Nothing here yet</h2>
          <p className="text-muted-foreground max-w-xs">
            Explore trending topics or follow some people to see what's happening.
          </p>
          <Button asChild className="mt-6 rounded-full font-bold" variant="outline">
            <Link href="/explore">Explore</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col">
          {data?.posts?.map((post: any) => (
            <Link key={post.id} href={`/post/${post.id}`}>
               <PostCard post={post} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
