import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetFeed } from "@workspace/api-client-react";
import { Image01Icon } from '@hugeicons/core-free-icons';
import { useColors } from "@/hooks/useColors";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useGetFeed();
  
  const posts = feedData?.posts ?? [];
  
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => <PostCard {...item} />}
        ListEmptyComponent={
          feedLoading ? (
            <View className="py-20 items-center">
                <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <EmptyState icon={Image01Icon} title="Nothing to see here" />
          )
        }
        refreshControl={
          <RefreshControl 
            refreshing={false} 
            onRefresh={refetchFeed} 
            tintColor={colors.primary} 
          />
        }
        showsVerticalScrollIndicator={false}
        // Only pad the bottom to clear the device home indicator
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  );
}