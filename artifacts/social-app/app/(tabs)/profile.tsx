import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { useGetUserPosts } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/EmptyState";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Menu01Icon,
  UserPlus01Icon,
  Logout01Icon,
  Grid01Icon,
  Bookmark02Icon,
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

  const { data: postsData, isLoading, refetch } = useGetUserPosts(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id }
  );

  const posts = postsData?.posts ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        onPress={() => router.push(`/post/${item.id}` as any)}
        activeOpacity={0.85}
        style={[styles.gridItem, { backgroundColor: colors.muted }]}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.gridPlaceholder}>
            <HugeiconsIcon icon={AiTypeIcon} size={20} color={colors.mutedForeground} />
          </View>
        )}
      </TouchableOpacity>
    ),
    [colors.muted, colors.mutedForeground, router]
  );

  const ListHeader = useMemo(
    () => (
      <View>
        <View
          style={[
            styles.navbar,
            { borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.username, { color: colors.foreground }]}>
            {user?.username ?? "Profile"}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/settings" as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HugeiconsIcon icon={Menu01Icon} size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
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
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={[styles.displayName, { color: colors.foreground }]}>
            {user?.displayName ?? user?.username}
          </Text>

          {user?.bio ? (
            <Text style={[styles.bio, { color: colors.foreground }]}>
              {user.bio}
            </Text>
          ) : null}

          {user?.website ? (
            <Text style={[styles.website, { color: colors.primary }]}>
              {user.website}
            </Text>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.editButton,
                { borderColor: colors.border },
              ]}
              onPress={() => router.push("/edit-profile" as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.editButtonText, { color: colors.foreground }]}>
                Edit profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                { borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <HugeiconsIcon icon={UserPlus01Icon} size={18} color={colors.foreground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                { borderColor: colors.border },
              ]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.tabsRow, { borderColor: colors.border }]}>
          {(["posts", "saved"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
            >
              <HugeiconsIcon
                icon={tab === "posts" ? Grid01Icon : Bookmark02Icon}
                size={22}
                color={activeTab === tab ? colors.foreground : colors.mutedForeground}
              />
              {activeTab === tab ? (
                <View style={[styles.tabIndicator, { backgroundColor: colors.foreground }]} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [activeTab, colors, handleLogout, router, user]
  );

  const Empty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return activeTab === "posts" ? (
      <EmptyState
        icon={Camera01Icon}
        title="No posts yet"
        subtitle="Share your first photo"
        actionLabel="Create post"
        onAction={() => router.push("/(tabs)/create" as any)}
      />
    ) : (
      <EmptyState
        icon={Bookmark02Icon}
        title="No saved posts"
        subtitle="Saved items will appear here"
      />
    );
  }, [activeTab, colors.primary, isLoading, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={activeTab === "posts" ? posts : []}
        keyExtractor={keyExtractor}
        numColumns={3}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={Empty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={9}
        windowSize={7}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
  },
  profileSection: {
    padding: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 4,
  },
  website: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    flex: 1,
    height: 34,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  tabsRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  gridItem: {
    width: ITEM,
    height: ITEM,
    margin: 0.5,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    padding: 40,
    alignItems: "center",
  },
});