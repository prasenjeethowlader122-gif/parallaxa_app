import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUpdateUser } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");

  const { mutate: updateUserMutation, isPending } = useUpdateUser({
    mutation: {
      onSuccess: async (data) => {
        await updateUser(data as any);
        Alert.alert("Success", "Profile updated!");
        router.back();
      },
      onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed to update profile"),
    },
  });

  const handleSave = () => {
    if (!displayName.trim()) { Alert.alert("Error", "Display name is required"); return; }
    updateUserMutation({
      userId: user?.id ?? "",
      data: {
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      },
    });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const fields = [
    { label: "Name", value: displayName, setter: setDisplayName, multiline: false },
    { label: "Bio", value: bio, setter: setBio, multiline: true },
    { label: "Website", value: website, setter: setWebsite, multiline: false },
    { label: "Avatar URL", value: avatarUrl, setter: setAvatarUrl, multiline: false },
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        className="flex-row justify-between items-center px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Feather name="x" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold" style={{ color: colors.foreground }}>Edit profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="check" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="items-center mb-7">
          <UserAvatar uri={avatarUrl || user?.avatarUrl} size={80} />
          <Text className="text-sm font-semibold mt-2.5 text-primary">Change photo</Text>
        </View>

        {fields.map(({ label, value, setter, multiline }) => (
          <View
            key={label}
            className="py-3.5 mb-1"
            style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
          >
            <Text
              className="text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: colors.mutedForeground }}
            >
              {label}
            </Text>
            <TextInput
              className="text-base"
              style={[
                { color: colors.foreground },
                multiline ? { minHeight: 70, textAlignVertical: "top" } : {},
              ]}
              value={value}
              onChangeText={setter}
              multiline={multiline}
              autoCapitalize={label === "Name" ? "words" : "none"}
              autoCorrect={multiline}
            />
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
