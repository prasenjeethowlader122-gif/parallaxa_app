import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  Platform,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Text } from "@/components/Text"
import { Stack, useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Menu01Icon,
  Home01Icon,
  Search01Icon,
  Notification01Icon,
  Settings01Icon,
  Add01Icon,
  Message01Icon,
  BookmarkIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

// ─── Nav items ────────────────────────────────────────────────────────────────
const MAIN_NAV = [
  { id: "index",         label: "Home",         icon: Home01Icon },
  { id: "explore",       label: "Explore",       icon: Search01Icon },
  { id: "notifications", label: "Notifications", icon: Notification01Icon },
  { id: "messages",      label: "Messages",      icon: Message01Icon },
];

const SECONDARY_NAV = [
  { id: "bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  { id: "settings",  label: "Settings",  icon: Settings01Icon },
];

const DRAWER_WIDTH = 300;

// Animation constants
const SPRING_CONFIG = { damping: 22, stiffness: 220, mass: 0.8 };
const CLOSE_TIMING  = { duration: 220, easing: Easing.out(Easing.cubic) };

const LARGE_SCREEN_BREAKPOINT = 1024;

export default function RootLayout() {
  const { width }   = useWindowDimensions();
  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;

  const colors      = useColors();
  const insets      = useSafeAreaInsets();
  const router      = useRouter();
  const pathname    = usePathname();
  const { user, logout, isLoading: authLoading } = useAuth();

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [drawerMounted, setDrawerMounted] = useState(false);

  const translateX  = useSharedValue(-DRAWER_WIDTH);
  const overlayAlpha = useSharedValue(0);

  const openDrawer = useCallback(() => {
    setDrawerMounted(true);
    translateX.value   = withSpring(0, SPRING_CONFIG);
    overlayAlpha.value = withTiming(1, { duration: 250 });
  }, []);

  const closeDrawer = useCallback(() => {
    translateX.value   = withTiming(-DRAWER_WIDTH, CLOSE_TIMING, (done) => {
      if (done) runOnJS(setDrawerMounted)(false);
    });
    overlayAlpha.value = withTiming(0, { duration: 200 });
  }, []);

  // Swipe-to-close gesture on the drawer panel
  const panGesture = Gesture.Pan()
    .activeOffsetX([-8, 999])           // only trigger on leftward drag
    .onUpdate((e) => {
      const next = Math.min(0, e.translationX);
      translateX.value = next;
      overlayAlpha.value = 1 + next / DRAWER_WIDTH; // fade as it slides away
    })
    .onEnd((e) => {
      if (e.translationX < -DRAWER_WIDTH * 0.35 || e.velocityX < -400) {
        // dismiss
        translateX.value   = withTiming(-DRAWER_WIDTH, CLOSE_TIMING, (done) => {
          if (done) runOnJS(setDrawerMounted)(false);
        });
        overlayAlpha.value = withTiming(0, { duration: 200 });
      } else {
        // snap back
        translateX.value   = withSpring(0, SPRING_CONFIG);
        overlayAlpha.value = withTiming(1, { duration: 180 });
      }
    });

  // Animated styles
  const drawerStyle  = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayAlpha.value,
  }));

  // ── Routing helpers ────────────────────────────────────────────────────────
  const currentRoute =
    pathname === "/" || pathname === "/(tabs)"
      ? "index"
      : pathname.split("/").pop();

  const isHome = pathname === "/" || pathname === "/(tabs)";
  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const navigateTo = (id: string) => {
    closeDrawer();
    setTimeout(() => {
      if (id === "index")    { router.push("/"); return; }
      if (id === "messages") { router.push("/messages" as any); return; }
      router.push(`/${id}` as any);
    }, 50); // let close animation start first
  };

  // ── Logo ──────────────────────────────────────────────────────────────────
  const XLogo = () => (
    <View style={{ width: 100, height: 35, justifyContent: "center", alignItems: "center" }}>
      <Image
        source={require("@/assets/images/text-logo.svg")}
        style={{  height: 45 , width: 100 }}
      />
    </View>
  );

  const Sidebar = () => (
    <View style={{ width: 275, paddingHorizontal: 12, paddingTop: topPadding, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "#e1e8ed" }}>
      <View style={{ paddingLeft: 12, marginBottom: 20 }}>
        <XLogo />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {MAIN_NAV.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigateTo(item.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 20,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 999,
              }}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={26}
                color="#0f1419"
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: isActive ? "800" : "500",
                  color: "#0f1419",
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {user && (
          <TouchableOpacity
            onPress={() => router.push("/profile" as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 999,
            }}
          >
            <UserAvatar uri={user.avatarUrl} size={26} />
            <Text style={{ fontSize: 20, fontWeight: currentRoute === "profile" ? "800" : "500", color: "#0f1419" }}>
              Profile
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigateTo("settings")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 999,
          }}
        >
          <HugeiconsIcon icon={Settings01Icon} size={26} color="#0f1419" strokeWidth={1.8} />
          <Text style={{ fontSize: 20, fontWeight: "500", color: "#0f1419" }}>
            Settings
          </Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity
            onPress={() => router.push("/create" as any)}
            style={{
              backgroundColor: "#1d9bf0",
              borderRadius: 999,
              paddingVertical: 14,
              marginTop: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff" }}>Post</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {user && (
        <TouchableOpacity
          onPress={logout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 12,
            marginBottom: 20,
            borderRadius: 999,
          }}
        >
          <UserAvatar uri={user.avatarUrl} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700", color: "#0f1419" }} numberOfLines={1}>
              {user.displayName}
            </Text>
            <Text style={{ color: "#536471" }} numberOfLines={1}>
              @{user.username}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, flexDirection: isLargeScreen ? "row" : "column", justifyContent: isLargeScreen ? "center" : "flex-start" }}>

        {isLargeScreen && <Sidebar />}

        <View style={{
          flex: 1,
          maxWidth: isLargeScreen ? 600 : undefined,
          borderRightWidth: isLargeScreen ? StyleSheet.hairlineWidth : 0,
          borderRightColor: "#e1e8ed",
          backgroundColor: "#fff"
        }}>
          {/* ── GLOBAL HEADER (Only on Mobile) ── */}
          {!isLargeScreen && (
            <View
              style={{
                paddingTop: topPadding,
                backgroundColor: "#fff",
                zIndex: 50,
                borderBottomWidth: !isHome ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: "#f2f2f2",
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                  <TouchableOpacity
                    onPress={openDrawer}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={2} color="#0f1419" />
                  </TouchableOpacity>
                  <XLogo />
                </View>

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
          )}

          {/* ── SCREEN CONTENT ── */}
          <Stack screenOptions={{ headerShown: false }} />

          {/* ── FAB: New Post (Only on Mobile) ── */}
          {user && !isLargeScreen && (
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
          )}
        </View>

        {isLargeScreen && (
          <View style={{ width: 350, paddingHorizontal: 20, paddingTop: topPadding }}>
             {/* Right Sidebar - can be used for search/trends later */}
             <View style={{ backgroundColor: "#f7f9f9", borderRadius: 16, padding: 16 }}>
               <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f1419", marginBottom: 12 }}>What's happening</Text>
               <Text style={{ color: "#536471" }}>Explore trends and more.</Text>
             </View>
          </View>
        )}
      </View>

      {/* ── DRAWER OVERLAY (animated fade) ── */}
      {drawerMounted && (
        <Animated.View
          style={[
            {
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              zIndex: 99,
            },
            overlayStyle,
          ]}
          pointerEvents={drawerMounted ? "auto" : "none"}
          onTouchEnd={closeDrawer}
        />
      )}

      {/* ── DRAWER PANEL (animated slide) ── */}
      {drawerMounted && (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: DRAWER_WIDTH,
                backgroundColor: "#fff",
                zIndex: 100,
                borderRightWidth: StyleSheet.hairlineWidth,
                borderRightColor: "#e1e8ed",
              },
              drawerStyle,
            ]}
          >
            {/* ── Drawer top bar ── */}
            <View
              style={{
                paddingTop: insets.top + 12,
                paddingHorizontal: 16,
                paddingBottom: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 15,
              }}
            >
              <TouchableOpacity
                onPress={closeDrawer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={22}
                  strokeWidth={2}
                  color="#0f1419"
                />
              </TouchableOpacity>
              <XLogo />
              <View style={{ width: 22 }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            >
              {/* ── Profile block ── */}
              {user ? (
                <TouchableOpacity
                  onPress={() => {
                    closeDrawer();
                    router.push(`/profile` as any);
                  }}
                  activeOpacity={0.8}
                  style={{ paddingHorizontal: 20, paddingVertical: 12 }}
                >
                  <UserAvatar uri={user.avatarUrl} size={52} />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: "#0f1419",
                      marginTop: 10,
                      letterSpacing: -0.3,
                    }}
                  >
                    {user.displayName}
                  </Text>
                  <Text style={{ fontSize: 14, color: "#536471", marginTop: 2 }}>
                    @{user.username}
                  </Text>

                  <View style={{ flexDirection: "row", gap: 18, marginTop: 12 }}>
                    <View style={{ flexDirection: "row", gap: 4, alignItems: "baseline" }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f1419" }}>
                        {user.followingCount}
                      </Text>
                      <Text style={{ fontSize: 13, color: "#536471" }}>Following</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 4, alignItems: "baseline" }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f1419" }}>
                        {user.followersCount}
                      </Text>
                      <Text style={{ fontSize: 13, color: "#536471" }}>Followers</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    closeDrawer();
                    router.push("/(auth)/login" as any);
                  }}
                  activeOpacity={0.8}
                  style={{ paddingHorizontal: 20, paddingVertical: 20 }}
                >
                  <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f1419" }}>
                    Welcome to Parallaxa
                  </Text>
                  <Text style={{ fontSize: 14, color: "#536471", marginTop: 4 }}>
                    Log in to follow others and join the conversation.
                  </Text>
                </TouchableOpacity>
              )}

              {/* Divider */}
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

              {/* Divider */}
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
              {user && (
                <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                  <TouchableOpacity
                    onPress={() => {
                      closeDrawer();
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
              )}

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
                      closeDrawer();
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
          </Animated.View>
        </GestureDetector>
      )}
    </GestureHandlerRootView>
  );
}