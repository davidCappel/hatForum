// src/app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { auth } from '@/auth';

// Delete a comment
export async function DELETE(
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
    
    // Verify the current user owns this comment
    const { data: comment, error: fetchError } = await adminClient
      .from('comments')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Comment fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 404 });
    }
    
    if (comment.user_id !== session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }
    
    // Delete the comment
    const { error } = await adminClient
      .from('comments')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Comment delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ 
      error: 'Failed to delete comment', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}