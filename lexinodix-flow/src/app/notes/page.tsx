import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileText, ArrowRight } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notes' };

export default async function NotesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, content_text, tags, updated_at, is_pinned')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  const pinned = notes?.filter(n => n.is_pinned) ?? [];
  const recent = notes?.filter(n => !n.is_pinned) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora text-xl font-bold text-dark-navy">Notes Studio</h1>
          <p className="text-sm text-neutral-gray mt-1">{notes?.length ?? 0} notes in your workspace</p>
        </div>
        <Link
          href="/notes/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-navy text-white rounded-xl font-sora text-xs font-semibold hover:bg-deep-blue transition-colors shadow-luxury"
        >
          <Plus className="w-3.5 h-3.5" />
          New Note
        </Link>
      </div>

      {/* Pinned notes */}
      {pinned.length > 0 && (
        <section>
          <span className="text-label text-neutral-gray block mb-3">Pinned</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pinned.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {/* All notes */}
      {recent.length > 0 && (
        <section>
          {pinned.length > 0 && <span className="text-label text-neutral-gray block mb-3">Recent</span>}
          <div className="space-y-2">
            {recent.map(note => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="flex items-center justify-between p-4 bg-white border border-warm-border rounded-xl hover:border-dark-navy hover:bg-warm-surface transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-neutral-gray shrink-0" />
                  <div className="min-w-0">
                    <h5 className="text-sm font-semibold text-dark-navy truncate">{note.title}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-neutral-gray">{timeAgo(note.updated_at)}</p>
                      {note.tags && note.tags.length > 0 && (
                        <span className="tag">{note.tags[0]}</span>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-gray opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!notes?.length && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-warm-hover mx-auto flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-warm-accent" />
          </div>
          <h3 className="font-sora text-lg font-semibold text-dark-navy mb-2">No notes yet</h3>
          <p className="text-sm text-neutral-gray max-w-xs mx-auto mb-6">
            Start capturing your thoughts, ideas, and knowledge.
          </p>
          <Link href="/notes/new" className="btn-primary max-w-[180px] mx-auto block text-center py-3">
            Create First Note
          </Link>
        </div>
      )}
    </div>
  );
}

function NoteCard({ note }: { note: { id: string; title: string; content_text: string | null; tags: string[]; updated_at: string } }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="bg-white border border-warm-border rounded-2xl p-5 hover:border-dark-navy hover:shadow-luxury transition-all duration-200 group block"
    >
      <div className="flex items-start justify-between mb-3">
        <FileText className="w-4 h-4 text-warm-accent mt-0.5" />
        <ArrowRight className="w-4 h-4 text-neutral-gray opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h4 className="font-sora text-sm font-bold text-dark-navy mb-2 line-clamp-2">{note.title}</h4>
      {note.content_text && (
        <p className="text-xs text-neutral-gray leading-relaxed line-clamp-3 mb-3">{note.content_text}</p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-neutral-gray">{timeAgo(note.updated_at)}</p>
        {note.tags && note.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {note.tags.slice(0, 2).map(tag => (
              <span key={tag} className="tag text-[10px]">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
