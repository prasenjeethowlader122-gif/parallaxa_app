"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPost, getReplies, createPost } from "@workspace/api-client-react";
import { PostCard } from "@/components/feed/post-card";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");

  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPost({ postId }),
  });

  const { data: replies, isLoading: isRepliesLoading } = useQuery({
    queryKey: ["replies", postId],
    queryFn: () => getReplies({ postId }),
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => createPost({ content, parentId: postId }),
    onSuccess: () => {
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["replies", postId] });
      toast.success("Reply sent!");
    }
  });

  if (isPostLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 flex items-center px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
        <Button variant="ghost" size="icon" className="rounded-full mr-2" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-extrabold tracking-tight">Post</h1>
      </div>

      <PostCard post={post} isDetail />

      <div className="p-4 border-b border-slate-100 flex gap-3">
         <Avatar className="h-10 w-10">
           <AvatarImage src={user?.avatar || ""} />
           <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
         </Avatar>
         <div className="flex-1 flex flex-col gap-2">
            <Textarea
               placeholder="Post your reply"
               className="border-none focus-visible:ring-0 text-[17px] p-0 min-h-[60px] resize-none"
               value={replyContent}
               onChange={(e) => setReplyContent(e.target.value)}
            />
            <div className="flex justify-end">
               <Button
                  className="rounded-full font-bold h-9 px-6"
                  disabled={!replyContent.trim() || replyMutation.isPending}
                  onClick={() => replyMutation.mutate(replyContent)}
               >
                  {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reply"}
               </Button>
            </div>
         </div>
      </div>

      <div className="flex flex-col">
         {isRepliesLoading ? (
            <div className="flex justify-center py-10">
               <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
         ) : (
            replies?.map((reply) => (
               <PostCard key={reply.id} post={reply} />
            ))
         )}
      </div>
    </div>
  );
}
