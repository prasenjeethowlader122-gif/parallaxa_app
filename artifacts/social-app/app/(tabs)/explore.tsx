import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetExplorePosts, useSearch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { UserAvatar } from "@/components/UserAvatar";

const { width } = Dimensions.get("window");
const COLUMN = 3;
const ITEM_SIZE = (width - 2) / COLUMN;

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data: exploreData, isLoading } = useGetExplorePosts({ limit: 30 });
  const { data: searchData } = useSearch(
    { q: debouncedQuery, type: "all" },
    { enabled: debouncedQuery.length > 1 }
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => setDebouncedQuery(text), 400);
    setDebounceTimer(t);
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const isSearching = debouncedQuery.length > 1;
  const posts = exploreData?.posts ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View
        style={[
          styles.searchHeader,
          { paddingTop: topPadding + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: colors.muted }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search users, tags, posts..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setDebouncedQuery(""); }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching && searchData ? (
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
                  style={[styles.searchResultRow, { borderBottomColor: colors.border }]}
                  onPress={() => router.push(`/profile/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  <UserAvatar uri={item.avatarUrl} size={44} />
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultTitle, { color: colors.foreground }]}>{item.username}</Text>
                    <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>{item.displayName}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item._type === "hashtag") {
              return (
                <TouchableOpacity
                  style={[styles.searchResultRow, { borderBottomColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.hashtagIcon, { backgroundColor: colors.muted }]}>
                    <Feather name="hash" size={22} color={colors.foreground} />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultTitle, { color: colors.foreground }]}>#{item.name}</Text>
                    <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>{item.postCount} posts</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item._type === "post" && item.imageUrl) {
              return (
                <TouchableOpacity
                  style={[styles.searchResultRow, { borderBottomColor: colors.border }]}
                  onPress={() => router.push(`/post/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.searchPostThumb} />
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>{item.content ?? "Post"}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            return null;
          }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item: any) => item.id}
          numColumns={COLUMN}
          renderItem={({ item, index }: { item: any; index: number }) => {
            const isLarge = index % 5 === 0;
            const size = isLarge ? ITEM_SIZE * 2 + 1 : ITEM_SIZE;
            return (
              <TouchableOpacity
                onPress={() => router.push(`/post/${item.id}` as any)}
                activeOpacity={0.85}
                style={[styles.gridItem, { width: size, height: size }]}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
                ) : (
                  <View style={[styles.gridPlaceholder, { backgroundColor: colors.muted }]}>
                    <Feather name="image" size={20} color={colors.mutedForeground} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.background }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  gridItem: { margin: 0.5 },
  gridImage: { width: "100%", height: "100%", resizeMode: "cover" },
  gridPlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  loadingContainer: { padding: 60, alignItems: "center" },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: "600" },
  resultSub: { fontSize: 13, marginTop: 2 },
  hashtagIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
  },
  searchPostThumb: { width: 44, height: 44, borderRadius: 6, resizeMode: "cover" },
});
