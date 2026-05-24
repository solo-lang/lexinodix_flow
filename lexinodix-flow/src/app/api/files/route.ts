import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

// DELETE /api/files?id=xxx
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json({ success: false, error: 'File ID required' }, { status: 400 });
  }

  // Fetch file — ensures ownership (RLS also enforces this)
  const { data: file } = await supabase
    .from('files')
    .select('storage_path, user_id')
    .eq('id', fileId)
    .eq('user_id', user.id) // Explicit ownership check
    .single();

  if (!file) {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }

  // Remove from storage
  const { error: storageError } = await supabase.storage
    .from('user-files')
    .remove([(file as any).storage_path]);

  if (storageError) {
    console.error('Storage delete error:', storageError);
  }

  // Remove from database
  await supabase.from('files').delete().eq('id', fileId).eq('user_id', user.id);

  return NextResponse.json({ success: true, data: { deleted: true } });
}

// GET /api/files/url?id=xxx — generate signed URL
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ url: string }>>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json({ success: false, error: 'File ID required' }, { status: 400 });
  }

  const { data: file } = await supabase
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single();

  if (!file) {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }

  const { data: signedUrl } = await supabase.storage
    .from('user-files')
    .createSignedUrl((file as any).storage_path, 3600); // 1 hour expiry

  if (!signedUrl?.signedUrl) {
    return NextResponse.json({ success: false, error: 'Could not generate URL' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { url: signedUrl.signedUrl } });
}
