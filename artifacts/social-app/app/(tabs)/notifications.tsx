import React, { useEffect } from "react";
import {
  ActivityIndicator, FlatList, Platform, RefreshControl, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetNotifications, useMarkNotificationsRead } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { NotificationItem } from "@/components/NotificationItem";
import { EmptyState } from "@/components/EmptyState";

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data, isLoading, refetch } = useGetNotifications();
  const { mutate: markRead } = useMarkNotificationsRead();

  useEffect(() => { markRead(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const notifications = data?.notifications ?? [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>Notifications</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <NotificationItem
              id={item.id}
              type={item.type}
              fromUser={item.fromUser}
              post={item.post}
              commentContent={item.commentContent}
              isRead={item.isRead}
              createdAt={item.createdAt}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="No notifications yet"
              subtitle="When people like or comment on your posts, you'll see them here"
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={notifications.length === 0 ? { flexGrow: 1 } : undefined}
        />
      )}
    </View>
  );
}
