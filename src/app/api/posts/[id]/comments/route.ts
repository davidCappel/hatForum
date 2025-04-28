// src/app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';

// Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:user_id (
        name,
        image
      )
    `)
    .eq('post_id', id)
    .order('created_at', { ascending: true });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
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
  
  const body = await request.json();
  const { content } = body;
  
  // Validate required fields
  if (!content) {
    return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: id,
      content,
      user_id: session.user?.email || '',
      created_at: new Date().toISOString(),
    })
    .select(`
      *,
      user:user_id (
        name,
        image
      )
    `);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data[0]);
}