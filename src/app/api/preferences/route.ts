// src/app/api/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';

// Get user preferences
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user?.email)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // If no preferences exist yet, return defaults
  if (!data) {
    return NextResponse.json({
      user_id: session.user?.email,
      color_scheme: 'light',
      show_content_on_feed: false,
      show_images_on_feed: false,
    });
  }
  
  return NextResponse.json(data);
}

// Update user preferences
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { color_scheme, show_content_on_feed, show_images_on_feed } = body;
  
  // Check if preferences already exist
  const { data: existingPrefs } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', session.user?.email)
    .single();
  
  let result;
  
  if (existingPrefs) {
    // Update existing preferences
    result = await supabase
      .from('user_preferences')
      .update({
        color_scheme,
        show_content_on_feed,
        show_images_on_feed,
      })
      .eq('user_id', session.user?.email)
      .select();
  } else {
    // Create new preferences
    result = await supabase
      .from('user_preferences')
      .insert({
        user_id: session.user?.email,
        color_scheme,
        show_content_on_feed,
        show_images_on_feed,
      })
      .select();
  }
  
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  
  return NextResponse.json(result.data[0]);
}