import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import NoteEditor from '@/components/features/notes/NoteEditor';
import type { Metadata } from 'next';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  // BUG FIX: use .select() array + rows[0] instead of .single()
  const { data: rows } = await supabase
    .from('notes')
    .select('title')
    .eq('id', params.id)
    .limit(1);
  return { title: rows?.[0]?.title ?? 'Note' };
}

export default async function NotePage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // BUG FIX: use .select() array + rows[0] — NOT .single()
  const { data: rows } = await supabase
    .from('notes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id) // ownership guard
    .limit(1);

  const note = rows?.[0];
  if (!note) notFound();

  return (
    <div className="-mx-6 lg:-mx-8 -mt-6 lg:-mt-8 h-[calc(100vh-64px)]">
      <NoteEditor
        noteId={note.id}
        initialData={{
          title: note.title,
          content: note.content as Record<string, unknown>,
          tags: note.tags ?? [],
          is_pinned: note.is_pinned ?? false,
        }}
      />
    </div>
  );
}
