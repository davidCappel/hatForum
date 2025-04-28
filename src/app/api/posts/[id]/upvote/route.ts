// src/app/api/posts/[id]/upvote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';

// Upvote a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const { id } = params;
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Increment the upvotes count for this post
  const { data, error } = await supabase.rpc('increment_upvotes', {
    post_id: id
  });
  
  if (error) {
    // If the RPC function doesn't exist yet, fall back to a direct update
    const { data: post } = await supabase
      .from('posts')
      .select('upvotes')
      .eq('id', id)
      .single();
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ upvotes: (post.upvotes || 0) + 1 })
      .eq('id', id)
      .select();
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json(updatedPost[0]);
  }
  
  return NextResponse.json({ success: true });
}