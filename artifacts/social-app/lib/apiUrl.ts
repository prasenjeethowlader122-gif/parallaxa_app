import { Platform } from "react-native";

/**
 * Returns the API base URL.
 *
 * Strategy:
 *  - If EXPO_PUBLIC_DOMAIN is set (Replit dev, EAS mobile build) → use it.
 *  - If running on web with no domain set (Docker/Render production) →
 *    use an empty string so all fetch calls use relative paths
 *    (the web app is served from the same origin as the API).
 *  - On native with no domain set → empty string (requests will fail; users
 *    must set EXPO_PUBLIC_DOMAIN for standalone native builds).
 */
export function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;

  if (domain) {
    if (domain.startsWith("http://") || domain.startsWith("https://")) {
      return domain;
    }
    return `https://${domain}`;
  }
  // On web in production the app is served from the same origin as /api
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://parallaxa-app-t5p2.onrender.com";
}
