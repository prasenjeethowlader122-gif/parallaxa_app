import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Cancel01Icon,
  Tick02Icon,
  UserCircleIcon,
  FileEditIcon,
  Link01Icon,
  Camera01Icon,
  ImageUploadIcon,
} from "@hugeicons/core-free-icons";
import { useUpdateUser } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldConfig {
  key: "displayName" | "bio" | "website";
  label: string;
  icon: any; // hugeicons icon object (not JSX)
  placeholder: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  keyboardType?: "default" | "url" | "email-address";
  autoCorrect?: boolean;
}

// ─── Field config ─────────────────────────────────────────────────────────────

const FIELDS: FieldConfig[] = [
  {
    key: "displayName",
    label: "Display name",
    icon: UserCircleIcon,
    placeholder: "Your name",
    autoCapitalize: "words",
    autoCorrect: false,
  },
  {
    key: "bio",
    label: "Bio",
    icon: FileEditIcon,
    placeholder: "Tell the world about yourself…",
    multiline: true,
    autoCorrect: true,
  },
  {
    key: "website",
    label: "Website",
    icon: Link01Icon,
    placeholder: "https://yoursite.com",
    autoCapitalize: "none",
    keyboardType: "url",
    autoCorrect: false,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio]                 = useState(user?.bio ?? "");
  const [website, setWebsite]         = useState(user?.website ?? "");
  const [avatarUri, setAvatarUri]     = useState<string>(user?.avatarUrl ?? "");
  const [avatarChanged, setAvatarChanged] = useState(false);

  // Lookup maps so the field loop stays generic
  const valueMap: Record<FieldConfig["key"], string> = { displayName, bio, website };
  const setterMap: Record<FieldConfig["key"], (v: string) => void> = {
    displayName: setDisplayName,
    bio:         setBio,
    website:     setWebsite,
  };

  // ── Mutation ────────────────────────────────────────────────────────────────

  const { mutate: updateUserMutation, isPending } = useUpdateUser({
    mutation: {
      onSuccess: async (data) => {
        await updateUser(data as any);
        Alert.alert("Success", "Profile updated!");
        router.back();
      },
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Failed to update profile"),
    },
  });

  // ── Image helpers ───────────────────────────────────────────────────────────

  const applyAsset = (uri: string) => {
    setAvatarUri(uri);
    setAvatarChanged(true);
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Photo library access is needed to pick an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) applyAsset(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) applyAsset(result.assets[0].uri);
  };

  const showImageOptions = () =>
    Alert.alert("Change photo", "Choose an option", [
      { text: "Take photo",          onPress: takePhoto       },
      { text: "Choose from library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name is required");
      return;
    }
    updateUserMutation({
      userId: user?.id ?? "",
      data: {
        displayName: displayName.trim(),
        bio:         bio.trim()     || undefined,
        website:     website.trim() || undefined,
        // Only send avatarUrl when the user actually picked a new image.
        // The server auto-generates a text logo when avatarUrl is omitted
        // and displayName changed (see users.ts PUT /users/:userId).
        //
        // ⚠️  users.ts BUG FIX (line ~70):
        //   BEFORE: const { displayName, bio, avatarUrl, website } = req.body;
        //           if (displayName) { avatarUrl = … }   // ← error: const re-assignment
        //   AFTER:  const { displayName, bio, website } = req.body;
        //           let { avatarUrl } = req.body;
        //           if (displayName && !avatarUrl) { avatarUrl = … }
        avatarUrl: avatarChanged ? avatarUri : undefined,
      },
    });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ─── Header ─── */}
      <View
        className="flex-row items-center justify-between px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.75}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.muted }}
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={20}
            color={colors.foreground}
            strokeWidth={2}
          />
        </TouchableOpacity>

        <Text className="text-[17px] font-bold" style={{ color: colors.foreground }}>
          Edit profile
        </Text>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isPending}
          activeOpacity={0.8}
          className="flex-row items-center gap-1.5 px-4 py-2 rounded-full"
          style={{ backgroundColor: colors.primary }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <HugeiconsIcon icon={Tick02Icon} size={15} color="#fff" strokeWidth={2.5} />
              <Text className="text-sm font-bold text-white">Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Body ─── */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      >
        {/* ── Avatar ── */}
        <View className="items-center pt-8 pb-6">
          <TouchableOpacity
            onPress={showImageOptions}
            activeOpacity={0.8}
            className="relative"
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 88, height: 88, borderRadius: 44 }}
              />
            ) : (
              <UserAvatar uri={user?.avatarUrl} size={88} />
            )}

            {/* Camera badge */}
            <View
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center"
              style={{
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: colors.background,
              }}
            >
              <HugeiconsIcon icon={Camera01Icon} size={13} color="#fff" strokeWidth={2} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={showImageOptions} activeOpacity={0.7} className="mt-3">
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Change photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={{ height: 0.5, backgroundColor: colors.border }} />

        {/* ── Form fields ── */}
        {FIELDS.map(({ key, label, icon, placeholder, multiline, autoCapitalize, keyboardType, autoCorrect }) => (
          <View
            key={key}
            className="flex-row items-start px-4 py-4"
            style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
          >
            {/* Icon column */}
            <View className="w-8 pt-0.5 items-center">
              <HugeiconsIcon
                icon={icon}
                size={18}
                color={colors.mutedForeground}
                strokeWidth={1.5}
              />
            </View>

            {/* Label + input column */}
            <View className="flex-1 pl-2">
              <Text
                className="text-[11px] font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: colors.mutedForeground }}
              >
                {label}
              </Text>
              <TextInput
                value={valueMap[key]}
                onChangeText={setterMap[key]}
                placeholder={placeholder}
                placeholderTextColor={colors.mutedForeground}
                multiline={multiline}
                autoCapitalize={autoCapitalize ?? "none"}
                keyboardType={keyboardType ?? "default"}
                autoCorrect={autoCorrect ?? false}
                style={[
                  {
                    fontSize: 15,
                    color: colors.foreground,
                    padding: 0, // remove default Android inner padding
                  },
                  multiline && { minHeight: 72, textAlignVertical: "top" },
                ]}
              />
            </View>
          </View>
        ))}

        {/* ── Library shortcut card ── */}
        <TouchableOpacity
          onPress={pickFromLibrary}
          activeOpacity={0.75}
          className="flex-row items-center gap-3 mx-4 mt-6 p-4 rounded-2xl"
          style={{ backgroundColor: colors.muted }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.background }}
          >
            <HugeiconsIcon
              icon={ImageUploadIcon}
              size={20}
              color={colors.primary}
              strokeWidth={1.5}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
              Upload profile photo
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
              Pick an image from your library
            </Text>
          </View>
          <HugeiconsIcon
            icon={ImageUploadIcon}
            size={16}
            color={colors.mutedForeground}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}