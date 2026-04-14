import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator,
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
      onError: (err: any) => {
        Alert.alert("Error", err?.message ?? "Failed to update profile");
      },
    },
  });

  const handleSave = () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name is required");
      return;
    }
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Feather name="x" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Edit profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="check" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <UserAvatar uri={avatarUrl || user?.avatarUrl} size={80} />
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change photo</Text>
        </View>

        {[
          { label: "Name", value: displayName, setter: setDisplayName, multiline: false },
          { label: "Bio", value: bio, setter: setBio, multiline: true },
          { label: "Website", value: website, setter: setWebsite, multiline: false },
          { label: "Avatar URL", value: avatarUrl, setter: setAvatarUrl, multiline: false },
        ].map(({ label, value, setter, multiline }) => (
          <View key={label} style={[styles.field, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground }, multiline && { minHeight: 70, textAlignVertical: "top" }]}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: "700" },
  content: { padding: 20 },
  avatarSection: { alignItems: "center", marginBottom: 28 },
  changePhotoText: { fontSize: 14, fontWeight: "600", marginTop: 10 },
  field: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { fontSize: 16 },
});
