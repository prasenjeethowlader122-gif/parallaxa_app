import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  LayoutAnimation,
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
  LockPasswordIcon,
  Tick01Icon,
  TickDouble01Icon,
} from "@hugeicons/core-free-icons";
import { TypingIndicator } from "@/components/TypingIndicator";
import { EmojiPicker } from "@/components/EmojiPicker";
import { GifPicker } from "@/components/GifPicker";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { encrypt, decrypt } from "@/lib/crypto";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👍", "🎉", "💯"];

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
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [reactionPickerPos, setReactionPickerPos] = useState<{ y: number } | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const { data: convoData } = useGetConversation(id ?? "");
  const { data: messagesData } = useGetMessages(id ?? "");

  useEffect(() => {
    if (messagesData?.messages) setLocalMessages(messagesData.messages);
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
        content: finalContent ? encrypt(finalContent) : undefined,
        mediaUrl: mediaUrl || undefined,
      },
    });
  };

  const handleReaction = useCallback((msgId: string, emoji: string) => {
    setMessageReactions((prev) => {
      const current = prev[msgId];
      if (current === emoji) {
        const next = { ...prev };
        delete next[msgId];
        return next;
      }
      return { ...prev, [msgId]: emoji };
    });
    setReactionTarget(null);
  }, []);

  const handleLongPress = useCallback((msgId: string) => {
    setReactionTarget(msgId);
  }, []);

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  const participant = (convoData as any)?.participant;

  const timeLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const lastSentMsgId = useMemo(
    () => localMessages.find((m: any) => m.senderId === user?.id)?.id,
    [localMessages, user?.id]
  );

  const seenByOther = useMemo(() => {
    const lastSentIdx = localMessages.findIndex((m: any) => m.senderId === user?.id);
    const lastRecvIdx = localMessages.findIndex((m: any) => m.senderId !== user?.id);
    return lastRecvIdx !== -1 && lastSentIdx !== -1 && lastRecvIdx < lastSentIdx;
  }, [localMessages, user?.id]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingBottom: 12,
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
          zIndex: 10,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 4 }}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.foreground} />
        </TouchableOpacity>
        {participant && (
          <TouchableOpacity
            style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}
            onPress={() => router.push(`/profile/${participant.id}` as any)}
          >
            <UserAvatar uri={participant.avatarUrl} size={36} />
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  {participant.displayName ?? participant.username}
                </Text>
                <HugeiconsIcon icon={LockPasswordIcon} size={12} color={colors.mutedForeground} />
              </View>
              {typingUser?.isTyping ? (
                <Text style={{ fontSize: 11, color: colors.primary }}>typing...</Text>
              ) : (
                <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                  End-to-end encrypted
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{ padding: 4 }}
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
        renderItem={({ item, index }: { item: any; index: number }) => {
          const isMine = item.senderId === user?.id;
          const showAvatar =
            !isMine &&
            (index === 0 || localMessages[index - 1]?.senderId !== item.senderId);
          const reaction = messageReactions[item.id];
          const isLastSent = isMine && item.id === lastSentMsgId;

          return (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                marginBottom: 4,
                gap: 8,
                justifyContent: isMine ? "flex-end" : "flex-start",
                paddingHorizontal: 12,
              }}
            >
              {!isMine && (
                <View style={{ width: 28 }}>
                  {showAvatar && participant && (
                    <UserAvatar uri={participant.avatarUrl} size={28} />
                  )}
                </View>
              )}

              <View style={{ maxWidth: "75%", alignItems: isMine ? "flex-end" : "flex-start" }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onLongPress={() => handleLongPress(item.id)}
                >
                  {isMine ? (
                    <LinearGradient
                      colors={[colors.primary, colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 20,
                        borderBottomRightRadius: 4,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                      }}
                    >
                      {item.mediaUrl && (
                        <Image
                          source={{ uri: item.mediaUrl }}
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: 12,
                            marginBottom: item.content ? 8 : 0,
                          }}
                          contentFit="cover"
                        />
                      )}
                      {item.content && (
                        <Text style={{ fontSize: 15, lineHeight: 21, color: "#FFFFFF" }}>
                          {decrypt(item.content)}
                        </Text>
                      )}
                    </LinearGradient>
                  ) : (
                    <View
                      style={{
                        backgroundColor: colors.muted,
                        borderRadius: 20,
                        borderBottomLeftRadius: 4,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                      }}
                    >
                      {item.mediaUrl && (
                        <Image
                          source={{ uri: item.mediaUrl }}
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: 12,
                            marginBottom: item.content ? 8 : 0,
                          }}
                          contentFit="cover"
                        />
                      )}
                      {item.content && (
                        <Text style={{ fontSize: 15, lineHeight: 21, color: colors.foreground }}>
                          {decrypt(item.content)}
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>

                {/* Reaction bubble */}
                {reaction && (
                  <TouchableOpacity
                    onPress={() => handleReaction(item.id, reaction)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{reaction}</Text>
                  </TouchableOpacity>
                )}

                {/* Timestamp + read receipt */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                    marginTop: 3,
                    marginHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.mutedForeground,
                    }}
                  >
                    {timeLabel(item.createdAt)}
                  </Text>
                  {isMine && (
                    <>
                      {isLastSent && seenByOther ? (
                        <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "600" }}>
                          Seen
                        </Text>
                      ) : (
                        <HugeiconsIcon
                          icon={isLastSent ? Tick01Icon : TickDouble01Icon}
                          size={12}
                          color={colors.mutedForeground}
                          strokeWidth={2}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListHeaderComponent={() =>
          typingUser?.isTyping ? (
            <View style={{ marginBottom: 16, marginLeft: 52 }}>
              <TypingIndicator />
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingVertical: 12,
          paddingHorizontal: 0,
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingTop: 8,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 28,
            paddingHorizontal: 8,
            paddingVertical: 6,
            backgroundColor: colors.muted,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}
        >
          <TouchableOpacity style={{ padding: 6 }} onPress={() => setIsEmojiPickerVisible(true)}>
            <HugeiconsIcon icon={SmileIcon} size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 6 }} onPress={() => setIsGifPickerVisible(true)}>
            <HugeiconsIcon icon={Image02Icon} size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TextInput
            style={{
              flex: 1,
              fontSize: 15,
              maxHeight: 100,
              paddingHorizontal: 8,
              color: colors.foreground,
            }}
            placeholder="Message..."
            placeholderTextColor={colors.mutedForeground}
            value={message}
            onChangeText={handleTyping}
            numberOfLines={1}
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={isPending || !message.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 4,
              backgroundColor: message.trim() ? colors.primary : "transparent",
            }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <HugeiconsIcon
                icon={SentIcon}
                size={18}
                color={message.trim() ? "#FFF" : colors.mutedForeground}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Reaction Picker Modal */}
      <Modal
        visible={!!reactionTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionTarget(null)}
      >
        <TouchableWithoutFeedback onPress={() => setReactionTarget(null)}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 24,
                  padding: 12,
                  flexDirection: "row",
                  gap: 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.18,
                  shadowRadius: 20,
                  elevation: 10,
                  borderWidth: 0.5,
                  borderColor: colors.border,
                }}
              >
                {REACTION_EMOJIS.map((emoji) => {
                  const isSelected = reactionTarget ? messageReactions[reactionTarget] === emoji : false;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => reactionTarget && handleReaction(reactionTarget, emoji)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected ? colors.primary + "22" : "transparent",
                        transform: [{ scale: isSelected ? 1.15 : 1 }],
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <EmojiPicker
        visible={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
        onSelect={(emoji) => setMessage((prev) => prev + emoji)}
      />
      <GifPicker
        visible={isGifPickerVisible}
        onClose={() => setIsGifPickerVisible(false)}
        onSelect={(url) => handleSend("", url)}
      />
    </KeyboardAvoidingView>
  );
}
