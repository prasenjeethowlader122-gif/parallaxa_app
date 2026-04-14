import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator,
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
        setContent("");
        setImageUrl("");
        setLocation("");
        setHashtags("");
        Alert.alert("Posted!", "Your post is now live.", [
          { text: "OK", onPress: () => router.push("/(tabs)" as any) },
        ]);
      },
      onError: (err: any) => {
        Alert.alert("Error", err?.message ?? "Could not create post");
      },
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

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New post</Text>
        <TouchableOpacity onPress={handlePost} disabled={isPending} style={[styles.postBtn, { backgroundColor: colors.primary }]}>
          {isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.postBtnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Image URL input */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="image" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.urlInput, { color: colors.foreground }]}
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
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.captionInput, { color: colors.foreground }]}
            placeholder="Write a caption..."
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={2200}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{content.length}/2200</Text>
        </View>

        {/* Location */}
        <View style={[styles.optionRow, { borderBottomColor: colors.border }]}>
          <Feather name="map-pin" size={18} color={colors.foreground} />
          <TextInput
            style={[styles.optionInput, { color: colors.foreground }]}
            placeholder="Add location"
            placeholderTextColor={colors.mutedForeground}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Hashtags */}
        <View style={[styles.optionRow, { borderBottomColor: colors.border }]}>
          <Feather name="hash" size={18} color={colors.foreground} />
          <TextInput
            style={[styles.optionInput, { color: colors.foreground }]}
            placeholder="Add hashtags (e.g. travel food)"
            placeholderTextColor={colors.mutedForeground}
            value={hashtags}
            onChangeText={setHashtags}
            autoCapitalize="none"
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={[styles.tipsTitle, { color: colors.mutedForeground }]}>Tips</Text>
          <Text style={[styles.tipsText, { color: colors.mutedForeground }]}>
            • Use a direct image URL ending in .jpg, .png, or .gif{"\n"}
            • Add hashtags to reach more people{"\n"}
            • Tag a location to connect with local communities
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 4 },
  cancelText: { fontSize: 15 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  postBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, minWidth: 60, alignItems: "center" },
  postBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  content: { padding: 16, gap: 4 },
  section: { marginBottom: 4, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  urlInput: { flex: 1, fontSize: 14 },
  captionInput: { fontSize: 16, lineHeight: 22, minHeight: 100, textAlignVertical: "top", marginBottom: 8 },
  charCount: { fontSize: 12, textAlign: "right" },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  optionInput: { flex: 1, fontSize: 15 },
  tipsContainer: { marginTop: 24, padding: 16, borderRadius: 12, backgroundColor: "#00000008" },
  tipsTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  tipsText: { fontSize: 13, lineHeight: 20 },
});
