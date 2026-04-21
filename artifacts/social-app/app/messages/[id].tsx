import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMessages, useGetConversation, useSendMessage } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  InformationCircleIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";

export default function ConversationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [typingUser, setTypingUser] = useState<{ userId: string; isTyping: boolean } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  // Fix: hooks take plain string, not an object
  const { data: convoData } = useGetConversation(id ?? "");
  const { data: messagesData, refetch } = useGetMessages(id ?? "");

  useEffect(() => {
    if (messagesData?.messages) {
      setLocalMessages(messagesData.messages);
    }
  }, [messagesData]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("join_conversation", id);

    socket.on("new_message", (newMsg: any) => {
      setLocalMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev];
      });
    });

    socket.on("user_typing", (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setTypingUser(data.isTyping ? data : null);
      }
    });

    return () => {
      socket.emit("leave_conversation", id);
      socket.off("new_message");
      socket.off("user_typing");
    };
  }, [socket, id, user?.id]);

  const { mutate: sendMessage, isPending } = useSendMessage({
    mutation: {
      onSuccess: (data) => {
        setMessage("");
        // Already handled by socket for real-time, but updating local state just in case
        setLocalMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev;
          return [data, ...prev];
        });
        socket?.emit("typing", { conversationId: id, isTyping: false });
      },
    },
  });

  const handleTyping = (text: string) => {
    setMessage(text);
    socket?.emit("typing", { conversationId: id, isTyping: text.length > 0 });
  };

  const handleSend = () => {
    if (!message.trim() || !id) return;
    sendMessage({ conversationId: id, data: { content: message.trim() } });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
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
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.foreground} />
        </TouchableOpacity>
        {participant && (
          <TouchableOpacity
            className="flex-1 flex-row items-center gap-2.5"
            onPress={() => router.push(`/profile/${participant.id}` as any)}
          >
            <UserAvatar uri={participant.avatarUrl} size={36} />
            <View>
              <Text className="text-base font-semibold" style={{ color: colors.foreground }}>{participant.username}</Text>
              {typingUser?.isTyping && (
                <Text className="text-[11px]" style={{ color: colors.primary }}>typing...</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity className="p-1">
          <HugeiconsIcon icon={InformationCircleIcon} size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={localMessages}
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
            onChangeText={handleTyping}
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
              <HugeiconsIcon icon={SentIcon} size={18} color={message.trim() ? "#FFFFFF" : colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}