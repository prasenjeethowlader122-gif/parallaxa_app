import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Image,
  Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetUser, useGetUserPosts, useFollowUser, useUnfollowUser } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/EmptyState";

const { width } = Dimensions.get("window");
const ITEM = (width - 2) / 3;

export default function UserProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profileData, isLoading, refetch } = useGetUser({ userId: id });
  const { data: postsData, refetch: refetchPosts } = useGetUserPosts({ userId: id });
  const { mutate: followUser } = useFollowUser({ mutation: { onSuccess: () => refetch() } });
  const { mutate: unfollowUser } = useUnfollowUser({ mutation: { onSuccess: () => refetch() } });

  const profile = profileData as any;
  const posts = postsData?.posts ?? [];
  const isOwnProfile = me?.id === id;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPosts()]);
    setRefreshing(false);
  };

  const handleFollow = () => {
    if (profile?.isFollowing) unfollowUser({ userId: id });
    else followUser({ userId: id });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const Header = () => (
    <View>
      {/* Navbar */}
      <View style={[styles.navbar, { paddingTop: topPadding + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navUsername, { color: colors.foreground }]}>{profile?.username ?? ""}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Feather name="more-horizontal" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : profile ? (
        <View style={styles.profileInfo}>
          <View style={styles.avatarSection}>
            <UserAvatar uri={profile.avatarUrl} size={84} />
            <View style={styles.statsRow}>
              {[
                { label: "Posts", value: profile.postsCount },
                { label: "Followers", value: profile.followersCount },
                { label: "Following", value: profile.followingCount },
              ].map(({ label, value }) => (
                <View key={label} style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: colors.foreground }]}>{profile.displayName}</Text>
            {profile.isVerified && <Feather name="check-circle" size={15} color={colors.primary} />}
          </View>
          {profile.bio && <Text style={[styles.bio, { color: colors.foreground }]}>{profile.bio}</Text>}
          {profile.website && <Text style={[styles.website, { color: colors.primary }]}>{profile.website}</Text>}

          {!isOwnProfile && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  {
                    backgroundColor: profile.isFollowing ? colors.background : colors.primary,
                    borderColor: profile.isFollowing ? colors.border : colors.primary,
                    borderWidth: 1,
                  },
                ]}
                onPress={handleFollow}
                activeOpacity={0.8}
              >
                <Text style={[styles.followBtnText, { color: profile.isFollowing ? colors.foreground : "#FFFFFF" }]}>
                  {profile.isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.msgBtn, { borderColor: colors.border }]}
                onPress={async () => {
                  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
                  const res = await fetch(`${baseUrl}/api/conversations/start`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${me?.id}` },
                    body: JSON.stringify({ userId: id }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    router.push(`/messages/${data.id}` as any);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.msgBtnText, { color: colors.foreground }]}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      {/* Grid header */}
      <View style={[styles.gridHeader, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        <Feather name="grid" size={22} color={colors.foreground} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id}
        numColumns={3}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            onPress={() => router.push(`/post/${item.id}` as any)}
            activeOpacity={0.85}
            style={[styles.gridItem, { backgroundColor: colors.muted }]}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
            ) : (
              <View style={[styles.textPostPlaceholder, { backgroundColor: colors.muted }]}>
                <Feather name="type" size={16} color={colors.mutedForeground} />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon="camera" title="No posts yet" subtitle="This user hasn't posted yet" />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  navUsername: { fontSize: 18, fontWeight: "700" },
  moreBtn: { padding: 4 },
  loadingContainer: { padding: 60, alignItems: "center" },
  profileInfo: { padding: 16 },
  avatarSection: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around", marginLeft: 12 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 13, marginTop: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  displayName: { fontSize: 15, fontWeight: "600" },
  bio: { fontSize: 14, lineHeight: 19, marginBottom: 4 },
  website: { fontSize: 14, fontWeight: "500", marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 8 },
  followBtn: {
    flex: 1, height: 34, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },
  followBtnText: { fontSize: 14, fontWeight: "700" },
  msgBtn: {
    flex: 1, height: 34, borderWidth: 1, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },
  msgBtnText: { fontSize: 14, fontWeight: "600" },
  gridHeader: {
    height: 44, justifyContent: "center", alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  gridItem: { width: ITEM, height: ITEM, margin: 0.5 },
  gridImage: { width: "100%", height: "100%", resizeMode: "cover" },
  textPostPlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
});
