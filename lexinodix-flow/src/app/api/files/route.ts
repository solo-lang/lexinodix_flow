import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

// ─────────────────────────────────────────────
// DELETE /api/files?id=xxx
// BUG FIXED: was using .single() — crashes if RLS blocks the return row.
// Now uses .select() array form, checks rows[0].
// BUG FIXED: was not returning error when DB delete fails — now does.
// ─────────────────────────────────────────────
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json({ success: false, error: 'File ID required' }, { status: 400 });
  }

  // Fetch the file row to get its storage_path — also verifies ownership
  // Use .select() (array) NOT .single() to avoid crash when RLS is disabled/misconfigured
  const { data: rows, error: fetchError } = await supabase
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .eq('user_id', user.id); // explicit ownership guard

  if (fetchError) {
    console.error('[Files API] Fetch error:', fetchError.message);
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  const file = rows?.[0];
  if (!file) {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }

  // Step 1: Remove from Supabase Storage bucket 'user-files'
  const { error: storageError } = await supabase.storage
    .from('user-files')
    .remove([file.storage_path]);

  if (storageError) {
    // Non-fatal: log but continue to remove DB record
    console.error('[Files API] Storage delete error:', storageError.message);
  }

  // Step 2: Remove metadata from public.files
  const { error: dbError } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', user.id); // ownership guard (redundant but safe)

  if (dbError) {
    console.error('[Files API] DB delete error:', dbError.message);
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}

// ─────────────────────────────────────────────
// GET /api/files?id=xxx — generate a signed URL (1 hour)
// BUG FIXED: was using .single() — replaced with array + rows[0]
// ─────────────────────────────────────────────
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ url: string }>>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json({ success: false, error: 'File ID required' }, { status: 400 });
  }

  // Use .select() array — do NOT use .single()
  const { data: rows, error: fetchError } = await supabase
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .eq('user_id', user.id);

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  const file = rows?.[0];
  if (!file) {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }

  const { data: signedData, error: signError } = await supabase.storage
    .from('user-files')
    .createSignedUrl(file.storage_path, 3600); // expires in 1 hour

  if (signError || !signedData?.signedUrl) {
    console.error('[Files API] Signed URL error:', signError?.message);
    return NextResponse.json(
      { success: false, error: 'Could not generate signed URL' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { url: signedData.signedUrl } });
}
