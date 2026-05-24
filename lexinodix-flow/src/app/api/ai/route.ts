import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider, buildWorkspaceSystemPrompt } from '@/lib/ai/providers';
import type { AIMessage, ApiResponse, AIResponse } from '@/types';
import { z } from 'zod';

// Validation schemas
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
});

const SummarizeSchema = z.object({
  action: z.literal('summarize'),
  content: z.string().max(50000),
});

const RequestSchema = z.discriminatedUnion('action', [ChatSchema, SummarizeSchema]);

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AIResponse>>> {
  try {
    // Auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse & validate body
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: ' + parsed.error.message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const provider = getAIProvider();

    if (data.action === 'summarize') {
      const summary = await provider.summarize(data.content);
      return NextResponse.json({
        success: true,
        data: { content: summary, provider: provider.name },
      });
    }

    // Chat action — fetch context
    let filesContent: string[] = [];
    let notesContent: string[] = [];
    let userName: string | undefined;

    // Get user name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    userName = (profile as any)?.full_name ?? undefined;

    // Fetch notes content (user-scoped — RLS enforced)
    if (data.context?.notes?.length) {
      const { data: notes } = await supabase
        .from('notes')
        .select('title, content_text')
        .in('id', data.context.notes)
        .eq('user_id', user.id); // Explicit user isolation

      notesContent = (notes as any[])?.map(n => `${n.title}\n${n.content_text ?? ''}`) ?? [];
    }

    // Fetch files content (user-scoped — RLS enforced)
    if (data.context?.files?.length) {
      const { data: files } = await supabase
        .from('files')
        .select('original_name, file_type, size_bytes')
        .in('id', data.context.files)
        .eq('user_id', user.id); // Explicit user isolation

      filesContent = (files as any[])?.map(f => `File: ${f.original_name} (${f.file_type})`) ?? [];
    }

    const systemPrompt = buildWorkspaceSystemPrompt({ filesContent, notesContent, userName });

    const result = await provider.chat(data.messages as AIMessage[], systemPrompt);

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('AI API error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
