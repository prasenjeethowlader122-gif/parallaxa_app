import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/Text";
import { useCreateStory } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, Image01Icon, Video01Icon } from "@hugeicons/core-free-icons";

export default function CreateStoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [duration, setDuration] = useState("5");

  const { mutate: createStory, isPending } = useCreateStory({
    mutation: {
      onSuccess: () => {
        router.back();
      },
      onError: (err: any) => {
        Alert.alert("Error", err?.message || "Failed to create story");
      },
    },
  });

  const handleCreate = () => {
    if (!mediaUrl.trim()) {
      Alert.alert("Error", "Media URL is required");
      return;
    }
    createStory({
      data: {
        mediaUrl: mediaUrl.trim(),
        mediaType,
        duration: parseInt(duration) || 5,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ paddingTop: insets.top, flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
            Create Story
          </Text>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={isPending || !mediaUrl.trim()}
            style={{
              backgroundColor: mediaUrl.trim() ? colors.primary : colors.muted,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>Share</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground, marginBottom: 8 }}>
            MEDIA URL
          </Text>
          <TextInput
            value={mediaUrl}
            onChangeText={setMediaUrl}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor={colors.mutedForeground}
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              color: colors.foreground,
              fontSize: 16,
              marginBottom: 20,
            }}
          />

          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground, marginBottom: 8 }}>
            MEDIA TYPE
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setMediaType("image")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 12,
                borderRadius: 12,
                backgroundColor: mediaType === "image" ? colors.primary + "20" : colors.card,
                borderWidth: 1,
                borderColor: mediaType === "image" ? colors.primary : colors.border,
              }}
            >
              <HugeiconsIcon icon={Image01Icon} size={20} color={mediaType === "image" ? colors.primary : colors.mutedForeground} />
              <Text style={{ color: mediaType === "image" ? colors.primary : colors.foreground, fontWeight: "600" }}>
                Image
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMediaType("video")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 12,
                borderRadius: 12,
                backgroundColor: mediaType === "video" ? colors.primary + "20" : colors.card,
                borderWidth: 1,
                borderColor: mediaType === "video" ? colors.primary : colors.border,
              }}
            >
              <HugeiconsIcon icon={Video01Icon} size={20} color={mediaType === "video" ? colors.primary : colors.mutedForeground} />
              <Text style={{ color: mediaType === "video" ? colors.primary : colors.foreground, fontWeight: "600" }}>
                Video
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground, marginBottom: 8 }}>
            DURATION (seconds)
          </Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              color: colors.foreground,
              fontSize: 16,
              marginBottom: 20,
            }}
          />

          {mediaUrl.trim().length > 0 && mediaType === "image" && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground, marginBottom: 8 }}>
                PREVIEW
              </Text>
              <Image
                source={{ uri: mediaUrl }}
                style={{ width: "100%", aspectRatio: 9 / 16, borderRadius: 12, backgroundColor: colors.muted }}
                resizeMode="cover"
              />
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
