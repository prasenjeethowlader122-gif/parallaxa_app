"use client";

import React from "react";
import Link from "next/link";
import { type Post, likePost, unlikePost, savePost, unsavePost } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PostCardProps {
  post: Post;
  isDetail?: boolean;
}

export function PostCard({ post, isDetail = false }: PostCardProps) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => post.isLiked ? unlikePost(post.id) : likePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
    }
  });

  const saveMutation = useMutation({
    mutationFn: () => post.isSaved ? unsavePost(post.id) : savePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
    }
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveMutation.mutate();
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Repost functionality pending API client update
    toast.info("Repost functionality coming soon");
  };

  const isRepost = !!post.repostOf;
  const displayPost = isRepost ? post.repostOf! : post;
  const author = displayPost.author;

  const timeAgo = (date: string) => {
    const diff = new Date().getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const renderContent = (content: string) => {
    const parts = content.split(/((?:@|#)\w+|(?:https?:\/\/[^\s]+))/);
    return parts.map((part, i) => {
      if (part.startsWith("#") || part.startsWith("@") || part.startsWith("http")) {
        return (
          <span key={i} className="text-primary font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={cn(
      "border-b-[0.5px] border-border px-4 py-3 transition-colors bg-background",
      !isDetail && "hover:bg-muted/5 cursor-pointer"
    )}>
      {isRepost && (
        <div className="flex items-center gap-2 ml-8 mb-2 text-muted-foreground">
          <span className="material-symbols-outlined !text-[14px]">repeat</span>
          <span className="text-[13px] font-semibold">{post.author.displayName} reposted</span>
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/user/${author.id}`} onClick={e => e.stopPropagation()}>
          <Avatar className="h-10 w-10 border-none shadow-none">
            <AvatarImage src={author.avatarUrl || ""} className="object-cover" />
            <AvatarFallback>{author.displayName?.[0]}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <Link
                  href={`/user/${author.id}`}
                  className="font-bold hover:underline truncate text-[15px]"
                  onClick={e => e.stopPropagation()}
                >
                  {author.displayName}
                </Link>
                {author.isVerified && (
                  <span className="material-symbols-outlined !text-[16px] text-[#1D9BF0] fill-1">verified</span>
                )}
                <span className="text-muted-foreground text-[13px]">· {timeAgo(displayPost.createdAt)}</span>
              </div>
              <span className="text-muted-foreground text-[13px]">@{author.username}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground -mr-2">
              <span className="material-symbols-outlined !text-[20px]">more_horiz</span>
            </Button>
          </div>

          {displayPost.content && (
            <div className="text-[15px] leading-[1.4] text-foreground mt-2 mb-3 whitespace-pre-wrap">
              {renderContent(displayPost.content)}
            </div>
          )}

          {displayPost.imageUrl && (
            <div className="rounded-[12px] overflow-hidden border-[0.5px] border-border mb-3 bg-muted">
              <img
                src={displayPost.imageUrl}
                alt="Post media"
                className="w-full h-auto object-cover max-h-[512px]"
              />
            </div>
          )}

          <div className="flex items-center justify-between max-w-sm text-muted-foreground -ml-2 pt-1">
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[20px] group-active:scale-90 transition-transform">chat</span>
              {displayPost.repliesCount > 0 && (
                <span className="text-[13px]">{displayPost.repliesCount}</span>
              )}
            </button>

            <button
              className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:text-green-500 transition-colors group"
              onClick={handleRepost}
            >
              <span className="material-symbols-outlined !text-[20px] group-active:scale-90 transition-transform">repeat</span>
            </button>

            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors group",
                displayPost.isLiked ? "text-like" : "hover:text-like"
              )}
              onClick={handleLike}
            >
              <span className={cn(
                "material-symbols-outlined !text-[22px] group-active:scale-90 transition-transform",
                displayPost.isLiked && "fill-1"
              )}>favorite</span>
              {displayPost.likesCount > 0 && (
                <span className={cn("text-[14px]", displayPost.isLiked ? "font-bold" : "font-medium")}>
                  {displayPost.likesCount}
                </span>
              )}
            </button>

            <button
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors group",
                displayPost.isSaved ? "text-saved" : "hover:text-saved"
              )}
              onClick={handleSave}
            >
              <span className={cn(
                "material-symbols-outlined !text-[20px] group-active:scale-90 transition-transform",
                displayPost.isSaved && "fill-1"
              )}>bookmark</span>
            </button>

            <button className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[20px]">share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
