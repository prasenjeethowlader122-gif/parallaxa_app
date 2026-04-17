import { Feather } from "@expo/vector-icons";
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
} from "react-native";
import { useCreatePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [hashtags, setHashtags] = useState("");

  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => {
        setContent("");
        setImageUrl("");
        setLocation("");
        setHashtags("");
        Alert.alert("Posted!", "Your post is now live.", [
          { text: "OK", onPress: () => router.push("/(tabs)" as any) },
        ]);
      },
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  const handlePost = () => {
    if (!content.trim() && !imageUrl.trim()) {
      Alert.alert("Error", "Add a caption or image URL to post");
      return;
    }
    const tags = hashtags
      .split(/[\s,#]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        location: location.trim() || undefined,
        hashtags: tags,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 15, color: colors.mutedForeground }}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text
          style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}
        >
          New post
        </Text>

        <TouchableOpacity
          onPress={handlePost}
          disabled={isPending}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: colors.primary ?? "#000",
            minWidth: 60,
            alignItems: "center",
          }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ padding: 16 }}
        contentContainerStyle={{ gap: 4 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image URL */}
        <View
          style={{
            marginBottom: 16,
            paddingBottom: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              gap: 8,
              backgroundColor: colors.muted,
              borderWidth: 0.5,
              borderColor: colors.border,
            }}
          >
            <Feather name="image" size={18} color={colors.mutedForeground} />
            <TextInput
              style={{ flex: 1, fontSize: 14, color: colors.foreground }}
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
        <View
          style={{
            marginBottom: 16,
            paddingBottom: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
          }}
        >
          <TextInput
            style={{
              fontSize: 16,
              lineHeight: 22,
              minHeight: 100,
              marginBottom: 8,
              color: colors.foreground,
              textAlignVertical: "top",
            }}
            placeholder="Write a caption..."
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={2200}
          />
          <Text
            style={{
              fontSize: 12,
              textAlign: "right",
              color: colors.mutedForeground,
            }}
          >
            {content.length}/2200
          </Text>
        </View>

        {/* Location */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 16,
            gap: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
          }}
        >
          <Feather name="map-pin" size={18} color={colors.foreground} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: colors.foreground }}
            placeholder="Add location"
            placeholderTextColor={colors.mutedForeground}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Hashtags */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 16,
            gap: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
          }}
        >
          <Feather name="hash" size={18} color={colors.foreground} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: colors.foreground }}
            placeholder="Add hashtags (e.g. travel food)"
            placeholderTextColor={colors.mutedForeground}
            value={hashtags}
            onChangeText={setHashtags}
            autoCapitalize="none"
          />
        </View>

        {/* Tips */}
        <View
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 12,
            backgroundColor: "#00000008",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: colors.mutedForeground,
            }}
          >
            Tips
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 20,
              color: colors.mutedForeground,
            }}
          >
            {"• Use a direct image URL ending in .jpg, .png, or .gif\n• Add hashtags to reach more people\n• Tag a location to connect with local communities"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}