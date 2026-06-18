"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Loader2, Heart, UserPlus, MessageCircle, Repeat2, Bell } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications({ limit: 50 }),
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE": return <Heart size={24} className="text-pink-500 fill-pink-500" />;
      case "FOLLOW": return <UserPlus size={24} className="text-blue-500 fill-blue-500" />;
      case "REPLY": return <MessageCircle size={24} className="text-blue-500 fill-blue-500" />;
      case "REPOST": return <Repeat2 size={24} className="text-green-500" />;
      default: return <Bell size={24} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 flex items-center justify-between px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
        <h1 className="text-xl font-extrabold tracking-tight">Notifications</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings size={20} />
        </Button>
      </div>

      <div className="flex flex-col">
         {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
         ) : data?.notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
               <h2 className="text-2xl font-extrabold mb-2">No notifications yet</h2>
               <p className="text-slate-500 max-w-xs">
                  When someone likes your posts or follows you, you'll see it here.
               </p>
            </div>
         ) : (
            data?.notifications?.map((notif) => (
               <div
                  key={notif.id}
                  className={cn(
                     "p-4 border-b border-slate-100 flex gap-4 transition-colors",
                     !notif.isRead && "bg-blue-50/30"
                  )}
               >
                  <div className="mt-1">
                     {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex gap-2 items-center mb-1">
                        <Link href={`/user/${notif.fromUser.id}`}>
                           <Avatar className="h-8 w-8">
                              <AvatarImage src={notif.fromUser.avatarUrl || ""} />
                              <AvatarFallback>{notif.fromUser.displayName?.[0]}</AvatarFallback>
                           </Avatar>
                        </Link>
                        <p className="text-sm font-medium text-slate-500">
                           {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                     </div>
                     <p className="text-[15px] leading-relaxed">
                        <span className="font-bold">{notif.fromUser.displayName}</span> {notif.type.toLowerCase()}ed your content
                     </p>
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
}
