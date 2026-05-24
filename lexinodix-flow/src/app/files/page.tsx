import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FileManager from '@/components/features/files/FileManager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Files' };

export default async function FilesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <FileManager initialFiles={files ?? []} userId={user.id} />;
}
