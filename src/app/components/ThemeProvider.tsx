"use client";

import { createContext, useState, useEffect, useContext } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const data = await res.json();
          setTheme(data.color_scheme || "system");
        }
      } catch (error) {
        console.error("Failed to fetch user preferences:", error);
      }
      setMounted(true);
    };

    fetchUserPreferences();
  }, []);

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
    
    
    localStorage.setItem("theme", theme);
    
  }, [theme, mounted]);

  
  useEffect(() => {
    if (!mounted) return;

    const updateThemePreference = async () => {
      try {
        
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const currentPrefs = await res.json();
          
         
          const updateRes = await fetch("/api/preferences", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...currentPrefs,
              color_scheme: theme,
            }),
          });
          
          if (!updateRes.ok) {
            const errorData = await updateRes.json();
            console.error("Failed to update theme preference:", errorData);
          }
        }
      } catch (error) {
        console.error("Failed to update theme preference:", error);
      }
    };

    
    if (theme !== "system") {
      updateThemePreference();
    }
  }, [theme, mounted]);

  
  if (!mounted) {
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