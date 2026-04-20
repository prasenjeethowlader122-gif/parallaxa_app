import { useRouter } from "expo-router";
import React, {
  useMemo,
  useState,
  FC,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Pressable,
  Modal,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
  Animated,
} from "react-native";
import { Text } from "@/components/Text"
import { useCreatePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Image01Icon,
  Location01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  Gif01Icon,
  SmileIcon,
  BarChart01Icon,
  Calendar01Icon,
  EarthIcon,
} from "@hugeicons/core-free-icons";

// ─── Types ────────────────────────────────────────────────────────────────────
type Segment = { text: string; type: "mention" | "hashtag" | "link" | "plain" };

// ─── Static mention suggestions ───────────────────────────────────────────────
const MENTION_SUGGESTIONS = [
  { id: "1", name: "Prasenjeet_Howlader", displayName: "Prasenjeet Howlader" },
  { id: "2", name: "Rahim", displayName: "Rahim" },
  { id: "3", name: "Sadia", displayName: "Sadia" },
  { id: "4", name: "Nayeem", displayName: "Nayeem" },
  { id: "5", name: "Ayesha", displayName: "Ayesha" },
];

// ─── Parse text into segments for rich highlighting ───────────────────────────
function parseSegments(text: string): Segment[] {
  const regex = /(@\w+|#\w+|https?:\/\/\S+)/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), type: "plain" });
    }
    const token = match[0];
    if (token.startsWith("@")) segments.push({ text: token, type: "mention" });
    else if (token.startsWith("#")) segments.push({ text: token, type: "hashtag" });
    else segments.push({ text: token, type: "link" });
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), type: "plain" });
  }

  return segments;
}

// ─── Rich text overlay (renders on top of the invisible TextInput) ─────────────
const RichTextOverlay: FC<{ text: string; style: object }> = ({ text, style }) => {
  const segments = useMemo(() => parseSegments(text), [text]);

  return (
    <Text style={[style, { position: "absolute", top: 0, left: 0, right: 0 }]} pointerEvents="none">
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
        if (seg.type === "link") {
          return (
            <Text key={i} style={{ color: "#1d9bf0", textDecorationLine: "underline" }}>
              {seg.text}
            </Text>
          );
        }
        return <Text key={i} style={{ color: "#14171a" }}>{seg.text}</Text>;
      })}
    </Text>
  );
};

// ─── Mention suggestion dropdown ──────────────────────────────────────────────
const MentionSuggestions: FC<{
  keyword: string | null;
  onSelect: (user: { id: string; name: string; displayName: string }) => void;
}> = ({ keyword, onSelect }) => {
  if (keyword === null || keyword === undefined) return null;

  const filtered = MENTION_SUGGESTIONS.filter((u) =>
    u.name.toLowerCase().includes(keyword.toLowerCase().trim()) ||
    u.displayName.toLowerCase().includes(keyword.toLowerCase().trim()),
  );

  if (filtered.length === 0) return null;

  return (
    <View
      style={{
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e1e8ed",
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#fff",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }}
    >
      {filtered.slice(0, 5).map((user, index) => (
        <Pressable
          key={user.id}
          onPress={() => onSelect(user)}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: pressed ? "#f7f9fa" : "#fff",
            borderBottomWidth: index < filtered.length - 1 ? 0.5 : 0,
            borderBottomColor: "#e1e8ed",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          })}
        >
          {/* Mini avatar placeholder */}
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#1d9bf0",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#14171a" }}>
              {user.displayName}
            </Text>
            <Text style={{ fontSize: 13, color: "#657786" }}>@{user.name}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

// ─── Character arc progress ring ─────────────────────────────────────────────
const CharacterRing: FC<{ count: number; max: number }> = ({ count, max }) => {
  const remaining = max - count;
  const progress = count / max;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * progress;

  const color =
    remaining <= 0 ? "#e0245e" : remaining <= 20 ? "#ffad1f" : "#1d9bf0";

  if (count === 0) return null;

  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      {/* SVG-like using View layers is not ideal in RN; use text-based approach */}
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2.5,
          borderColor: progress >= 1 ? color : "#e1e8ed",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {remaining <= 20 && remaining > 0 && (
          <Text style={{ fontSize: 9, fontWeight: "700", color }}>{remaining}</Text>
        )}
        {remaining <= 0 && (
          <Text style={{ fontSize: 9, fontWeight: "700", color }}>!</Text>
        )}
      </View>
    </View>
  );
};

// ─── Image URL input modal ────────────────────────────────────────────────────
const ImageUrlModal: FC<{
  visible: boolean;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ visible, value, onChange, onConfirm, onCancel }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
    <Pressable
      style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
      onPress={onCancel}
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: 24,
          paddingBottom: Platform.OS === "ios" ? 36 : 24,
          gap: 16,
        }}
      >
        {/* Drag handle */}
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#e1e8ed", alignSelf: "center", marginBottom: 4 }} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#14171a" }}>Add image URL</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="https://example.com/image.jpg"
          placeholderTextColor="#aab8c2"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={onConfirm}
          style={{
            borderWidth: 1.5,
            borderColor: "#e1e8ed",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 13,
            fontSize: 15,
            color: "#14171a",
            backgroundColor: "#f7f9fa",
          }}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: "#e1e8ed",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#657786" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={!value.trim()}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 24,
              backgroundColor: value.trim() ? "#1d9bf0" : "#aab8c2",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Add image</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Location input modal ─────────────────────────────────────────────────────
const LocationModal: FC<{
  visible: boolean;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ visible, value, onChange, onConfirm, onCancel }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
    <Pressable
      style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
      onPress={onCancel}
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: 24,
          paddingBottom: Platform.OS === "ios" ? 36 : 24,
          gap: 16,
        }}
      >
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#e1e8ed", alignSelf: "center", marginBottom: 4 }} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#14171a" }}>Add location</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Dhaka, Bangladesh"
          placeholderTextColor="#aab8c2"
          returnKeyType="done"
          onSubmitEditing={onConfirm}
          style={{
            borderWidth: 1.5,
            borderColor: "#e1e8ed",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 13,
            fontSize: 15,
            color: "#14171a",
            backgroundColor: "#f7f9fa",
          }}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: "#e1e8ed",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#657786" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={!value.trim()}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 24,
              backgroundColor: value.trim() ? "#1d9bf0" : "#aab8c2",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Add location</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Audience selector modal ──────────────────────────────────────────────────
type Audience = "everyone" | "followers" | "verified";
const AudienceModal: FC<{
  visible: boolean;
  current: Audience;
  onSelect: (a: Audience) => void;
  onCancel: () => void;
}> = ({ visible, current, onSelect, onCancel }) => {
  const options: { key: Audience; label: string; desc: string }[] = [
    { key: "everyone", label: "Everyone", desc: "Anyone on or off X" },
    { key: "followers", label: "Followers", desc: "People who follow you" },
    { key: "verified", label: "Verified accounts", desc: "Verified accounts only" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        onPress={onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            padding: 24,
            paddingBottom: Platform.OS === "ios" ? 36 : 24,
            gap: 6,
          }}
        >
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#e1e8ed", alignSelf: "center", marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#14171a", marginBottom: 8 }}>
            Who can reply?
          </Text>
          {options.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(opt.key)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderRadius: 12,
                backgroundColor: pressed ? "#f7f9fa" : "transparent",
                gap: 12,
              })}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: current === opt.key ? "#1d9bf0" : "#cfd9de",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {current === opt.key && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#1d9bf0" }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#14171a" }}>{opt.label}</Text>
                <Text style={{ fontSize: 13, color: "#657786", marginTop: 1 }}>{opt.desc}</Text>
              </View>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Toolbar icon button ──────────────────────────────────────────────────────
const ToolbarBtn: FC<{
  icon: any;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}> = ({ icon, onPress, active = false, disabled = false }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{
      padding: 8,
      borderRadius: 20,
      opacity: disabled ? 0.4 : 1,
    }}
    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
  >
    <HugeiconsIcon
      icon={icon}
      size={22}
      color={active ? "#1d9bf0" : "#536471"}
      strokeWidth={1.5}
    />
  </TouchableOpacity>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageDraft, setImageDraft] = useState("");
  const [location, setLocation] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [audience, setAudience] = useState<Audience>("everyone");
  const [mentionKeyword, setMentionKeyword] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [inputHeight, setInputHeight] = useState(100);
  // Track whether user is typing (for overlay transparency trick)
  const [isFocused, setIsFocused] = useState(false);

  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => router.replace("/(tabs)"),
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  const hashtags = useMemo(
    () => content.match(/#\w+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [],
    [content],
  );

  const mentions = useMemo(
    () => content.match(/@\w+/g)?.map((t) => t.slice(1)) ?? [],
    [content],
  );

  const canPost =
    !isPending && (content.trim().length > 0 || imageUrl.trim().length > 0);

  const MAX_CHARS = 280;
  const remaining = MAX_CHARS - content.length;

  const handlePost = () => {
    if (!canPost) return;
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        location: location.trim() || undefined,
        hashtags,
        mentions,
      },
    });
  };

  const handleTextChange = useCallback((text: string) => {
    setContent(text);
    const match = text.match(/@(\w*)$/i);
    setMentionKeyword(match ? match[1] : null);
  }, []);

  const handleSuggestionSelect = useCallback(
    (suggestionUser: { id: string; name: string; displayName: string }) => {
      setContent((prev) => {
        const before = prev.replace(/@\w*$/i, "");
        return `${before}@${suggestionUser.name} `;
      });
      setMentionKeyword(null);
    },
    [],
  );

  // Image handlers
  const openImageModal = () => { setImageDraft(imageUrl); setShowImageModal(true); };
  const confirmImage = () => { setImageUrl(imageDraft.trim()); setShowImageModal(false); };
  const cancelImage = () => { setImageDraft(""); setShowImageModal(false); };

  // Location handlers
  const openLocationModal = () => { setLocationDraft(location); setShowLocationModal(true); };
  const confirmLocation = () => { setLocation(locationDraft.trim()); setShowLocationModal(false); };
  const cancelLocation = () => { setLocationDraft(""); setShowLocationModal(false); };

  // Audience label
  const audienceLabel =
    audience === "everyone" ? "Everyone" :
    audience === "followers" ? "Followers" :
    "Verified";

  // Text style shared between input and overlay
  const textStyle = {
    fontSize: 18,
    lineHeight: 26,
    color: "#14171a",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    padding: 0,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: "#e1e8ed",
          backgroundColor: "#fff",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={colors.foreground}
            strokeWidth={1.5}
          />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {/* Drafts button */}
          <TouchableOpacity
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: "#cfd9de",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f1419" }}>
              Drafts
            </Text>
          </TouchableOpacity>

          {/* Post button */}
          <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost}
            style={{
              backgroundColor: canPost ? "#1d9bf0" : "#8ecdf8",
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 24,
              minWidth: 72,
              alignItems: "center",
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
      </View>

      {/* ── Body ── */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Avatar column */}
            <View style={{ alignItems: "center" }}>
              <UserAvatar uri={user?.avatarUrl} size={44} />
              <View
                style={{
                  width: 2,
                  flex: 1,
                  marginTop: 8,
                  borderRadius: 1,
                  backgroundColor: "#e1e8ed",
                  minHeight: 32,
                }}
              />
            </View>

            {/* Content column */}
            <View style={{ flex: 1, paddingBottom: 16 }}>
              {/* Name row */}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#0f1419",
                  marginBottom: 6,
                }}
              >
                {user?.displayName || "You"}
              </Text>

              {/* Audience selector badge */}
              <TouchableOpacity
                onPress={() => setShowAudienceModal(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1.5,
                  borderColor: "#1d9bf0",
                  borderRadius: 20,
                  alignSelf: "flex-start",
                  marginBottom: 12,
                }}
              >
                <HugeiconsIcon icon={EarthIcon} size={12} color="#1d9bf0" strokeWidth={2} />
                <Text style={{ color: "#1d9bf0", fontSize: 12, fontWeight: "700" }}>
                  {audienceLabel} ▾
                </Text>
              </TouchableOpacity>

              {/* Mention suggestions */}
              <MentionSuggestions
                keyword={mentionKeyword}
                onSelect={handleSuggestionSelect}
              />

              {/* ── Rich Text Editor Area ──
                  Strategy: transparent TextInput layered over a Text render.
                  The Text component renders colored segments; the TextInput
                  sits on top with transparent text color so the cursor shows
                  but letters are invisible — the colored overlay shows through. */}
              <View
                style={{
                  minHeight: Math.max(inputHeight, 100),
                  position: "relative",
                }}
              >
                {/* Colored overlay — always visible */}
                {content.length > 0 && (
                  <RichTextOverlay
                    text={content}
                    style={{
                      ...textStyle,
                      minHeight: Math.max(inputHeight, 100),
                    }}
                  />
                )}

                {/* Actual TextInput — transparent text, so overlay shows */}
                <TextInput
                  ref={inputRef}
                  value={content}
                  onChangeText={handleTextChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onContentSizeChange={(e) =>
                    setInputHeight(e.nativeEvent.contentSize.height)
                  }
                  style={{
                    ...textStyle,
                    color: content.length > 0 ? "transparent" : "#aab8c2",
                    textAlignVertical: "top",
                    minHeight: Math.max(inputHeight, 100),
                    maxHeight: 400,
                    // On Android, selection handles need a non-zero color
                    ...(Platform.OS === "android" && content.length > 0
                      ? { color: "rgba(0,0,0,0.01)" }
                      : {}),
                  }}
                  placeholder={content.length === 0 ? "What is happening?!" : ""}
                  placeholderTextColor="#aab8c2"
                  multiline
                  maxLength={MAX_CHARS}
                  autoFocus
                  selectionColor="#1d9bf0"
                  cursorColor="#1d9bf0"
                />
              </View>

              {/* Location tag */}
              {location.trim().length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                    gap: 5,
                    alignSelf: "flex-start",
                    backgroundColor: "#e8f5fd",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                  }}
                >
                  <HugeiconsIcon icon={Location01Icon} size={13} color="#1d9bf0" />
                  <Text style={{ fontSize: 13, color: "#1d9bf0", fontWeight: "600" }}>
                    {location}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setLocation("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} color="#1d9bf0" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Image preview */}
              {imageUrl.trim().length > 0 && (
                <View style={{ marginTop: 14, borderRadius: 18, overflow: "hidden" }}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={{
                      width: "100%",
                      height: 220,
                      backgroundColor: "#f0f3f4",
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setImageUrl("")}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      backgroundColor: "rgba(15,20,25,0.75)",
                      borderRadius: 16,
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={15} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* ── Add thread hint ── */}
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 4 }}>
            <View style={{ width: 44, alignItems: "center" }}>
              <UserAvatar uri={user?.avatarUrl} size={22} />
            </View>
            <TouchableOpacity>
              <Text style={{ fontSize: 15, color: "#aab8c2" }}>Add to thread</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Toolbar ── */}
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: "#e1e8ed",
          paddingHorizontal: 8,
          paddingVertical: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        {/* Image/media */}
        <ToolbarBtn
          icon={Image01Icon}
          onPress={openImageModal}
          active={imageUrl.trim().length > 0}
        />

        {/* GIF */}
        <ToolbarBtn
          icon={Gif01Icon}
          onPress={() => Alert.alert("GIF picker coming soon")}
        />

        {/* Poll */}
        <ToolbarBtn
          icon={BarChart01Icon}
          onPress={() => Alert.alert("Poll creator coming soon")}
        />

        {/* Emoji */}
        <ToolbarBtn
          icon={SmileIcon}
          onPress={() => Alert.alert("Emoji picker coming soon")}
        />

        {/* Schedule */}
        <ToolbarBtn
          icon={Calendar01Icon}
          onPress={() => Alert.alert("Schedule post coming soon")}
        />

        {/* Location */}
        <ToolbarBtn
          icon={Location01Icon}
          onPress={openLocationModal}
          active={location.trim().length > 0}
        />

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Vertical divider */}
        <View
          style={{
            width: 1,
            height: 24,
            backgroundColor: "#e1e8ed",
            marginHorizontal: 8,
          }}
        />

        {/* Character ring counter */}
        <CharacterRing count={content.length} max={MAX_CHARS} />

        {/* Add post (+) button */}
        <TouchableOpacity
          style={{
            marginLeft: 8,
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: content.length > 0 ? "#1d9bf0" : "#cfd9de",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              lineHeight: 20,
              color: content.length > 0 ? "#1d9bf0" : "#cfd9de",
              fontWeight: "300",
            }}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <ImageUrlModal
        visible={showImageModal}
        value={imageDraft}
        onChange={setImageDraft}
        onConfirm={confirmImage}
        onCancel={cancelImage}
      />
      <LocationModal
        visible={showLocationModal}
        value={locationDraft}
        onChange={setLocationDraft}
        onConfirm={confirmLocation}
        onCancel={cancelLocation}
      />
      <AudienceModal
        visible={showAudienceModal}
        current={audience}
        onSelect={(a) => { setAudience(a); setShowAudienceModal(false); }}
        onCancel={() => setShowAudienceModal(false)}
      />
    </KeyboardAvoidingView>
  );
}