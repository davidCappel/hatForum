
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';
import { auth } from '@/auth';

type SortColumn = 'created_at' | 'upvotes' | 'title';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';
  const search = searchParams.get('search') || '';
  const flag = searchParams.get('flag') || '';
  
  let query = supabase
    .from('posts')
    .select('*');
  
  
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  
  
  if (flag) {
    query = query.eq('flag', flag);
  }
  
  
  query = query.order(sort as SortColumn, { ascending: order === 'asc' });
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}


export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { title, content, image_url, external_link, flag, referenced_post_id } = body;
  
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('posts')
    .insert({
      title,
      content: content || null,
      image_url: image_url || null, // Allow null for image_url
      external_link: external_link || null,
      user_id: session.user?.email || '',
      flag: flag || null,
      referenced_post_id: referenced_post_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select();
  
  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data[0]);
}