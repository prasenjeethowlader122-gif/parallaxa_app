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
  UserIcon,
  Settings01Icon,
  Add01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const TABS = [
  { id: "index", label: "For You" },
  { id: "explore", label: "Following" },
  { id: "trending", label: "Trending" },
];

const MENU_ITEMS = [
  { id: "index",        label: "Home",          icon: Home01Icon },
  { id: "explore",      label: "Explore",       icon: Search01Icon },
  { id: "notifications",label: "Notifications", icon: Notification01Icon },
  { id: "profile",      label: "Profile",       icon: UserIcon },
  { id: "create",       label: "New Post",      icon: Add01Icon },
  { id: "settings",     label: "Settings",      icon: Settings01Icon },
];

export default function RootLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentRoute = pathname === "/" ? "index" : pathname.replace("/", "");
  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const navigateTo = (id: string) => {
    setMenuOpen(false);
    const path = id === "index" ? "/(tabs)" : `/(tabs)/${id}`;
    router.push(path as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── GLOBAL HEADER ── */}
      <View
        style={{
          paddingTop: topPadding,
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          zIndex: 50,
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
          {/* Hamburger */}
          <TouchableOpacity
            onPress={() => setMenuOpen((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HugeiconsIcon
              icon={menuOpen ? Cancel01Icon : Menu01Icon}
              size={22}
              color={colors.foreground}
            />
          </TouchableOpacity>

          {/* Logo */}
          <Image
            source={require("@/assets/images/parallaxa-logo.svg")}
            style={{ width: 36, height: 36 }}
            resizeMode="contain"
          />

          {/* Notifications shortcut */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/notifications" as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HugeiconsIcon
              icon={Notification01Icon}
              size={22}
              color={colors.foreground}
            />
          </TouchableOpacity>
        </View>

        {/* Tab slider */}
        <View style={{ flexDirection: "row", paddingHorizontal: 8 }}>
          {TABS.map((tab) => {
            const isActive = currentRoute === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => navigateTo(tab.id)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.foreground,
                    opacity: isActive ? 1 : 0.4,
                  }}
                >
                  {tab.label}
                </Text>
                {isActive && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      height: 3,
                      width: 28,
                      borderRadius: 2,
                      backgroundColor: colors.primary ?? "#000",
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── CONTENT ── */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* ── SIDE DRAWER OVERLAY ── */}
      {menuOpen && (
        <>
          {/* Scrim */}
          <Pressable
            onPress={() => setMenuOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              zIndex: 99,
            }}
          />

          {/* Drawer panel */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 280,
              backgroundColor: colors.background,
              zIndex: 100,
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
              borderRightWidth: StyleSheet.hairlineWidth,
              borderRightColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 4, height: 0 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 12,
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

            {/* Menu items */}
            <ScrollView showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}