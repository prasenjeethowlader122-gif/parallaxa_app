import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Dimensions, FlatList, Image, Platform,
  Text, TextInput, TouchableOpacity, View,
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Search bar */}
      <View
        className="px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <View
          className="flex-row items-center rounded-xl px-3 h-10 gap-2"
          style={{ backgroundColor: colors.muted }}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            className="flex-1 text-[15px]"
            style={{ color: colors.foreground }}
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
                  className="flex-row items-center px-4 py-3 gap-3"
                  style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
                  onPress={() => router.push(`/profile/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  <UserAvatar uri={item.avatarUrl} size={44} />
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold" style={{ color: colors.foreground }}>{item.username}</Text>
                    <Text className="text-[13px] mt-0.5" style={{ color: colors.mutedForeground }}>{item.displayName}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item._type === "hashtag") {
              return (
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3 gap-3"
                  style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.muted }}
                  >
                    <Feather name="hash" size={22} color={colors.foreground} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold" style={{ color: colors.foreground }}>#{item.name}</Text>
                    <Text className="text-[13px] mt-0.5" style={{ color: colors.mutedForeground }}>{item.postCount} posts</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            if (item._type === "post" && item.imageUrl) {
              return (
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3 gap-3"
                  style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}
                  onPress={() => router.push(`/post/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.imageUrl }} className="w-11 h-11 rounded-md" resizeMode="cover" />
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold" style={{ color: colors.foreground }} numberOfLines={2}>
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
                style={{ width: size, height: size, margin: 0.5 }}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center" style={{ backgroundColor: colors.muted }}>
                    <Feather name="image" size={20} color={colors.mutedForeground} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            isLoading ? (
              <View className="p-16 items-center">
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
