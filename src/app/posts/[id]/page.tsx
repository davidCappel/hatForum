"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Post, Comment } from "@/lib/supabase";

export default function PostDetailPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [referencedPost, setReferencedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Fetch post data
  useEffect(() => {
    if (!id) return;
    
    const fetchPostData = async () => {
      try {
        // Fetch post
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch post");
        }
        
        const postData = await res.json();
        setPost(postData);
        setIsOwner(session?.user?.email === postData.user_id);
        
        // Fetch comments
        const commentsRes = await fetch(`/api/posts/${id}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData);
        }
        
        // If post references another post, fetch it
        if (postData.referenced_post_id) {
          const refPostRes = await fetch(`/api/posts/${postData.referenced_post_id}`);
          if (refPostRes.ok) {
            const refPostData = await refPostRes.json();
            setReferencedPost(refPostData);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchPostData();
    }
  }, [id, session]);

  const handleUpvote = async () => {
    if (!post) return;
    
    try {
      const res = await fetch(`/api/posts/${post.id}/upvote`, {
        method: "POST",
      });
      
      if (res.ok) {
        // Update post with new upvote count
        setPost({
          ...post,
          upvotes: post.upvotes + 1,
        });
      }
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentContent.trim()) return;
    
    setSubmittingComment(true);
    
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: commentContent,
        }),
      });
      
      if (res.ok) {
        const newComment = await res.json();
        setComments([...comments, newComment]);
        setCommentContent("");
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        // Remove comment from list
        setComments(comments.filter(comment => comment.id !== commentId));
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleDeletePost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        router.push("/home");
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600 dark:text-gray-400">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-400">{error || "Post not found"}</p>
          <Link
            href="/home"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/home"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Home
        </Link>
      </div>
      
      {/* Main post */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
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
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {post.title}
          </h1>
          
          <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              Posted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              {post.updated_at && post.updated_at !== post.created_at && (
                <span className="ml-2">
                  (Edited {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })})
                </span>
              )}
            </div>
            
            <div className="flex items-center">
              <button
                onClick={handleUpvote}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-5 h-5 mr-1"
                >
                  <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.968 8.968 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
                </svg>
                Upvote ({post.upvotes})
              </button>
            </div>
          </div>
          
          {/* Referenced Post (if any) */}
          {referencedPost && (
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Referenced Post:
              </h3>
              <Link
                href={`/posts/${referencedPost.id}`}
                className="block hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md"
              >
                <p className="font-semibold text-gray-900 dark:text-white">
                  {referencedPost.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(referencedPost.created_at), "MMMM d, yyyy")}
                </p>
              </Link>
            </div>
          )}
          
          {/* Post content */}
          {post.content && (
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                {post.content}
              </p>
            </div>
          )}
          
          {/* Post image */}
          {post.image_url && (
            <div className="mt-4 mb-6">
              <Image
                src={post.image_url}
                alt={post.title}
                width={800}
                height={500}
                className="rounded-md max-h-[500px] w-auto object-contain"
              />
            </div>
          )}
          
          {/* External link */}
          {post.external_link && (
            <div className="mt-4 mb-6">
              <a
                href={post.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                View External Link
              </a>
            </div>
          )}
          
          {/* Post actions */}
          {isOwner && (
            <div className="mt-6 flex space-x-4">
              <Link
                href={`/posts/${post.id}/edit`}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Edit Post
              </Link>
              
              {confirmDelete ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleDeletePost}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Comments section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Comments ({comments.length})
          </h2>
          
          {/* Add comment form */}
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              placeholder="Add a comment..."
              required
            ></textarea>
            
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentContent.trim()}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                  submittingComment || !commentContent.trim() ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {submittingComment ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </form>
          
          {/* Comments list */}
          {comments.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <div className="flex justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {comment.user?.image ? (
                          <Image
                            src={comment.user.image}
                            alt="User"
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-300 text-sm">
                              {comment.user?.name?.[0] || "U"}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {comment.user?.name || "User"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {session?.user?.email === comment.user_id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete comment"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-2 text-gray-800 dark:text-gray-200 pl-11">
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}