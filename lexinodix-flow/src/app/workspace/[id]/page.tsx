import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, HardDrive, ArrowRight } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Metadata } from 'next';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  // BUG FIX: .select() array instead of .single()
  const { data: rows } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', params.id)
    .limit(1);
  return { title: rows?.[0]?.name ?? 'Workspace' };
}

export default async function WorkspaceDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // BUG FIX: .select() array instead of .single()
  const { data: wsRows } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .limit(1);

  const workspace = wsRows?.[0];
  if (!workspace) notFound();

  const [{ data: notes }, { data: files }] = await Promise.all([
    supabase.from('notes').select('id, title, updated_at, tags')
      .eq('workspace_id', params.id).eq('user_id', user.id)
      .order('updated_at', { ascending: false }).limit(10),
    supabase.from('files').select('id, original_name, file_type, size_bytes, created_at')
      .eq('workspace_id', params.id).eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(10),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Link href="/workspace" className="p-2 rounded-xl text-neutral-gray hover:text-dark-navy hover:bg-warm-hover transition-colors mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-luxury shrink-0"
            style={{ backgroundColor: workspace.color ?? '#011C26' }}
          >
            {workspace.icon ?? '📁'}
          </div>
          <div>
            <h1 className="font-sora text-2xl font-bold text-dark-navy">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-sm text-neutral-gray mt-1">{workspace.description}</p>
            )}
            <p className="text-[11px] text-neutral-gray mt-1">Updated {timeAgo(workspace.updated_at)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href={`/notes/new?workspace=${workspace.id}`} className="flex items-center gap-2 px-4 py-2.5 bg-dark-navy text-white rounded-xl font-sora text-xs font-semibold hover:bg-deep-blue transition-colors shadow-luxury">
          <Plus className="w-3.5 h-3.5" /> New Note
        </Link>
        <Link href={`/files?workspace=${workspace.id}`} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-warm-border text-dark-navy rounded-xl font-sora text-xs font-semibold hover:bg-warm-hover transition-colors">
          <Plus className="w-3.5 h-3.5" /> Upload File
        </Link>
        <Link href={`/chat?workspace=${workspace.id}`} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-warm-border text-dark-navy rounded-xl font-sora text-xs font-semibold hover:bg-warm-hover transition-colors">
          <span className="text-warm-accent">✦</span> Ask AI
        </Link>
      </div>

      {notes && notes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-label text-neutral-gray">Notes ({notes.length})</span>
            <Link href="/notes" className="text-[11px] text-warm-accent font-bold uppercase tracking-wider hover:underline">All Notes</Link>
          </div>
          <div className="space-y-2">
            {notes.map(note => (
              <Link key={note.id} href={`/notes/${note.id}`} className="flex items-center justify-between p-3.5 bg-white border border-warm-border rounded-xl hover:border-dark-navy transition-all group">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-neutral-gray" />
                  <div>
                    <p className="text-sm font-semibold text-dark-navy">{note.title}</p>
                    <p className="text-[11px] text-neutral-gray">{timeAgo(note.updated_at)}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-gray opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {files && files.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-label text-neutral-gray">Files ({files.length})</span>
            <Link href="/files" className="text-[11px] text-warm-accent font-bold uppercase tracking-wider hover:underline">All Files</Link>
          </div>
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-3.5 bg-white border border-warm-border rounded-xl">
                <HardDrive className="w-4 h-4 text-neutral-gray" />
                <div>
                  <p className="text-sm font-semibold text-dark-navy">{file.original_name}</p>
                  <p className="text-[11px] text-neutral-gray">{timeAgo(file.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!notes?.length && !files?.length && (
        <div className="text-center py-12">
          <p className="text-sm text-neutral-gray mb-4">This workspace is empty</p>
          <Link href={`/notes/new?workspace=${workspace.id}`} className="btn-secondary text-sm">Create a note</Link>
        </div>
      )}
    </div>
  );
}
