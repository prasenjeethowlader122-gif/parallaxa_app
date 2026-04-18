import { useRouter } from "expo-router";
import React, { useMemo, useState, FC, useRef } from "react";
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
  Pressable,
  Animated,
} from "react-native";
import { useCreatePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Image01Icon,
  Location01Icon,
  EmojiSmileIcon,
  BarChart04Icon,
  Calendar03Icon,
  Cancel01Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import {
  useMentions,
  TriggersConfig,
  MentionSuggestionsProps,
} from "react-native-controlled-mentions";

const triggersConfig: TriggersConfig<"mention" | "hashtag"> = {
  mention: {
    trigger: "@",
    textStyle: { fontWeight: "700", color: "#1d9bf0" },
  },
  hashtag: {
    trigger: "#",
    allowedSpacesCount: 0,
    isInsertSpaceAfterMention: true,
    textStyle: { fontWeight: "700", color: "#1d9bf0" },
  },
};

const mentionSuggestions = [
  { id: "1", name: "Prasenjeet Howlader" },
  { id: "2", name: "Rahim" },
  { id: "3", name: "Sadia" },
  { id: "4", name: "Nayeem" },
  { id: "5", name: "Ayesha" },
];

const MAX_CHARS = 280;

// Circular progress ring
function CharRing({ count, max }: { count: number; max: number }) {
  const remaining = max - count;
  const pct = Math.min(count / max, 1);
  const size = 30;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct);

  const isNearLimit = remaining <= 20;
  const isOverLimit = remaining < 0;

  const ringColor = isOverLimit ? "#f4212e" : isNearLimit ? "#ffd400" : "#1d9bf0";

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* SVG-style ring using border trick */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: "#2f3336",
          position: "absolute",
        }}
      />
      {isNearLimit && (
        <Text style={{ fontSize: 10, fontWeight: "700", color: ringColor, zIndex: 1 }}>
          {remaining}
        </Text>
      )}
    </View>
  );
}

// Audience pill button
function AudiencePill({ label }: { label: string }) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderWidth: 1,
        borderColor: "#1d9bf0",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: "#1d9bf0", fontSize: 13, fontWeight: "700" }}>{label}</Text>
      <HugeiconsIcon icon={Globe02Icon} size={11} color="#1d9bf0" />
    </TouchableOpacity>
  );
}

const MentionSuggestions: FC<MentionSuggestionsProps> = ({ keyword, onSuggestionPress }) => {
  if (keyword == null) return null;
  const filtered = mentionSuggestions.filter((u) =>
    u.name.toLowerCase().includes(keyword.toLowerCase())
  );
  if (filtered.length === 0) return null;

  return (
    <View
      style={{
        marginBottom: 8,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#16181c",
        borderWidth: 1,
        borderColor: "#2f3336",
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {filtered.map((u, i) => (
        <Pressable
          key={u.id}
          onPress={() => onSuggestionPress(u)}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: pressed ? "#1e2126" : "transparent",
            borderTopWidth: i > 0 ? 1 : 0,
            borderTopColor: "#2f3336",
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#e7e9ea" }}>{u.name}</Text>
        </Pressable>
      ))}
    </View>
  );
};

// Toolbar action buttons
const TOOLBAR_ACTIONS = [
  { icon: Image01Icon, id: "image" },
  { icon: BarChart04Icon, id: "poll" },
  { icon: EmojiSmileIcon, id: "emoji" },
  { icon: Calendar03Icon, id: "schedule" },
  { icon: Location01Icon, id: "location" },
];

export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const inputRef = useRef<TextInput>(null);

  const charCount = content.length;
  const remaining = MAX_CHARS - charCount;
  const isOverLimit = remaining < 0;
  const isEmpty = !content.trim() && !imageUrl.trim();

  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => router.push("/(tabs)" as any),
      onError: (err: any) => Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  const hashtags = useMemo(
    () => content.match(/#(\w+)/g)?.map((t) => t.replace("#", "").toLowerCase()) || [],
    [content]
  );

  const handlePost = () => {
    if (isEmpty || isOverLimit) return;
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        hashtags,
      },
    });
  };

  const { textInputProps, triggers } = useMentions({
    value: content,
    onChange: setContent,
    triggersConfig,
  });

  // Post button state
  const postBtnDisabled = isPending || isEmpty || isOverLimit;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── HEADER ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: Platform.OS === "ios" ? 56 : 16,
          paddingBottom: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: "#2f3336",
        }}
      >
        {/* Cancel */}
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
          }}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#e7e9ea" />
        </TouchableOpacity>

        {/* Drafts */}
        <TouchableOpacity>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#1d9bf0" }}>Drafts</Text>
        </TouchableOpacity>

        {/* Post button */}
        <TouchableOpacity
          onPress={handlePost}
          disabled={postBtnDisabled}
          style={{
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: postBtnDisabled ? "#0f4c75" : "#1d9bf0",
          }}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={{
                color: postBtnDisabled ? "#5b9ab8" : "#fff",
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── COMPOSE AREA ── */}
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", padding: 16, gap: 12 }}>
          {/* Avatar with thread line */}
          <View style={{ alignItems: "center" }}>
            <UserAvatar uri={user?.avatarUrl} size={42} />
            {/* Thread line */}
            {content.length > 0 && (
              <View
                style={{
                  width: 2,
                  flex: 1,
                  marginTop: 8,
                  backgroundColor: "#2f3336",
                  borderRadius: 1,
                  minHeight: 30,
                }}
              />
            )}
          </View>

          <View style={{ flex: 1, paddingTop: 2 }}>
            {/* Username */}
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#e7e9ea", marginBottom: 4 }}>
              {user?.username ?? "you"}
            </Text>

            {/* Audience selector */}
            <AudiencePill label="Everyone" />

            {/* Mention suggestions dropdown */}
            <View style={{ marginTop: 10 }}>
              <MentionSuggestions {...triggers.mention} />
            </View>

            {/* Text input */}
            <TextInput
              ref={inputRef}
              {...textInputProps}
              style={{
                fontSize: 20,
                color: "#e7e9ea",
                textAlignVertical: "top",
                lineHeight: 26,
                marginTop: 6,
                minHeight: 100,
                fontWeight: "400",
              }}
              placeholder="What is happening?!"
              placeholderTextColor="#536471"
              multiline
              autoFocus
              selectionColor="#1d9bf0"
            />

            {/* Image preview */}
            {imageUrl.trim().length > 0 && (
              <View
                style={{
                  marginTop: 12,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#2f3336",
                }}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "100%", height: 220 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setImageUrl("")}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.75)",
                    borderRadius: 20,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} color="#e7e9ea" />
                </TouchableOpacity>
              </View>
            )}

            {/* Add to thread hint */}
            {content.length > 0 && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16, alignItems: "center" }}>
                <UserAvatar uri={user?.avatarUrl} size={24} />
                <Text style={{ fontSize: 15, color: "#536471" }}>Add to thread</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── BOTTOM TOOLBAR ── */}
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: "#2f3336",
          paddingHorizontal: 12,
          paddingVertical: 10,
          paddingBottom: Platform.OS === "ios" ? 34 : 14,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#000000",
        }}
      >
        {/* Action icons */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2, flex: 1 }}>
          {TOOLBAR_ACTIONS.map(({ icon, id }) => (
            <TouchableOpacity
              key={id}
              style={{
                width: 38,
                height: 38,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 19,
              }}
              activeOpacity={0.7}
            >
              <HugeiconsIcon icon={icon} size={20} color="#1d9bf0" strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={{ width: 1, height: 28, backgroundColor: "#2f3336", marginHorizontal: 8 }} />

        {/* Char counter ring area */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {/* Progress circle */}
          <View style={{ width: 30, height: 30, position: "relative" }}>
            {/* Background track */}
            <View
              style={{
                position: "absolute",
                width: 30,
                height: 30,
                borderRadius: 15,
                borderWidth: 2.5,
                borderColor: "#2f3336",
              }}
            />
            {/* Filled arc — simplified as colored ring with opacity trick */}
            {charCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  borderWidth: 2.5,
                  borderColor: isOverLimit ? "#f4212e" : remaining <= 20 ? "#ffd400" : "#1d9bf0",
                  opacity: Math.min(charCount / MAX_CHARS, 1),
                }}
              />
            )}
            {remaining <= 20 && (
              <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: isOverLimit ? "#f4212e" : "#ffd400",
                  }}
                >
                  {remaining}
                </Text>
              </View>
            )}
          </View>

          {/* Add post (+) button */}
          <TouchableOpacity
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 1.5,
              borderColor: "#536471",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#536471", fontSize: 18, lineHeight: 20, marginTop: -1 }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
/**
 * // এই replacements করুন create.tsx এ:
backgroundColor: "#000000"  →  backgroundColor: colors.background
color: "#e7e9ea"            →  color: colors.foreground
color: "#536471"            →  color: colors.mutedForeground
borderColor: "#2f3336"      →  borderColor: colors.border
color: "#1d9bf0"            →  color: colors.primary
backgroundColor: "#1d9bf0"  →  backgroundColor: colors.primary
backgroundColor: "#0f4c75"  →  backgroundColor: colors.muted
 */