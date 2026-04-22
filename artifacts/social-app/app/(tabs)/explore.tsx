import { useRouter } from "expo-router";
import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Search01Icon, Cancel01Icon, Tag01Icon, ImageIcon } from "@hugeicons/core-free-icons";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useGetExplorePosts, useSearch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "@/components/UserAvatar";

const { width } = Dimensions.get("window");
const COLUMN = 3;
const GAP = 1;
const ITEM_SIZE = (width - GAP * (COLUMN - 1)) / COLUMN;

export default function ExploreScreen() {
  const colors = useColors();
  const router = useRouter();
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
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
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setDebouncedQuery("");
              }}
            >
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
                    <Text
                      style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}
                    >
                      {item.username}
                    </Text>
                    <Text
                      style={{ fontSize: 13, marginTop: 2, color: colors.mutedForeground }}
                    >
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
                  onPress={() => {
                    setQuery(`#${item.name}`);
                    setDebouncedQuery(`#${item.name}`);
                  }}
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
                    <Text
                      style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}
                    >
                      #{item.name}
                    </Text>
                    <Text
                      style={{ fontSize: 13, marginTop: 2, color: colors.mutedForeground }}
                    >
                      {item.postCount} posts
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            if (item._type === "post" && item.imageUrl) {
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
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: 44, height: 44, borderRadius: 6 }}
                    resizeMode="cover"
                  />
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
        /* ── EXPLORE GRID ── */
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id}
          numColumns={COLUMN}
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
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    padding: 8,
                    backgroundColor: colors.muted,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.foreground,
                      fontWeight: '500'
                    }}
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