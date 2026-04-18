import { useRouter } from "expo-router";
import React, { useMemo, useState, FC, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Pressable,
} from "react-native";
import { useCreatePost } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Image01Icon,
  Location01Icon,
  ArrowLeft01Icon
} from "@hugeicons/core-free-icons";

const mentionSuggestions = [
  { id: "1", name: "Prasenjeet Howlader" },
  { id: "2", name: "Rahim" },
  { id: "3", name: "Sadia" },
  { id: "4", name: "Nayeem" },
  { id: "5", name: "Ayesha" },
];

const MentionSuggestions: FC<{
  keyword: string | null;
  onSuggestionPress: (user: { id: string; name: string }) => void;
}> = ({ keyword, onSuggestionPress }) => {
  if (keyword == null || keyword.trim() === "") return null;
  
  const filtered = mentionSuggestions.filter((u) =>
    u.name.toLowerCase().includes(keyword.toLowerCase().trim())
  );
  
  if (filtered.length === 0) return null;
  
  return (
    <View
      style={{
        marginTop: 4,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#e1e8ed",
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {filtered.slice(0, 5).map((user) => (
        <Pressable
          key={user.id}
          onPress={() => onSuggestionPress(user)}
          style={({ pressed }) => [
            {
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: pressed ? "#f7f9fa" : "#fff",
              borderBottomWidth: 0.5,
              borderBottomColor: "#e1e8ed",
            },
            filtered[filtered.length - 1].id === user.id && { borderBottomWidth: 0 },
          ]}
        >
          <Text style={{ fontSize: 15, color: "#14171a", fontWeight: "400" }}>
            {user.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default function CreateScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [mentionKeyword, setMentionKeyword] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { mutate: createPost, isPending } = useCreatePost({
    mutation: {
      onSuccess: () => {
        router.push("/(tabs)");
      },
      onError: (err: any) =>
        Alert.alert("Error", err?.message ?? "Could not create post"),
    },
  });
  
  const hashtags = useMemo(
    () => content.match(/#\w+/g)?.map((t) => t.slice(1).toLowerCase()) || [],
    [content]
  );
  
  const handlePost = () => {
    if (!content.trim() && !imageUrl.trim()) return;
    
    createPost({
      data: {
        content: content.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        location: location.trim() || undefined,
        hashtags,
      },
    });
  };

  const handleTextChange = useCallback((text: string) => {
    setContent(text);
    
    // Simple mention detection - find last @word
    const match = text.match(/@(\w+)$/i);
    if (match) {
      setMentionKeyword(match[1]);
      setShowSuggestions(true);
    } else {
      setMentionKeyword(null);
      setShowSuggestions(false);
    }
  }, []);

  const handleSuggestionPress = useCallback((user: { id: string; name: string }) => {
    const parts = content.split(/(@\w+)$/i);
    const beforeMention = parts[0] || "";
    setContent(`${beforeMention}@${user.name} `);
    setMentionKeyword(null);
    setShowSuggestions(false);
  }, [content]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: "#e1e8ed",
          backgroundColor: "#fff",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={colors.foreground}
            strokeWidth={1.5}
          />        </TouchableOpacity>
        <TouchableOpacity
          className = 'rounded-2xl px-4 p-2 bg-gray-900 text-white'
          onPress={handlePost}
          disabled={isPending || (!content.trim() && !imageUrl.trim())}
          style={{
            opacity: isPending || (!content.trim() && !imageUrl.trim()) ? 0.5 : 1,
          }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
              Post
            </Text>
          )}
        </TouchableOpacity>
        
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120 }} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <UserAvatar uri={user?.avatarUrl} size={40} />
            
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 15, 
                fontWeight: "700", 
                color: "#14171a", 
                marginBottom: 4 
              }}>
                {user?.name || "Your Name"}
              </Text>
              
              <View style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderWidth: 1, 
                borderColor: "#b8d7f1", 
                borderRadius: 20, 
                backgroundColor: "#e8f5fd",
                alignSelf: "flex-start",
                marginBottom: 12,
              }}>
                <Text style={{
                  color: "#1d9bf0",
                  fontSize: 10,
                  fontWeight: "500",
                }}>
                  Everyone can reply
                </Text>
              </View>

              {showSuggestions && (
                <MentionSuggestions 
                  keyword={mentionKeyword} 
                  onSuggestionPress={handleSuggestionPress} 
                />
              )}

              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#e1e8ed",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  minHeight: 140,
                  backgroundColor: "#fff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <TextInput
                  className = 'outline-none border-none'
                  value={content}
                  onChangeText={handleTextChange}
                  style={{
                    fontSize: 19,
                    lineHeight: 24,
                    color: "#14171a",
                    textAlignVertical: "top",
                    flex: 1,
                    maxHeight: 500,
                  }}
                  placeholder="What is happening?!"
                  placeholderTextColor="#71767b"
                  multiline
                  maxLength={280}
                />
              </View>

              {imageUrl.trim().length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={{
                      width: "100%",
                      height: 240,
                      borderRadius: 16,
                    }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setImageUrl("")}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.7)",
                      borderRadius: 16,
                      width: 28,
                      height: 28,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#e1e8ed",
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          backgroundColor: "#fff",
        }}
      >
        <TouchableOpacity 
          onPress={() => {}}
          style={{ padding: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon icon={Image01Icon} size={24} color="#1d9bf0" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {}}
          style={{ padding: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon icon={Location01Icon} size={24} color="#1d9bf0" />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: content.length > 270 ? "#e0245e" : "#657786",
          }}
        >
          {280 - content.length}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
