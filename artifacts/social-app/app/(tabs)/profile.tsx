import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Image, Platform,
  RefreshControl, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetUserPosts } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/EmptyState";

const { width } = Dimensions.get("window");
const ITEM = (width - 2) / 3;

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

  const { data: postsData, isLoading, refetch } = useGetUserPosts(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const posts = postsData?.posts ?? [];

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
        <Text className="text-xl font-bold" style={{ color: colors.foreground }}>{user?.username}</Text>
        <View className="flex-row gap-1">
          <TouchableOpacity onPress={() => router.push("/settings" as any)} className="p-1">
            <Feather name="menu" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile info */}
      <View className="p-4">
        <View className="flex-row items-center mb-3">
          <UserAvatar uri={user?.avatarUrl} size={84} />
          <View className="flex-1 flex-row justify-around ml-3">
            {[
              { label: "Posts", value: user?.postsCount ?? 0 },
              { label: "Followers", value: user?.followersCount ?? 0 },
              { label: "Following", value: user?.followingCount ?? 0 },
            ].map(({ label, value }) => (
              <View key={label} className="items-center">
                <Text className="text-lg font-bold" style={{ color: colors.foreground }}>
                  {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
                </Text>
                <Text className="text-[13px] mt-0.5" style={{ color: colors.mutedForeground }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-[15px] font-semibold mb-1" style={{ color: colors.foreground }}>{user?.displayName}</Text>
        {user?.bio && <Text className="text-sm leading-[19px] mb-1" style={{ color: colors.foreground }}>{user.bio}</Text>}
        {user?.website && <Text className="text-sm font-medium mb-3 text-primary">{user.website}</Text>}

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 h-[34px] border rounded-lg items-center justify-center"
            style={{ borderColor: colors.border }}
            onPress={() => router.push("/edit-profile" as any)}
            activeOpacity={0.7}
          >
            <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[34px] h-[34px] border rounded-lg items-center justify-center"
            style={{ borderColor: colors.border }}
            activeOpacity={0.7}
          >
            <Feather name="user-plus" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[34px] h-[34px] border rounded-lg items-center justify-center"
            style={{ borderColor: colors.border }}
            onPress={() => logout()}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View
        className="flex-row"
        style={{ borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: colors.border }}
      >
        {["posts", "saved"].map((tab) => (
          <TouchableOpacity
            key={tab}
            className="flex-1 h-11 items-center justify-center relative"
            onPress={() => setActiveTab(tab as "posts" | "saved")}
          >
            <Feather
              name={tab === "posts" ? "grid" : "bookmark"}
              size={22}
              color={activeTab === tab ? colors.foreground : colors.mutedForeground}
            />
            {activeTab === tab && (
              <View className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: colors.foreground }} />
            )}
          </TouchableOpacity>
        ))}
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
            style={{ width: ITEM, height: ITEM, margin: 0.5, backgroundColor: colors.muted }}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Feather name="type" size={16} color={colors.mutedForeground} />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={
          isLoading ? (
            <View className="p-10 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <EmptyState
              icon="camera"
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
