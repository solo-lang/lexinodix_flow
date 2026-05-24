import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SearchResult, ApiResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<SearchResult[]>>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Sanitize query to prevent injection
  const safeQuery = query.replace(/[%_]/g, '\\$&').slice(0, 200);

  const results: SearchResult[] = [];

  // Search notes (full-text search on title + content_text)
  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, content_text, created_at, tags')
    .eq('user_id', user.id)
    .or(`title.ilike.%${safeQuery}%,content_text.ilike.%${safeQuery}%`)
    .limit(10);

  notes?.forEach(note => {
    const excerpt = note.content_text
      ? extractExcerpt(note.content_text, safeQuery)
      : null;

    results.push({
      id: note.id,
      type: 'note',
      title: note.title,
      excerpt,
      relevance_score: note.title.toLowerCase().includes(safeQuery.toLowerCase()) ? 1 : 0.5,
      created_at: note.created_at,
      metadata: { tags: note.tags },
    });
  });

  // Search files
  const { data: files } = await supabase
    .from('files')
    .select('id, original_name, file_type, size_bytes, created_at')
    .eq('user_id', user.id)
    .ilike('original_name', `%${safeQuery}%`)
    .limit(10);

  files?.forEach(file => {
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

  // Search workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, description, created_at')
    .eq('user_id', user.id)
    .or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
    .limit(5);

  workspaces?.forEach(ws => {
    results.push({
      id: ws.id,
      type: 'workspace',
      title: ws.name,
      excerpt: ws.description,
      relevance_score: ws.name.toLowerCase().includes(safeQuery.toLowerCase()) ? 0.9 : 0.4,
      created_at: ws.created_at,
      metadata: {},
    });
  });

  // Sort by relevance
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  return NextResponse.json({ success: true, data: results });
}

function extractExcerpt(text: string, query: string, maxLength = 150): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLength);

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  const excerpt = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  return excerpt;
}
