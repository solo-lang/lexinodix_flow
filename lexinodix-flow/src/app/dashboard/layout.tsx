import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex h-screen bg-warm-bg overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar user={profile ?? { id: user.id, email: user.email ?? '', full_name: user.user_metadata?.full_name ?? null, avatar_url: user.user_metadata?.avatar_url ?? null, created_at: '', updated_at: '' }} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar user={profile ?? { id: user.id, email: user.email ?? '', full_name: user.user_metadata?.full_name ?? null, avatar_url: user.user_metadata?.avatar_url ?? null, created_at: '', updated_at: '' }} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
