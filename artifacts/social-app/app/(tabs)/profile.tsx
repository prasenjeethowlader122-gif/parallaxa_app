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

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

  // Fixed: positional args — userId string first, then optional params
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

  const posts = postsData?.posts ?? [];

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
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
            {user?.username}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/settings" as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HugeiconsIcon icon={Menu01Icon} size={24} color={colors.foreground} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Profile info */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <UserAvatar uri={user?.avatarUrl} size={84} />
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around", marginLeft: 12 }}>
              {[
                { label: "Posts",     value: user?.postsCount ?? 0 },
                { label: "Followers", value: user?.followersCount ?? 0 },
                { label: "Following", value: user?.followingCount ?? 0 },
              ].map(({ label, value }) => (
                <View key={label} style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                    {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
                  </Text>
                  <Text style={{ fontSize: 13, marginTop: 2, color: colors.mutedForeground }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={{ fontSize: 15, fontWeight: "600", marginBottom: 4, color: colors.foreground }}>
            {user?.displayName}
          </Text>
          {user?.bio ? (
            <Text style={{ fontSize: 14, lineHeight: 19, marginBottom: 4, color: colors.foreground }}>
              {user.bio}
            </Text>
          ) : null}
          {user?.website ? (
            <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 12, color: colors.primary }}>
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
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                Edit profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 34, height: 34,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <HugeiconsIcon icon={UserPlus01Icon} size={16} color={colors.foreground} strokeWidth={1.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 34, height: 34,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => logout()}
              activeOpacity={0.7}
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} color={colors.destructive} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid / Saved tabs */}
        <View
          style={{
            flexDirection: "row",
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          }}
        >
          {(["posts", "saved"]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={{
                flex: 1, height: 44,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
              onPress={() => setActiveTab(tab)}
            >
              <HugeiconsIcon
                icon={tab === "posts" ? Grid01Icon : Bookmark02Icon}
                size={22}
                color={activeTab === tab ? colors.foreground : colors.mutedForeground}
                strokeWidth={1.5}
              />
              {activeTab === tab && (
                <View
                  style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: 2,
                    backgroundColor: colors.foreground,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [user, activeTab, colors]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id}
        numColumns={3}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            onPress={() => router.push(`/post/${item.id}` as any)}
            activeOpacity={0.85}
            style={{ width: ITEM, height: ITEM, margin: 0.5, backgroundColor: colors.muted }}
          >
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <HugeiconsIcon icon={AiTypeIcon} size={16} color={colors.mutedForeground} strokeWidth={1.5} />
              </View>
            )}
          </TouchableOpacity>
        )}
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
      />
    </View>
  );
}