import { useRouter } from "expo-router";
import React, { useCallback, useState, useRef } from "react";
import { HugeiconsIcon } from '@hugeicons/react-native';
import { SentIcon, Image01Icon, Search01Icon } from '@hugeicons/core-free-icons';

import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetFeed, useGetStories } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

const TABS = ["For You", "Following", "Trending"];

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useGetFeed();
  const posts = feedData?.posts ?? [];
  
  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  
  // Layout Fix: Sticky Top Slider
  const SliderNav = () => (
    <View 
      className="z-50 w-full border-b" 
      style={{ 
        paddingTop: topPadding, 
        backgroundColor: colors.background,
        borderColor: colors.border + '30'
      }}
    >
      <View className="flex-row justify-between items-center px-5 mb-2">
        <Text className="text-2xl font-black tracking-tighter" style={{ color: colors.foreground }}>
          Pulse
        </Text>
        <View className="flex-row gap-3">
            <TouchableOpacity className="p-2"><HugeiconsIcon icon={Search01Icon} size={22} color={colors.foreground} /></TouchableOpacity>
            <TouchableOpacity className="p-2"><HugeiconsIcon icon={SentIcon} size={22} color={colors.foreground} /></TouchableOpacity>
        </View>
      </View>

      <View className="flex-row px-2">
        {TABS.map((tab, index) => {
          const isActive = activeTab === index;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(index)}
              className="py-3 px-4 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text 
                className={`text-sm font-bold transition-all ${isActive ? "opacity-100" : "opacity-40"}`}
                style={{ color: colors.foreground }}
              >
                {tab}
              </Text>
              {isActive && (
                <Animated.View 
                  className="absolute bottom-0 h-1 w-8 rounded-full bg-black" 
                  layout={Animated.Layout}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
  
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Fixed Slider Navigation */}
      <SliderNav />

      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => <PostCard {...item} />}
        ListEmptyComponent={
          feedLoading ? (
            <View className="py-20 items-center"><ActivityIndicator color={colors.primary} /></View>
          ) : (
            <EmptyState icon={Image01Icon} title="Nothing to see here" />
          )
        }
        refreshControl={
          <RefreshControl 
            refreshing={false} 
            onRefresh={refetchFeed} 
            tintColor={colors.primary} 
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      />
    </View>
  );
}