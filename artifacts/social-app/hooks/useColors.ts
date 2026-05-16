import { useTheme } from "@/context/ThemeContext";
import colors from "@/constants/colors";

/**
 * Returns design tokens for the current color scheme.
 * Reads from ThemeContext so the user's manual dark/light/system
 * preference (set in Settings) overrides the device appearance.
 */
export function useColors() {
  const { resolvedScheme } = useTheme();
  const palette =
    resolvedScheme === "dark" && "dark" in colors
      ? (colors as unknown as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
