import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Stack, useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Menu01Icon,
  Home01Icon,
  Search01Icon,
  Notification01Icon,
  Settings01Icon,
  Add01Icon,
  Cancel01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

const MENU_ITEMS = [
  { id: "index", label: "Home", icon: Home01Icon },
  { id: "explore", label: "Explore", icon: Search01Icon },
  { id: "notifications", label: "Notifications", icon: Notification01Icon },
  { id: "settings", label: "Settings", icon: Settings01Icon },
];

const BOTTOM_MENU_ITEMS = [
  { id: "create", label: "New Post", icon: Add01Icon },
];

export default function RootLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentRoute =
    pathname === "/" || pathname === "/(tabs)" ? "index" : pathname.split("/").pop();
  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  const isHome = pathname === "/" || pathname === "/(tabs)";

  const navigateTo = (id: string) => {
    setMenuOpen(false);
    const path = id === "index" ? "/" : `/${id}`;
    router.push(path as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── GLOBAL HEADER ── */}
      <View
        style={{
          paddingTop: topPadding,
          backgroundColor: colors.background,
          zIndex: 50,
          // শুধু non-home পেজে border দেখাবে; home-এ index.tsx নিজে ট্যাব দেখাবে
          borderBottomWidth: !isHome ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border,
        }}
      >
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {/* Hamburger */}
            <TouchableOpacity
              onPress={() => setMenuOpen((prev) => !prev)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <HugeiconsIcon
                icon={menuOpen ? Cancel01Icon : Menu01Icon}
                size={22}
                strokeWidth={2}
                color={colors.foreground}
              />
            </TouchableOpacity>

            {/* Logo */}
            <Image
              source={require("@/assets/images/placeholder-logo.svg")}
              style={{ width: 35, height: 35 }}
              resizeMode="contain"
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 18,
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore" as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <HugeiconsIcon
                icon={Search01Icon}
                size={22}
                strokeWidth={2}
                color={colors.foreground}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/messages" as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <HugeiconsIcon
                icon={Message01Icon}
                size={22}
                strokeWidth={2}
                color={colors.foreground}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push(`/profile/${user?.id}`)}>
              <UserAvatar uri={user?.avatarUrl} size={32} />
            </TouchableOpacity>
          </View>
        </View>
        {/* ট্যাব bar এখন index.tsx-এ থাকবে — layout থেকে সরানো হয়েছে */}
      </View>

      {/* ── CONTENT ── */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* ── SIDE DRAWER OVERLAY ── */}
      {menuOpen && (
        <>
          <Pressable
            onPress={() => setMenuOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              zIndex: 99,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 250,
              backgroundColor: colors.background,
              zIndex: 100,
              paddingTop: insets.top + 16,
              borderRightWidth: StyleSheet.hairlineWidth,
              borderRightColor: colors.border,
            }}
          >
            {/* Drawer header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingBottom: 20,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
                marginBottom: 8,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.foreground,
                  }}
                >
                  {user?.displayName ?? "Menu"}
                </Text>
                {user?.username ? (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.mutedForeground,
                      marginTop: 2,
                    }}
                  >
                    @{user.username}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={20}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1  }}
              className= 'h-full'
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Top menu items */}
              {MENU_ITEMS.map((item) => {
                const isActive = currentRoute === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigateTo(item.id)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      backgroundColor: isActive
                        ? (colors.primary ?? "#000") + "12"
                        : "transparent",
                      borderRadius: 12,
                      marginHorizontal: 8,
                      marginVertical: 2,
                    }}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={22}
                      color={
                        isActive
                          ? (colors.primary ?? colors.foreground)
                          : colors.foreground
                      }
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isActive ? "700" : "500",
                        color: isActive
                          ? (colors.primary ?? colors.foreground)
                          : colors.foreground,
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Divider */}
              <View
                style={{
                  height: 0.8,
                  backgroundColor: colors.border,
                  marginVertical: 16,
                  marginHorizontal: 20,
                }}
              />

              {/* Bottom action items */}
              {BOTTOM_MENU_ITEMS.map((item) => {
                const isActive = currentRoute === item.id;
                return (
                <View className = 'flex-row mx-4 my-4 items-center justify-between gap-4'>
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigateTo(item.id)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      backgroundColor: "#000",
                      borderRadius: 20,
                      
                    }}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={22}
                      color="#fff"
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isActive ? "700" : "500",
                        color: "#fff",
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                  onPress={() => router.push("/(tabs)/explore" as any)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
              <HugeiconsIcon
                icon={Settings01Icon}
                size={22}
                strokeWidth={2}
                color={colors.foreground}
              /></TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}