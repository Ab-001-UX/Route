"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { initAnalytics } from "@/lib/analytics";

type Theme = "light" | "dark";
type FontSize = "default" | "large" | "extra-large";

interface ThemeContextType {
  theme: Theme;
  fontSize: FontSize;
  privacyMode: boolean;
  setTheme: (theme: Theme) => Promise<void>;
  setFontSize: (size: FontSize) => Promise<void>;
  setPrivacyMode: (mode: boolean) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dbUser = useQuery(api.users.getCurrentUser);
  const updateUserSettings = useAction(api.rateLimitedActions.rateLimitedUpdateUserSettings);

  const [theme, setThemeState] = useState<Theme>("light");
  const [fontSize, setFontSizeState] = useState<FontSize>("default");
  const [privacyMode, setPrivacyModeState] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // 1. Initial load from localStorage (to prevent flash before Convex queries resolve)
  useEffect(() => {
    initAnalytics();
    const localTheme = localStorage.getItem("route-theme") as Theme;
    const localFontSize = localStorage.getItem("route-fontsize") as FontSize;
    const localPrivacy = localStorage.getItem("route-privacymode") === "true";

    if (localTheme) {
      setThemeState(localTheme);
      document.documentElement.setAttribute("data-theme", localTheme);
    } else {
      setThemeState("light");
      document.documentElement.setAttribute("data-theme", "light");
    }

    if (localFontSize) {
      setFontSizeState(localFontSize);
      document.documentElement.setAttribute("data-font-size", localFontSize);
    } else {
      document.documentElement.setAttribute("data-font-size", "default");
    }

    setPrivacyModeState(localPrivacy);
    setLoading(false);
  }, []);

  // 2. Sync from Convex when dbUser changes
  useEffect(() => {
    if (dbUser) {
      if (dbUser.theme && dbUser.theme !== theme) {
        setThemeState(dbUser.theme as Theme);
        document.documentElement.setAttribute("data-theme", dbUser.theme);
        localStorage.setItem("route-theme", dbUser.theme);
      }
      if (dbUser.fontSize && dbUser.fontSize !== fontSize) {
        setFontSizeState(dbUser.fontSize as FontSize);
        document.documentElement.setAttribute("data-font-size", dbUser.fontSize);
        localStorage.setItem("route-fontsize", dbUser.fontSize);
      }
      if (dbUser.privacyMode !== undefined && dbUser.privacyMode !== privacyMode) {
        setPrivacyModeState(dbUser.privacyMode);
        localStorage.setItem("route-privacymode", dbUser.privacyMode ? "true" : "false");
      }
    }
  }, [dbUser]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("route-theme", newTheme);
    if (dbUser) {
      try {
        await updateUserSettings({ theme: newTheme });
      } catch (err) {
        console.error("Failed to save theme setting to database:", err);
      }
    }
  };

  const setFontSize = async (newSize: FontSize) => {
    setFontSizeState(newSize);
    document.documentElement.setAttribute("data-font-size", newSize);
    localStorage.setItem("route-fontsize", newSize);
    if (dbUser) {
      try {
        await updateUserSettings({ fontSize: newSize });
      } catch (err) {
        console.error("Failed to save font size setting to database:", err);
      }
    }
  };

  const setPrivacyMode = async (newMode: boolean) => {
    setPrivacyModeState(newMode);
    localStorage.setItem("route-privacymode", newMode ? "true" : "false");
    if (dbUser) {
      try {
        await updateUserSettings({ privacyMode: newMode });
      } catch (err) {
        console.error("Failed to save privacy mode setting to database:", err);
      }
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        fontSize,
        privacyMode,
        setTheme,
        setFontSize,
        setPrivacyMode,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a ThemeProvider");
  }
  return context;
}
