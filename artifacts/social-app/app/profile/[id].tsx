import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { Text } from "@/components/Text"
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  MoreHorizontalIcon,
  GridIcon,
  AiIcon,
  Message01Icon,
  CheckmarkBadge01Icon,
  Calendar03Icon,
  Link01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import {
  useGetUser,
  useGetUserPosts,
  useFollowUser,
  useUnfollowUser,
  useStartConversation,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/EmptyState";
import { getApiBaseUrl } from "@/lib/apiUrl";

// ─── Constants ────────────────────────────────────────────────────────────────
const { width } = Dimensions.get("window");
const GRID_COL = 3;
const GRID_GAP = 1;
const GRID_ITEM = (width - GRID_GAP * (GRID_COL - 1)) / GRID_COL;
const insets = useSafeAreaInsets();
const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);

type Tab = "posts" | "replies" | "media" | "likes";
const TABS: { id: Tab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "replies", label: "Replies" },
  { id: "media", label: "Media" },
  { id: "likes", label: "Likes" },
];

// ─── Stat Item ────────────────────────────────────────────────────────────────
const StatItem = ({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.statItem}>
    <Text style={styles.statValue}>
      {value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)}M`
        : value >= 1000
        ? `${(value / 1000).toFixed(1)}K`
        : value}
    </Text>
    <Text style={styles.statLabel}> {label}</Text>
  </TouchableOpacity>
);

// ─── Follow Button ────────────────────────────────────────────────────────────
const FollowButton = ({
  isFollowing,
  onPress,
}: {
  isFollowing: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[styles.followBtn, isFollowing && styles.followBtnOutline]}
  >
    <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextOutline]}>
      {isFollowing ? "Following" : "Follow"}
    </Text>
  </TouchableOpacity>
);

// ─── Icon Button ──────────────────────────────────────────────────────────────
const IconBtn = ({ icon, onPress }: { icon: any; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.iconBtn}>
    <HugeiconsIcon icon={icon} size={18} color="#0f1419" strokeWidth={1.5} />
  </TouchableOpacity>
);

// ─── Profile Post Grid Item ───────────────────────────────────────────────────
const GridItem = ({ item, onPress }: { item: any; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.88}
    style={[styles.gridCell, { width: GRID_ITEM, height: GRID_ITEM }]}
  >
    {item.imageUrl ? (
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.gridImage}
        resizeMode="cover"
      />
    ) : (
      <View style={styles.gridTextCell}>
        <Text style={styles.gridTextContent} numberOfLines={4}>
          {item.content}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─── Cover gradient ───────────────────────────────────────────────────────────
const CoverBanner = ({ uri }: { uri?: string | null }) => (
  <View style={styles.cover} className = 'm-4 rounded-2xl'>
    {uri ? (
      <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
    ) : (
      <View style={styles.coverFallback} />
    )}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading, refetch } = useGetUser(id!);
  const { data: postsData, refetch: refetchPosts } = useGetUserPosts(id!);

  const { mutate: followUser } = useFollowUser({
    mutation: { onSuccess: () => refetch() },
  });
  const { mutate: unfollowUser } = useUnfollowUser({
    mutation: { onSuccess: () => refetch() },
  });
  const { mutate: startConversation } = useStartConversation({
    mutation: {
      onSuccess: (data) => {
        router.push(`/messages/${data.id}` as any);
      },
    },
  });

  const posts = useMemo(() => {
    const allPosts = postsData?.posts ?? [];
    if (activeTab === "posts") return allPosts;
    if (activeTab === "replies") return allPosts.filter(p => !!p.parentPostId);
    if (activeTab === "media") return allPosts.filter(p => !!p.imageUrl || !!p.videoUrl);
    if (activeTab === "likes") return []; // Not supported by API yet
    return allPosts;
  }, [postsData, activeTab]);

  const isOwnProfile = me?.id === id;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPosts()]);
    setRefreshing(false);
  };

  const handleFollow = () => {
    if (!id) return;
    profile?.isFollowing ? unfollowUser({ userId: id }) : followUser({ userId: id });
  };

  const handleMessage = () => {
    if (!id || !me?.id) return;
    startConversation({ data: { userId: id } });
  };

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const Header = () => (
    <View style={styles.headerContainer}>
      {/* ── Top nav ── */}
      <View style={[styles.topNav, { paddingTop: topPadding }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#0f1419" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          {profile && (
            <>
              <Text style={styles.navName} numberOfLines={1}>
                {profile.displayName}
              </Text>
              <Text style={styles.navPostCount}>{profile.postsCount} posts</Text>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.navBtn}>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={22} color="#0f1419" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* ── Cover ── */}
      <CoverBanner />

      {/* ── Avatar row ── */}
      <View style={styles.avatarRow}>
        <View style={styles.avatarRing}>
          <UserAvatar uri={profile?.avatarUrl ?? undefined} size={76} />
        </View>

        {!isLoading && profile && (
          <View style={styles.actionRow}>
            {isOwnProfile ? (
              <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress = {()=> router.push('/edit-profile')}>
                <Text style={styles.editBtnText}>Edit profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <IconBtn icon={Message01Icon} onPress={handleMessage} />
                <IconBtn icon={UserAdd01Icon} onPress={() => {}} />
                <FollowButton isFollowing={!!profile.isFollowing} onPress={handleFollow} />
              </>
            )}
          </View>
        )}
      </View>

      {/* ── Bio section ── */}
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#1d9bf0" />
        </View>
      ) : profile ? (
        <View style={styles.bioSection}>
          {/* Name + verified */}
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            {profile.isVerified && (
              <HugeiconsIcon
                icon={CheckmarkBadge01Icon}
                size={20}
                color="#1d9bf0"
                strokeWidth={1.5}
              />
            )}
          </View>
          <Text style={styles.username}>@{profile.username}</Text>

          {/* Followed-by hint */}
          {!isOwnProfile && profile.isFollowedBy && (
            <View style={styles.followsYouBadge}>
              <Text style={styles.followsYouText}>Follows you</Text>
            </View>
          )}

          {/* Bio */}
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}

          {/* Website */}
          {profile.website ? (
            <View style={styles.metaRow}>
              <HugeiconsIcon icon={Link01Icon} size={14} color="#71767b" strokeWidth={1.5} />
              <Text style={styles.websiteLink}>{profile.website}</Text>
            </View>
          ) : null}

          {/* Joined date */}
          {joinedDate && (
            <View style={styles.metaRow}>
              <HugeiconsIcon icon={Calendar03Icon} size={14} color="#71767b" strokeWidth={1.5} />
              <Text style={styles.metaText}>Joined {joinedDate}</Text>
            </View>
          )}

          {/* Follower stats */}
          <View style={styles.statsRow}>
            <StatItem value={profile.followingCount} label="Following" />
            <StatItem value={profile.followersCount} label="Followers" />
          </View>
        </View>
      ) : null}

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={styles.tab}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }: { item: any }) => (
          <GridItem
            item={item}
            onPress={() => router.push(`/post/${item.id}` as any)}
          />
        )}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={GridIcon}
              title={
                activeTab === "posts"
                  ? "No posts yet"
                  : activeTab === "media"
                  ? "No media yet"
                  : activeTab === "likes"
                  ? "No likes yet"
                  : "No replies yet"
              }
              subtitle="Nothing to show here"
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1d9bf0"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // Top navigation
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f1419",
    lineHeight: 20,
  },
  navPostCount: {
    fontSize: 13,
    color: "#71767b",
    lineHeight: 16,
  },

  // Cover
  cover: {
    height: 158,
    borderRadius:20,
    backgroundColor: "#cfd9de",
    overflow: "hidden",
  },
  coverFallback: {
    flex: 1,
    backgroundColor: "#1d9bf0",
    opacity: 0.15,
  },

  // Avatar row
  avatarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: -48,
    marginBottom: 12,
  },
  avatarRing: {
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Buttons
  editBtn: {
    borderWidth: 1,
    borderColor: "#cfd9de",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f1419",
  },
  followBtn: {
    backgroundColor: "#0f1419",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#0f1419",
  },
  followBtnOutline: {
    backgroundColor: "#fff",
    borderColor: "#cfd9de",
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  followBtnTextOutline: {
    color: "#0f1419",
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#cfd9de",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bio
  bioSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  loadingRow: {
    paddingVertical: 40,
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  displayName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0f1419",
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 14,
    color: "#71767b",
    marginTop: 1,
    marginBottom: 6,
  },
  followsYouBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eff3f4",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  followsYouText: {
    fontSize: 12,
    color: "#71767b",
    fontWeight: "500",
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: "#0f1419",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  metaText: {
    fontSize: 14,
    color: "#71767b",
  },
  websiteLink: {
    fontSize: 14,
    color: "#1d9bf0",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f1419",
  },
  statLabel: {
    fontSize: 14,
    color: "#71767b",
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e1e8ed",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#71767b",
  },
  tabLabelActive: {
    color: "#0f1419",
    fontWeight: "700",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "#1d9bf0",
  },

  // Header container
  headerContainer: {
    backgroundColor: "#fff",
  },

  // Grid
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridCell: {
    overflow: "hidden",
    backgroundColor: "#eff3f4",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridTextCell: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
  },
  gridTextContent: {
    fontSize: 12,
    color: "#0f1419",
    lineHeight: 16,
  },
});