import { useRouter } from "expo-router";
import React, { useMemo, useState, FC, useRef, useCallback } from "react";
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Svg, Circle } from "react-native-svg";
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
} from "react-native-controlled-mentions";

type MentionType = "mention" | "hashtag";

const mentionSuggestions = [
  { id: "1", name: "Prasenjeet Howlader" },
  { id: "2", name: "Rahim" },
  { id: "3", name: "Sadia" },
  { id: "4", name: "Nayeem" },
  { id: "5", name: "Ayesha" },
] as const;

type MentionSuggestion = { id: string; name: string };

const MAX_CHARS = 280;

interface CharRingProps {
  count: number;
  max: number;
  colors: any;
}

const CharRing: FC<CharRingProps> = ({ count, max, colors }) => {
  const remaining = max - count;
  const pct = Math.min(count / max, 1);
  const size = 30;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct);

  const isNearLimit = remaining <= 20;
  const isOverLimit = remaining < 0;
  const ringColor = isOverLimit
    ? colors.destructive ?? "#f4212e"
    : isNearLimit
    ? colors.accent ?? "#ffd400"
    : colors.primary;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.border ?? "#2f3336"}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {isNearLimit && (
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: ringColor,
            position: "absolute",
          }}
        >
          {remaining}
        </Text>
      )}
    </View>
  );
};

const AudiencePill: FC<{ label: string; colors: any }> = ({
  label,
  colors,
}) => (
  <TouchableOpacity
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
      alignSelf: "flex-start",
    }}
    accessibilityRole="button"
    accessibilityLabel={`Audience: ${label}`}
  >
    <Text
      style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}
    >
      {label}
    </Text>
    <HugeiconsIcon icon={Globe02Icon} size={11} color={colors.primary} />
  </TouchableOpacity>
);

interface MentionSuggestionsCompProps {
  keyword?: string;
  onSuggestionPress?: (suggestion: MentionSuggestion) => void;
  colors: any;
}

const MentionSuggestionsComp: FC<MentionSuggestionsCompProps> = ({
  keyword,
  onSuggestionPress,
  colors,
}) => {
  // Guard: keyword must be a non-empty string
  if (!keyword || typeof keyword !== "string") return null;

  const filtered = (mentionSuggestions as readonly MentionSuggestion[]).filter(
    (u) =>
      u?.name && u.name.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!filtered.length) return null;

  return (
    <View
      style={{
        marginBottom: 8,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: colors.card ?? "#16181c",
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {filtered.map((u, i) => (
        <Pressable
          key={u.id}
          onPress={() => onSuggestionPress?.(u)}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: pressed
              ? colors.cardHover ?? "#1e2126"
              : "transparent",
            borderTopWidth: i > 0 ? 1 : 0,
            borderTopColor: colors.border,
          })}
          accessibilityRole="button"
          accessibilityLabel={`Mention @${u.name}`}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.foreground,
            }}
          >
            {u.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const TOOLBAR_ACTIONS = [
  { icon: Image01Icon, id: "image", accessibilityLabel: "Add photo" },
  { icon: BarChart04Icon, id: "poll", accessibilityLabel: "Poll" },
  { icon: EmojiSmileIcon, id: "emoji", accessibilityLabel: "Emoji" },
  { icon: Calendar03Icon, id: "schedule", accessibilityLabel: "Schedule" },
  { icon: Location01Icon, id: "location", accessibilityLabel: "Location" },
] as const;

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
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  // Guard: content may not have .match if it's somehow not a string
  const hashtags = useMemo(
    () =>
      typeof content === "string"
        ? (content.match(/#\w+/g) ?? []).map((t) => t.slice(1).toLowerCase())
        : [],
    [content]
  );

  const handlePost = useCallback(() => {
    if (isEmpty || isOverLimit) return;
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        hashtags,
      },
    });
  }, [content, imageUrl, hashtags, isEmpty, isOverLimit, createPost]);

  const triggersConfig = useMemo(
    (): TriggersConfig<MentionType> => ({
      mention: {
        trigger: "@",
        textStyle: { fontWeight: "700", color: colors.primary },
      },
      hashtag: {
        trigger: "#",
        allowedSpacesCount: 0,
        isInsertSpaceAfterMention: true,
        textStyle: { fontWeight: "700", color: colors.primary },
      },
    }),
    [colors.primary]
  );

  const { textInputProps, triggers } = useMentions({
    value: content,
    onChange: setContent,
    triggersConfig,
  });

  // Guard: triggers.mention may be undefined on first render
  const mentionKeyword = triggers?.mention?.keyword;
  const mentionOnPress = triggers?.mention?.onSuggestionPress;

  const postBtnDisabled = isPending || isEmpty || isOverLimit;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUrl(result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background ?? "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: Platform.OS === "ios" ? 56 : 16,
          paddingBottom: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border ?? "#2f3336",
        }}
      >
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
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={20}
            color={colors.foreground ?? "#e7e9ea"}
          />
        </TouchableOpacity>

        <TouchableOpacity accessibilityLabel="Save draft">
          <Text
            style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}
          >
            Drafts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePost}
          disabled={postBtnDisabled}
          style={{
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: postBtnDisabled
              ? colors.muted ?? "#0f4c75"
              : colors.primary,
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Post"
          accessibilityState={{ disabled: postBtnDisabled }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={{
                color: postBtnDisabled
                  ? colors.mutedForeground ?? "#5b9ab8"
                  : "#fff",
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Compose Area */}
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", padding: 16, gap: 12 }}>
          <View style={{ alignItems: "center" }}>
            <UserAvatar uri={user?.avatarUrl} size={42} />
            {content.length > 0 && (
              <View
                style={{
                  width: 2,
                  flex: 1,
                  marginTop: 8,
                  backgroundColor: colors.border ?? "#2f3336",
                  borderRadius: 1,
                  minHeight: 30,
                }}
              />
            )}
          </View>

          <View style={{ flex: 1, paddingTop: 2 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.foreground ?? "#e7e9ea",
                marginBottom: 4,
              }}
            >
              {user?.username ?? "you"}
            </Text>

            <AudiencePill label="Everyone" colors={colors} />

            {/* Guard: only render suggestions when triggers.mention is ready */}
            <View style={{ marginTop: 10 }}>
              <MentionSuggestionsComp
                keyword={mentionKeyword}
                onSuggestionPress={mentionOnPress}
                colors={colors}
              />
            </View>

            <TextInput
              ref={inputRef}
              {...textInputProps}
              style={{
                fontSize: 20,
                color: colors.foreground ?? "#e7e9ea",
                textAlignVertical: "top",
                lineHeight: 26,
                marginTop: 6,
                minHeight: 100,
                fontWeight: "400",
              }}
              placeholder="What is happening?!"
              placeholderTextColor={colors.mutedForeground ?? "#536471"}
              multiline
              autoFocus
              selectionColor={colors.primary}
              accessibilityLabel="Post content"
            />

            {imageUrl.trim().length > 0 && (
              <View
                style={{
                  marginTop: 12,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border ?? "#2f3336",
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
                  accessibilityRole="button"
                  accessibilityLabel="Remove image"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={16}
                    color={colors.foreground ?? "#e7e9ea"}
                  />
                </TouchableOpacity>
              </View>
            )}

            {content.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 16,
                  alignItems: "center",
                }}
              >
                <UserAvatar uri={user?.avatarUrl} size={24} />
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.mutedForeground ?? "#536471",
                  }}
                >
                  Add to thread
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Toolbar */}
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: colors.border ?? "#2f3336",
          paddingHorizontal: 12,
          paddingVertical: 10,
          paddingBottom: Platform.OS === "ios" ? 34 : 14,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.background ?? "#000",
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 2, flex: 1 }}
        >
          {TOOLBAR_ACTIONS.map(({ icon, id, accessibilityLabel }) => (
            <TouchableOpacity
              key={id}
              onPress={id === "image" ? pickImage : undefined}
              style={{
                width: 38,
                height: 38,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 19,
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
            >
              <HugeiconsIcon
                icon={icon}
                size={20}
                color={colors.primary}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={{
            width: 1,
            height: 28,
            backgroundColor: colors.border ?? "#2f3336",
            marginHorizontal: 8,
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <CharRing count={charCount} max={MAX_CHARS} colors={colors} />

          <TouchableOpacity
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 1.5,
              borderColor: colors.mutedForeground ?? "#536471",
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel="Add media"
          >
            <Text
              style={{
                color: colors.mutedForeground ?? "#536471",
                fontSize: 18,
                lineHeight: 20,
                marginTop: -1,
              }}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}