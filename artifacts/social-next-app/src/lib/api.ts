import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://parallaxa-backend.onrender.com/api/";

export function initApi() {
  setBaseUrl(API_BASE_URL);
  setAuthTokenGetter(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  });
}
