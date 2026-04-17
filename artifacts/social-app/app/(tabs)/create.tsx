import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCreatePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Image01Icon,
  Location01Icon,
  SquareLock02Icon,
  XMarkIcon,
} from "@hugeicons/core-free-icons";

const MAX_LENGTH = 2200;

export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [audience, setAudience] = useState<"public" | "followers">("public");

  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => router.replace("/(tabs)" as any),
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  const remaining = MAX_LENGTH - content.length;
  const canPost = useMemo(() => {
    return !!content.trim() || !!imageUrl.trim();
  }, [content, imageUrl]);

  const hashtags = useMemo(() => {
    return Array.from(
      new Set((content.match(/#\w+/g) ?? []).map((t) => t.slice(1).toLowerCase()))
    );
  }, [content]);

  const handlePost = () => {
    if (!canPost || isPending) return;

    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        location: location.trim() || undefined,
        hashtags,
        visibility: audience,
      },
    });
  };

  const insertAtCursor = (value: string) => {
    setContent((prev) => (prev.endsWith(" ") || prev.length === 0 ? prev + value : prev + " " + value));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.headerAction, { color: colors.foreground }]}>Cancel</Text>
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          New post
        </Text>

        <Pressable
          onPress={handlePost}
          disabled={!canPost || isPending}
          style={[
            styles.postButton,
            {
              backgroundColor: colors.primary,
              opacity: !canPost || isPending ? 0.5 : 1,
            },
          ]}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.composeRow}>
          <UserAvatar uri={user?.avatarUrl} size={44} />

          <View style={styles.composeMain}>
            <Pressable
              onPress={() =>
                setAudience(audience === "public" ? "followers" : "public")
              }
              style={[
                styles.audienceChip,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <HugeiconsIcon
                icon={audience === "public" ? SquareLock02Icon : SquareLock02Icon}
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.audienceText, { color: colors.primary }]}>
                {audience === "public" ? "Public" : "Followers"}
              </Text>
            </Pressable>

            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="What's happening?"
              placeholderTextColor={colors.mutedForeground}
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
              maxLength={MAX_LENGTH}
              textAlignVertical="top"
              scrollEnabled={false}
            />

            {imageUrl.trim().length > 0 ? (
              <View style={styles.previewWrap}>
                <Image
                  source={{ uri: imageUrl.trim() }}
                  style={[styles.previewImage, { backgroundColor: colors.muted }]}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => setImageUrl("")}
                  style={styles.removePreview}
                >
                  <HugeiconsIcon icon={XMarkIcon} size={16} color="#fff" />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.metaCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable
            style={styles.metaRow}
            onPress={() => {
              Alert.prompt?.("Image URL", "Paste image URL", [
                { text: "Cancel", style: "cancel" },
                { text: "Save", onPress: (t) => setImageUrl(t ?? "") },
              ]);
            }}
          >
            <HugeiconsIcon icon={Image01Icon} size={20} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.foreground }]}>Add image URL</Text>
          </Pressable>

          <Pressable
            style={styles.metaRow}
            onPress={() => {
              Alert.prompt?.("Location", "Enter location", [
                { text: "Cancel", style: "cancel" },
                { text: "Save", onPress: (t) => setLocation(t ?? "") },
              ]);
            }}
          >
            <HugeiconsIcon icon={Location01Icon} size={20} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.foreground }]}>Add location</Text>
          </Pressable>
        </View>

        <View style={styles.helperRow}>
          <Text
            style={[
              styles.counter,
              { color: remaining < 100 ? colors.destructive : colors.mutedForeground },
            ]}
          >
            {remaining}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.toolbar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable onPress={() => insertAtCursor("#")} style={styles.toolbarButton}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>#</Text>
        </Pressable>

        <Pressable onPress={() => insertAtCursor("@")} style={styles.toolbarButton}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>@</Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        <Text style={[styles.toolbarHint, { color: colors.mutedForeground }]}>
          {hashtags.length > 0 ? `${hashtags.length} hashtag${hashtags.length > 1 ? "s" : ""}` : "No hashtags yet"}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerAction: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  postButton: {
    minWidth: 72,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  composeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  composeMain: {
    flex: 1,
    marginLeft: 12,
  },
  audienceChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  audienceText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    fontSize: 18,
    lineHeight: 24,
    minHeight: 140,
    padding: 0,
  },
  previewWrap: {
    marginTop: 12,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  removePreview: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  metaCard: {
    marginTop: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: "hidden",
  },
  metaRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  helperRow: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  counter: {
    fontSize: 12,
    fontWeight: "600",
  },
  toolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  toolbarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  toolbarHint: {
    fontSize: 12,
  },
});