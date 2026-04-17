import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useCreatePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

// Hugeicons
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Image01Icon,
  Location01Icon,
  SquareLock02Icon, // For "Public/Everyone"
  CircleIcon,
} from "@hugeicons/core-free-icons";

export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  
  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => {
        router.push("/(tabs)");
      },
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });
  
  const handlePost = () => {
    if (!content.trim() && !imageUrl.trim()) return;
    
    // Extract hashtags automatically from content
    const tags = content.match(/#(\w+)/g)?.map((t) => t.replace("#", "").toLowerCase()) || [];
    
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        location: location.trim() || undefined,
        hashtags: tags,
      },
    });
  };
  
  // Function to render highlighted text
  const renderHighlightedText = (text: string) => {
    return text.split(/(\s+)/).map((word, index) => {
      if (word.startsWith("#") || word.startsWith("@")) {
        return (
          <Text key={index} style={{ color: colors.primary }}>
            {word}
          </Text>
        );
      }
      return word;
    });
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── HEADER ── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 16, color: colors.foreground }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePost}
          disabled={isPending || (!content.trim() && !imageUrl.trim())}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: colors.primary,
            opacity: !content.trim() && !imageUrl.trim() ? 0.5 : 1,
          }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ flexDirection: "row", padding: 16, gap: 12 }}>
          <UserAvatar uri={user?.avatarUrl} size={40} />
          
          <View style={{ flex: 1 }}>
            {/* Audience Selector (Twitter Style) */}
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 15, 
                paddingHorizontal: 8, 
                paddingVertical: 2,
                alignSelf: 'flex-start',
                marginBottom: 12
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Public</Text>
            </TouchableOpacity>

            <View>
                {/* Highlighted text overlay for visual feedback */}
                <TextInput
                style={{
                    fontSize: 18,
                    color: colors.foreground,
                    textAlignVertical: "top",
                    minHeight: 120,
                }}
                placeholder="What's happening?"
                placeholderTextColor={colors.mutedForeground}
                value={content}
                onChangeText={setContent}
                multiline
                autoFocus
                />
            </View>

            {/* Image Preview if URL exists */}
            {imageUrl.trim().length > 0 && (
              <View style={{ marginTop: 12, position: 'relative' }}>
                <Image 
                  source={{ uri: imageUrl }} 
                  style={{ width: '100%', height: 200, borderRadius: 16, backgroundColor: colors.muted }} 
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  onPress={() => setImageUrl("")}
                  style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 }}
                >
                   <Text style={{ color: '#fff', fontSize: 10 }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── TOOLBAR ── */}
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
        }}
      >
        <TouchableOpacity onPress={() => {/* Trigger Image Picker or URL Alert */}}>
          <HugeiconsIcon icon={Image01Icon} size={22} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => {/* Location Logic */}}>
          <HugeiconsIcon icon={Location01Icon} size={22} color={colors.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* Character Count Circle */}
        <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: content.length > 2000 ? 'red' : colors.mutedForeground }}>
                {2200 - content.length}
            </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}