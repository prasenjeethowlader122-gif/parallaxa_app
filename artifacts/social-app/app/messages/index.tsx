import { useRouter } from "expo-router";
import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  PencilEdit01Icon,
  Message01Icon,
  Search01Icon
} from "@hugeicons/core-free-icons";
import {
  ActivityIndicator, FlatList, Platform, RefreshControl, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetConversations } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { ConversationItem } from "@/components/ConversationItem";
import { EmptyState } from "@/components/EmptyState";

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch } = useGetConversations();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  const conversations = Array.isArray(data) ? data.filter((c: any) =>
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="flex-row justify-between items-center px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.foreground }}>Messages</Text>
        <TouchableOpacity className="p-1">
          <HugeiconsIcon icon={PencilEdit01Icon} size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-2">
        <View
          className="flex-row items-center px-3 py-2 rounded-xl"
          style={{ backgroundColor: colors.muted }}
        >
          <HugeiconsIcon icon={Search01Icon} size={18} color={colors.mutedForeground} />
          <TextInput
            placeholder="Search messages..."
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 ml-2 text-sm"
            style={{ color: colors.foreground }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <ConversationItem
              id={item.id}
              participant={item.participant}
              lastMessage={item.lastMessage}
              unreadCount={item.unreadCount}
              myId={user?.id ?? ""}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Message01Icon}
              title="No messages yet"
              subtitle="Send a message to start a conversation"
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={conversations.length === 0 ? { flexGrow: 1 } : undefined}
        />
      )}
    </View>
  );
}
