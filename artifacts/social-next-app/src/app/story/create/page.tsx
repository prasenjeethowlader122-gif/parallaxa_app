"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createStory } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Palette, Type, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#000000"
];

export default function StoryCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate() {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      await createStory({
        content: content.trim(),
        type: "TEXT",
        backgroundColor: COLORS[colorIndex]
      });
      toast.success("Story shared!");
      router.back();
    } catch (err) {
      toast.error("Failed to share story");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col relative overflow-hidden lg:items-center lg:justify-center">
      <div
         className="relative w-full h-full lg:max-w-md lg:h-[800px] lg:rounded-3xl lg:overflow-hidden shadow-2xl flex flex-col"
         style={{ backgroundColor: COLORS[colorIndex] }}
      >
         <div className="p-4 flex items-center justify-between z-10">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => router.back()}>
               <X size={24} />
            </Button>
            <div className="flex gap-2">
               <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 rounded-full"
                  onClick={() => setColorIndex((colorIndex + 1) % COLORS.length)}
               >
                  <Palette size={20} />
               </Button>
               <Button
                  className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-6"
                  disabled={!content.trim() || isLoading}
                  onClick={handleCreate}
               >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Share"}
               </Button>
            </div>
         </div>

         <div className="flex-1 flex items-center justify-center p-8">
            <Textarea
               placeholder="Start typing..."
               className="bg-transparent border-none focus-visible:ring-0 text-white text-4xl font-extrabold text-center placeholder:text-white/40 resize-none min-h-[300px]"
               value={content}
               onChange={(e) => setContent(e.target.value)}
               autoFocus
            />
         </div>

         <div className="p-6 flex justify-center gap-4 z-10">
            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full gap-2">
               <Type size={20} />
               Text
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full gap-2 opacity-50 cursor-not-allowed">
               <ImageIcon size={20} />
               Media
            </Button>
         </div>
      </div>
    </div>
  );
}
