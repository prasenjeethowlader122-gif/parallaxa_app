import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Image, Platform,
  RefreshControl, StyleSheet, Text, TouchableOpacity, View,
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
      <View style={[styles.navbar, { paddingTop: topPadding + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[styles.navUsername, { color: colors.foreground }]}>{user?.username}</Text>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => router.push("/settings" as any)} style={styles.navBtn}>
            <Feather name="menu" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile info */}
      <View style={styles.profileInfo}>
        <View style={styles.avatarSection}>
          <UserAvatar uri={user?.avatarUrl} size={84} />
          <View style={styles.statsRow}>
            {[
              { label: "Posts", value: user?.postsCount ?? 0 },
              { label: "Followers", value: user?.followersCount ?? 0 },
              { label: "Following", value: user?.followingCount ?? 0 },
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

        <Text style={[styles.displayName, { color: colors.foreground }]}>{user?.displayName}</Text>
        {user?.bio && <Text style={[styles.bio, { color: colors.foreground }]}>{user.bio}</Text>}
        {user?.website && (
          <Text style={[styles.website, { color: colors.primary }]}>{user.website}</Text>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/edit-profile" as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.editBtnText, { color: colors.foreground }]}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Feather name="user-plus" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: colors.border }]}
            onPress={() => logout()}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        {["posts", "saved"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(tab as "posts" | "saved")}
          >
            <Feather
              name={tab === "posts" ? "grid" : "bookmark"}
              size={22}
              color={activeTab === tab ? colors.foreground : colors.mutedForeground}
            />
            {activeTab === tab && (
              <View style={[styles.tabIndicator, { backgroundColor: colors.foreground }]} />
            )}
          </TouchableOpacity>
        ))}
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
              <View style={styles.gridTextPost}>
                <Feather name="type" size={16} color={colors.mutedForeground} />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navUsername: { fontSize: 20, fontWeight: "700" },
  navRight: { flexDirection: "row", gap: 4 },
  navBtn: { padding: 4 },
  profileInfo: { padding: 16 },
  avatarSection: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around", marginLeft: 12 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 13, marginTop: 2 },
  displayName: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  bio: { fontSize: 14, lineHeight: 19, marginBottom: 4 },
  website: { fontSize: 14, fontWeight: "500", marginBottom: 12 },
  actionButtons: { flexDirection: "row", gap: 8 },
  editBtn: {
    flex: 1, height: 34, borderWidth: 1, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },
  editBtnText: { fontSize: 14, fontWeight: "600" },
  shareBtn: {
    width: 34, height: 34, borderWidth: 1, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, height: 44, justifyContent: "center", alignItems: "center", position: "relative" },
  tabIndicator: { position: "absolute", top: 0, left: 0, right: 0, height: 1 },
  gridItem: { width: ITEM, height: ITEM, margin: 0.5 },
  gridImage: { width: "100%", height: "100%", resizeMode: "cover" },
  gridTextPost: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  loadingContainer: { padding: 40, alignItems: "center" },
});
