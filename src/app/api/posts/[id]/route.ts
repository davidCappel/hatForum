
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  
  const { data, error } = await supabase
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
  
  
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .single();
  
  if (!post || post.user_id !== session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized to edit this post' }, { status: 403 });
  }
  
  const body = await request.json();
  const { title, content, image_url, external_link, flag } = body;
  
  
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('posts')
    .update({
      title,
      content,
      image_url,
      external_link,
      flag,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data[0]);
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
  
  
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .single();
  
  if (!post || post.user_id !== session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized to delete this post' }, { status: 403 });
  }
  
  
  await supabase
    .from('comments')
    .delete()
    .eq('post_id', id);
  
  
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}