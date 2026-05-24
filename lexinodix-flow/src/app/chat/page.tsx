import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatInterface from '@/components/features/chat/ChatInterface';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'AI Flow' };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: { file?: string; note?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch recent files & notes for context selection
  const [{ data: files }, { data: notes }] = await Promise.all([
    supabase.from('files').select('id, original_name, file_type').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('notes').select('id, title').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20),
  ]);

  return (
    <ChatInterface
      userId={user.id}
      availableFiles={files ?? []}
      availableNotes={notes ?? []}
      initialFileId={searchParams.file}
      initialNoteId={searchParams.note}
    />
  );
}
