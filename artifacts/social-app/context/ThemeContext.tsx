import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

export type ThemePref = "system" | "light" | "dark";

interface ThemeContextType {
  themePref: ThemePref;
  setThemePref: (pref: ThemePref) => Promise<void>;
  resolvedScheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  themePref: "system",
  setThemePref: async () => {},
  resolvedScheme: "light",
});

const THEME_KEY = "@parallaxa_theme_pref";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePref, setThemePrefState] = useState<ThemePref>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") {
          setThemePrefState(v);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const setThemePref = async (pref: ThemePref) => {
    setThemePrefState(pref);
    await AsyncStorage.setItem(THEME_KEY, pref);
  };

  const resolvedScheme: "light" | "dark" =
    themePref === "system" ? (systemScheme ?? "light") : themePref;

  if (!loaded) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ themePref, setThemePref, resolvedScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
