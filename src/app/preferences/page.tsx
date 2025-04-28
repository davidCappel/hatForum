"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useTheme } from "../components/ThemeProvider";

export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  
  const [showContentOnFeed, setShowContentOnFeed] = useState(false);
  const [showImagesOnFeed, setShowImagesOnFeed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch user preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const prefs = await res.json();
          setShowContentOnFeed(prefs.show_content_on_feed || false);
          setShowImagesOnFeed(prefs.show_images_on_feed || false);
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchPreferences();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");
    
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          color_scheme: theme,
          show_content_on_feed: showContentOnFeed,
          show_images_on_feed: showImagesOnFeed,
        }),
      });
      
      if (res.ok) {
        setSuccessMessage("Preferences saved successfully!");
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "unauthenticated") {
    redirect("/");
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600 dark:text-gray-400">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        User Preferences
      </h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Theme
          </h2>
          
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="theme"
                checked={theme === "light"}
                onChange={() => setTheme("light")}
                className="form-radio text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Light</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="theme"
                checked={theme === "dark"}
                onChange={() => setTheme("dark")}
                className="form-radio text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Dark</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="theme"
                checked={theme === "system"}
                onChange={() => setTheme("system")}
                className="form-radio text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">System</span>
            </label>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Feed Preferences
          </h2>
          
          <div className="space-y-3">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showContentOnFeed}
                onChange={(e) => setShowContentOnFeed(e.target.checked)}
                className="form-checkbox text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Show post content on feed
              </span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showImagesOnFeed}
                onChange={(e) => setShowImagesOnFeed(e.target.checked)}
                className="form-checkbox text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Show post images on feed
              </span>
            </label>
          </div>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            These settings control how posts appear in your home feed. Enabling these options will show more
            content directly in the feed without having to click into each post.
          </p>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
              isSaving ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}