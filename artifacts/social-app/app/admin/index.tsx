import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  UserGroup02Icon,
  SquareIcon,
  Shield02Icon,
  Analytics01Icon,
  Settings01Icon,
  CheckmarkBadge01Icon,
  Image01Icon
} from "@hugeicons/core-free-icons";
import {
  ActivityIndicator, ScrollView, Text, TouchableOpacity, View, Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/apiUrl";

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: currentUser, token: authToken } = useAuth();

  const [stats, setStats] = useState({ users: 0, posts: 0, stories: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [disableSignups, setDisableSignups] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: {
          "Authorization": `Bearer ${authToken}`
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchStats();
    }
  }, [currentUser]);

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

  const StatCard = ({ title, value, icon, color }: any) => (
    <View className="bg-white p-4 rounded-2xl flex-1 shadow-sm border border-gray-100">
      <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3`} style={{ backgroundColor: `${color}15` }}>
        <HugeiconsIcon icon={icon} size={20} color={color} />
      </View>
      <Text className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wider">{title}</Text>
      <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>{value}</Text>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: "#F9FAFB" }}>
      <View
        className="flex-row items-center px-4 pb-4 bg-white"
        style={{
          paddingTop: insets.top + 12,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.foreground }}>Admin Dashboard</Text>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View className="flex-row gap-4 mb-6">
          <StatCard title="Users" value={stats.users} icon={UserGroup02Icon} color="#3b82f6" />
          <StatCard title="Posts" value={stats.posts} icon={Analytics01Icon} color="#10b981" />
        </View>
        <View className="flex-row gap-4 mb-6">
          <StatCard title="Stories" value={stats.stories} icon={Image01Icon} color="#f59e0b" />
          <View className="flex-1" />
        </View>

        {/* Quick Actions */}
        <Text className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest ml-1">System Controls</Text>
        <View className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-6">
          <TouchableOpacity
            className="flex-row items-center p-4 border-b border-gray-50"
            onPress={() => router.push("/admin/users")}
          >
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
              <HugeiconsIcon icon={UserGroup02Icon} size={20} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900">User Management</Text>
              <Text className="text-gray-500 text-xs">Manage roles, verify or freeze users</Text>
            </View>
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Settings Toggles (Mock) */}
        <Text className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest ml-1">Safety & Settings</Text>
        <View className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-10">
          <View className="flex-row items-center p-4 border-b border-gray-50">
            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-3">
              <HugeiconsIcon icon={Settings01Icon} size={20} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900">Maintenance Mode</Text>
              <Text className="text-gray-500 text-xs">Disable app access for everyone but admins</Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: "#e2e8f0", true: "#ef4444" }}
            />
          </View>
          <View className="flex-row items-center p-4">
            <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
              <HugeiconsIcon icon={Shield02Icon} size={20} color="#f97316" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900">Disable New Signups</Text>
              <Text className="text-gray-500 text-xs">Prevent new users from creating accounts</Text>
            </View>
            <Switch
              value={disableSignups}
              onValueChange={setDisableSignups}
              trackColor={{ false: "#e2e8f0", true: "#f97316" }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
