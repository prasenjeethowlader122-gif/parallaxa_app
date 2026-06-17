"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@workspace/api-client-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, X, Smile, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  async function handlePost() {
    if (!content.trim() && !image) return;

    setIsLoading(true);
    try {
      await createPost({
        content: content.trim(),
        image: image || undefined,
        hashtags: [], // Extracted server-side normally
      });
      toast.success("Post published!");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      router.back();
    } catch (err) {
      toast.error("Failed to publish post");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
        <button onClick={() => router.back()} className="font-medium text-slate-600">Cancel</button>
        <Button
          className="rounded-full font-bold h-9 px-6"
          disabled={(!content.trim() && !image) || isLoading}
          onClick={handlePost}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
        </Button>
      </div>

      <div className="p-4 flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.avatar || ""} />
          <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex flex-col">
          <Textarea
            placeholder="What's happening?"
            className="border-none focus-visible:ring-0 text-xl p-0 min-h-[150px] resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />

          {image && (
             <div className="relative mt-4 rounded-2xl overflow-hidden border border-slate-100">
                <img src={image} className="w-full h-auto object-cover max-h-[400px]" alt="Preview" />
                <button
                   onClick={() => setImage(null)}
                   className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                   <X size={18} />
                </button>
             </div>
          )}

          <div className="flex items-center gap-1 mt-6 border-t border-slate-50 pt-4 text-blue-500">
            <Button variant="ghost" size="icon" className="rounded-full text-blue-500 h-9 w-9">
              <ImageIcon size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-blue-500 h-9 w-9">
              <Smile size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-blue-500 h-9 w-9">
              <MapPin size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
