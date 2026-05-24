import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';
import { z } from 'zod';

const NoteSchema = z.object({
  title: z.string().min(1).max(200),
  content_text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  workspace_id: z.string().uuid().optional(),
});

// GET /api/notes — fetch user's notes
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any[]>>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');

  let query = supabase
    .from('notes')
    .select('id, title, content_text, created_at, updated_at, tags, workspace_id')
    .eq('user_id', user.id);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data: notes, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: notes ?? [] });
}

// POST /api/notes — create a note
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = NoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
  }

  const { data: note, error } = await (supabase
    .from('notes') as any)
    .insert({ ...parsed.data, user_id: user.id })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { id: note.id } });
}

// PATCH /api/notes?id=xxx — update a note
export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<{ updated: boolean }>>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('id');

  if (!noteId) {
    return NextResponse.json({ success: false, error: 'Note ID required' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = NoteSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
  }

  const { error } = await (supabase
    .from('notes') as any)
    .update(parsed.data)
    .eq('id', noteId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { updated: true } });
}

// DELETE /api/notes?id=xxx — delete a note
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('id');

  if (!noteId) {
    return NextResponse.json({ success: false, error: 'Note ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
