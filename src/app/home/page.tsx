"use client";

import { useEffect, useState, Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

// Create a component that uses searchParams
function HomeContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "created_at");
  const [sortOrder] = useState(searchParams.get("order") || "desc");
  const [selectedFlag, setSelectedFlag] = useState(searchParams.get("flag") || "");
  const [showContent, setShowContent] = useState(false);
  const [showImages, setShowImages] = useState(false);

  // Redirect if no session
  if (status === "unauthenticated") {
    redirect("/");
  }

  useEffect(() => {
    // Load user preferences
    const fetchPreferences = async () => {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const prefs = await res.json();
          setShowContent(prefs.show_content_on_feed || false);
          setShowImages(prefs.show_images_on_feed || false);
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      }
    };

    if (session) {
      fetchPreferences();
    }
  }, [session]);

  useEffect(() => {
    // Fetch posts whenever filters change
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (sortBy) params.append("sort", sortBy);
        if (sortOrder) params.append("order", sortOrder);
        if (searchTerm) params.append("search", searchTerm);
        if (selectedFlag) params.append("flag", selectedFlag);

        const res = await fetch(`/api/posts?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        } else {
          console.error("Failed to fetch posts");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchPosts();
    }
  }, [session, sortBy, sortOrder, searchTerm, selectedFlag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search params without causing a page reload
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (sortBy) params.append("sort", sortBy);
    if (sortOrder) params.append("order", sortOrder);
    if (selectedFlag) params.append("flag", selectedFlag);
    
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Hat Forum Feed
        </h1>
        
        {/* Search and filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="flex space-x-2">
                <select
                  value={selectedFlag}
                  onChange={(e) => setSelectedFlag(e.target.value)}
                  className="px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="Question">Question</option>
                  <option value="Opinion">Opinion</option>
                  <option value="Information">Information</option>
                  <option value="Other">Other</option>
                </select>
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === "created_at"}
                    onChange={() => setSortBy("created_at")}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Newest</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === "upvotes"}
                    onChange={() => setSortBy("upvotes")}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Most Upvoted</span>
                </label>
              </div>
              
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showContent}
                    onChange={(e) => setShowContent(e.target.checked)}
                    className="form-checkbox text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Show Content</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showImages}
                    onChange={(e) => setShowImages(e.target.checked)}
                    className="form-checkbox text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Show Images</span>
                </label>
              </div>
            </div>
          </form>
        </div>
        
        {/* Posts list */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400">No posts found. Be the first to post!</p>
            <Link
              href="/new-post"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create a Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4">
                  {post.flag && (
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2" style={{
                      backgroundColor: post.flag === 'Question' ? '#E3F2FD' : 
                                     post.flag === 'Opinion' ? '#FFF8E1' : 
                                     post.flag === 'Information' ? '#E8F5E9' : '#ECEFF1',
                      color: post.flag === 'Question' ? '#1976D2' : 
                            post.flag === 'Opinion' ? '#FF8F00' : 
                            post.flag === 'Information' ? '#388E3C' : '#607D8B'
                    }}>
                      {post.flag}
                    </span>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {post.title}
                    </h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex space-x-2 items-center">
                      <span>
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          className="w-4 h-4 mr-1 text-blue-600"
                        >
                          <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.968 8.968 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
                        </svg>
                        {post.upvotes}
                      </span>
                    </div>
                  </div>
                  
                  {showContent && post.content && (
                    <div className="mt-2 text-gray-600 dark:text-gray-400">
                      {post.content.length > 150
                        ? `${post.content.substring(0, 150)}...`
                        : post.content}
                    </div>
                  )}
                  
                  {showImages && post.image_url && (
                    <div className="mt-4">
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        width={300}
                        height={200}
                        className="rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}