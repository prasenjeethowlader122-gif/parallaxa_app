import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreatePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [hashtags, setHashtags] = useState("");

  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => {
        setContent(""); setImageUrl(""); setLocation(""); setHashtags("");
        Alert.alert("Posted!", "Your post is now live.", [
          { text: "OK", onPress: () => router.push("/(tabs)" as any) },
        ]);
      },
      onError: (err: any) => Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  const handlePost = () => {
    if (!content.trim() && !imageUrl.trim()) {
      Alert.alert("Error", "Add a caption or image URL to post");
      return;
    }
    const tags = hashtags.split(/[\s,#]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        location: location.trim() || undefined,
        hashtags: tags,
      },
    });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        className="flex-row justify-between items-center px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Text className="text-[15px]" style={{ color: colors.mutedForeground }}>Cancel</Text>
        </TouchableOpacity>
        <Text className="text-[17px] font-bold" style={{ color: colors.foreground }}>New post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={isPending}
          className="px-4 py-1.5 rounded-lg bg-primary items-center min-w-[60px]"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-[15px] font-bold">Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="p-4" contentContainerStyle={{ gap: 4 }} keyboardShouldPersistTaps="handled">
        {/* Image URL */}
        <View className="mb-4 pb-4" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          <View
            className="flex-row items-center rounded-[10px] px-3 py-2.5 gap-2"
            style={{ backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 0.5 }}
          >
            <Feather name="image" size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 text-sm"
              style={{ color: colors.foreground }}
              placeholder="Image URL (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Caption */}
        <View className="mb-4 pb-4" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          <TextInput
            className="text-base leading-[22px] min-h-[100px] mb-2"
            style={{ color: colors.foreground, textAlignVertical: "top" }}
            placeholder="Write a caption..."
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={2200}
          />
          <Text className="text-xs text-right" style={{ color: colors.mutedForeground }}>
            {content.length}/2200
          </Text>
        </View>

        {/* Location */}
        <View
          className="flex-row items-center py-4 gap-3"
          style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
        >
          <Feather name="map-pin" size={18} color={colors.foreground} />
          <TextInput
            className="flex-1 text-[15px]"
            style={{ color: colors.foreground }}
            placeholder="Add location"
            placeholderTextColor={colors.mutedForeground}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Hashtags */}
        <View
          className="flex-row items-center py-4 gap-3"
          style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
        >
          <Feather name="hash" size={18} color={colors.foreground} />
          <TextInput
            className="flex-1 text-[15px]"
            style={{ color: colors.foreground }}
            placeholder="Add hashtags (e.g. travel food)"
            placeholderTextColor={colors.mutedForeground}
            value={hashtags}
            onChangeText={setHashtags}
            autoCapitalize="none"
          />
        </View>

        {/* Tips */}
        <View className="mt-6 p-4 rounded-xl" style={{ backgroundColor: "#00000008" }}>
          <Text
            className="text-[13px] font-semibold mb-2 uppercase tracking-wide"
            style={{ color: colors.mutedForeground }}
          >
            Tips
          </Text>
          <Text className="text-[13px] leading-5" style={{ color: colors.mutedForeground }}>
            {"• Use a direct image URL ending in .jpg, .png, or .gif\n• Add hashtags to reach more people\n• Tag a location to connect with local communities"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
