"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage, getConversations } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Info, Send, Loader2, Image as ImageIcon, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: convData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversations(),
  });

  const conversation = convData?.find(c => c.id === conversationId);
  const participant = conversation?.participant;

  const { data: messagePage, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId, { limit: 100 }),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage(conversationId, { content: text }),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagePage]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sendMutation.isPending) return;
    sendMutation.mutate(content.trim());
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-14 flex items-center justify-between px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
               <AvatarImage src={participant?.avatarUrl || ""} />
               <AvatarFallback>{participant?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
               <span className="text-sm font-bold leading-tight">{participant?.displayName}</span>
               <span className="text-[11px] text-slate-500 font-medium">@{participant?.username}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Info size={20} />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col"
      >
         {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
         ) : (
            messagePage?.messages?.map((msg, i) => {
                const isMe = msg.senderId === currentUser?.id;
               const nextMsg = messagePage.messages[i + 1];
                const showAvatar = !isMe && (!nextMsg || nextMsg.senderId !== msg.senderId);

               return (
                  <div
                     key={msg.id}
                     className={cn(
                        "flex flex-col max-w-[80%]",
                        isMe ? "self-end items-end" : "self-start items-start"
                     )}
                  >
                     <div className="flex items-end gap-2">
                        {!isMe && (
                           <div className="w-8 h-8 flex-shrink-0">
                              {showAvatar && (
                                 <Avatar className="h-8 w-8">
                     <AvatarImage src={participant?.avatarUrl || ""} />
                     <AvatarFallback>{participant?.displayName?.[0]}</AvatarFallback>
                                 </Avatar>
                              )}
                           </div>
                        )}
                        <div
                           className={cn(
                              "px-4 py-2.5 rounded-[20px] text-[15px]",
                              isMe
                                 ? "bg-blue-500 text-white rounded-br-none"
                                 : "bg-slate-100 text-slate-900 rounded-bl-none"
                           )}
                        >
                           {msg.content}
                        </div>
                     </div>
                     <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {format(new Date(msg.createdAt), "h:mm a")}
                     </span>
                  </div>
               );
            })
         )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-white">
         <form onSubmit={handleSend} className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-500">
               <ImageIcon size={20} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-500">
               <Smile size={20} />
            </Button>
            <Input
               placeholder="Start a new message"
               className="border-none bg-transparent focus-visible:ring-0 h-9"
               value={content}
               onChange={(e) => setContent(e.target.value)}
            />
            <Button
               type="submit"
               variant="ghost"
               size="icon"
               className={cn(
                  "h-8 w-8 rounded-full transition-colors",
                  content.trim() ? "text-blue-500" : "text-slate-300"
               )}
               disabled={!content.trim() || sendMutation.isPending}
            >
               <Send size={20} />
            </Button>
         </form>
      </div>
    </div>
  );
}
