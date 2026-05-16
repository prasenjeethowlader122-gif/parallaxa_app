import React, { useState, useCallback, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/Text";
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
  Shield02Icon,
} from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useGetNotifications } from "@workspace/api-client-react";

// ─── Nav items ────────────────────────────────────────────────────────────────
const MAIN_NAV = [
  { id: "index",         label: "Home",          icon: Home01Icon,         requiresAuth: false },
  { id: "explore",       label: "Explore",        icon: Search01Icon,       requiresAuth: false },
  { id: "notifications", label: "Notifications",  icon: Notification01Icon, requiresAuth: true  },
  { id: "messages",      label: "Messages",       icon: Message01Icon,      requiresAuth: true  },
];

const SECONDARY_NAV = [
  { id: "bookmarks", label: "Bookmarks", icon: BookmarkIcon,  requiresAuth: true  },
  { id: "settings",  label: "Settings",  icon: Settings01Icon, requiresAuth: false },
];

const DRAWER_WIDTH = 300;
const SPRING_CONFIG = { damping: 22, stiffness: 220, mass: 0.8 };
const CLOSE_TIMING  = { duration: 220, easing: Easing.out(Easing.cubic) };
const LARGE_SCREEN_BREAKPOINT = 1024;

export default function RootLayout() {
  const { width }      = useWindowDimensions();
  const isLargeScreen  = width >= LARGE_SCREEN_BREAKPOINT;
  const colors         = useColors();
  const insets         = useSafeAreaInsets();
  const router         = useRouter();
  const pathname       = usePathname();
  const { user, logout } = useAuth();

  // ── Unread notification count ────────────────────────────────────────────
  const { data: notifData } = useGetNotifications();
  const unreadCount = useMemo(() => {
    if (!user || !notifData?.notifications) return 0;
    return (notifData.notifications as any[]).filter((n) => !n.isRead).length;
  }, [user, notifData]);

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [drawerMounted, setDrawerMounted] = useState(false);
  const translateX   = useSharedValue(-DRAWER_WIDTH);
  const overlayAlpha = useSharedValue(0);

  const openDrawer = useCallback(() => {
    setDrawerMounted(true);
    translateX.value   = withSpring(0, SPRING_CONFIG);
    overlayAlpha.value = withTiming(1, { duration: 250 });
  }, []);

  const closeDrawer = useCallback(() => {
    translateX.value = withTiming(-DRAWER_WIDTH, CLOSE_TIMING, (done) => {
      if (done) runOnJS(setDrawerMounted)(false);
    });
    overlayAlpha.value = withTiming(0, { duration: 200 });
  }, []);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-8, 999])
    .onUpdate((e) => {
      const next = Math.min(0, e.translationX);
      translateX.value   = next;
      overlayAlpha.value = 1 + next / DRAWER_WIDTH;
    })
    .onEnd((e) => {
      if (e.translationX < -DRAWER_WIDTH * 0.35 || e.velocityX < -400) {
        translateX.value = withTiming(-DRAWER_WIDTH, CLOSE_TIMING, (done) => {
          if (done) runOnJS(setDrawerMounted)(false);
        });
        overlayAlpha.value = withTiming(0, { duration: 200 });
      } else {
        translateX.value   = withSpring(0, SPRING_CONFIG);
        overlayAlpha.value = withTiming(1, { duration: 180 });
      }
    });

  const drawerStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayAlpha.value }));

  // ── Routing ──────────────────────────────────────────────────────────────
  const currentRoute =
    pathname === "/" || pathname === "/(tabs)" ? "index" : pathname.split("/").pop();
  const isHome = pathname === "/" || pathname === "/(tabs)";
  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

  const navigateTo = (id: string, requiresAuth = false) => {
    if (requiresAuth && !user) {
      closeDrawer();
      setTimeout(() => router.push("/(auth)/login" as any), 50);
      return;
    }
    closeDrawer();
    setTimeout(() => {
      if (id === "index")    { router.push("/"); return; }
      if (id === "messages") { router.push("/messages" as any); return; }
      router.push(`/${id}` as any);
    }, 50);
  };

  // ── Logo ─────────────────────────────────────────────────────────────────
  const XLogo = () => (
    <View style={{ height: 35, justifyContent: "center", alignItems: "flex-start" }}>
      <Image
        source={require("@/assets/images/text-logo-dark.svg")}
        style={{ height: 26, width: 148 }}
        contentFit="contain"
      />
    </View>
  );

  // ── Large-screen sidebar ─────────────────────────────────────────────────
  const Sidebar = () => (
    <View
      style={{
        width: 275,
        paddingHorizontal: 12,
        paddingTop: topPadding,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <View style={{ paddingLeft: 12, marginBottom: 20 }}>
        <XLogo />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {MAIN_NAV.map((item) => {
          const isActive = currentRoute === item.id;
          const isLocked = item.requiresAuth && !user;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigateTo(item.id, item.requiresAuth)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 20,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 999,
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              <View>
                <HugeiconsIcon
                  icon={item.icon}
                  size={26}
                  color={colors.foreground}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.id === "notifications" && unreadCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}>
                      {unreadCount > 99 ? "99+" : String(unreadCount)}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: isActive ? "800" : "500",
                  color: colors.foreground,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {user?.role === "admin" && (
          <TouchableOpacity
            onPress={() => navigateTo("admin")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 999,
            }}
          >
            <HugeiconsIcon icon={Shield02Icon} size={26} color={colors.foreground} strokeWidth={1.8} />
            <Text style={{ fontSize: 20, fontWeight: "500", color: colors.foreground }}>
              Admin Panel
            </Text>
          </TouchableOpacity>
        )}
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
            <Text
              style={{
                fontSize: 20,
                fontWeight: currentRoute === "profile" ? "800" : "500",
                color: colors.foreground,
              }}
            >
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
          <HugeiconsIcon icon={Settings01Icon} size={26} color={colors.foreground} strokeWidth={1.8} />
          <Text style={{ fontSize: 20, fontWeight: "500", color: colors.foreground }}>
            Settings
          </Text>
        </TouchableOpacity>
        {user && (
          <TouchableOpacity
            onPress={() => router.push("/create" as any)}
            style={{
              backgroundColor: colors.primary,
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
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            flexDirection: isLargeScreen ? "row" : "column",
            justifyContent: isLargeScreen ? "center" : "flex-start",
          }}
        >
          {isLargeScreen && <Sidebar />}

          <View
            style={{
              flex: 1,
              maxWidth: isLargeScreen ? 600 : undefined,
              borderRightWidth: isLargeScreen ? StyleSheet.hairlineWidth : 0,
              borderRightColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            {/* ── GLOBAL HEADER (Mobile only) ── */}
            {!isLargeScreen && (
              <View
                style={{
                  paddingTop: topPadding,
                  backgroundColor: colors.background,
                  zIndex: 50,
                  borderBottomWidth: !isHome ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                    <TouchableOpacity
                      onPress={openDrawer}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <HugeiconsIcon
                        icon={Menu01Icon}
                        size={22}
                        strokeWidth={2}
                        color={colors.foreground}
                      />
                    </TouchableOpacity>
                    <XLogo />
                  </View>

                  <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
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

                    {/* Notification icon with badge */}
                    <TouchableOpacity
                      onPress={() => {
                        if (!user) { router.push("/(auth)/login"); return; }
                        router.push("/(tabs)/notifications" as any);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <View>
                        <HugeiconsIcon
                          icon={Notification01Icon}
                          size={22}
                          strokeWidth={2}
                          color={colors.foreground}
                        />
                        {unreadCount > 0 && (
                          <View
                            style={{
                              position: "absolute",
                              top: -4,
                              right: -4,
                              backgroundColor: colors.primary,
                              borderRadius: 8,
                              minWidth: 16,
                              height: 16,
                              alignItems: "center",
                              justifyContent: "center",
                              paddingHorizontal: 3,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>
                              {unreadCount > 99 ? "99+" : String(unreadCount)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (!user) { router.push("/(auth)/login"); return; }
                        router.push("/messages" as any);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <HugeiconsIcon
                        icon={Message01Icon}
                        size={22}
                        strokeWidth={2}
                        color={colors.foreground}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ── SCREEN CONTENT ── */}
            <Stack screenOptions={{ headerShown: false }} />

            {/* ── FAB: New Post (Mobile) ── */}
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
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  elevation: 6,
                  shadowColor: colors.primary,
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

          {/* ── Right sidebar (large screen) ── */}
          {isLargeScreen && (
            <View
              style={{
                width: 350,
                paddingHorizontal: 20,
                paddingTop: topPadding,
                backgroundColor: colors.background,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: colors.foreground,
                    marginBottom: 12,
                  }}
                >
                  What's happening
                </Text>
                <Text style={{ color: colors.mutedForeground }}>
                  Explore trends and more.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── DRAWER OVERLAY ── */}
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

        {/* ── DRAWER PANEL ── */}
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
                  backgroundColor: colors.background,
                  zIndex: 100,
                  borderRightWidth: StyleSheet.hairlineWidth,
                  borderRightColor: colors.border,
                },
                drawerStyle,
              ]}
            >
              {/* Drawer top bar */}
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
                    color={colors.foreground}
                  />
                </TouchableOpacity>
                <XLogo />
                <View style={{ width: 22 }} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              >
                {/* Profile block */}
                {user ? (
                  <TouchableOpacity
                    onPress={() => {
                      closeDrawer();
                      router.push("/profile" as any);
                    }}
                    activeOpacity={0.8}
                    style={{ paddingHorizontal: 20, paddingVertical: 12 }}
                  >
                    <UserAvatar uri={user.avatarUrl} size={52} />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "800",
                        color: colors.foreground,
                        marginTop: 10,
                        letterSpacing: -0.3,
                      }}
                    >
                      {user.displayName}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                      @{user.username}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 18, marginTop: 12 }}>
                      <View style={{ flexDirection: "row", gap: 4, alignItems: "baseline" }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                          {user.followingCount}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Following</Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 4, alignItems: "baseline" }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                          {user.followersCount}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Followers</Text>
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
                    <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
                      Welcome to Parallaxa
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 4 }}>
                      Log in to follow others and join the conversation.
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: colors.border,
                    marginVertical: 6,
                    marginHorizontal: 20,
                  }}
                />

                {/* Main nav */}
                {MAIN_NAV.map((item) => {
                  const isActive = currentRoute === item.id;
                  const isLocked = item.requiresAuth && !user;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => navigateTo(item.id, item.requiresAuth)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 16,
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        opacity: isLocked ? 0.45 : 1,
                      }}
                    >
                      <View>
                        <HugeiconsIcon
                          icon={item.icon}
                          size={24}
                          color={isActive ? colors.primary : colors.foreground}
                          strokeWidth={isActive ? 2.5 : 1.8}
                        />
                        {item.id === "notifications" && unreadCount > 0 && (
                          <View
                            style={{
                              position: "absolute",
                              top: -4,
                              right: -4,
                              backgroundColor: colors.primary,
                              borderRadius: 8,
                              minWidth: 16,
                              height: 16,
                              alignItems: "center",
                              justifyContent: "center",
                              paddingHorizontal: 3,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>
                              {unreadCount > 99 ? "99+" : String(unreadCount)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 19,
                          fontWeight: isActive ? "800" : "500",
                          color: isActive ? colors.primary : colors.foreground,
                          letterSpacing: -0.2,
                          flex: 1,
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
                    backgroundColor: colors.border,
                    marginVertical: 10,
                    marginHorizontal: 20,
                  }}
                />

                {/* Admin Panel */}
                {user?.role === "admin" && (
                  <TouchableOpacity
                    onPress={() => { closeDrawer(); router.push("/admin" as any); }}
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
                      icon={Shield02Icon}
                      size={24}
                      color={colors.mutedForeground}
                      strokeWidth={1.8}
                    />
                    <Text
                      style={{
                        fontSize: 19,
                        fontWeight: "500",
                        color: colors.mutedForeground,
                        letterSpacing: -0.2,
                      }}
                    >
                      Admin Panel
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Secondary nav */}
                {SECONDARY_NAV.map((item) => {
                  const isActive = currentRoute === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => navigateTo(item.id, item.requiresAuth)}
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
                        color={isActive ? colors.primary : colors.mutedForeground}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: isActive ? "700" : "400",
                          color: isActive ? colors.primary : colors.mutedForeground,
                        }}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* New Post CTA */}
                {user && (
                  <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                    <TouchableOpacity
                      onPress={() => { closeDrawer(); router.push("/create" as any); }}
                      style={{
                        backgroundColor: colors.primary,
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

                {/* Log out */}
                {user && (
                  <>
                    <View
                      style={{
                        height: StyleSheet.hairlineWidth,
                        backgroundColor: colors.border,
                        marginTop: 20,
                        marginHorizontal: 20,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => { closeDrawer(); logout(); }}
                      style={{ paddingHorizontal: 20, paddingVertical: 16 }}
                    >
                      <Text style={{ fontSize: 15, color: colors.destructive, fontWeight: "500" }}>
                        Log out
                      </Text>
                      {user.username ? (
                        <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}>
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
    </>
  );
}
