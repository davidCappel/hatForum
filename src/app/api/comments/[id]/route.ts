// src/app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
  
  // Verify the current user owns this comment
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', id)
    .single();
  
  if (!comment || comment.user_id !== session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
  }
  
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}