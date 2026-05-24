import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, FolderOpen, Sparkles, ArrowRight } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Workspace' };

export default async function WorkspacePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora text-xl font-bold text-dark-navy">Workspaces</h1>
          <p className="text-sm text-neutral-gray mt-1">Organize your knowledge into focused spaces</p>
        </div>
        <Link
          href="/workspace/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-navy text-white rounded-xl font-sora text-xs font-semibold hover:bg-deep-blue transition-colors shadow-luxury"
        >
          <Plus className="w-3.5 h-3.5" />
          New Space
        </Link>
      </div>

      {/* AI Context Banner */}
      <div className="p-4 bg-white border border-warm-border rounded-2xl flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dark-navy opacity-40" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-dark-navy" />
        </span>
        <div className="flex-1">
          <h5 className="text-xs font-bold text-dark-navy">AI Context Active</h5>
          <p className="text-[10px] text-neutral-gray">Flow is context-modeling your active workspaces</p>
        </div>
        <Link href="/chat" className="px-3 py-1.5 bg-warm-surface border border-warm-border rounded-lg text-[11px] font-bold text-dark-navy hover:bg-warm-hover transition-colors">
          Open AI →
        </Link>
      </div>

      {/* Workspace Grid */}
      {workspaces && workspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => (
            <Link
              key={ws.id}
              href={`/workspace/${ws.id}`}
              className="bg-white border border-warm-border rounded-2xl p-5 hover:border-dark-navy hover:shadow-luxury transition-all duration-200 group block"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xl shadow-luxury"
                  style={{ backgroundColor: ws.color ?? '#011C26' }}
                >
                  {ws.icon ?? '📁'}
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-gray opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
              </div>
              <h3 className="font-sora text-sm font-bold text-dark-navy mb-1">{ws.name}</h3>
              {ws.description && (
                <p className="text-xs text-neutral-gray leading-relaxed line-clamp-2 mb-3">{ws.description}</p>
              )}
              <p className="text-[10px] text-neutral-gray">Updated {timeAgo(ws.updated_at)}</p>
            </Link>
          ))}

          {/* Add new card */}
          <Link
            href="/workspace/new"
            className="bg-warm-surface border border-dashed border-warm-border rounded-2xl p-5 hover:border-dark-navy hover:bg-warm-hover transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-warm-accent flex items-center justify-center">
              <Plus className="w-5 h-5 text-warm-accent" />
            </div>
            <span className="text-xs font-semibold text-neutral-gray">New Workspace</span>
          </Link>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-warm-hover mx-auto flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-warm-accent" />
          </div>
          <h3 className="font-sora text-lg font-semibold text-dark-navy mb-2">No workspaces yet</h3>
          <p className="text-sm text-neutral-gray max-w-xs mx-auto mb-6">
            Create your first workspace to start organizing your knowledge and projects.
          </p>
          <Link href="/workspace/new" className="btn-primary max-w-[200px] mx-auto block text-center py-3">
            Create Workspace
          </Link>
        </div>
      )}
    </div>
  );
}
