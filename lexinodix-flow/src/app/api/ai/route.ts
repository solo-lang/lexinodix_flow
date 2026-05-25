import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider, buildWorkspaceSystemPrompt } from '@/lib/ai/providers';
import type { AIMessage, ApiResponse, AIResponse } from '@/types';
import { z } from 'zod';

const ChatSchema = z.object({
  action: z.literal('chat'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(10000),
  })).max(50),
  context: z.object({
    files: z.array(z.string().uuid()).max(10).optional(),
    notes: z.array(z.string().uuid()).max(10).optional(),
  }).optional(),
  conversationId: z.string().uuid().optional(),
});

const SummarizeSchema = z.object({
  action: z.literal('summarize'),
  content: z.string().max(50000),
});

const RequestSchema = z.discriminatedUnion('action', [ChatSchema, SummarizeSchema]);

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AIResponse>>> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }

    const data = parsed.data;
    const provider = getAIProvider();

    // ── Summarize ──
    if (data.action === 'summarize') {
      const summary = await provider.summarize(data.content);
      return NextResponse.json({ success: true, data: { content: summary, provider: provider.name } });
    }

    // ── Chat: build context ──
    let filesContent: string[] = [];
    let notesContent: string[] = [];
    let userName: string | undefined;

    // BUG FIX: was using .single() — replaced with .select() array + rows[0]
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .limit(1);
    userName = profileRows?.[0]?.full_name ?? undefined;

    if (data.context?.notes?.length) {
      const { data: notes } = await supabase
        .from('notes')
        .select('title, content_text')
        .in('id', data.context.notes)
        .eq('user_id', user.id);
      notesContent = notes?.map(n => `${n.title}\n${n.content_text ?? ''}`) ?? [];
    }

    if (data.context?.files?.length) {
      const { data: files } = await supabase
        .from('files')
        .select('original_name, file_type')
        .in('id', data.context.files)
        .eq('user_id', user.id);
      filesContent = files?.map(f => `File: ${f.original_name} (${f.file_type})`) ?? [];
    }

    const systemPrompt = buildWorkspaceSystemPrompt({ filesContent, notesContent, userName });
    const result = await provider.chat(data.messages as AIMessage[], systemPrompt);

    // ── Persist to public.ai_conversations (non-fatal) ──
    try {
      const allMessages: AIMessage[] = [
        ...data.messages,
        { role: 'assistant', content: result.content },
      ];

      if (data.conversationId) {
        await supabase
          .from('ai_conversations')
          .update({ messages: allMessages as any, updated_at: new Date().toISOString() })
          .eq('id', data.conversationId)
          .eq('user_id', user.id);
      } else {
        const title = data.messages.find(m => m.role === 'user')?.content?.slice(0, 80) ?? 'New Conversation';
        await supabase.from('ai_conversations').insert({
          user_id: user.id,
          title,
          messages: allMessages as any,
          context_files: (data.context?.files ?? []) as any,
          context_notes: (data.context?.notes ?? []) as any,
        });
      }
    } catch (persistErr) {
      console.error('[AI Route] Failed to persist conversation:', persistErr);
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('[AI Route] Unhandled error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
