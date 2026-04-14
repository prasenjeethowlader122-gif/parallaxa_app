import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator,
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
    mutation: {
      onSuccess: () => {
        setMessage("");
        refetch();
      },
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage({
      conversationId: id,
      data: { content: message.trim() },
    });
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        {participant && (
          <TouchableOpacity
            style={styles.participantInfo}
            onPress={() => router.push(`/profile/${participant.id}` as any)}
          >
            <UserAvatar uri={participant.avatarUrl} size={36} />
            <Text style={[styles.participantName, { color: colors.foreground }]}>{participant.username}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.infoBtn}>
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
            <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowTheirs]}>
              {!isMine && participant && (
                <UserAvatar uri={participant.avatarUrl} size={28} />
              )}
              <View style={styles.msgBubbleWrapper}>
                <View style={[
                  styles.bubble,
                  {
                    backgroundColor: isMine ? colors.primary : colors.muted,
                  },
                ]}>
                  <Text style={[styles.bubbleText, { color: isMine ? "#FFFFFF" : colors.foreground }]}>
                    {item.content}
                  </Text>
                </View>
                <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>{timeLabel(item.createdAt)}</Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={[
        styles.inputContainer,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
        },
      ]}>
        <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
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
            style={[styles.sendBtn, { backgroundColor: message.trim() ? colors.primary : colors.muted }]}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4, marginRight: 4 },
  participantInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  participantName: { fontSize: 16, fontWeight: "600" },
  infoBtn: { padding: 4 },
  messagesList: { padding: 12, gap: 8, flexGrow: 1, justifyContent: "flex-end" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6, gap: 8 },
  msgRowMine: { justifyContent: "flex-end" },
  msgRowTheirs: { justifyContent: "flex-start" },
  msgBubbleWrapper: { maxWidth: "70%" },
  bubble: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  msgTime: { fontSize: 11, marginTop: 3, marginHorizontal: 6 },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12, paddingTop: 8,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 24, paddingHorizontal: 14, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 100 },
  sendBtn: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: "center", alignItems: "center", marginLeft: 8,
  },
});
