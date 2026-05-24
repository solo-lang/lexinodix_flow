import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/features/settings/SettingsClient';
import { listAvailableProviders } from '@/lib/ai/providers';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Storage usage
  const { count: noteCount } = await supabase
    .from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  const { count: fileCount } = await supabase
    .from('files').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  const { data: fileSizeData } = await supabase
    .from('files').select('size_bytes').eq('user_id', user.id);

  // تحويل fileSizeData إلى as any[] لمنع أخطاء الـ Type matching في الـ reduce
  const totalBytes = (fileSizeData as any[])?.reduce((sum, f) => sum + (f.size_bytes ?? 0), 0) ?? 0;
  const providers = listAvailableProviders();

  return (
    <SettingsClient
      profile={(profile as any) ?? { id: user.id, email: user.email ?? '', full_name: null, avatar_url: null, created_at: '', updated_at: '' }}
      stats={{ noteCount: noteCount ?? 0, fileCount: fileCount ?? 0, totalBytes }}
      aiProviders={providers}
      activeProvider={process.env.AI_PROVIDER ?? 'grok'}
    />
  );
}
