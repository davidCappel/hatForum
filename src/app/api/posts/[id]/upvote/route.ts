// src/app/api/posts/[id]/upvote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
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
  
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    
    // First get the current post to check if it exists
    const { data: post, error: fetchError } = await adminClient
      .from('posts')
      .select('upvotes')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Post fetch error:', fetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Increment the upvotes directly
    const newUpvotes = (post.upvotes || 0) + 1;
    
    const { data, error } = await adminClient
      .from('posts')
      .update({ upvotes: newUpvotes })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Upvote error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error upvoting post:', error);
    return NextResponse.json({ 
      error: 'Failed to upvote post', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}