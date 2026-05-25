'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { createClient } from '@/lib/supabase/client';
import { extractNoteTitle, extractPlainText, getWordCount, cn } from '@/lib/utils';
import {
  Bold, Italic, Heading2, List, ListOrdered, Quote,
  Sparkles, Save, ArrowLeft, Tag, Pin, Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface NoteEditorProps {
  noteId?: string;
  initialData?: {
    title: string;
    content: Record<string, unknown>;
    tags: string[];
    is_pinned: boolean;
  };
}

export default function NoteEditor({ noteId, initialData }: NoteEditorProps) {
  const router = useRouter();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(initialData?.is_pinned ?? false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // BUG FIX: store timeout in a ref, NOT state.
  // Storing a Timeout in useState causes an infinite render loop because
  // setSaveTimeout triggers a re-render, which recreates onUpdate, which
  // triggers setSaveTimeout again.
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // BUG FIX: store the current noteId in a ref so the saveNote callback always
  // sees the latest value — even after router.replace() sets a new ID.
  const noteIdRef = useRef<string | undefined>(noteId);
  useEffect(() => {
    noteIdRef.current = noteId;
  }, [noteId]);

  // ─── Core save function ───────────────────
  const saveNote = useCallback(
    async (content: Record<string, unknown>) => {
      setSaving(true);
      setSaveError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSaving(false);
        return;
      }

      const title = extractNoteTitle(content) || 'Untitled Note';
      const contentText = extractPlainText(content);

      const noteData = {
        user_id: user.id,
        title,
        content,
        content_text: contentText,
        tags,
        is_pinned: isPinned,
        word_count: getWordCount(contentText),
        updated_at: new Date().toISOString(),
      };

      if (noteIdRef.current) {
        // ── Update existing note ──
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', noteIdRef.current)
          .eq('user_id', user.id);

        if (error) {
          console.error('[NoteEditor] Update error:', error.message);
          setSaveError(error.message);
        }
      } else {
        // ── Create new note — use .select() array, NOT .single() ──
        const { data: rows, error } = await supabase
          .from('notes')
          .insert(noteData)
          .select('id');

        if (error) {
          console.error('[NoteEditor] Insert error:', error.message);
          setSaveError(error.message);
        } else {
          const newId = rows?.[0]?.id;
          if (newId) {
            noteIdRef.current = newId; // update ref immediately so next autosave uses it
            router.replace(`/notes/${newId}`);
          }
        }
      }

      setSaving(false);
      setLastSaved(new Date());
    },
    // Only depend on stable values — tags/isPinned are read at call time via closure
    [supabase, router, tags, isPinned]
  );

  // ─── Editor setup ─────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your thoughts…' }),
      Highlight,
    ],
    content: initialData?.content ?? {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 1 }, content: [] }],
    },
    editorProps: {
      attributes: { class: 'tiptap-editor focus:outline-none' },
    },
    onUpdate: ({ editor }) => {
      const text = extractPlainText(editor.getJSON());
      setWordCount(getWordCount(text));

      // Debounced autosave — using ref to avoid state-loop bug
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveNote(editor.getJSON());
      }, 2000);
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // ─── Manual save ──────────────────────────
  const handleManualSave = () => {
    if (!editor) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveNote(editor.getJSON());
  };

  // ─── AI summarize ─────────────────────────
  const handleAISummarize = async () => {
    if (!editor) return;
    const text = extractPlainText(editor.getJSON());
    if (!text.trim()) return;

    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summarize', content: text }),
      });

      const data = await res.json();
      if (data.success) {
        setAiResult(data.data.content);
      } else {
        setAiResult(`⚠️ ${data.error ?? 'AI unavailable'}`);
      }
    } catch (err) {
      console.error('[NoteEditor] AI error:', err);
      setAiResult('⚠️ Could not reach AI. Check your API key in .env.local.');
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Tag management ───────────────────────
  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (newTag && !tags.includes(newTag)) {
        setTags((prev) => [...prev, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  if (!editor) return null;

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-10 bg-warm-surface/90 backdrop-blur-sm border-b border-warm-border">

        {/* Top row */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/notes"
              className="p-1.5 rounded-lg text-neutral-gray hover:text-dark-navy hover:bg-warm-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="text-[11px] text-neutral-gray">
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving…
                </span>
              ) : saveError ? (
                <span className="text-red-500">Save failed</span>
              ) : lastSaved ? (
                <span className="text-emerald-600">Saved</span>
              ) : (
                <span>Draft</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-gray hidden sm:inline">
              {wordCount} words
            </span>

            <button
              onClick={() => setIsPinned((p) => !p)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isPinned
                  ? 'text-dark-navy bg-warm-hover'
                  : 'text-neutral-gray hover:text-dark-navy hover:bg-warm-hover'
              )}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className="w-4 h-4" />
            </button>

            <button
              onClick={handleAISummarize}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-warm-accent text-dark-navy rounded-lg text-xs font-semibold hover:bg-warm-hover transition-colors disabled:opacity-50"
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-warm-accent" />
              )}
              <span className="hidden sm:inline">Summarize</span>
            </button>

            <button
              onClick={handleManualSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-navy text-white rounded-lg text-xs font-semibold hover:bg-deep-blue transition-colors disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 px-6 pb-3 flex-wrap">
          {[
            {
              icon: Bold,
              action: () => editor.chain().focus().toggleBold().run(),
              active: editor.isActive('bold'),
              title: 'Bold',
            },
            {
              icon: Italic,
              action: () => editor.chain().focus().toggleItalic().run(),
              active: editor.isActive('italic'),
              title: 'Italic',
            },
            {
              icon: Heading2,
              action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
              active: editor.isActive('heading', { level: 2 }),
              title: 'Heading',
            },
            {
              icon: List,
              action: () => editor.chain().focus().toggleBulletList().run(),
              active: editor.isActive('bulletList'),
              title: 'Bullet List',
            },
            {
              icon: ListOrdered,
              action: () => editor.chain().focus().toggleOrderedList().run(),
              active: editor.isActive('orderedList'),
              title: 'Ordered List',
            },
            {
              icon: Quote,
              action: () => editor.chain().focus().toggleBlockquote().run(),
              active: editor.isActive('blockquote'),
              title: 'Quote',
            },
          ].map(({ icon: Icon, action, active, title }) => (
            <button
              key={title}
              onClick={action}
              title={title}
              className={cn(
                'p-1.5 rounded-lg transition-colors text-sm',
                active
                  ? 'bg-dark-navy text-white'
                  : 'text-neutral-gray hover:text-dark-navy hover:bg-warm-hover'
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor area ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <EditorContent editor={editor} className="max-w-none" />

        {/* Tags row */}
        <div className="mt-8 pt-6 border-t border-warm-border">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-neutral-gray shrink-0" />
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => removeTag(tag)}
                className="tag hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                #{tag} ×
              </button>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Add tag…"
              className="text-xs text-neutral-gray bg-transparent border-none outline-none placeholder:text-neutral-gray/40 w-24"
            />
          </div>
        </div>

        {/* AI Summary panel */}
        {aiResult && (
          <div className="mt-6 p-5 bg-white border border-warm-border rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-dark-navy flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-dark-navy font-sora">AI Summary</span>
              <button
                onClick={() => setAiResult(null)}
                className="ml-auto text-neutral-gray hover:text-dark-navy text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-dark-navy/90 leading-relaxed whitespace-pre-wrap">
              {aiResult}
            </p>
          </div>
        )}

        {/* Save error panel */}
        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium flex justify-between items-center">
            <span>⚠️ Save failed: {saveError}</span>
            <button onClick={() => setSaveError(null)} className="ml-3 text-red-400 hover:text-red-700">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
