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
  Animated,
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
  UserIcon,
  BookmarkIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

// ─── Nav items ────────────────────────────────────────────────────────────────
const MAIN_NAV = [
  { id: "index",         label: "Home",          icon: Home01Icon },
  { id: "explore",       label: "Explore",        icon: Search01Icon },
  { id: "notifications", label: "Notifications",  icon: Notification01Icon },
  { id: "messages",      label: "Messages",       icon: Message01Icon },
];

const SECONDARY_NAV = [
  { id: "bookmarks",     label: "Bookmarks",      icon: BookmarkIcon },
  { id: "settings",      label: "Settings",       icon: Settings01Icon },
];

// ─── Drawer width ─────────────────────────────────────────────────────────────
const DRAWER_WIDTH = 300;

export default function RootLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentRoute =
    pathname === "/" || pathname === "/(tabs)"
      ? "index"
      : pathname.split("/").pop();

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  const isHome = pathname === "/" || pathname === "/(tabs)";

  const navigateTo = (id: string) => {
    setMenuOpen(false);
    if (id === "index") { router.push("/"); return; }
    if (id === "messages") { router.push("/messages" as any); return; }
    router.push(`/${id}` as any);
  };

  // ── X logo SVG placeholder (uses the Image asset if available) ──
  const XLogo = () => (
    <View style={{ width: 28, height: 28, justifyContent: "center", alignItems: "center" }}>
      <Image source={require('@/assets/images/st.svg')} style={{ width: 40, height: 40 }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ── GLOBAL HEADER ── */}
      <View
        style={{
          paddingTop: topPadding,
          backgroundColor: "#fff",
          zIndex: 50,
          borderBottomWidth: !isHome ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: "#e1e8ed",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingBottom: 10,
          }}
        >
          {/* Left: avatar (opens drawer) */}
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={2} color="#0f1419" />

          </TouchableOpacity>

          {/* Centre: X logo */}
          <XLogo />

          {/* Right: icons */}
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore" as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <HugeiconsIcon icon={Search01Icon} size={22} strokeWidth={2} color="#0f1419" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/messages" as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <HugeiconsIcon icon={Message01Icon} size={22} strokeWidth={2} color="#0f1419" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── CONTENT ── */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* ── FAB: New Post ── */}
      <TouchableOpacity
        onPress={() => router.push("/create" as any)}
        style={{
          position: "absolute",
          bottom: insets.bottom + 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#1d9bf0",
          justifyContent: "center",
          alignItems: "center",
          elevation: 6,
          shadowColor: "#1d9bf0",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          zIndex: 40,
        }}
      >
        <HugeiconsIcon icon={Add01Icon} size={24} color="#fff" strokeWidth={2} />
      </TouchableOpacity>

      {/* ── DRAWER OVERLAY ── */}
      {menuOpen && (
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 99,
          }}
        />
      )}

      {/* ── DRAWER PANEL ── */}
      {menuOpen && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            backgroundColor: "#fff",
            zIndex: 100,
            borderRightWidth: StyleSheet.hairlineWidth,
            borderRightColor: "#e1e8ed",
          }}
        >
          {/* ── Drawer top bar ── */}
          <View
            style={{
              paddingTop: insets.top + 12,
              paddingHorizontal: 16,
              paddingBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Close (arrow back) */}
            <TouchableOpacity
              onPress={() => setMenuOpen(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={22}
                strokeWidth={2}
                color="#0f1419"
              />
            </TouchableOpacity>

            {/* X logo centred */}
            <XLogo />

            {/* Spacer to keep logo centred */}
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            {/* ── Profile block ── */}
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                router.push(`/profile/${user?.id}` as any);
              }}
              activeOpacity={0.8}
              style={{ paddingHorizontal: 20, paddingVertical: 12 }}
            >
              <UserAvatar uri={user?.avatarUrl} size={52} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#0f1419",
                  marginTop: 10,
                  letterSpacing: -0.3,
                }}
              >
                {user?.displayName ?? "You"}
              </Text>
              {user?.username ? (
                <Text style={{ fontSize: 14, color: "#536471", marginTop: 2 }}>
                  @{user.username}
                </Text>
              ) : null}

              {/* Followers / Following row */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 18,
                  marginTop: 12,
                }}
              >
                <View style={{ flexDirection: "row", gap: 4, alignItems: "baseline" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f1419" }}>
                    {user?.followingCount ?? 0}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#536471" }}>Following</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 4, alignItems: "baseline" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f1419" }}>
                    {user?.followersCount ?? 0}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#536471" }}>Followers</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Thin divider */}
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: "#e1e8ed",
                marginVertical: 6,
                marginHorizontal: 20,
              }}
            />

            {/* ── Main nav ── */}
            {MAIN_NAV.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigateTo(item.id)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                  }}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    size={24}
                    color="#0f1419"
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <Text
                    style={{
                      fontSize: 19,
                      fontWeight: isActive ? "800" : "500",
                      color: "#0f1419",
                      letterSpacing: -0.2,
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Thin divider */}
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: "#e1e8ed",
                marginVertical: 10,
                marginHorizontal: 20,
              }}
            />

            {/* ── Secondary nav ── */}
            {SECONDARY_NAV.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigateTo(item.id)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                  }}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    size={22}
                    color="#536471"
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: isActive ? "700" : "400",
                      color: "#536471",
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* ── New Post CTA ── */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/create" as any);
                }}
                style={{
                  backgroundColor: "#1d9bf0",
                  borderRadius: 28,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <HugeiconsIcon icon={Add01Icon} size={18} color="#fff" strokeWidth={2.5} />
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                  New Post
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Log out ── */}
            {logout && (
              <>
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: "#e1e8ed",
                    marginTop: 20,
                    marginHorizontal: 20,
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  style={{ paddingHorizontal: 20, paddingVertical: 16 }}
                >
                  <Text style={{ fontSize: 15, color: "#e0245e", fontWeight: "500" }}>
                    Log out
                  </Text>
                  {user?.username ? (
                    <Text style={{ fontSize: 13, color: "#aab8c2", marginTop: 2 }}>
                      @{user.username}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}