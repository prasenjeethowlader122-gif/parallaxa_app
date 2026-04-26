import React, { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetNotifications,
  useMarkNotificationsRead,
} from "@workspace/api-client-react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { useColors } from "@/hooks/useColors";
import { NotificationItem } from "@/components/NotificationItem";
import { EmptyState } from "@/components/EmptyState";

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  const [refreshing, setRefreshing] = React.useState(false);

  const { data, isLoading, refetch } = useGetNotifications();
  const { mutate: markRead } = useMarkNotificationsRead();

  // Mark all as read when screen mounts
  useEffect(() => {
    markRead();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const notifications = data?.notifications ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Screen header */}
      <View
        style={{
          paddingTop: topPadding,
          paddingHorizontal: 16,
          paddingBottom: 14,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}
        >
          Notifications
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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
              icon={Notification01Icon}
              title="No notifications yet"
              subtitle="When people like or comment on your posts, you'll see them here"
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            notifications.length === 0 ? { flexGrow: 1 } : undefined
          }
        />
      )}
    </View>
  );
}