import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  MoreHorizontalIcon,
  GridIcon,
  AiIcon,
  Message01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import {
  useGetUser,
  useGetUserPosts,
  useFollowUser,
  useUnfollowUser,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/EmptyState";
import { getApiBaseUrl } from "@/lib/apiUrl";

const { width } = Dimensions.get("window");
const GRID_GAP = 1.5;
const ITEM = (width - GRID_GAP * 2) / 3;

export default function UserProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading, refetch } = useGetUser(id!);
  const { data: postsData, refetch: refetchPosts } = useGetUserPosts(id!);

  const { mutate: followUser } = useFollowUser({
    mutation: { onSuccess: () => refetch() },
  });
  const { mutate: unfollowUser } = useUnfollowUser({
    mutation: { onSuccess: () => refetch() },
  });

  const posts = postsData?.posts ?? [];
  const isOwnProfile = me?.id === id;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPosts()]);
    setRefreshing(false);
  };

  const handleFollow = () => {
    if (!id) return;
    if (profile?.isFollowing) unfollowUser({ userId: id });
    else followUser({ userId: id });
  };

  // web-এ layout-এর header height account করতে হয়
  const headerTopPadding = Platform.OS === "web" ? 16 : 12;

  const Header = () => (
    <View style={{ backgroundColor: colors.background }}>
      {/* ── Navbar ── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: headerTopPadding,
          paddingBottom: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={colors.foreground}
            strokeWidth={1.5}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {profile?.username ?? ""}
        </Text>

        <TouchableOpacity style={{ padding: 4 }}>
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color={colors.foreground}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>

      {/* ── Profile info ── */}
      {isLoading ? (
        <View style={{ paddingVertical: 64, alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : profile ? (
        <View style={{ padding: 16 }}>
          {/* Avatar + stats */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <UserAvatar uri={profile.avatarUrl ?? undefined} size={84} />
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "space-around",
                marginLeft: 12,
              }}
            >
              {[
                { label: "Posts", value: profile.postsCount },
                { label: "Followers", value: profile.followersCount },
                { label: "Following", value: profile.followingCount },
              ].map(({ label, value }) => (
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
                      fontSize: 12,
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

          {/* Name + verified */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              {profile.displayName}
            </Text>
            {profile.isVerified && (
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={15}
                color={colors.primary}
                strokeWidth={1.5}
              />
            )}
          </View>

          {/* Bio */}
          {profile.bio ? (
            <Text
              style={{
                fontSize: 14,
                lineHeight: 20,
                color: colors.foreground,
                marginBottom: 4,
              }}
            >
              {profile.bio}
            </Text>
          ) : null}

          {/* Website */}
          {profile.website ? (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: colors.primary,
                marginBottom: 12,
              }}
            >
              {profile.website}
            </Text>
          ) : null}

          {/* Action buttons */}
          {!isOwnProfile && (
            <View
              style={{ flexDirection: "row", gap: 8, marginTop: 4 }}
            >
              {/* Follow / Following button */}
              <TouchableOpacity
                onPress={handleFollow}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  backgroundColor: profile.isFollowing
                    ? colors.background
                    : colors.primary,
                  borderColor: profile.isFollowing
                    ? colors.border
                    : colors.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: profile.isFollowing ? colors.foreground : "#FFFFFF",
                  }}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>

              {/* Message button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={async () => {
                  if (!id || !me?.id) return;
                  const baseUrl = getApiBaseUrl();
                  try {
                    const res = await fetch(
                      `${baseUrl}/api/conversations/start`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${me.id}`,
                        },
                        body: JSON.stringify({ userId: id }),
                      }
                    );
                    if (res.ok) {
                      const data = await res.json();
                      router.push(`/messages/${data.id}` as any);
                    }
                  } catch (e) {
                    console.error("Failed to start conversation", e);
                  }
                }}
              >
                <HugeiconsIcon
                  icon={Message01Icon}
                  size={18}
                  color={colors.foreground}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      {/* ── Grid tab indicator ── */}
      <View
        style={{
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          borderTopWidth: 0.5,
          borderBottomWidth: 0.5,
          borderColor: colors.border,
        }}
      >
        <HugeiconsIcon
          icon={GridIcon}
          size={22}
          color={colors.foreground}
          strokeWidth={1.5}
        />
      </View>
    </View>
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
            style={{
              width: ITEM,
              height: ITEM,
              margin: GRID_GAP / 2,
              backgroundColor: colors.muted,
            }}
          >
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HugeiconsIcon
                  icon={AiIcon}
                  size={16}
                  color={colors.mutedForeground}
                  strokeWidth={1.5}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={GridIcon}
              title="No posts yet"
              subtitle="This user hasn't posted yet"
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  );
}