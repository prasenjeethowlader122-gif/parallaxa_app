import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Platform, StyleSheet } from "react-native";
import { Stack, useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Menu01Icon } from '@hugeicons/core-free-icons';
import { useColors } from "@/hooks/useColors";

const TABS = [
  { id: "index", label: "For You" },
  { id: "explore", label: "Following" },
  { id: "trending", label: "Trending" }
];

export default function RootLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentRoute = pathname === "/" ? "index" : pathname.replace("/", "");
  const topPadding = insets.top + (Platform.OS === "web" ? 20 : 8);
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* --- GLOBAL HEADER & SLIDER --- */}
      <View 
        style={{ 
          paddingTop: topPadding, 
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border + '30',
          zIndex: 50
        }}
      >
        {/* Top Bar: Logo & Actions */}
        <View className="flex-row justify-between items-center px-5 mb-2">
          <Image 
            source={require('@/assets/images/parallaxa-logo.svg')} 
            style={{ width: 40, height: 40 }} 
          />
         
          <TouchableOpacity className="p-2">
            <HugeiconsIcon icon={Menu01Icon} size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Navigation Slider */}
        <View className="flex-row px-2">
          {TABS.map((tab) => {
            const isActive = currentRoute === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => router.push(`/${tab.id === 'index' ? '' : tab.id}`)}
                className="py-3 px-4 items-center justify-center"
              >
                <Text 
                  className={`text-sm font-bold`}
                  style={{ 
                    color: colors.foreground, 
                    opacity: isActive ? 1 : 0.4 
                  }}
                >
                  {tab.label}
                </Text>
                {isActive && (
                  <View 
                    className="absolute bottom-0 h-1 w-8 rounded-full" 
                    style={{ backgroundColor: colors.primary || 'black' }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* --- CONTENT AREA --- */}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}