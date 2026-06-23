"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getStories } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StoryBar() {
  const { data: stories, isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => getStories(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 px-4 py-3 h-[90px] border-b border-border">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto no-scrollbar px-2 py-2 h-[90px] border-b border-border bg-background">
      {/* Create Story */}
      <Link href="/story/create" className="flex-shrink-0 px-2 flex flex-col items-center gap-1 group">
        <div className="relative">
          <Avatar className="h-[50px] w-[50px] border border-border">
            <AvatarImage src="" />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold uppercase">Me</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 h-4 w-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
            <Plus className="h-2.5 w-2.5 text-white stroke-[3]" />
          </div>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">Your Story</span>
      </Link>

      {/* Story List */}
      {stories?.map((group) => (
        <Link
          key={group.user.id}
          href={`/stories/${group.user.id}`}
          className="flex-shrink-0 px-2 flex flex-col items-center gap-1 group"
        >
          <div className={cn(
            "p-[2px] rounded-full",
            group.hasUnviewed
              ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600"
              : "border border-muted-foreground/30"
          )}>
            <div className="p-[2px] bg-background rounded-full">
              <Avatar className="h-[46px] w-[46px]">
                <AvatarImage src={group.user.avatarUrl || ""} className="object-cover" />
                <AvatarFallback className="text-[10px] uppercase font-bold">{group.user.displayName[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-[11px] font-medium max-w-[58px] truncate">
            {group.user.displayName}
          </span>
        </Link>
      ))}
    </div>
  );
}
