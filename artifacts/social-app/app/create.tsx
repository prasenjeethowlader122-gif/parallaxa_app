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
type TextSegment = { text: string; type: "plain" | "mention" | "hashtag" };

// ─── Helpers ────────────────────────────────────────────────────────────────
function parseSegments(text: string | undefined | null): TextSegment[] {
  if (!text) return [];
  const regex = /(@\w+|#\w+)/g; // ← fixed: no double backslash
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), type: "plain" });
    }
    const token = match[0];
    segments.push({
      text: token,
      type: token.startsWith("@") ? "mention" : "hashtag",
    });
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), type: "plain" });
  }

  return segments;
}

// ─── Highlighted Text Overlay ───────────────────────────────────────────────
const HighlightedText: FC<{ text: string; fontSize: number; lineHeight: number }> = ({
  text,
  fontSize,
  lineHeight,
}) => {
  const segments = parseSegments(text);

  return (
    <Text
      style={{
        fontSize,
        lineHeight,
        color: "transparent",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        pointerEvents: "none",
      }}
      selectable={false}
    >
      {segments.map((seg, i) => {
        if (seg.type === "mention") {
          return (
            <Text key={i} style={{ color: "#1d9bf0", fontWeight: "500" }}>
              {seg.text}
            </Text>
          );
        }
        if (seg.type === "hashtag") {
          return (
            <Text key={i} style={{ color: "#1d9bf0", fontWeight: "500" }}>
              {seg.text}
            </Text>
          );
        }
        return <Text key={i} style={{ color: "transparent" }}>{seg.text}</Text>;
      })}
    </Text>
  );
};

// ─── Mention Suggestions ────────────────────────────────────────────────────
const MENTION_SUGGESTIONS = [
  { id: "1", name: "Prasenjeet Howlader", username: "prasenjeet" },
  { id: "2", name: "Rahim Uddin", username: "rahimuddin" },
  { id: "3", name: "Sadia Islam", username: "sadia_islam" },
  { id: "4", name: "Nayeem Hassan", username: "nayeem_h" },
  { id: "5", name: "Ayesha Khatun", username: "ayesha_k" },
];

const MentionSuggestions: FC<{
  keyword: string | null;
  onSuggestionPress: (user: { id: string; name: string; username: string }) => void;
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
            <Text style={styles.suggestionAvatarText}>
              {user.name[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.suggestionName}>{user.name}</Text>
            <Text style={styles.suggestionUsername}>@{user.username}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

// ─── Character Arc ───────────────────────────────────────────────────────────
const CharacterArc: FC<{ count: number; max: number }> = ({ count, max }) => {
  const remaining = max - count;
  const pct = count / max;
  const size = 22;
  const stroke = 2.2;

  const color = remaining <= 0 ? "#f4212e" : remaining <= 20 ? "#ffd400" : "#1d9bf0";

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
          borderColor: "transparent",
          borderTopColor: pct > 0 ? color : "transparent",
          borderRightColor: pct > 0.25 ? color : "transparent",
          borderBottomColor: pct > 0.5 ? color : "transparent",
          borderLeftColor: pct > 0.75 ? color : "transparent",
          position: "absolute",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      {remaining <= 20 && remaining > 0 && (
        <Text style={{ fontSize: 9, fontWeight: "700", color }}>{remaining}</Text>
      )}
      {remaining <= 0 && (
        <Text style={{ fontSize: 9, fontWeight: "700", color }}>{remaining}</Text>
      )}
    </View>
  );
};

// ─── Toolbar Button ───────────────────────────────────────────────────────────
const ToolbarBtn: FC<{ icon: any; onPress: () => void; size?: number }> = ({
  icon,
  onPress,
  size = 20,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.toolbarBtn}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    activeOpacity={0.6}
  >
    <HugeiconsIcon icon={icon} size={size} color="#1d9bf0" strokeWidth={1.5} />
  </TouchableOpacity>
);

// ─── Audience Badge ───────────────────────────────────────────────────────────
const AudienceBadge = () => (
  <View style={styles.audienceBadge}>
    <Text style={styles.audienceBadgeText}>Everyone</Text>
    <Text style={styles.audienceBadgeChevron}>›</Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
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

  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => router.push("/(tabs)"),
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  const hashtags = useMemo(
    () => content.match(/#\w+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [],
    [content]
  );

  const canPost = (content.trim().length > 0 || imageUrl.trim().length > 0) && remaining >= 0;

  const handlePost = () => {
    if (!canPost) return;
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        location: location.trim() || undefined,
        hashtags,
      },
    });
  };

  const handleTextChange = useCallback((text: string) => {
    const safeText = text ?? "";
    setContent(safeText);
    const match = safeText.match(/@(\w*)$/i); // ← fixed: \w instead of \\w
    setMentionKeyword(match ? match[1] : null);
  }, [setContent, setMentionKeyword]); // ← add deps

  const handleSuggestionPress = useCallback(
    (u: { id: string; name: string; username: string }) => {
      const replaced = content.replace(/@(\w*)$/i, `@${u.username} `); // ← fixed: \w
      setContent(replaced);
      setMentionKeyword(null);
    },
    [content]
  );

  const displayName = user?.displayName ?? (user as any)?.name ?? "You";
  const segments = parseSegments(content);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost || isPending}
          style={[styles.postBtn, (!canPost || isPending) && styles.postBtnDisabled]}
          activeOpacity={0.85}
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
      >
        <View style={styles.composer}>
          {/* Avatar */}
          <View style={styles.avatarCol}>
            <UserAvatar uri={user?.avatarUrl} size={42} />
            <View style={styles.threadLine} />
          </View>

          {/* Right column */}
          <View style={styles.composerRight}>
            {/* Name + Audience */}
            <View style={styles.nameRow}>
              <Text style={styles.displayName} numberOfLines={1}>
                {displayName}
              </Text>
              <AudienceBadge />
            </View>

            {/* Mention suggestions */}
            {mentionKeyword !== null && (
              <MentionSuggestions
                keyword={mentionKeyword}
                onSuggestionPress={handleSuggestionPress}
              />
            )}

            {/* Text input with highlight overlay */}
            <View style={styles.inputWrapper}>
              {/* Highlight layer */}
              <Text
                style={styles.highlightLayer}
                selectable={false}
                pointerEvents="none"
              >
                {segments.map((seg, i) => {
                  if (seg.type === "mention" || seg.type === "hashtag") {
                    return (
                      <Text key={i} style={styles.highlightToken}>
                        {seg.text}
                      </Text>
                    );
                  }
                  return (
                    <Text key={i} style={styles.highlightPlain}>
                      {seg.text}
                    </Text>
                  );
                })}
                {"\u200B"} {/* ← fixed invisible char */}
              </Text>

              {/* Actual input */}
              <TextInput
                ref={inputRef}
                value={content}
                onChangeText={handleTextChange}
                style={styles.input}
                placeholder="What is happening?!"
                placeholderTextColor="#71767b"
                multiline
                maxLength={MAX + 10}
                autoFocus
                selectionColor="#1d9bf0"
              />
            </View>

            {/* Image preview */}
            {imageUrl.trim().length > 0 && (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setImageUrl("")}
                  style={styles.removeImage}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Location */}
            {location.trim().length > 0 && (
              <View style={styles.locationRow}>
                <HugeiconsIcon icon={Location01Icon} size={14} color="#1d9bf0" />
                <Text style={styles.locationText}>{location}</Text>
              </View>
            )}

            {/* Add to thread hint */}
            <View style={styles.addThreadRow}>
              <View style={styles.addThreadAvatarSmall} />
              <Text style={styles.addThreadText}>Add to thread</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Toolbar ── */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <ToolbarBtn icon={Image01Icon} onPress={() => {}} />
          <ToolbarBtn icon={Gif01Icon} onPress={() => {}} />
          <ToolbarBtn icon={PollIcon} onPress={() => {}} />
          <ToolbarBtn icon={EmojiIcon} onPress={() => {}} />
          <ToolbarBtn icon={Calendar01Icon} onPress={() => {}} />
          <ToolbarBtn icon={Location01Icon} onPress={() => {}} />
        </View>

        <View style={styles.toolbarRight}>
          <View style={styles.toolbarDivider} />
          <CharacterArc count={content.length} max={MAX} />
          <TouchableOpacity style={styles.addPostBtn} activeOpacity={0.7}>
            <Text style={styles.addPostBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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