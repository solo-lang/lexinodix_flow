import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types';

const NoteSchema = z.object({
  title: z.string().max(500).default('Untitled Note'),
  content: z.record(z.unknown()),
  content_text: z.string().max(100000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  is_pinned: z.boolean().default(false),
  word_count: z.number().int().min(0).default(0),
  workspace_id: z.string().uuid().optional(),
  folder_id: z.string().uuid().optional(),
});

// ─────────────────────────────────────────────
// POST /api/notes — create note
// BUG FIXED: was using .single() which crashes if RLS blocks the return
// Now uses .select() array form + checks rows[0]
// ─────────────────────────────────────────────
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = NoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
  }

  // Use .select() (array) instead of .select().single() to avoid runtime crash
  const { data: rows, error } = await supabase
    .from('notes')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id');

  if (error) {
    console.error('[Notes API] Insert error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  const noteId = rows?.[0]?.id;
  if (!noteId) {
    return NextResponse.json(
      { success: false, error: 'Note created but ID not returned' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { id: noteId } }, { status: 201 });
}

// ─────────────────────────────────────────────
// PATCH /api/notes?id=xxx — update note
// BUG FIXED: was missing try/catch on JSON parse
// ─────────────────────────────────────────────
export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ updated: boolean }>>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('id');

  if (!noteId) {
    return NextResponse.json({ success: false, error: 'Note ID required' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = NoteSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
  }

  const { error } = await supabase
    .from('notes')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('user_id', user.id); // explicit ownership guard

  if (error) {
    console.error('[Notes API] Update error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { updated: true } });
}

// ─────────────────────────────────────────────
// DELETE /api/notes?id=xxx
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
  const noteId = searchParams.get('id');

  if (!noteId) {
    return NextResponse.json({ success: false, error: 'Note ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id); // explicit ownership guard

  if (error) {
    console.error('[Notes API] Delete error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
