import { useRouter } from "expo-router";
import React, { useMemo, useState, FC, useCallback, useRef } from "react";
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
  StyleSheet,
  Dimensions,
} from "react-native";
import { useCreatePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Image01Icon,
  Location01Icon,
  Gif01Icon,
  PollIcon,
  EmojiIcon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";

// ─── Types ──────────────────────────────────────────────────────────────────
type UserSuggestion = { id: string; name: string; username: string };

type TextPart = { text: string; type: "plain" | "mention" | "hashtag" };

// ─── Fixed Helpers ──────────────────────────────────────────────────────────
const MENTION_REGEX = /@(\w+)/g;
const HASHTAG_REGEX = /#(\w+)/g;

function parseSegments(text: string): TextPart[] {
  if (!text) return [];
  const segments: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Process mentions first
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), type: "plain" });
    }
    segments.push({ text: match[0], type: "mention" });
    lastIndex = match.index + match[0].length;
  }

  // Reset for hashtags (only in remaining text)
  HASHTAG_REGEX.lastIndex = lastIndex;
  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), type: "plain" });
    }
    segments.push({ text: match[0], type: "hashtag" });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), type: "plain" });
  }

  return segments;
}

function extractHashtags(text: string): string[] {
  const matches = text.match(HASHTAG_REGEX);
  return matches ? matches.map((m) => m.slice(1).toLowerCase()) : [];
}

// ─── Rendered Text Display (No Overlay!) ────────────────────────────────────
const RenderedText: FC<{ segments: TextPart[]; fontSize: number; lineHeight: number }> = ({
  segments,
  fontSize,
  lineHeight,
}) => (
  <Text style={{ fontSize, lineHeight, opacity: 0.6 }}>
    {segments.map((seg, i) => {
      const style = seg.type === "mention" || seg.type === "hashtag"
        ? { color: "#1d9bf0", fontWeight: "500" }
        : {};
      return <Text key={i} style={style}>{seg.text}</Text>;
    })}
  </Text>
);

// ─── Fixed Mention Suggestions ─────────────────────────────────────────────
const MENTION_SUGGESTIONS: UserSuggestion[] = [
  { id: "1", name: "Prasenjeet Howlader", username: "prasenjeet" },
  { id: "2", name: "Rahim Uddin", username: "rahimuddin" },
  { id: "3", name: "Sadia Islam", username: "sadia_islam" },
  { id: "4", name: "Nayeem Hassan", username: "nayeem_h" },
  { id: "5", name: "Ayesha Khatun", username: "ayesha_k" },
];

const MentionSuggestions: FC<{
  keyword: string | null;
  onSuggestionPress: (user: UserSuggestion) => void;
}> = ({ keyword, onSuggestionPress }) => {
  if (!keyword || keyword.trim() === "") return null;

  const filtered = MENTION_SUGGESTIONS.filter(
    (u) =>
      u.username.toLowerCase().includes(keyword.toLowerCase()) ||
      u.name.toLowerCase().includes(keyword.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <View style={styles.suggestionsContainer}>
      {filtered.slice(0, 5).map((user, index) => (
        <Pressable
          key={user.id}
          onPress={() => onSuggestionPress(user)}
          style={({ pressed }) => [
            styles.suggestionItem,
            index < filtered.length - 1 && styles.suggestionBorder,
            pressed && styles.suggestionPressed,
          ]}
        >
          <View style={styles.suggestionAvatar}>
            <Text style={styles.suggestionAvatarText}>{user.name[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.suggestionName} numberOfLines={1}>{user.name}</Text>
            <Text style={styles.suggestionUsername}>@{user.username}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

// ─── Improved Character Arc ─────────────────────────────────────────────────
const CharacterArc: FC<{ count: number; max: number }> = ({ count, max }) => {
  const remaining = Math.max(0, max - count);
  const pct = Math.min(1, count / max);
  const size = 22;
  const stroke = 2.2;
  const color = remaining === 0 ? "#f4212e" : remaining <= 20 ? "#ffd400" : "#1d9bf0";

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: "#e1e8ed",
          position: "absolute",
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: pct === 0 ? "transparent" : color,
          borderTopColor: pct > 0 ? color : "transparent",
          borderRightColor: pct > 0.25 ? color : "transparent",
          borderBottomColor: pct > 0.5 ? color : "transparent",
          borderLeftColor: pct > 0.75 ? color : "transparent",
          position: "absolute",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      <Text style={{ fontSize: 9, fontWeight: "700", color }}>{remaining}</Text>
    </View>
  );
};

// ─── Toolbar Button ─────────────────────────────────────────────────────────
const ToolbarBtn: FC<{ icon: any; onPress: () => void; size?: number; accessibilityLabel: string }> = ({
  icon,
  onPress,
  size = 20,
  accessibilityLabel,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.toolbarBtn}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    activeOpacity={0.6}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
  >
    <HugeiconsIcon icon={icon} size={size} color="#1d9bf0" strokeWidth={1.5} />
  </TouchableOpacity>
);

// ─── Audience Badge ─────────────────────────────────────────────────────────
const AudienceBadge: FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.audienceBadge} activeOpacity={0.7}>
    <Text style={styles.audienceBadgeText}>Everyone</Text>
    <Text style={styles.audienceBadgeChevron}>›</Text>
  </TouchableOpacity>
);

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [mentionKeyword, setMentionKeyword] = useState<string | null>(null);

  const MAX = 280;
  const remaining = MAX - content.length;
  const segments = useMemo(() => parseSegments(content), [content]);
  const hashtags = useMemo(() => extractHashtags(content), [content]);

  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => router.push("/(tabs)"),
      onError: (err: any) => Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  const canPost = (content.trim().length > 0 || imageUrl.trim().length > 0) && remaining >= 0;

  const handlePost = useCallback(() => {
    if (!canPost) return;
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        location: location.trim() || undefined,
        hashtags,
      },
    });
  }, [canPost, content, imageUrl, location, hashtags, createPost]);

  const handleTextChange = useCallback((text: string) => {
    setContent(text);
    const match = text.match(/@(\w*)$/i);
    setMentionKeyword(match ? match[1] : null);
  }, []);

  const handleSuggestionPress = useCallback((user: UserSuggestion) => {
    const cursorPos = content.search(/@(\w*)$/i);
    if (cursorPos !== -1) {
      const before = content.slice(0, cursorPos);
      const after = content.slice(content.length); // Preserve anything after
      setContent(`${before}@${user.username} ${after}`);
    }
    setMentionKeyword(null);
    inputRef.current?.focus();
  }, [content]);

  const displayName = user?.displayName ?? (user as any)?.name ?? "You";

  const pickImage = () => Alert.alert("Image Picker", "Implement image picker");
  const pickGif = () => Alert.alert("GIF", "Implement GIF picker");
  // Add other toolbar handlers...

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.cancelBtn} 
          activeOpacity={0.7}
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost || isPending}
          style={[styles.postBtn, (!canPost || isPending) && styles.postBtnDisabled]}
          activeOpacity={0.85}
          accessibilityLabel="Post"
          accessibilityState={{ disabled: !canPost || isPending }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.composer}>
          {/* Avatar Column */}
          <View style={styles.avatarCol}>
            <UserAvatar uri={user?.avatarUrl} size={42} />
            <View style={styles.threadLine} />
          </View>

          {/* Content Column */}
          <View style={styles.composerRight}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
              <AudienceBadge onPress={() => Alert.alert("Audience", "Select audience")} />
            </View>

            {/* Preview Rendered Text */}
            <RenderedText 
              segments={segments} 
              fontSize={17} 
              lineHeight={24} 
            />

            {/* Mention Suggestions */}
            {mentionKeyword !== null && (
              <MentionSuggestions
                keyword={mentionKeyword}
                onSuggestionPress={handleSuggestionPress}
              />
            )}

            {/* Editable Input (plain, below preview) */}
            <TextInput
              ref={inputRef}
              value={content}
              onChangeText={handleTextChange}
              style={styles.input}
              placeholder="What is happening?!"
              placeholderTextColor="#71767b"
              multiline
              maxLength={MAX}
              autoFocus
              textAlignVertical="top"
              selectionColor="#1d9bf0"
              accessibilityLabel="Write your post"
            />

            {/* Image Preview */}
            {imageUrl.trim().length > 0 && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                <TouchableOpacity onPress={() => setImageUrl("")} style={styles.removeImage}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Location */}
            {location.trim().length > 0 && (
              <View style={styles.locationRow}>
                <HugeiconsIcon icon={Location01Icon} size={14} color="#1d9bf0" />
                <Text style={styles.locationText}>{location}</Text>
                <TouchableOpacity onPress={() => setLocation("")} style={styles.removeSmall}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Thread Hint */}
            <View style={styles.addThreadRow}>
              <View style={styles.addThreadAvatarSmall} />
              <Text style={styles.addThreadText}>Add another post to this thread</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <ToolbarBtn icon={Image01Icon} onPress={pickImage} accessibilityLabel="Add photo" />
          <ToolbarBtn icon={Gif01Icon} onPress={pickGif} accessibilityLabel="Add GIF" />
          <ToolbarBtn icon={PollIcon} onPress={() => {}} accessibilityLabel="Add poll" />
          <ToolbarBtn icon={EmojiIcon} onPress={() => {}} accessibilityLabel="Add emoji" />
          <ToolbarBtn icon={Calendar01Icon} onPress={() => {}} accessibilityLabel="Schedule post" />
          <ToolbarBtn icon={Location01Icon} onPress={() => Alert.alert("Location", "Set location")} accessibilityLabel="Add location" />
        </View>

        <View style={styles.toolbarRight}>
          <View style={styles.toolbarDivider} />
          <CharacterArc count={content.length} max={MAX} />
          <TouchableOpacity style={styles.addPostBtn} activeOpacity={0.7} accessibilityLabel="Add post to thread">
            <Text style={styles.addPostBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles (Updated for new layout) ────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FONT_SIZE = 17;
const LINE_HEIGHT = 24;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e1e8ed",
    backgroundColor: "#fff",
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  cancelText: {
    fontSize: 16,
    color: "#0f1419",
    fontWeight: "400",
  },
  postBtn: {
    backgroundColor: "#1d9bf0",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 66,
    alignItems: "center",
  },
  postBtnDisabled: {
    backgroundColor: "#b8d5ff",
  },
  postBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 4,
  },
  composer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  avatarCol: {
    alignItems: "center",
    paddingTop: 2,
  },
  threadLine: {
    width: 2.5,
    flex: 1,
    minHeight: 32,
    marginTop: 8,
    borderRadius: 1.25,
    backgroundColor: "#cfd9de",
    opacity: 0.6,
    alignSelf: "center",
  },
  composerRight: {
    flex: 1,
    paddingBottom: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f1419",
    flex: 1,
  },
  audienceBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1d9bf0",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  audienceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d9bf0",
  },
  audienceBadgeChevron: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1d9bf0",
    marginLeft: 2,
  },
  input: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: "#0f1419",
    minHeight: 120,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    backgroundColor: "#f7f9fa",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e1e8ed",
    textAlignVertical: "top",
  },
  imagePreview: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cfd9de",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  removeImage: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(15,20,25,0.9)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f7f9fa",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e1e8ed",
  },
  locationText: {
    fontSize: 15,
    color: "#1d9bf0",
    flex: 1,
  },
  removeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#71767b",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  addThreadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    paddingVertical: 8,
  },
  addThreadAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#cfd9de",
  },
  addThreadText: {
    fontSize: 15,
    color: "#71767b",
    fontWeight: "400",
  },
  suggestionsContainer: {
    marginTop: 4,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cfd9de",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  suggestionPressed: {
    backgroundColor: "#f7f9f9",
  },
  suggestionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e1e8ed",
  },
  suggestionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1d9bf0",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f1419",
  },
  suggestionUsername: {
    fontSize: 13,
    color: "#71767b",
    marginTop: 2,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e1e8ed",
    backgroundColor: "#fff",
  },
  toolbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  toolbarBtn: {
    padding: 8,
    borderRadius: 20,
  },
  toolbarDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: "#cfd9de",
  },
  addPostBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#cfd9de",
    alignItems: "center",
    justifyContent: "center",
  },
  addPostBtnText: {
    fontSize: 20,
    color: "#0f1419",
    fontWeight: "300",
    lineHeight: 24,
  },
});