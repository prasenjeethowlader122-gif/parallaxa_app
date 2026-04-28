import { useRouter } from "expo-router";
import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, UserIcon, Shield02Icon, Cancel01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import {
  ActivityIndicator, FlatList, Platform, RefreshControl, Text, TouchableOpacity, View, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { getApiBaseUrl } from "@/lib/apiUrl";

export default function AdminUsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: currentUser, token: authToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Use search API to list users (as we don't have a specific /admin/users GET)
  const { data, isLoading, refetch } = useSearch({ q: "", type: "users" });

  const handleAction = async (userId: string, action: 'freeze' | 'unfreeze' | 'approve-verification') => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
      });
      if (response.ok) {
        Alert.alert("Success", `Action ${action} completed`);
        refetch();
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Failed to perform action");
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed");
    }
  };

  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  const users = data?.users || [];

  if (currentUser?.role !== 'admin') {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <HugeiconsIcon icon={Shield02Icon} size={64} color="#ef4444" />
        <Text className="text-xl font-bold mt-4 text-center">Access Denied</Text>
        <Text className="text-gray-500 text-center mt-2">You do not have administrator privileges.</Text>
        <TouchableOpacity
          className="mt-6 bg-black px-8 py-3 rounded-full"
          onPress={() => router.replace("/(tabs)")}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="flex-row items-center px-4 pb-3"
        style={{
          paddingTop: topPadding + 12,
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.foreground }}>User Management</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <UserAvatar uri={item.avatarUrl} size={48} />
            <View className="flex-1 ml-3">
              <Text className="font-bold text-base" style={{ color: colors.foreground }}>{item.displayName}</Text>
              <Text className="text-gray-500 text-sm">@{item.username}</Text>
              <View className="flex-row mt-1 gap-2">
                {item.isFrozen && <View className="bg-red-100 px-2 py-0.5 rounded"><Text className="text-red-600 text-[10px] font-bold">FROZEN</Text></View>}
                {item.isVerified && <View className="bg-blue-100 px-2 py-0.5 rounded"><Text className="text-blue-600 text-[10px] font-bold">VERIFIED</Text></View>}
              </View>
            </View>
            <View className="flex-row gap-2">
              {!item.isVerified && (
                <TouchableOpacity
                  onPress={() => handleAction(item.id, 'approve-verification')}
                  className="w-8 h-8 rounded-full bg-green-50 items-center justify-center"
                >
                  <HugeiconsIcon icon={Tick01Icon} size={18} color="#16a34a" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleAction(item.id, item.isFrozen ? 'unfreeze' : 'freeze')}
                className={`w-8 h-8 rounded-full items-center justify-center ${item.isFrozen ? 'bg-blue-50' : 'bg-red-50'}`}
              >
                <HugeiconsIcon icon={item.isFrozen ? Shield02Icon : Cancel01Icon} size={18} color={item.isFrozen ? "#2563eb" : "#dc2626"} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.primary} />
        }
      />
    </View>
  );
}
