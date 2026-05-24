import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { timeAgo, formatFileSize, getFileIcon } from '@/lib/utils';
import { FolderOpen, FileText, HardDrive, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Parallel data fetching
  const [
    { data: recentNotes },
    { data: recentFiles },
    { data: workspaces },
    { count: noteCount },
    { count: fileCount },
  ] = await Promise.all([
    supabase.from('notes').select('id, title, updated_at, tags').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(4),
    supabase.from('files').select('id, original_name, file_type, size_bytes, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('workspaces').select('id, name, color, icon').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('files').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const stats = [
    { label: 'Workspaces', value: workspaces?.length ?? 0, icon: FolderOpen, href: '/workspace', color: 'text-deep-blue' },
    { label: 'Notes', value: noteCount ?? 0, icon: FileText, href: '/notes', color: 'text-neutral-gray' },
    { label: 'Files', value: fileCount ?? 0, icon: HardDrive, href: '/files', color: 'text-warm-accent' },
  ];

  return (
    <div className="space-y-8 pb-24 lg:pb-0">

      {/* AI Quick Actions */}
      <div className="bg-white border border-warm-border rounded-3xl p-6 shadow-luxury">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-dark-navy flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-sora text-sm font-semibold text-dark-navy">Flow AI</h2>
            <p className="text-[11px] text-neutral-gray">Context-aware workspace intelligence</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link href="/chat" className="flex items-center gap-1.5 px-3 py-2 bg-warm-surface border border-warm-border rounded-xl text-xs font-semibold text-dark-navy hover:bg-warm-hover transition-colors">
            <span className="text-warm-accent">✦</span> Ask Flow AI
          </Link>
          <Link href="/notes/new" className="flex items-center gap-1.5 px-3 py-2 bg-warm-surface border border-warm-border rounded-xl text-xs font-semibold text-dark-navy hover:bg-warm-hover transition-colors">
            <span>✍️</span> Quick Draft
          </Link>
          <Link href="/files" className="flex items-center gap-1.5 px-3 py-2 bg-warm-surface border border-warm-border rounded-xl text-xs font-semibold text-dark-navy hover:bg-warm-hover transition-colors">
            <span>☁️</span> Upload File
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white border border-warm-border rounded-2xl p-4 hover:border-dark-navy hover:shadow-luxury transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <ArrowRight className="w-3.5 h-3.5 text-neutral-gray opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="font-sora text-2xl font-bold text-dark-navy">{stat.value}</p>
              <p className="text-[11px] text-neutral-gray mt-0.5 font-medium">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Workspaces */}
      {workspaces && workspaces.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-label text-neutral-gray">Active Workspaces</span>
            <Link href="/workspace" className="text-[11px] text-warm-accent font-bold uppercase tracking-wider hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {workspaces.map(ws => (
              <Link
                key={ws.id}
                href={`/workspace/${ws.id}`}
                className="bg-white border border-warm-border rounded-2xl p-4 hover:border-dark-navy hover:shadow-luxury transition-all duration-200 group"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: ws.color ?? '#011C26' }}
                  >
                    {ws.icon ?? '📁'}
                  </div>
                  <span className="font-sora text-xs font-semibold text-dark-navy truncate group-hover:text-dark-navy">
                    {ws.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Notes */}
      {recentNotes && recentNotes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-label text-neutral-gray">Recent Notes</span>
            <Link href="/notes" className="text-[11px] text-warm-accent font-bold uppercase tracking-wider hover:underline">
              All Notes
            </Link>
          </div>
          <div className="space-y-2">
            {recentNotes.map(note => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="flex items-center justify-between p-4 bg-white border border-warm-border rounded-xl hover:border-dark-navy hover:bg-warm-surface transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-neutral-gray shrink-0" />
                  <div className="min-w-0">
                    <h5 className="text-sm font-semibold text-dark-navy truncate">{note.title}</h5>
                    <p className="text-[11px] text-neutral-gray">{timeAgo(note.updated_at)}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-gray opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Files */}
      {recentFiles && recentFiles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-label text-neutral-gray">Recent Files</span>
            <Link href="/files" className="text-[11px] text-warm-accent font-bold uppercase tracking-wider hover:underline">
              All Files
            </Link>
          </div>
          <div className="space-y-2">
            {recentFiles.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-white border border-warm-border rounded-xl hover:border-dark-navy transition-all duration-200"
              >
                <span className="text-lg">{getFileIcon(file.file_type)}</span>
                <div className="flex-1 min-w-0">
                  <h6 className="text-xs font-semibold text-dark-navy truncate">{file.original_name}</h6>
                  <p className="text-[10px] text-neutral-gray">{formatFileSize(file.size_bytes)} · {timeAgo(file.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!recentNotes?.length && !recentFiles?.length && !workspaces?.length) && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-warm-hover mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-warm-accent" />
          </div>
          <h3 className="font-sora text-lg font-semibold text-dark-navy mb-2">Your workspace awaits</h3>
          <p className="text-sm text-neutral-gray max-w-xs mx-auto mb-6">
            Start by creating a workspace, drafting a note, or uploading your first file.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/workspace" className="btn-secondary text-sm">Create Workspace</Link>
            <Link href="/notes/new" className="btn-primary text-sm max-w-[160px]">New Note</Link>
          </div>
        </div>
      )}
    </div>
  );
}
