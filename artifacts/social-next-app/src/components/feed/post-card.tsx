"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { type Post, likePost, unlikePost, savePost, unsavePost } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  MoreHorizontal,
  Verified,
  Share
} from "lucide-react";
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
  const { user: currentUser } = useAuth();
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
      toast.success(post.isSaved ? "Post unsaved" : "Post saved");
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

  const author = post.author;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <div className={cn(
      "border-b border-slate-100 p-4 transition-colors",
      !isDetail && "hover:bg-slate-50/50 cursor-pointer"
    )}>
      <div className="flex gap-3">
        <Link href={`/user/${author.id}`} onClick={e => e.stopPropagation()}>
          <Avatar className="h-10 w-10 border border-slate-100">
            <AvatarImage src={author.avatarUrl || ""} />
            <AvatarFallback>{author.displayName?.[0]}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1 min-w-0">
              <Link
                href={`/user/${author.id}`}
                className="font-bold hover:underline truncate"
                onClick={e => e.stopPropagation()}
              >
                {author.displayName}
              </Link>
              {author.isVerified && <Verified className="w-4 h-4 text-blue-500 fill-blue-500" />}
              <span className="text-slate-500 text-sm truncate">@{author.username}</span>
              <span className="text-slate-400 text-sm">· {timeAgo}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400">
              <MoreHorizontal size={16} />
            </Button>
          </div>

          <div className="text-[15px] leading-relaxed text-slate-900 mb-3 whitespace-pre-wrap">
            {post.content}
          </div>

          {post.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 mb-3 bg-slate-100">
              <img
                src={post.imageUrl}
                alt="Post media"
                className="w-full h-auto object-cover max-h-[512px]"
              />
            </div>
          )}

          {post.repostOf && (
             <div className="border border-slate-200 rounded-2xl p-3 mb-3 hover:bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                   <Avatar className="h-5 w-5">
                      <AvatarImage src={post.repostOf.author.avatarUrl || ""} />
                      <AvatarFallback>{post.repostOf.author.displayName?.[0]}</AvatarFallback>
                   </Avatar>
                   <span className="font-bold text-sm">@{post.repostOf.author.username}</span>
                </div>
                <div className="text-sm line-clamp-3 text-slate-700">
                   {post.repostOf.content}
                </div>
             </div>
          )}

          <div className="flex items-center justify-between max-w-sm text-slate-500 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 rounded-full hover:text-blue-500 hover:bg-blue-50 px-3"
            >
              <MessageCircle size={18} />
              <span className="text-sm font-medium">{post.repliesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 rounded-full hover:text-green-500 hover:bg-green-50 px-3"
            >
              <Repeat2 size={18} />
              <span className="text-sm font-medium">0</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center gap-2 rounded-full px-3",
                post.isLiked ? "text-pink-500 bg-pink-50 hover:bg-pink-100" : "hover:text-pink-500 hover:bg-pink-50"
              )}
              onClick={handleLike}
            >
              <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
              <span className="text-sm font-medium">{post.likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center gap-2 rounded-full px-3",
                post.isSaved ? "text-blue-500 bg-blue-50" : "hover:text-blue-500 hover:bg-blue-50"
              )}
              onClick={handleSave}
            >
              <Bookmark size={18} fill={post.isSaved ? "currentColor" : "none"} />
            </Button>

            <Button variant="ghost" size="sm" className="rounded-full hover:text-blue-500 hover:bg-blue-50 px-3">
              <Share size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
