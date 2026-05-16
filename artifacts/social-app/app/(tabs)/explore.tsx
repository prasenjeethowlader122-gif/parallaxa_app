import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Search01Icon, Cancel01Icon, Tag01Icon, ImageIcon, Fire01Icon } from "@hugeicons/core-free-icons";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useGetExplorePosts, useSearch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "@/components/UserAvatar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLUMN = 3;
const GAP = 1;

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const ITEM_SIZE = (width - GAP * (COLUMN - 1)) / COLUMN;
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data: exploreData, isLoading } = useGetExplorePosts({ limit: 30 });
  const { data: searchData } = useSearch(
    { q: debouncedQuery, type: "all" },
    { query: { enabled: debouncedQuery.length > 1 } as any }
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => setDebouncedQuery(text), 400);
    setDebounceTimer(t);
  };

  const isSearching = debouncedQuery.length > 1;
  const posts = exploreData?.posts ?? [];

  const trendingHashtags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post: any) => {
      (post.hashtags ?? []).forEach((tag: string) => {
        const clean = tag.replace(/^#/, "");
        if (clean) counts.set(clean, (counts.get(clean) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search bar */}
      <View
        style={{
          paddingTop: topPadding,
          paddingHorizontal: 16,
          paddingBottom: 10,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 40,
            gap: 8,
            backgroundColor: colors.muted,
          }}
        >
          <HugeiconsIcon icon={Search01Icon} size={16} color={colors.mutedForeground} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: colors.foreground }}
            placeholder="Search users, tags, posts..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setDebouncedQuery(""); }}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching && searchData ? (
        /* ── SEARCH RESULTS ── */
        <FlatList
          data={[
            ...searchData.users.map((u: any) => ({ ...u, _type: "user" })),
            ...searchData.hashtags.map((h: any) => ({ ...h, _type: "hashtag" })),
            ...searchData.posts.map((p: any) => ({ ...p, _type: "post" })),
          ]}
          keyExtractor={(item: any) => `${item._type}-${item.id ?? item.name}`}
          renderItem={({ item }: { item: any }) => {
            if (item._type === "user") {
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => router.push(`/profile/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  <UserAvatar uri={item.avatarUrl} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                      {item.username}
                    </Text>
                    <Text style={{ fontSize: 13, marginTop: 2, color: colors.mutedForeground }}>
                      {item.displayName}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            if (item._type === "hashtag") {
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => { setQuery(`#${item.name}`); setDebouncedQuery(`#${item.name}`); }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.muted,
                    }}
                  >
                    <HugeiconsIcon icon={Tag01Icon} size={22} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                      #{item.name}
                    </Text>
                    <Text style={{ fontSize: 13, marginTop: 2, color: colors.mutedForeground }}>
                      {item.postCount} posts
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            if (item._type === "post") {
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => router.push(`/post/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: 44, height: 44, borderRadius: 6 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        backgroundColor: colors.muted,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <HugeiconsIcon icon={ImageIcon} size={20} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}
                      numberOfLines={2}
                    >
                      {item.content ?? "Post"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }
            return null;
          }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* ── EXPLORE GRID with Trending section ── */
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id}
          numColumns={COLUMN}
          ListHeaderComponent={
            trendingHashtags.length > 0 ? (
              <View
                style={{
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.border,
                  paddingVertical: 14,
                  backgroundColor: colors.background,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    marginBottom: 12,
                  }}
                >
                  <HugeiconsIcon icon={Fire01Icon} size={18} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: colors.foreground,
                      letterSpacing: -0.3,
                    }}
                  >
                    Trending
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  {trendingHashtags.map(({ tag, count }) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => {
                        setQuery(`#${tag}`);
                        setDebouncedQuery(`#${tag}`);
                      }}
                      activeOpacity={0.75}
                      style={{
                        backgroundColor: colors.muted,
                        borderRadius: 20,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderWidth: 0.5,
                        borderColor: colors.border,
                        minWidth: 80,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: colors.primary,
                        }}
                      >
                        #{tag}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.mutedForeground,
                          marginTop: 2,
                        }}
                      >
                        {count} {count === 1 ? "post" : "posts"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              onPress={() => router.push(`/post/${item.id}` as any)}
              activeOpacity={0.85}
              style={{
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                margin: GAP / 2,
                backgroundColor: colors.muted,
              }}
            >
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ flex: 1, padding: 8, backgroundColor: colors.muted }}>
                  <Text
                    style={{ fontSize: 12, color: colors.foreground, fontWeight: "500" }}
                    numberOfLines={6}
                  >
                    {item.content}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ padding: 64, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => (
            <View style={{ height: GAP, backgroundColor: colors.background }} />
          )}
        />
      )}
    </View>
  );
}
