import { useRouter } from "expo-router";
import React, { useMemo, useState, FC, useCallback, useRef, useEffect } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/Text"
import { useCreatePost, useSearch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Image01Icon,
  Location01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
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
    <View
      style={{
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#e1e8ed",
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#fff",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }}
    >
      {isLoading ? (
        <View style={{ padding: 12, alignItems: 'center' }}>
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
            })}
          >
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: "#14171a" }}>{user.displayName}</Text>
              <Text style={{ fontSize: 13, color: "#657786" }}>@{user.username}</Text>
            </View>
          </Pressable>
        ))
      )}
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
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <Pressable
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
      }}
      onPress={onCancel}
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: 18,
          padding: 20,
          gap: 14,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#14171a" }}>
          Add image URL
        </Text>
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
            borderWidth: 1,
            borderColor: "#e1e8ed",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontSize: 15,
            color: "#14171a",
          }}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#e1e8ed",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, color: "#657786" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={!value.trim()}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 10,
              backgroundColor: value.trim() ? "#1d9bf0" : "#aab8c2",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
              Add
            </Text>
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
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <Pressable
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
      }}
      onPress={onCancel}
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: 18,
          padding: 20,
          gap: 14,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#14171a" }}>
          Add location
        </Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Dhaka, Bangladesh"
          placeholderTextColor="#aab8c2"
          returnKeyType="done"
          onSubmitEditing={onConfirm}
          style={{
            borderWidth: 1,
            borderColor: "#e1e8ed",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontSize: 15,
            color: "#14171a",
          }}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#e1e8ed",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, color: "#657786" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={!value.trim()}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 10,
              backgroundColor: value.trim() ? "#1d9bf0" : "#aab8c2",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageDraft, setImageDraft] = useState("");
  const [location, setLocation] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [mentionKeyword, setMentionKeyword] = useState<string | null>(null);
  const [validMentions, setValidMentions] = useState<Set<string>>(new Set());
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)");
        }
      },
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });

  const hashtags = useMemo(
    () =>
      content.match(/#\w+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [],
    [content],
  );

  const canPost =
    !isPending && (content.trim().length > 0 || imageUrl.trim().length > 0);

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

  // Detect @mention as the user types
  const handleTextChange = useCallback((text: string) => {
    setContent(text);
    const match = text.match(/@(\w*)$/i);
    setMentionKeyword(match ? match[1] : null);
  }, []);

  // Insert the selected mention into the text
  const handleSuggestionSelect = useCallback(
    (suggestionUser: { id: string; username: string }) => {
      setValidMentions(prev => new Set(prev).add(suggestionUser.username.toLowerCase()));
      setContent((prev) => {
        const before = prev.replace(/@\w*$/i, "");
        return `${before}@${suggestionUser.username} `;
      });
      setMentionKeyword(null);
    },
    [],
  );

  const renderContentWithHighlights = (text: string) => {
    const parts = text.split(/((?:@|#)\w+|(?:https?:\/\/[^\s]+))/g);
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <Text key={index} style={{ color: colors.primary }}>
            {part}
          </Text>
        );
      }
      if (part.startsWith("@")) {
        const username = part.slice(1).toLowerCase();
        const isValid = validMentions.has(username);
        return (
          <Text key={index} style={{ color: isValid ? colors.primary : colors.foreground }}>
            {part}
          </Text>
        );
      }
      if (part.startsWith("http")) {
        return (
          <Text key={index} style={{ color: colors.primary }}>
            {part}
          </Text>
        );
      }
      return <Text key={index} style={{ color: colors.foreground }}>{part}</Text>;
    });
  };

  // Image modal handlers
  const openImageModal = () => {
    setImageDraft(imageUrl);
    setShowImageModal(true);
  };
  const confirmImage = () => {
    setImageUrl(imageDraft.trim());
    setShowImageModal(false);
  };
  const cancelImage = () => {
    setImageDraft("");
    setShowImageModal(false);
  };

  // Location modal handlers
  const openLocationModal = () => {
    setLocationDraft(location);
    setShowLocationModal(true);
  };
  const confirmLocation = () => {
    setLocation(locationDraft.trim());
    setShowLocationModal(false);
  };
  const cancelLocation = () => {
    setLocationDraft("");
    setShowLocationModal(false);
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
          paddingTop: topPadding,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
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

        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          style={{
            backgroundColor: canPost ? "#0f1419" : "#aab8c2",
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
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

      {/* ── Body ── */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Avatar column */}
            <View style={{ alignItems: "center" }}>
              <UserAvatar uri={user?.avatarUrl} size={42} />
              {/* Thread line */}
              <View
                style={{
                  width: 2,
                  flex: 1,
                  marginTop: 6,
                  borderRadius: 1,
                  backgroundColor: "#e1e8ed",
                  minHeight: 24,
                }}
              />
            </View>

            {/* Content column */}
            <View style={{ flex: 1, paddingBottom: 16 }}>
              {/* Display name */}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#14171a",
                  marginBottom: 2,
                }}
              >
                {user?.displayName || "You"}
              </Text>

              {/* Audience badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderWidth: 1,
                  borderColor: "#b8d7f1",
                  borderRadius: 20,
                  backgroundColor: "#e8f5fd",
                  alignSelf: "flex-start",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{ color: "#1d9bf0", fontSize: 11, fontWeight: "500" }}
                >
                  Everyone can reply
                </Text>
              </View>

              {/* Mention suggestions */}
              <MentionSuggestions
                keyword={mentionKeyword}
                onSelect={handleSuggestionSelect}
              />

              {/* Text input wrapper for highlighting */}
              <View style={{ position: "relative", minHeight: 120 }}>
                <Text
                  style={{
                    fontSize: 18,
                    lineHeight: 26,
                    color: "transparent",
                    textAlignVertical: "top",
                    padding: 0,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                  }}
                  pointerEvents="none"
                >
                  {renderContentWithHighlights(content)}
                  {content.endsWith("\n") ? " " : ""}
                </Text>
                <TextInput
                  value={content}
                  onChangeText={handleTextChange}
                  style={{
                    fontSize: 18,
                    lineHeight: 26,
                    color: content ? "transparent" : "#14171a",
                    textAlignVertical: "top",
                    maxHeight: 400,
                    padding: 0,
                    backgroundColor: "transparent",
                    zIndex: 1,
                  }}
                  placeholder="What is happening?!"
                  placeholderTextColor="#aab8c2"
                  multiline
                  maxLength={280}
                  autoFocus
                />
              </View>

              {/* Location tag (shown inline when set) */}
              {location.trim().length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 4,
                    alignSelf: "flex-start",
                    backgroundColor: "#e8f5fd",
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={13}
                    color="#1d9bf0"
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#1d9bf0",
                      fontWeight: "500",
                    }}
                  >
                    {location}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setLocation("")}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={12}
                      color="#1d9bf0"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Image preview (shown when URL is set) */}
              {imageUrl.trim().length > 0 && (
                <View style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={{
                      width: "100%",
                      aspectRatio: 16 / 9,
                      backgroundColor: colors.muted,
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setImageUrl("")}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: 15,
                      width: 30,
                      height: 30,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={16}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Link preview placeholder */}
              {!imageUrl.trim() && content.match(/https?:\/\/[^\s]+/) && (
                <View
                  style={{
                    marginTop: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: colors.card
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' }}>
                    <HugeiconsIcon icon={Image01Icon} size={20} color={colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>
                      {content.match(/https?:\/\/([^\/\s]+)/)?.[1] || "Link Preview"}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={1}>
                      {content.match(/(https?:\/\/[^\s]+)/)?.[0]}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Toolbar ── */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#f2f2f2",
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: "#fff",
        }}
      >
        {/* Image URL button */}
        <TouchableOpacity
          onPress={openImageModal}
          style={{ padding: 8 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <HugeiconsIcon
            icon={Image01Icon}
            size={22}
            color={imageUrl ? "#1d9bf0" : "#657786"}
          />
        </TouchableOpacity>

        {/* Location button */}
        <TouchableOpacity
          onPress={openLocationModal}
          style={{ padding: 8 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <HugeiconsIcon
            icon={Location01Icon}
            size={22}
            color={location ? "#1d9bf0" : "#657786"}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* Character counter circle */}
        <View style={{ width: 30, height: 30, justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: content.length > 280 ? "#e0245e" : "#e1e8ed",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
             <Text style={{ fontSize: 10, color: content.length > 270 ? "#e0245e" : "#657786" }}>
              {280 - content.length <= 20 ? 280 - content.length : ""}
             </Text>
          </View>
        </View>
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
    </KeyboardAvoidingView>
  );
}