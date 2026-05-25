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

  // BUG FIX: was using .single() — replaced with .select() array + rows[0]
  // .single() throws if the profile row hasn't been created yet by the DB trigger
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .limit(1);

  const profile = profileRows?.[0] ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string) ?? null,
    avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
    created_at: '',
    updated_at: '',
  };

  // Storage usage stats
  const { count: noteCount } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: fileCount } = await supabase
    .from('files')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: fileSizeRows } = await supabase
    .from('files')
    .select('size_bytes')
    .eq('user_id', user.id);

  const totalBytes = fileSizeRows?.reduce((sum, f) => sum + (f.size_bytes ?? 0), 0) ?? 0;
  const providers = listAvailableProviders();

  return (
    <SettingsClient
      profile={profile}
      stats={{ noteCount: noteCount ?? 0, fileCount: fileCount ?? 0, totalBytes }}
      aiProviders={providers}
      activeProvider={process.env.AI_PROVIDER ?? 'grok'}
    />
  );
}
