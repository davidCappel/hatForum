"use client";

import { createContext, useState, useEffect, useContext } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light", // Default value
  setTheme: () => {}, // Empty function as default
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Load theme preference from API when component mounts
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const data = await res.json();
          setTheme(data.color_scheme);
        }
      } catch (error) {
        console.error("Failed to fetch user preferences:", error);
      }
      setMounted(true);
    };

    fetchUserPreferences();
  }, []);

  // Update actual theme when preference changes
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, mounted]);

  // When theme changes, update user preferences in the database
  useEffect(() => {
    if (!mounted) return;

    const updateThemePreference = async () => {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const currentPrefs = await res.json();
          
          await fetch("/api/preferences", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...currentPrefs,
              color_scheme: theme,
            }),
          });
        }
      } catch (error) {
        console.error("Failed to update theme preference:", error);
      }
    };

    updateThemePreference();
  }, [theme, mounted]);

  if (!mounted) {
    // Prevent theme flash during hydration
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}