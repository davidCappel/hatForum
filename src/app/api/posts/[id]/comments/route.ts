// src/app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { auth } from '@/auth';

// Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  
  try {
    // Simple query without joins first to see if it works
    const { data, error } = await adminClient
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Comments fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Format the data to include user info from session if needed
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch comments', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Add a comment to a post
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
    const body = await request.json();
    const { content } = body;
    
    // Validate required fields
    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }
    
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    
    // Insert comment
    const { data, error } = await adminClient
      .from('comments')
      .insert({
        post_id: id,
        content,
        user_id: session.user?.email || '',
        created_at: new Date().toISOString(),
      })
      .select();
    
    if (error) {
      console.error('Comment insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Add user info manually
    const commentWithUser = {
      ...data[0],
      user: {
        name: session.user?.name || 'User',
        image: session.user?.image || null
      }
    };
    
    return NextResponse.json(commentWithUser);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ 
      error: 'Failed to create comment', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}