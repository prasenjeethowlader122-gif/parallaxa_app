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
  ArrowLeft01Icon,
  Gif01Icon,
  PollIcon,
  EmojiIcon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";

// ─── Types ──────────────────────────────────────────────────────────────────
type TextSegment = { text: string; type: "plain" | "mention" | "hashtag" };

// ─── Helpers ────────────────────────────────────────────────────────────────
function parseSegments(text: string): TextSegment[] {
  const regex = /(@\w+|#\w+)/g;
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
        color: "transparent", // invisible — sits over TextInput
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
          {/* Avatar placeholder */}
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
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const gap = circ - dash;
  const offset = circ * 0.25;

  const color = remaining <= 0 ? "#f4212e" : remaining <= 20 ? "#ffd400" : "#1d9bf0";

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* SVG not available in RN — use a simple View ring approximation */}
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
      {/* Filled arc approximation using border trick */}
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

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
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
    setContent(text);
    const match = text.match(/@(\w*)$/i);
    setMentionKeyword(match ? match[1] : null);
  }, []);

  const handleSuggestionPress = useCallback(
    (u: { id: string; name: string; username: string }) => {
      const replaced = content.replace(/@(\w*)$/i, `@${u.username} `);
      setContent(replaced);
      setMentionKeyword(null);
    },
    [content]
  );

  const displayName = user?.displayName ?? user?.name ?? "You";

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
            {/* Thread line */}
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
              {/* Highlight layer (behind) */}
              <Text
                style={styles.highlightLayer}
                selectable={false}
                pointerEvents="none"
              >
                {parseSegments(content).map((seg, i) => {
                  if (seg.type === "mention" || seg.type === "hashtag") {
                    return (
                      <Text key={i} style={styles.highlightToken}>
                        {seg.text}
                      </Text>
                    );
                  }
                  // Plain text — same color as input text so overlay is invisible
                  return (
                    <Text key={i} style={styles.highlightPlain}>
                      {seg.text}
                    </Text>
                  );
                })}
                {/* Invisible padding so height matches */}
                {"\u200B"}
              </Text>

              {/* Actual input (text set to transparent where highlights show) */}
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
          {/* Divider */}
          <View style={styles.toolbarDivider} />
          <CharacterArc count={content.length} max={MAX} />
          {/* Thread add */}
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

  // Header
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
    backgroundColor: "#0f1419",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 66,
    alignItems: "center",
  },
  postBtnDisabled: {
    opacity: 0.35,
  },
  postBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
    paddingTop: 4,
  },

  // Composer
  composer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
  },
  avatarCol: {
    alignItems: "center",
    paddingTop: 2,
  },
  threadLine: {
    width: 2,
    flex: 1,
    minHeight: 32,
    marginTop: 8,
    borderRadius: 1,
    backgroundColor: "#cfd9de",
    opacity: 0.6,
    alignSelf: "center",
  },
  composerRight: {
    flex: 1,
    paddingBottom: 12,
  },

  // Name / audience
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f1419",
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

  // Input + highlight
  inputWrapper: {
    position: "relative",
    minHeight: 80,
  },
  highlightLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: "transparent",
    // must NOT intercept touches
  },
  highlightToken: {
    color: "#1d9bf0",
    fontWeight: "500",
  },
  highlightPlain: {
    color: "transparent",
  },
  input: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: "#0f1419",
    textAlignVertical: "top",
    minHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
    // on Android the background needs to be transparent so highlight shows
    backgroundColor: "transparent",
  },

  // Image preview
  imagePreview: {
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cfd9de",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 14,
  },
  removeImage: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(15,20,25,0.75)",
    borderRadius: 14,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // Location
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#1d9bf0",
  },

  // Add to thread
  addThreadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  addThreadAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#cfd9de",
  },
  addThreadText: {
    fontSize: 15,
    color: "#71767b",
  },

  // Mention suggestions
  suggestionsContainer: {
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cfd9de",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: "#fff",
  },
  suggestionPressed: {
    backgroundColor: "#f7f9f9",
  },
  suggestionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e1e8ed",
  },
  suggestionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1d9bf0",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionAvatarText: {
    color: "#fff",
    fontSize: 15,
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
    marginTop: 1,
  },

  // Toolbar
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e1e8ed",
    backgroundColor: "#fff",
  },
  toolbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  toolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#cfd9de",
    alignItems: "center",
    justifyContent: "center",
  },
  addPostBtnText: {
    fontSize: 18,
    color: "#0f1419",
    fontWeight: "300",
    lineHeight: 22,
  },
});