"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function NewPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [flag, setFlag] = useState<string>("");
  const [referencedPostId, setReferencedPostId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [useLocalImage, setUseLocalImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  if (status === "unauthenticated") {
    redirect("/");
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;
    
    setUploadingImage(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Upload to Supabase Storage
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await res.json();
      setUploadingImage(false);
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorMessage('Failed to upload image. Please try again.');
      setUploadingImage(false);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setErrorMessage("Title is required");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      let finalImageUrl = imageUrl;
      
      // If user wants to use a local image, upload it first
      if (useLocalImage && selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          setIsSubmitting(false);
          return; // Stop if upload failed
        }
      }
      
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          image_url: finalImageUrl,
          external_link: externalLink,
          flag,
          referenced_post_id: referencedPostId || null,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create post");
      }
      
      const post = await res.json();
      router.push(`/posts/${post.id}`);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Create a New Post
      </h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          ></textarea>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image
          </label>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="radio"
              id="url-image"
              name="image-source"
              checked={!useLocalImage}
              onChange={() => setUseLocalImage(false)}
            />
            <label htmlFor="url-image" className="text-sm text-gray-700 dark:text-gray-300">
              External URL
            </label>
            
            <input
              type="radio"
              id="local-image"
              name="image-source"
              checked={useLocalImage}
              onChange={() => setUseLocalImage(true)}
            />
            <label htmlFor="local-image" className="text-sm text-gray-700 dark:text-gray-300">
              Upload Image
            </label>
          </div>
          
          {useLocalImage ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Select Image
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile ? selectedFile.name : "No file selected"}
                </span>
              </div>
            </div>
          ) : (
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="https://example.com/image.jpg"
            />
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="externalLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            External Link (where to buy the hat, if applicable)
          </label>
          <input
            type="url"
            id="externalLink"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="https://example.com/hat-shop"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="flag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Post Type
          </label>
          <select
            id="flag"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select Type (Optional)</option>
            <option value="Question">Question</option>
            <option value="Opinion">Opinion</option>
            <option value="Information">Information</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="referencedPostId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reference Another Post (Optional)
          </label>
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <input
              type="text"
              id="referencedPostId"
              value={referencedPostId}
              onChange={(e) => setReferencedPostId(e.target.value)}
              className="flex-grow px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter Post ID to reference"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            If you want to repost or reference another hat post, enter its ID here.
          </p>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || uploadingImage}
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
              (isSubmitting || uploadingImage) ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Creating Post..." : uploadingImage ? "Uploading Image..." : "Create Post"}
          </button>
        </div>
      </form>
    </div>
  );
}