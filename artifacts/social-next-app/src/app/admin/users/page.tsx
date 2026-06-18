"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, freezeUser, unfreezeUser } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Search, MoreVertical, ShieldAlert, ShieldCheck, UserX, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: admin } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAllUsers(),
  });

  const freezeMutation = useMutation({
    mutationFn: ({ userId, isFrozen }: { userId: string, isFrozen: boolean }) =>
      isFrozen ? unfreezeUser(userId) : freezeUser(userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(`User ${variables.isFrozen ? "unfrozen" : "frozen"} successfully`);
    }
  });

  if (admin?.role !== "admin") return null;

  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 flex items-center px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
        <Button variant="ghost" size="icon" className="rounded-full mr-4" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
           <h1 className="text-xl font-extrabold tracking-tight leading-tight">Manage Users</h1>
           <p className="text-xs text-slate-500 font-medium">{users?.length || 0} total accounts</p>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
         <div className="relative">
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-slate-400" />
            <Input
               placeholder="Search users by name, email or username"
               className="pl-11 h-10 bg-white border-slate-200 rounded-xl"
            />
         </div>
      </div>

      <div className="flex flex-col">
         {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
         ) : (
            users?.map((user) => (
               <div key={user.id} className="p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                     <Avatar className="h-12 w-12 border border-slate-100">
                        <AvatarImage src={user.avatarUrl || ""} />
                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                     </Avatar>
                     <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                           <span className="font-bold text-[15px] truncate">{user.displayName}</span>
                           {user.isFrozen && <ShieldAlert size={14} className="text-red-500" />}
                        </div>
                        <span className="text-slate-500 text-sm truncate">@{user.username}</span>
                        <span className="text-slate-400 text-xs truncate">{user.email}</span>
                     </div>
                  </div>

                  <div className="flex gap-2">
                     <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                           "rounded-full font-bold h-9",
                           user.isFrozen ? "text-green-600 border-green-200 hover:bg-green-50" : "text-red-600 border-red-200 hover:bg-red-50"
                        )}
                        onClick={() => freezeMutation.mutate({ userId: user.id, isFrozen: user.isFrozen || false })}
                        disabled={freezeMutation.isPending}
                     >
                        {user.isFrozen ? (
                           <>
                              <UserCheck size={16} className="mr-1.5" />
                              Unfreeze
                           </>
                        ) : (
                           <>
                              <UserX size={16} className="mr-1.5" />
                              Freeze
                           </>
                        )}
                     </Button>
                     <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-slate-400">
                        <MoreVertical size={18} />
                     </Button>
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
}
