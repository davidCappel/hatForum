"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import SignOutButton from "./signout";
import Image from "next/image";
import { useTheme } from "./ThemeProvider";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/home" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Hat Forum
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {session && (
              <>
                <Link
                  href="/home"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/home"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/new-post"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/new-post"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  New Post
                </Link>
                <Link
                  href="/preferences"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/preferences"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Preferences
                </Link>

                <div className="flex items-center ml-4">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile picture"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-300 text-sm">
                        {session.user?.name?.[0] || "U"}
                      </span>
                    </div>
                  )}
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {session.user?.name || "User"}
                  </span>
                  <SignOutButton />
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="ml-4 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && session && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href="/home"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/home"
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Home
              </Link>
              <Link
                href="/new-post"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/new-post"
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                New Post
              </Link>
              <Link
                href="/preferences"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/preferences"
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Preferences
              </Link>
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
                <SignOutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}