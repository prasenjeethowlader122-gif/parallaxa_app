import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const options = [
    { icon: "user" as const, label: "Edit profile", onPress: () => router.push("/edit-profile" as any) },
    { icon: "bell" as const, label: "Notifications", onPress: () => {} },
    { icon: "lock" as const, label: "Privacy", onPress: () => {} },
    { icon: "shield" as const, label: "Security", onPress: () => {} },
    { icon: "help-circle" as const, label: "Help", onPress: () => {} },
    { icon: "info" as const, label: "About", onPress: () => {} },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        {options.map(({ icon, label, onPress }) => (
          <TouchableOpacity
            key={label}
            style={[styles.option, { borderBottomColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Feather name={icon} size={20} color={colors.foreground} />
            <Text style={[styles.optionLabel, { color: colors.foreground }]}>{label}</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.option, { borderBottomColor: colors.border }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={20} color={colors.destructive} />
          <Text style={[styles.optionLabel, { color: colors.destructive }]}>Log out</Text>
          <View style={{ width: 18 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: "700" },
  content: { marginTop: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  optionLabel: { flex: 1, fontSize: 16 },
});
