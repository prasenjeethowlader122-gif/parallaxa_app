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
  UserPlus01Icon,
} from "@hugeicons/core-free-icons";
import { useGetUser, useGetUserPosts, useFollowUser, useUnfollowUser } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/EmptyState";
import { getApiBaseUrl } from "@/lib/apiUrl";

const { width } = Dimensions.get("window");
const ITEM = (width - 2) / 3;

export default function UserProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fixed: positional string arg (id as string)
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

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const Header = () => (
    <View>
      {/* Navbar */}
      <View
        className="flex-row justify-between items-center px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={colors.foreground}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
        <Text
          className="text-lg font-bold"
          style={{ color: colors.foreground }}
        >
          {profile?.username ?? ""}
        </Text>
        <TouchableOpacity className="p-1">
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color={colors.foreground}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="p-16 items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : profile ? (
        <View className="p-4">
          <View className="flex-row items-center mb-3.5">
            <UserAvatar uri={profile.avatarUrl ?? undefined} size={84} />
            <View className="flex-1 flex-row justify-around ml-3">
              {[
                { label: "Posts", value: profile.postsCount },
                { label: "Followers", value: profile.followersCount },
                { label: "Following", value: profile.followingCount },
              ].map(({ label, value }) => (
                <View key={label} className="items-center">
                  <Text
                    className="text-lg font-bold"
                    style={{ color: colors.foreground }}
                  >
                    {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
                  </Text>
                  <Text
                    className="text-[13px] mt-0.5"
                    style={{ color: colors.mutedForeground }}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="flex-row items-center gap-1.5 mb-1">
            <Text
              className="text-[15px] font-semibold"
              style={{ color: colors.foreground }}
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

          {profile.bio && (
            <Text
              className="text-sm leading-[19px] mb-1"
              style={{ color: colors.foreground }}
            >
              {profile.bio}
            </Text>
          )}
          {profile.website && (
            <Text
              className="text-sm font-medium mb-3"
              style={{ color: colors.primary }}
            >
              {profile.website}
            </Text>
          )}

          {!isOwnProfile && (
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 h-[34px] rounded-lg items-center justify-center border"
                style={{
                  backgroundColor: profile.isFollowing
                    ? colors.background
                    : colors.primary,
                  borderColor: profile.isFollowing
                    ? colors.border
                    : colors.primary,
                }}
                onPress={handleFollow}
                activeOpacity={0.8}
              >
                <Text
                  className="text-sm font-bold"
                  style={{
                    color: profile.isFollowing
                      ? colors.foreground
                      : "#FFFFFF",
                  }}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 h-[34px] border rounded-lg items-center justify-center"
                style={{ borderColor: colors.border }}
                onPress={async () => {
                  if (!id || !me?.id) return;
                  const baseUrl = getApiBaseUrl();
                  try {
                    const res = await fetch(`${baseUrl}/api/conversations/start`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        // Note: in production you should pass a real auth token
                        Authorization: `Bearer ${me.id}`,
                      },
                      body: JSON.stringify({ userId: id }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      router.push(`/messages/${data.id}` as any);
                    }
                  } catch (e) {
                    console.error("Failed to start conversation", e);
                  }
                }}
                activeOpacity={0.8}
              >
                <HugeiconsIcon
                  icon={Message01Icon}
                  size={16}
                  color={colors.foreground}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      {/* Grid header */}
      <View
        className="h-11 items-center justify-center"
        style={{
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
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
              margin: 0.5,
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
              <View className="w-full h-full items-center justify-center">
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
      />
    </View>
  );
}