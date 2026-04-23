import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  Text, TextInput, TouchableOpacity, View, LayoutAnimation,
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
  SmileIcon,
  Image02Icon,
} from "@hugeicons/core-free-icons";
import { TypingIndicator } from "@/components/TypingIndicator";
import { EmojiPicker } from "@/components/EmojiPicker";
import { GifPicker } from "@/components/GifPicker";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

export default function ConversationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [typingUser, setTypingUser] = useState<{ userId: string; isTyping: boolean } | null>(null);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [isGifPickerVisible, setIsGifPickerVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  const { data: convoData } = useGetConversation(id ?? "");
  const { data: messagesData } = useGetMessages(id ?? "");

  useEffect(() => {
    if (messagesData?.messages) {
      setLocalMessages(messagesData.messages);
    }
  }, [messagesData]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("join_conversation", id);

    socket.on("new_message", (newMsg: any) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setLocalMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev];
      });
    });

    socket.on("user_typing", (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  const handleSend = (content?: string, mediaUrl?: string) => {
    const finalContent = content ?? message.trim();
    if (!finalContent && !mediaUrl) return;
    if (!id) return;

    sendMessage({
      conversationId: id,
      data: {
        content: finalContent || undefined,
        mediaUrl: mediaUrl || undefined
      }
    });
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-3 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
          zIndex: 10,
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
        <TouchableOpacity
          className="p-1"
          onPress={() => router.push(`/messages/settings/${id}` as any)}
        >
          <HugeiconsIcon icon={InformationCircleIcon} size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={localMessages}
        keyExtractor={(item: any) => item.id}
        inverted
        renderItem={({ item, index }: { item: any, index: number }) => {
          const isMine = item.senderId === user?.id;
          const showAvatar = !isMine && (index === 0 || localMessages[index - 1]?.senderId !== item.senderId);

          return (
            <View className={`flex-row items-end mb-1 gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
              <View style={{ width: 28 }}>
                {showAvatar && participant && <UserAvatar uri={participant.avatarUrl} size={28} />}
              </View>
              <View style={{ maxWidth: "75%" }}>
                {isMine ? (
                  <LinearGradient
                    colors={[colors.primary, colors.primary]} // You can add a second color for a real gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomRightRadius: 4,
                    }}
                  >
                    {item.mediaUrl && (
                      <Image
                        source={{ uri: item.mediaUrl }}
                        style={{ width: 200, height: 200, borderRadius: 12, marginBottom: item.content ? 8 : 0 }}
                        contentFit="cover"
                      />
                    )}
                    {item.content && (
                      <Text className="text-[15px] leading-5" style={{ color: "#FFFFFF" }}>
                        {item.content}
                      </Text>
                    )}
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomLeftRadius: 4,
                    }}
                  >
                    {item.mediaUrl && (
                      <Image
                        source={{ uri: item.mediaUrl }}
                        style={{ width: 200, height: 200, borderRadius: 12, marginBottom: item.content ? 8 : 0 }}
                        contentFit="cover"
                      />
                    )}
                    {item.content && (
                      <Text className="text-[15px] leading-5" style={{ color: colors.foreground }}>
                        {item.content}
                      </Text>
                    )}
                  </View>
                )}
                <Text className="text-[10px] mt-1 mx-1" style={{ color: colors.mutedForeground, textAlign: isMine ? 'right' : 'left' }}>
                  {timeLabel(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
        ListHeaderComponent={() => (
          typingUser?.isTyping ? (
            <View className="mb-4 ml-10">
              <TypingIndicator />
            </View>
          ) : null
        )}
        contentContainerStyle={{ padding: 12, flexGrow: 1, justifyContent: "flex-end" }}
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
          className="flex-row items-center rounded-3xl px-2 py-1.5"
          style={{ backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 0.5 }}
        >
          <TouchableOpacity
            className="p-1.5"
            onPress={() => setIsEmojiPickerVisible(true)}
          >
            <HugeiconsIcon icon={SmileIcon} size={22} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            className="p-1.5"
            onPress={() => setIsGifPickerVisible(true)}
          >
            <HugeiconsIcon icon={Image02Icon} size={22} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TextInput
            className="flex-1 text-[15px] max-h-[100px] px-2 outline-none"
            style={{ color: colors.foreground }}
            placeholder="Message..."
            placeholderTextColor={colors.mutedForeground}
            value={message}
            onChangeText={handleTyping}
            numberOfLines={1}
            maxLength={1000}
          />

          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={isPending || (!message.trim())}
            className="w-[34px] h-[34px] rounded-full items-center justify-center ml-1"
            style={{ backgroundColor: message.trim() ? colors.primary : "transparent" }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <HugeiconsIcon
                icon={SentIcon}
                size={18}
                color={message.trim() ? "#FFFFFF" : colors.mutedForeground}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <EmojiPicker
        visible={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
        onSelect={(emoji) => setMessage(prev => prev + emoji)}
      />

      <GifPicker
        visible={isGifPickerVisible}
        onClose={() => setIsGifPickerVisible(false)}
        onSelect={(url) => handleSend("", url)}
      />
    </KeyboardAvoidingView>
  );
}
