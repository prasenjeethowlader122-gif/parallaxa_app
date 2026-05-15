import { useRouter } from "expo-router";
import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  PencilEdit01Icon,
  Message01Icon,
  Search01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useGetConversations,
  useSearch,
  useStartConversation,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { ConversationItem } from "@/components/ConversationItem";
import { EmptyState } from "@/components/EmptyState";
import { UserAvatar } from "@/components/UserAvatar";
import { Text } from "@/components/Text";

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMsgVisible, setNewMsgVisible] = useState(false);
  const [newMsgSearch, setNewMsgSearch] = useState("");
  const [startingConvo, setStartingConvo] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetConversations();
  const startConversation = useStartConversation();

  const { data: searchResults, isFetching: isSearching } = useSearch(
    { q: newMsgSearch, type: "users" },
    { query: { enabled: newMsgSearch.trim().length > 1, queryKey: ['search', newMsgSearch, 'users'] } }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleStartConversation = async (userId: string) => {
    setStartingConvo(userId);
    try {
      const convo = await startConversation.mutateAsync({ data: { userId } });
      setNewMsgVisible(false);
      setNewMsgSearch("");
      router.push(`/messages/${convo.id}` as any);
    } catch {
    } finally {
      setStartingConvo(null);
    }
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  const conversations = Array.isArray(data)
    ? data.filter(
        (c: any) =>
          c.participant.username
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          c.participant.displayName
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : [];

  const searchUsers: any[] = Array.isArray((searchResults as any)?.users)
    ? (searchResults as any).users
    : [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
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
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.foreground }}>
          Messages
        </Text>
        <TouchableOpacity
          className="p-1"
          onPress={() => setNewMsgVisible(true)}
        >
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            size={22}
            color={colors.foreground}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-2">
        <View
          className="flex-row items-center px-3 py-2 rounded-xl"
          style={{ backgroundColor: colors.muted }}
        >
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            color={colors.mutedForeground}
          />
          <TextInput
            placeholder="Search messages..."
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 ml-2 text-sm"
            style={{ color: colors.foreground }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
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
              subtitle="Tap the pencil icon to start a conversation"
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
            conversations.length === 0 ? { flexGrow: 1 } : undefined
          }
        />
      )}

      {/* New Message Modal */}
      <Modal
        visible={newMsgVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setNewMsgVisible(false);
          setNewMsgSearch("");
        }}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ backgroundColor: colors.background }}
        >
          {/* Modal Header */}
          <View
            className="flex-row justify-between items-center px-4 py-4"
            style={{
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
              paddingTop: insets.top + 16,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setNewMsgVisible(false);
                setNewMsgSearch("");
              }}
            >
              <RNText style={{ color: colors.primary, fontSize: 16 }}>
                Cancel
              </RNText>
            </TouchableOpacity>
            <Text
              className="text-base font-bold"
              style={{ color: colors.foreground }}
            >
              New Message
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Search Input */}
          <View
            className="flex-row items-center px-4 py-3"
            style={{
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              className="text-base font-semibold mr-2"
              style={{ color: colors.mutedForeground }}
            >
              To:
            </Text>
            <TextInput
              placeholder="Search users..."
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 text-base"
              style={{ color: colors.foreground }}
              value={newMsgSearch}
              onChangeText={setNewMsgSearch}
              autoFocus
              autoCapitalize="none"
            />
            {isSearching && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {/* Search Results */}
          <FlatList
            data={searchUsers}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => (
              <TouchableOpacity
                className="flex-row items-center px-4 py-3 gap-3"
                onPress={() => handleStartConversation(item.id)}
                activeOpacity={0.7}
                disabled={startingConvo === item.id}
              >
                <UserAvatar uri={item.avatarUrl} size={46} />
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <Text
                      className="text-[15px] font-semibold"
                      style={{ color: colors.foreground }}
                    >
                      {item.displayName || item.username}
                    </Text>
                    {item.isVerified && (
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={14}
                        color={colors.verified}
                      />
                    )}
                  </View>
                  <Text
                    className="text-sm"
                    style={{ color: colors.mutedForeground }}
                  >
                    @{item.username}
                  </Text>
                </View>
                {startingConvo === item.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              newMsgSearch.length > 1 && !isSearching ? (
                <View className="items-center py-12">
                  <Text
                    className="text-base"
                    style={{ color: colors.mutedForeground }}
                  >
                    No users found
                  </Text>
                </View>
              ) : newMsgSearch.length === 0 ? (
                <View className="items-center py-12">
                  <Text
                    className="text-base"
                    style={{ color: colors.mutedForeground }}
                  >
                    Search for people to message
                  </Text>
                </View>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
