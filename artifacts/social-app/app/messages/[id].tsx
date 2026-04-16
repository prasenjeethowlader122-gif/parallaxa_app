import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMessages, useGetConversation, useSendMessage } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

export default function ConversationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: convoData } = useGetConversation({ conversationId: id });
  const { data: messagesData, refetch } = useGetMessages({ conversationId: id });
  const { mutate: sendMessage, isPending } = useSendMessage({
    mutation: { onSuccess: () => { setMessage(""); refetch(); } },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage({ conversationId: id, data: { content: message.trim() } });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);
  const messages = messagesData?.messages ?? [];
  const participant = (convoData as any)?.participant;

  const timeLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-3 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-1">
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        {participant && (
          <TouchableOpacity
            className="flex-1 flex-row items-center gap-2.5"
            onPress={() => router.push(`/profile/${participant.id}` as any)}
          >
            <UserAvatar uri={participant.avatarUrl} size={36} />
            <Text className="text-base font-semibold" style={{ color: colors.foreground }}>{participant.username}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity className="p-1">
          <Feather name="info" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item: any) => item.id}
        inverted
        renderItem={({ item }: { item: any }) => {
          const isMine = item.senderId === user?.id;
          return (
            <View className={`flex-row items-end mb-1.5 gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && participant && <UserAvatar uri={participant.avatarUrl} size={28} />}
              <View style={{ maxWidth: "70%" }}>
                <View
                  className="px-3.5 py-2.5 rounded-[20px]"
                  style={{ backgroundColor: isMine ? colors.primary : colors.muted }}
                >
                  <Text className="text-[15px] leading-5" style={{ color: isMine ? "#FFFFFF" : colors.foreground }}>
                    {item.content}
                  </Text>
                </View>
                <Text className="text-[11px] mt-0.5 mx-1.5" style={{ color: colors.mutedForeground }}>
                  {timeLabel(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1, justifyContent: "flex-end" }}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View
        className="px-3 pt-2"
        style={{
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
        }}
      >
        <View
          className="flex-row items-center rounded-3xl px-3.5 py-1.5"
          style={{ backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 0.5 }}
        >
          <TextInput
            className="flex-1 text-[15px] max-h-[100px]"
            style={{ color: colors.foreground }}
            placeholder="Message..."
            placeholderTextColor={colors.mutedForeground}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={isPending || !message.trim()}
            className="w-[34px] h-[34px] rounded-full items-center justify-center ml-2"
            style={{ backgroundColor: message.trim() ? colors.primary : colors.muted }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="send" size={16} color={message.trim() ? "#FFFFFF" : colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
