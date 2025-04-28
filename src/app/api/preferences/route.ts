// src/app/api/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { auth } from '@/auth';

// Get user preferences
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user?.email)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Preferences fetch error:', error);
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
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch preferences', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Update user preferences
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { color_scheme, show_content_on_feed, show_images_on_feed } = body;
    
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    
    // Check if preferences already exist
    const { data: existingPrefs, error: checkError } = await adminClient
      .from('user_preferences')
      .select('id')
      .eq('user_id', session.user?.email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check preferences error:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    let result;
    
    if (existingPrefs) {
      // Update existing preferences
      result = await adminClient
        .from('user_preferences')
        .update({
          color_scheme: color_scheme || 'light',
          show_content_on_feed: show_content_on_feed ?? false,
          show_images_on_feed: show_images_on_feed ?? false,
        })
        .eq('user_id', session.user?.email)
        .select();
    } else {
      // Create new preferences
      result = await adminClient
        .from('user_preferences')
        .insert({
          user_id: session.user?.email,
          color_scheme: color_scheme || 'light',
          show_content_on_feed: show_content_on_feed ?? false,
          show_images_on_feed: show_images_on_feed ?? false,
        })
        .select();
    }
    
    if (result.error) {
      console.error('Update preferences error:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    
    return NextResponse.json(result.data[0]);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ 
      error: 'Failed to update preferences', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}