import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import React, { createContext, useContext, useEffect, useState } from "react";

const AUTH_TOKEN_KEY = "@social_app_token";
const AUTH_USER_KEY = "@social_app_user";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  website?: string | null;
  isVerified: boolean;
  role: 'user' | 'admin';
  isFrozen: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isProcessing: boolean;
  processingMessage: string;
  setIsProcessing: (val: boolean) => void;
  setProcessingMessage: (msg: string) => void;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

let _tokenRef: string | null = null;

setAuthTokenGetter(() => _tokenRef);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (savedToken && savedUser) {
          _tokenRef = savedToken;
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (newToken: string, newUser: AuthUser) => {
    setIsProcessing(true);
    setProcessingMessage("Logging in...");
    try {
      _tokenRef = newToken;
      setToken(newToken);
      setUser(newUser);
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser)),
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const logout = async () => {
    setIsProcessing(true);
    setProcessingMessage("Logging out...");
    try {
      _tokenRef = null;
      setToken(null);
      setUser(null);
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const updateUser = async (updatedUser: AuthUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isProcessing,
      processingMessage,
      setIsProcessing,
      setProcessingMessage,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
