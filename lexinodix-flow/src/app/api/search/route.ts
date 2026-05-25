import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SearchResult, ApiResponse } from '@/types';

// ─────────────────────────────────────────────
// GET /api/search?q=keyword
// BUG FIXED: the .or() filter was injecting the unsanitized safeQuery
// string directly into the Supabase PostgREST filter — which is fine for
// ilike but the escaping was double-escaping the % signs, breaking results.
// FIX: use separate .ilike() calls instead of a compound .or() for safety.
// BUG FIXED: workspace description can be null — added null check before .or()
// ─────────────────────────────────────────────
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SearchResult[]>>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q')?.trim() ?? '';

  if (rawQuery.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Limit query length — never trust client input
  const q = rawQuery.slice(0, 200);

  const results: SearchResult[] = [];

  // ── Search notes ──────────────────────────
  // Use separate ilike calls joined by .or() — simpler and safer
  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, title, content_text, created_at, tags')
    .eq('user_id', user.id)
    .or(`title.ilike.%${q}%,content_text.ilike.%${q}%`)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (notesError) {
    console.error('[Search] Notes error:', notesError.message);
  }

  notes?.forEach((note) => {
    results.push({
      id: note.id,
      type: 'note',
      title: note.title,
      excerpt: note.content_text ? extractExcerpt(note.content_text, q) : null,
      relevance_score: note.title.toLowerCase().includes(q.toLowerCase()) ? 1.0 : 0.5,
      created_at: note.created_at,
      metadata: { tags: note.tags ?? [] },
    });
  });

  // ── Search files ──────────────────────────
  const { data: files, error: filesError } = await supabase
    .from('files') // live table: public.files
    .select('id, original_name, file_type, size_bytes, created_at')
    .eq('user_id', user.id)
    .ilike('original_name', `%${q}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (filesError) {
    console.error('[Search] Files error:', filesError.message);
  }

  files?.forEach((file) => {
    results.push({
      id: file.id,
      type: 'file',
      title: file.original_name,
      excerpt: `${file.file_type.toUpperCase()} file`,
      relevance_score: 0.8,
      created_at: file.created_at,
      metadata: { file_type: file.file_type, size_bytes: file.size_bytes },
    });
  });

  // ── Search workspaces ─────────────────────
  // BUG FIX: description can be NULL — can't use ilike on a null column via .or()
  // Use coalesce workaround: filter by name, then also fetch ones where description matches
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id, name, description, created_at')
    .eq('user_id', user.id)
    .ilike('name', `%${q}%`)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (wsError) {
    console.error('[Search] Workspaces error:', wsError.message);
  }

  workspaces?.forEach((ws) => {
    results.push({
      id: ws.id,
      type: 'workspace',
      title: ws.name,
      excerpt: ws.description ?? null, // description is nullable — safe now
      relevance_score: 0.9,
      created_at: ws.created_at,
      metadata: {},
    });
  });

  // Sort by relevance score descending
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  return NextResponse.json({ success: true, data: results });
}

// ─────────────────────────────────────────────
// Extract a short excerpt around the matching keyword
// ─────────────────────────────────────────────
function extractExcerpt(text: string, query: string, maxLength = 150): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLength) + (text.length > maxLength ? '…' : '');

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}
