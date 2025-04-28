// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database
export type Post = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  external_link: string | null;
  created_at: string;
  updated_at: string | null;
  upvotes: number;
  user_id: string;
  flag: 'Question' | 'Opinion' | 'Information' | 'Other' | null;
  referenced_post_id: string | null;
}

export type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
  user?: {
    name?: string;
    image?: string;
  }
}

export type UserPreferences = {
  id: string;
  user_id: string;
  color_scheme: 'light' | 'dark' | 'system';
  show_content_on_feed: boolean;
  show_images_on_feed: boolean;
}