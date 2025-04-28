// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/lib/supabase';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds the limit (5MB)' }, { status: 400 });
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `user_upload/${fileName}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use admin client to bypass RLS with retry logic
    const adminClient = createAdminClient();
    
    // Retry logic for upload
    let retries = 3;
    let uploadError = null;
    let data = null;
    
    while (retries > 0) {
      try {
        const result = await adminClient.storage
          .from('hat-images')
          .upload(filePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });
          
        if (result.error) {
          uploadError = result.error;
          retries--;
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        data = result.data;
        uploadError = null;
        break;
      } catch (err) {
        uploadError = err;
        retries--;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (uploadError || !data) {
      console.error('Supabase storage error after retries:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: uploadError
      }, { status: 500 });
    }
    
    // Get public URL
    const { data: publicUrlData } = adminClient.storage
      .from('hat-images')
      .getPublicUrl(filePath);
    
    return NextResponse.json({ url: publicUrlData.publicUrl });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}