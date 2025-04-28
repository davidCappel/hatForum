// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  // Use admin client
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const { id } = params;
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Use admin client
    const adminClient = createAdminClient();
    
    // First check if the user owns this post
    const { data: post, error: fetchError } = await adminClient
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 404 });
    }
    
    if (post.user_id !== session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized to edit this post' }, { status: 403 });
    }
    
    // Get the request body
    const body = await request.json();
    const { title, content, image_url, external_link, flag } = body;
    
    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Prepare update data with null handling
    const updateData = {
      title,
      content: content || null,
      image_url: image_url || null,
      external_link: external_link || null,
      flag: flag || null,
      updated_at: new Date().toISOString(),
    };
    
    // Update the post
    const { data, error } = await adminClient
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Make sure we return data in a serializable format
    return NextResponse.json(data?.[0] || {});
  } catch (error) {
    console.error('Edit post error:', error);
    return NextResponse.json({ 
      error: 'An error occurred while updating the post',
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const { id } = params;
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use admin client
  const adminClient = createAdminClient();
  
  // Check ownership
  const { data: post, error: fetchError } = await adminClient
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .single();
  
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 404 });
  }
  
  if (post.user_id !== session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized to delete this post' }, { status: 403 });
  }
  
  // Delete comments first
  await adminClient
    .from('comments')
    .delete()
    .eq('post_id', id);
  
  // Delete the post
  const { error } = await adminClient
    .from('posts')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}