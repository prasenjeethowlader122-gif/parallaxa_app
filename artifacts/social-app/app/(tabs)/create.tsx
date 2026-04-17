import { useRouter } from "expo-router";
import React, { useMemo, useState, FC } from "react";
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
import { useCreatePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Image01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import {
  useMentions,
  TriggersConfig,
  MentionSuggestionsProps,
} from "react-native-controlled-mentions";

const triggersConfig: TriggersConfig < "mention" | "hashtag" > = {
  mention: {
    trigger: "@",
    textStyle: {
      fontWeight: "700",
      color: "#2563eb",
    },
  },
  hashtag: {
    trigger: "#",
    allowedSpacesCount: 0,
    isInsertSpaceAfterMention: true,
    textStyle: {
      fontWeight: "700",
      color: "#7c3aed",
    },
  },
};

const mentionSuggestions = [
  { id: "1", name: "Prasenjeet Howlader" },
  { id: "2", name: "Rahim" },
  { id: "3", name: "Sadia" },
  { id: "4", name: "Nayeem" },
  { id: "5", name: "Ayesha" },
];

const MentionSuggestions: FC < MentionSuggestionsProps > = ({ keyword, onSuggestionPress }) => {
  if (keyword == null) return null;
  
  const filtered = mentionSuggestions.filter((u) =>
    u.name.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (filtered.length === 0) return null;
  
  return (
    <View
      style={{
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      {filtered.map((user) => (
        <Pressable
          key={user.id}
          onPress={() => onSuggestionPress(user)}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: pressed ? "#f3f4f6" : "#fff",
          })}
        >
          <Text style={{ fontSize: 15, color: "#111827" }}>{user.name}</Text>
        </Pressable>
      ))}
    </View>
  );
};

export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  
  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => {
        router.push("/(tabs)");
      },
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });
  
  const hashtags = useMemo(
    () => content.match(/#(\w+)/g)?.map((t) => t.replace("#", "").toLowerCase()) || [],
    [content]
  );
  
  const handlePost = () => {
    if (!content.trim() && !imageUrl.trim()) return;
    
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        location: location.trim() || undefined,
        hashtags,
      },
    });
  };
  
  const { textInputProps, triggers } = useMentions({
    value: content,
    onChange: setContent,
    triggersConfig,
  });
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 16, color: colors.foreground }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePost}
          disabled={isPending || (!content.trim() && !imageUrl.trim())}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: colors.primary,
            opacity: !content.trim() && !imageUrl.trim() ? 0.5 : 1,
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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ flexDirection: "row", padding: 16, gap: 12 }}>
          <UserAvatar uri={user?.avatarUrl} size={40} />

          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 15,
                paddingHorizontal: 8,
                paddingVertical: 2,
                alignSelf: "flex-start",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                Public
              </Text>
            </TouchableOpacity>

            <MentionSuggestions {...triggers.mention} />

            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 120,
                backgroundColor: colors.background,
              }}
            >
              <TextInput
                {...textInputProps}
                style={{
                  fontSize: 18,
                  color: colors.foreground,
                  textAlignVertical: "top",
                  minHeight: 120,
                }}
                placeholder="What's happening?"
                placeholderTextColor={colors.mutedForeground}
                multiline
                autoFocus
              />
            </View>

            {imageUrl.trim().length > 0 && (
              <View style={{ marginTop: 12, position: "relative" }}>
                <Image
                  source={{ uri: imageUrl }}
                  style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 16,
                    backgroundColor: colors.muted,
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setImageUrl("")}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 12,
                    padding: 4,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 10 }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
        }}
      >
        <TouchableOpacity onPress={() => {}}>
          <HugeiconsIcon icon={Image01Icon} size={22} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {}}>
          <HugeiconsIcon icon={Location01Icon} size={22} color={colors.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <Text
          style={{
            fontSize: 10,
            color: content.length > 2200 ? "red" : colors.mutedForeground,
          }}
        >
          {2200 - content.length}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}