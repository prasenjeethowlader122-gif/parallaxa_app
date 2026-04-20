import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useGetUserPosts } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/EmptyState";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Menu01Icon,
  Grid01Icon,
  Bookmark02Icon,
  UserPlus01Icon,
  Logout01Icon,
  AiTypeIcon,
  Camera01Icon,
} from "@hugeicons/core-free-icons";

const { width } = Dimensions.get("window");
const ITEM = (width - 2) / 3;

type ActiveTab = "posts" | "replies" | "media" | "likes" | "saved";
const TABS = ["posts", "replies", "media", "likes", "saved"] as const;

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("posts");

  const { data: postsData, isLoading, refetch } = useGetUserPosts(
    user?.id ?? "",
    undefined,
    { query: { enabled: !!user?.id } }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Defensive: handle PostPage shape, plain array, or nested data envelope
  const posts = useMemo(() => {
    if (!postsData) return [];
    const raw =
      (postsData as any)?.posts ??
      (postsData as any)?.data?.posts ??
      postsData;
    const allPosts = Array.isArray(raw) ? raw : [];

    if (activeTab === "posts") return allPosts;
    if (activeTab === "replies") return allPosts.filter((p: any) => !!p.parentPostId);
    if (activeTab === "media") return allPosts.filter((p: any) => !!p.imageUrl || !!p.videoUrl);
    if (activeTab === "likes") return []; // Not supported yet
    if (activeTab === "saved") return []; // TODO: fetch saved posts if needed

    return allPosts;
  }, [postsData, activeTab]);

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Navbar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.foreground,
            }}
          >
            {user?.username}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/settings" as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HugeiconsIcon
              icon={Menu01Icon}
              size={24}
              color={colors.foreground}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        </View>

        {/* Profile info */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <UserAvatar uri={user?.avatarUrl} size={84} />
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "space-around",
                marginLeft: 12,
              }}
            >
              {(
                [
                  { label: "Posts", value: user?.postsCount ?? 0 },
                  { label: "Followers", value: user?.followersCount ?? 0 },
                  { label: "Following", value: user?.followingCount ?? 0 },
                ] as const
              ).map(({ label, value }) => (
                <View key={label} style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: colors.foreground,
                    }}
                  >
                    {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      marginTop: 2,
                      color: colors.mutedForeground,
                    }}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              marginBottom: 4,
              color: colors.foreground,
            }}
          >
            {user?.displayName}
          </Text>
          {user?.bio ? (
            <Text
              style={{
                fontSize: 14,
                lineHeight: 19,
                marginBottom: 4,
                color: colors.foreground,
              }}
            >
              {user.bio}
            </Text>
          ) : null}
          {user?.website ? (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 12,
                color: colors.primary,
              }}
            >
              {user.website}
            </Text>
          ) : null}

          {/* Action row */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                height: 34,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => router.push("/edit-profile" as any)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                Edit profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 34,
                height: 34,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <HugeiconsIcon
                icon={UserPlus01Icon}
                size={16}
                color={colors.foreground}
                strokeWidth={1.5}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 34,
                height: 34,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => logout()}
              activeOpacity={0.7}
            >
              <HugeiconsIcon
                icon={Logout01Icon}
                size={16}
                color={colors.destructive}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid / Saved tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={{
                width: width / 4,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: activeTab === tab ? "700" : "500",
                  color: activeTab === tab ? colors.foreground : colors.mutedForeground,
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "15%",
                    right: "15%",
                    height: 2,
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ),
    [user, activeTab, colors]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        // Always pass a guaranteed array to FlatList
        data={Array.isArray(posts) ? posts : []}
        keyExtractor={(item: any) => String(item?.id ?? Math.random())}
        numColumns={3}
        renderItem={({ item }: { item: any }) => {
          // Guard against null/undefined items
          if (!item) return null;
          return (
            <TouchableOpacity
              onPress={() =>
                item?.id && router.push(`/post/${item.id}` as any)
              }
              activeOpacity={0.85}
              style={{
                width: ITEM,
                height: ITEM,
                margin: 0.5,
                backgroundColor: colors.muted,
              }}
            >
              {item?.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HugeiconsIcon
                    icon={AiTypeIcon}
                    size={16}
                    color={colors.mutedForeground}
                    strokeWidth={1.5}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <EmptyState
              icon={Camera01Icon}
              title="No posts yet"
              subtitle="Share your first photo"
              actionLabel="Create post"
              onAction={() => router.push("/(tabs)/create" as any)}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
      />
    </View>
  );
}