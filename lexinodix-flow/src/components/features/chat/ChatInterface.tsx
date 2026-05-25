'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, FileText, HardDrive, X, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIMessage } from '@/types';

interface ContextItem {
  id: string;
  type: 'file' | 'note';
  name: string;
}

interface ChatInterfaceProps {
  userId: string;
  availableFiles: { id: string; original_name: string; file_type: string }[];
  availableNotes: { id: string; title: string }[];
  initialFileId?: string;
  initialNoteId?: string;
}

const STARTER_PROMPTS = [
  'Summarize everything in my workspace',
  'What are the key themes across my notes?',
  'Help me organize my files by topic',
  'Extract action items from my documents',
];

export default function ChatInterface({
  userId,
  availableFiles,
  availableNotes,
  initialFileId,
  initialNoteId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(false);

  // Context items — pre-populated if URL has ?file= or ?note= param
  const [contextItems, setContextItems] = useState<ContextItem[]>(() => {
    const items: ContextItem[] = [];
    if (initialFileId) {
      const f = availableFiles.find((f) => f.id === initialFileId);
      if (f) items.push({ id: f.id, type: 'file', name: f.original_name });
    }
    if (initialNoteId) {
      const n = availableNotes.find((n) => n.id === initialNoteId);
      if (n) items.push({ id: n.id, type: 'note', name: n.title });
    }
    return items;
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // BUG FIX: store conversationId in a ref so it persists across re-renders
  // without causing extra renders itself
  const conversationIdRef = useRef<string | undefined>(undefined);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Close context picker when clicking outside
  useEffect(() => {
    if (!showContextPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('[data-context-picker]')) {
        setShowContextPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showContextPicker]);

  const addContext = (item: ContextItem) => {
    if (!contextItems.find((c) => c.id === item.id)) {
      setContextItems((prev) => [...prev, item]);
    }
    setShowContextPicker(false);
  };

  const removeContext = (id: string) => {
    setContextItems((prev) => prev.filter((c) => c.id !== id));
  };

  // ─── Send message ─────────────────────────
  const sendMessage = useCallback(
    async (text?: string) => {
      const content = text ?? input.trim();
      if (!content || loading) return;

      const userMessage: AIMessage = { role: 'user', content };

      // Optimistic UI: add user message immediately
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'chat',
            // BUG FIX: was sending stale `messages` state (before the new userMessage).
            // Now reads the current messages from the setter callback is not possible here,
            // so we explicitly build the full array including the new message.
            messages: [...messages, userMessage],
            context: {
              files: contextItems.filter((c) => c.type === 'file').map((c) => c.id),
              notes: contextItems.filter((c) => c.type === 'note').map((c) => c.id),
            },
            // Pass conversationId so the API can update the existing row
            conversationId: conversationIdRef.current,
          }),
        });

        // BUG FIX: was not checking res.ok before parsing JSON.
        // If the server returns HTML (e.g. 500 error page), JSON.parse throws.
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}`);
        }

        const data = await res.json();

        if (data.success) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.data.content },
          ]);
          // Store the conversation ID for subsequent messages
          if (data.data.conversationId) {
            conversationIdRef.current = data.data.conversationId;
          }
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `⚠️ ${data.error ?? 'Something went wrong.'}` },
          ]);
        }
      } catch (err) {
        console.error('[ChatInterface] Send error:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ Connection error. Please check your .env.local API key configuration.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, contextItems]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-130px)] -mx-6 lg:-mx-8 -mt-6 lg:-mt-8">

      {/* ── Chat header ── */}
      <div className="px-6 lg:px-8 py-4 border-b border-warm-border bg-warm-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-dark-navy flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-sora text-sm font-bold text-dark-navy">Flow AI</h2>
            <p className="text-[11px] text-emerald-600 font-medium">
              {contextItems.length > 0
                ? `Synced with ${contextItems.length} item${contextItems.length !== 1 ? 's' : ''}`
                : 'Ready to assist your workspace'}
            </p>
          </div>
        </div>

        {/* Context chips */}
        {contextItems.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {contextItems.map((item) => (
              <span
                key={item.id}
                className="flex items-center gap-1.5 text-[11px] bg-white border border-warm-border px-2.5 py-1 rounded-full font-medium text-dark-navy"
              >
                {item.type === 'file' ? (
                  <HardDrive className="w-3 h-3" />
                ) : (
                  <FileText className="w-3 h-3" />
                )}
                <span className="max-w-[120px] truncate">{item.name}</span>
                <button
                  onClick={() => removeContext(item.id)}
                  className="text-neutral-gray hover:text-dark-navy"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 space-y-4">

        {/* Empty / starter prompts */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-dark-navy mx-auto flex items-center justify-center text-white mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-sora text-base font-semibold text-dark-navy mb-1">Flow AI</h3>
              <p className="text-sm text-neutral-gray max-w-xs">
                Ask anything about your workspace. I can summarize, analyze, and help organize your knowledge.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left p-3 bg-white border border-warm-border rounded-xl text-xs font-medium text-dark-navy hover:border-dark-navy hover:bg-warm-surface transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-dark-navy flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={cn(
                  'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-dark-navy text-white rounded-tr-sm'
                    : 'bg-white border border-warm-border text-dark-navy rounded-tl-sm'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-warm-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-sora font-bold text-[10px] text-dark-navy">
                    {userId.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-dark-navy flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-warm-border px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-warm-accent animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="px-6 lg:px-8 py-4 border-t border-warm-border bg-warm-surface shrink-0">
        <div className="flex items-end gap-3 bg-white border border-warm-border rounded-2xl px-4 py-3 focus-within:border-dark-navy transition-colors">

          {/* Context picker button */}
          <div className="relative shrink-0" data-context-picker>
            <button
              onClick={() => setShowContextPicker((v) => !v)}
              className="p-1 rounded-lg text-neutral-gray hover:text-dark-navy hover:bg-warm-hover transition-colors"
              title="Add file or note as context"
            >
              <Plus className="w-4 h-4" />
            </button>

            {showContextPicker && (
              <div
                data-context-picker
                className="absolute bottom-10 left-0 bg-white border border-warm-border rounded-2xl shadow-luxury-lg z-20 w-64 py-2 max-h-64 overflow-y-auto"
              >
                {availableNotes.length > 0 && (
                  <>
                    <p className="text-label text-neutral-gray px-3 py-1.5">Notes</p>
                    {availableNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() =>
                          addContext({ id: note.id, type: 'note', name: note.title })
                        }
                        disabled={!!contextItems.find((c) => c.id === note.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-dark-navy hover:bg-warm-hover transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-3.5 h-3.5 text-neutral-gray shrink-0" />
                        <span className="truncate">{note.title}</span>
                      </button>
                    ))}
                  </>
                )}

                {availableFiles.length > 0 && (
                  <>
                    <p className="text-label text-neutral-gray px-3 py-1.5 mt-1">Files</p>
                    {availableFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() =>
                          addContext({ id: file.id, type: 'file', name: file.original_name })
                        }
                        disabled={!!contextItems.find((c) => c.id === file.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-dark-navy hover:bg-warm-hover transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-neutral-gray shrink-0" />
                        <span className="truncate">{file.original_name}</span>
                      </button>
                    ))}
                  </>
                )}

                {availableNotes.length === 0 && availableFiles.length === 0 && (
                  <p className="text-xs text-neutral-gray px-3 py-3 text-center">
                    No files or notes yet
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Flow AI anything…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none text-sm text-dark-navy bg-transparent outline-none placeholder:text-neutral-gray/50 max-h-32 disabled:opacity-60"
            style={{ lineHeight: '1.5' }}
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl bg-dark-navy text-white flex items-center justify-center hover:bg-deep-blue transition-colors disabled:opacity-40 shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-[10px] text-neutral-gray mt-2 text-center">
          Flow AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

