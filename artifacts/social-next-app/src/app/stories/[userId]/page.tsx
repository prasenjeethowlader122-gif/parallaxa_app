"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getUserStories, getUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function StoryViewPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const { data: stories, isLoading: storiesLoading } = useQuery({
    queryKey: ["stories", userId],
    queryFn: () => getUserStories(userId),
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser(userId),
  });

  const isLoading = storiesLoading || userLoading;

  const currentStory = stories?.[currentIndex];

  useEffect(() => {
    if (!currentStory) return;

    const duration = 5000; // 5 seconds per story
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          handleNext();
          return 0;
        }
        return p + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, currentStory]);

  const handleNext = () => {
    if (stories && currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
      setProgress(0);
    } else {
      router.back();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (!stories || stories.length === 0) {
    router.back();
    return null;
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col relative overflow-hidden lg:items-center lg:justify-center">
      <div className="relative w-full h-full lg:max-w-md lg:h-[800px] lg:rounded-3xl lg:overflow-hidden bg-slate-900 shadow-2xl">
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-1.5">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
               <div
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{
                     width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%"
                  }}
               />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/20">
                 <AvatarImage src={user?.avatarUrl || ""} />
                 <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                 <span className="text-white font-bold text-sm">
                    {user?.displayName}
                 </span>
                 <span className="text-white/60 text-xs font-medium">
                    {currentStory ? formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true }) : ""}
                 </span>
              </div>
           </div>
           <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => router.back()}>
              <X size={24} />
           </Button>
        </div>

        {/* Content */}
        <div className="w-full h-full relative flex items-center justify-center">
           {currentStory?.mediaType === "image" ? (
              <img src={currentStory.mediaUrl} className="w-full h-full object-contain lg:object-cover" alt="Story content" />
           ) : (
              <video src={currentStory?.mediaUrl} className="w-full h-full object-contain lg:object-cover" autoPlay muted playsInline />
           )}

           {/* Tap Controls */}
           <div className="absolute inset-0 flex">
              <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
              <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
           </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-4 right-4 z-20 flex items-center gap-3">
           <Input
              placeholder="Send a message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-full h-11 px-5"
           />
           <Button size="icon" className="rounded-full bg-white text-black hover:bg-white/90 h-11 w-11">
              <Send size={18} />
           </Button>
        </div>
      </div>
    </div>
  );
}
