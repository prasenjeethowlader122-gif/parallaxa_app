"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Plus, Loader2, Search, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const { user: currentUser } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversations(),
  });

  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 flex items-center justify-between px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
        <h1 className="text-xl font-extrabold tracking-tight">Messages</h1>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Plus size={20} />
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100">
         <div className="relative">
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-slate-400" />
            <Input
               placeholder="Search messages"
               className="pl-11 h-10 bg-slate-100 border-none rounded-full"
            />
         </div>
      </div>

      <div className="flex flex-col">
         {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
         ) : conversations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
               <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-500" />
               </div>
               <h2 className="text-2xl font-extrabold mb-2">Welcome to your inbox!</h2>
               <p className="text-slate-500 max-w-xs mb-6">
                  Drop a line, share posts and more with private conversations between you and others on Parallaxa.
               </p>
               <Button className="rounded-full font-bold bg-blue-500 hover:bg-blue-600 px-8 py-6 text-lg">
                  Write a message
               </Button>
            </div>
         ) : (
            conversations?.map((conv) => {
               const participant = conv.participants.find(p => p.id !== currentUser?.id) || conv.participants[0];
               const lastMessage = conv.lastMessage;
               const timeAgo = lastMessage ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false }) : "";

               return (
                  <Link
                     key={conv.id}
                     href={`/messages/${conv.id}`}
                     className="flex gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100/50"
                  >
                     <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={participant.avatar || ""} />
                        <AvatarFallback>{participant.firstName?.[0]}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-1 min-w-0">
                              <span className="font-bold text-[15px] truncate">{participant.firstName} {participant.lastName}</span>
                              <span className="text-slate-500 text-[15px] truncate">@{participant.username}</span>
                              <span className="text-slate-400 text-sm">· {timeAgo}</span>
                           </div>
                        </div>
                        <p className="text-slate-500 text-[15px] truncate mt-0.5">
                           {lastMessage?.content || "No messages yet"}
                        </p>
                     </div>
                  </Link>
               );
            })
         )}
      </div>
    </div>
  );
}
