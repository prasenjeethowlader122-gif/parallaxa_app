"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUser, getUserPosts, followUser, unfollowUser } from "@workspace/api-client-react";
import { PostCard } from "@/components/feed/post-card";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, Loader2, Verified, Settings, Mail } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string || "me";
  const { user: currentUser, logout } = useAuth();
  const queryClient = useQueryClient();

  const isMe = userId === "me" || userId === currentUser?.id;

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser(userId),
  });

  const { data: posts, isLoading: isPostsLoading } = useQuery({
    queryKey: ["user-posts", userId],
    queryFn: () => getUserPosts(userId),
  });

  const followMutation = useMutation({
    mutationFn: () => user?.isFollowing ? unfollowUser(user!.id) : followUser(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success(user?.isFollowing ? `Unfollowed @${user?.username}` : `Following @${user?.username}`);
    }
  });

  if (isUserLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return <div className="p-20 text-center">User not found</div>;

  const joinDate = user.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "Unknown";

  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 flex items-center px-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
        <Button variant="ghost" size="icon" className="rounded-full mr-4" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
           <h1 className="text-xl font-extrabold tracking-tight leading-tight">{user.displayName}</h1>
           <p className="text-xs text-slate-500 font-medium">{user.postsCount || 0} posts</p>
        </div>
      </div>

      <div className="h-40 bg-slate-200 relative">
         <div className="absolute -bottom-16 left-4">
            <Avatar className="h-32 w-32 border-4 border-white shadow-sm">
               <AvatarImage src={user.avatarUrl || ""} />
               <AvatarFallback className="text-4xl">{user.displayName?.[0]}</AvatarFallback>
            </Avatar>
         </div>
      </div>

      <div className="pt-4 px-4 pb-4">
         <div className="flex justify-end mb-4">
            {isMe ? (
               <div className="flex gap-2">
                  <Button variant="outline" className="rounded-full font-bold border-slate-200" asChild>
                     <Link href="/settings">
                        <Settings size={18} className="mr-2" />
                        Settings
                     </Link>
                  </Button>
                  <Button variant="outline" className="rounded-full font-bold border-slate-200" asChild>
                     <Link href="/profile/edit">Edit Profile</Link>
                  </Button>
               </div>
            ) : (
               <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-full border-slate-200">
                     <Mail size={18} />
                  </Button>
                  <Button
                     variant={user.isFollowing ? "outline" : "default"}
                     className={cn("rounded-full font-bold px-6", !user.isFollowing && "bg-slate-900")}
                     onClick={() => followMutation.mutate()}
                     disabled={followMutation.isPending}
                  >
                     {user.isFollowing ? "Following" : "Follow"}
                  </Button>
               </div>
            )}
         </div>

         <div className="mt-8">
            <div className="flex items-center gap-1">
               <h2 className="text-2xl font-extrabold tracking-tight">{user.displayName}</h2>
               {user.role === "admin" && <Verified className="w-5 h-5 text-blue-500 fill-blue-500" />}
            </div>
            <p className="text-slate-500 font-medium">@{user.username}</p>
         </div>

         {user.bio && <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">{user.bio}</p>}

         <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-slate-500 text-[15px]">
            {user.location && (
               <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{user.location}</span>
               </div>
            )}
            {user.website && (
               <div className="flex items-center gap-1 text-blue-600 hover:underline">
                  <LinkIcon size={16} />
                  <a href={user.website} target="_blank" rel="noreferrer">{user.website.replace(/^https?:\/\//, "")}</a>
               </div>
            )}
            <div className="flex items-center gap-1">
               <Calendar size={16} />
               <span>Joined {joinDate}</span>
            </div>
         </div>

         <div className="flex gap-5 mt-4">
            <button className="hover:underline flex gap-1 items-center">
               <span className="font-bold text-slate-900">{user.followingCount || 0}</span>
               <span className="text-slate-500">Following</span>
            </button>
            <button className="hover:underline flex gap-1 items-center">
               <span className="font-bold text-slate-900">{user.followersCount || 0}</span>
               <span className="text-slate-500">Followers</span>
            </button>
         </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full h-12 bg-transparent border-b border-slate-100 rounded-none p-0">
          <TabsTrigger value="posts" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent font-bold">Posts</TabsTrigger>
          <TabsTrigger value="replies" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent font-bold">Replies</TabsTrigger>
          <TabsTrigger value="media" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent font-bold">Media</TabsTrigger>
          <TabsTrigger value="likes" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent font-bold">Likes</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-0">
           {isPostsLoading ? (
              <div className="flex justify-center py-10">
                 <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
           ) : (
              posts?.posts?.map((post) => (
                 <Link key={post.id} href={`/post/${post.id}`}>
                    <PostCard post={post} />
                 </Link>
              ))
           )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
