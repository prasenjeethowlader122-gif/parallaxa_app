import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState, FC, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  Modal,
  Animated,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/Text";
import { useCreatePost, useSearch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Image01Icon,
  Location01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  Globe02Icon,
  SmileIcon,
  BarChart02Icon,
  CalendarCheckOut01Icon,
  Gif01Icon,
} from "@hugeicons/core-free-icons";

// ─── Mention suggestion dropdown ─────────────────────────────────────────────
const MentionSuggestions: FC<{
  keyword: string | null;
  onSelect: (user: { id: string; username: string }) => void;
}> = ({ keyword, onSelect }) => {
  if (!keyword || keyword.trim() === "") return null;

  const { data: searchResults, isLoading } = useSearch(
    { q: keyword, type: "users" },
    { query: { enabled: keyword.length >= 1 } as any }
  );

  const users = searchResults?.users ?? [];
  if (users.length === 0 && !isLoading) return null;

  return (
    <View style={styles.mentionBox}>
      {isLoading ? (
        <View style={{ padding: 12, alignItems: "center" }}>
          <ActivityIndicator size="small" color="#1d9bf0" />
        </View>
      ) : (
        users.slice(0, 5).map((user: any, index: number) => (
          <Pressable
            key={user.id}
            onPress={() => onSelect(user)}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 11,
              backgroundColor: pressed ? "#f7f9fa" : "#fff",
              borderBottomWidth: index < Math.min(users.length, 5) - 1 ? 0.5 : 0,
              borderBottomColor: "#f2f2f2",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            })}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: "#e8f5fd",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1d9bf0" }}>
                {user.displayName?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#14171a" }}>
                {user.displayName}
              </Text>
              <Text style={{ fontSize: 12, color: "#657786" }}>@{user.username}</Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
};

// ─── Location input modal ─────────────────────────────────────────────────────
const LocationModal: FC<{
  visible: boolean;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ visible, value, onChange, onConfirm, onCancel }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
    <Pressable style={styles.modalOverlay} onPress={onCancel}>
      <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Add Location</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="e.g. Dhaka, Bangladesh"
          placeholderTextColor="#aab8c2"
          returnKeyType="done"
          onSubmitEditing={onConfirm}
          style={styles.modalInput}
          autoFocus
        />
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          <TouchableOpacity onPress={onCancel} style={styles.modalBtnSecondary}>
            <Text style={{ fontSize: 15, color: "#657786", fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={!value.trim()}
            style={[styles.modalBtnPrimary, { opacity: value.trim() ? 1 : 0.5 }]}
          >
            <Text style={{ fontSize: 15, color: "#fff", fontWeight: "700" }}>Add</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Audience selector ────────────────────────────────────────────────────────
const AudienceChip = () => (
  <View style={styles.audienceChip}>
    <HugeiconsIcon icon={Globe02Icon} size={11} color="#1d9bf0" />
    <Text style={{ color: "#1d9bf0", fontSize: 11, fontWeight: "600" }}>Everyone</Text>
  </View>
);

// ─── Character ring ───────────────────────────────────────────────────────────
const CharRing: FC<{ count: number; limit: number }> = ({ count, limit }) => {
  const remaining = limit - count;
  const pct = count / limit;
  const size = 26;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * pct;

  if (count === 0) return null;

  return (
    <View style={{ width: size, height: size, position: "relative", justifyContent: "center", alignItems: "center" }}>
      {/* Background ring */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: "#e1e8ed",
        }}
      />
      {/* Progress ring (approximate with color only) */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: remaining <= 20 ? (remaining <= 0 ? "#e0245e" : "#f5a623") : "#1d9bf0",
          opacity: pct,
        }}
      />
      {remaining <= 20 && (
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: remaining <= 0 ? "#e0245e" : "#536471",
          }}
        >
          {remaining}
        </Text>
      )}
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { imageUrl: initialImageUrl } = useLocalSearchParams<{ imageUrl?: string }>();

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState(initialImageUrl || "");
  const [location, setLocation] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [mentionKeyword, setMentionKeyword] = useState<string | null>(null);
  const [validMentions, setValidMentions] = useState<Set<string>>(new Set());
  const [showLocationModal, setShowLocationModal] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const CHAR_LIMIT = 280;

  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)");
      },
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  const hashtags = useMemo(
    () => content.match(/#\w+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [],
    [content]
  );

  const canPost = !isPending && (content.trim().length > 0 || imageUri.trim().length > 0) && content.length <= CHAR_LIMIT;

  const handlePost = () => {
    if (!canPost) return;
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUri.trim() || undefined,
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

  const handleSuggestionSelect = useCallback(
    (suggestionUser: { id: string; username: string }) => {
      setValidMentions((prev) => new Set(prev).add(suggestionUser.username.toLowerCase()));
      setContent((prev) => {
        const before = prev.replace(/@\w*$/i, "");
        return `${before}@${suggestionUser.username} `;
      });
      setMentionKeyword(null);
    },
    []
  );

  const renderHighlighted = (text: string) =>
    text.split(/((?:@|#)\w+|https?:\/\/[^\s]+)/g).map((part, i) => {
      if (part.startsWith("#") || part.startsWith("@") || part.startsWith("http")) {
        return (
          <Text key={i} style={{ color: "#1d9bf0" }}>
            {part}
          </Text>
        );
      }
      return (
        <Text key={i} style={{ color: colors.foreground }}>
          {part}
        </Text>
      );
    });

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const openLocationModal = () => {
    setLocationDraft(location);
    setShowLocationModal(true);
  };
  const confirmLocation = () => {
    setLocation(locationDraft.trim());
    setShowLocationModal(false);
  };
  const cancelLocation = () => {
    setShowLocationModal(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerCloseBtn}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} color={colors.foreground} strokeWidth={2} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          style={[
            styles.postBtn,
            { backgroundColor: canPost ? "#0f1419" : "#ccd6dd" },
          ]}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Left: avatar + thread line */}
            <View style={{ alignItems: "center" }}>
              <UserAvatar uri={user?.avatarUrl} size={44} />
              {(content.length > 0 || imageUri.length > 0) && (
                <View style={styles.threadLine} />
              )}
            </View>

            {/* Right: content */}
            <View style={{ flex: 1, paddingBottom: 16 }}>
              {/* Username & audience */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Text style={styles.displayName}>
                  {user?.displayName || "You"}
                </Text>
                <AudienceChip />
              </View>

              {/* Mention suggestions */}
              <MentionSuggestions keyword={mentionKeyword} onSelect={handleSuggestionSelect} />

              {/* Text input with highlight overlay */}
              <Pressable onPress={() => inputRef.current?.focus()} style={{ minHeight: 80 }}>
                <Text
                  style={[styles.highlightOverlay, { color: colors.foreground }]}
                  pointerEvents="none"
                >
                  {content ? renderHighlighted(content) : (
                    <Text style={{ color: "#aab8c2", fontSize: 18 }}>What is happening?!</Text>
                  )}
                  {content.endsWith("\n") ? " " : ""}
                </Text>
                <TextInput
                  ref={inputRef}
                  value={content}
                  onChangeText={handleTextChange}
                  style={[styles.textInput, { color: "transparent" }]}
                  multiline
                  maxLength={CHAR_LIMIT + 20}
                  autoFocus
                  textAlignVertical="top"
                />
              </Pressable>

              {/* Location tag */}
              {location.trim().length > 0 && (
                <View style={styles.locationTag}>
                  <HugeiconsIcon icon={Location01Icon} size={13} color="#1d9bf0" />
                  <Text style={styles.locationText}>{location}</Text>
                  <TouchableOpacity
                    onPress={() => setLocation("")}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} color="#1d9bf0" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Image preview */}
              {imageUri.trim().length > 0 && (
                <View style={styles.imagePreviewWrap}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    contentFit="cover"
                    transition={200}
                  />
                  {/* Remove button */}
                  <TouchableOpacity
                    onPress={() => setImageUri("")}
                    style={styles.imageRemoveBtn}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} color="#fff" strokeWidth={2.5} />
                  </TouchableOpacity>
                  {/* Edit / replace button */}
                  <TouchableOpacity onPress={pickImage} style={styles.imageEditBtn}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Toolbar ── */}
      <View
        style={[
          styles.toolbar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
          },
        ]}
      >
        {/* Left actions */}
        <View style={styles.toolbarLeft}>
          <TouchableOpacity onPress={pickImage} style={styles.toolbarBtn} hitSlop={8}>
            <HugeiconsIcon
              icon={Image01Icon}
              size={22}
              strokeWidth={1.8}
              color="#1d9bf0"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}} style={styles.toolbarBtn} hitSlop={8}>
            <HugeiconsIcon icon={Gif01Icon} size={22} strokeWidth={1.8} color="#1d9bf0" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}} style={styles.toolbarBtn} hitSlop={8}>
            <HugeiconsIcon icon={BarChart02Icon} size={22} strokeWidth={1.8} color="#1d9bf0" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}} style={styles.toolbarBtn} hitSlop={8}>
            <HugeiconsIcon icon={SmileIcon} size={22} strokeWidth={1.8} color="#1d9bf0" />
          </TouchableOpacity>

          <TouchableOpacity onPress={openLocationModal} style={styles.toolbarBtn} hitSlop={8}>
            <HugeiconsIcon
              icon={Location01Icon}
              size={22}
              strokeWidth={1.8}
              color={location ? "#1d9bf0" : "#1d9bf0"}
            />
            {location && <View style={styles.toolbarDot} />}
          </TouchableOpacity>
        </View>

        {/* Divider + char counter */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 1, height: 22, backgroundColor: "#e1e8ed" }} />
          <CharRing count={content.length} limit={CHAR_LIMIT} />
          <TouchableOpacity
            style={[styles.replyBtn, { borderColor: "#e1e8ed" }]}
            disabled
          >
            <HugeiconsIcon icon={CalendarCheckOut01Icon} size={16} strokeWidth={2} color="#1d9bf0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Location Modal ── */}
      <LocationModal
        visible={showLocationModal}
        value={locationDraft}
        onChange={setLocationDraft}
        onConfirm={confirmLocation}
        onCancel={cancelLocation}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  postBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#14171a",
    letterSpacing: -0.2,
  },
  audienceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#b8d7f1",
    borderRadius: 20,
    backgroundColor: "#e8f5fd",
  },
  mentionBox: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  threadLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
    borderRadius: 1,
    backgroundColor: "#e1e8ed",
    minHeight: 20,
  },
  highlightOverlay: {
    fontSize: 18,
    lineHeight: 26,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  textInput: {
    fontSize: 18,
    lineHeight: 26,
    minHeight: 80,
    maxHeight: 400,
    padding: 0,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  locationTag: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "#e8f5fd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  locationText: {
    fontSize: 13,
    color: "#1d9bf0",
    fontWeight: "600",
  },
  imagePreviewWrap: {
    marginTop: 14,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  imageRemoveBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageEditBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  toolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toolbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  toolbarBtn: {
    padding: 8,
    borderRadius: 20,
    position: "relative",
  },
  toolbarDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1d9bf0",
  },
  replyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingTop: 16,
    gap: 16,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e1e8ed",
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#14171a",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#14171a",
    backgroundColor: "#f9f9f9",
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    alignItems: "center",
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#1d9bf0",
    alignItems: "center",
  },
});
