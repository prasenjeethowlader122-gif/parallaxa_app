import React from "react";
import {
  Text as RNText,
  TextProps,
  StyleSheet,
  TextStyle,
} from "react-native";

/**
 * Drop-in replacement for React Native's <Text>.
 * Automatically applies SpaceGrotesk based on fontWeight so you never
 * have to set fontFamily manually anywhere in the app.
 *
 * Usage:
 *   import { Text } from "@/components/Text";
 *   <Text style={{ fontWeight: "700" }}>Bold text</Text>
 */

function resolveFontFamily(style ? : TextStyle | TextStyle[]): string {
  const flat: TextStyle = StyleSheet.flatten(style) ?? {};
  const weight = flat.fontWeight;
  
  switch (weight) {
    case "700":
      return "Sora-SemiBold";
    case "800":
      return "Sora-SemiBold";
    case "900":
      return "Sora-SemiBold";
    case "bold":
      return "Sora-SemiBold";
    case "600":
      return "Sora-SemiBold";
    case "500":
      return "Sora-Medium";
    default:
      return "Sora-Regular";
  }
}

export function Text({ style, ...props }: TextProps) {
  const flatStyle = StyleSheet.flatten(style) ?? {};
  
  // If a fontFamily is already explicitly set, respect it.
  const fontFamily = flatStyle.fontFamily ?? resolveFontFamily(flatStyle);
  
  return (
    <RNText
      {...props}
      style={[style, { fontFamily }]}
    />
  );
}