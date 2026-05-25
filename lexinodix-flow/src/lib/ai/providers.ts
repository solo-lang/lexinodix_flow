// ============================================================
// LEXINODIX FLOW — AI PROVIDER ABSTRACTION LAYER
// Modular AI provider system supporting multiple backends.
// ============================================================

import type { AIMessage, AIProvider, AIResponse } from '@/types';

// --- PROVIDER INTERFACE ---
export interface AIProviderInterface {
  name: AIProvider;
  displayName: string;
  chat(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse>;
  summarize(text: string): Promise<string>;
  isAvailable(): boolean;
}

// --- GROQ PROVIDER (llama-3.3-70b-versatile) ---
// NOTE: We use Groq's API (api.groq.com) — NOT xAI.
// The env variable is still named GROK_API_KEY for backwards-compat.
// Model: llama-3.3-70b-versatile (free, fast, high-quality)
class GrokProvider implements AIProviderInterface {
  name: AIProvider = 'grok';
  displayName = 'Groq — Llama 3.3 70B';

  isAvailable(): boolean {
    return !!process.env.GROK_API_KEY;
  }

  async chat(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error('Groq API key not configured. Add GROK_API_KEY to .env.local');
    }

    // Build message list — system prompt goes first if provided
    const allMessages: { role: string; content: string }[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : [...messages];

    // IMPORTANT: Do NOT include 'model' inside the messages array.
    // 'model' is a top-level key only — duplicate keys cause Webpack/Vercel build failures.
    const requestBody = {
      model: 'llama-3.3-70b-versatile',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2048,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    return {
      content,
      provider: this.name,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  async summarize(text: string): Promise<string> {
    const result = await this.chat(
      [
        {
          role: 'user',
          content: `Please provide a concise, intelligent summary of the following content. Focus on key insights, main points, and actionable information. Keep the summary clear and well-structured.\n\n---\n\n${text}`,
        },
      ],
      'You are an intelligent workspace assistant for Lexinodix Flow. Your summaries are clear, concise, and insightful. You focus on extracting the most valuable information.'
    );
    return result.content;
  }
}

// --- OPENAI PROVIDER (Future) ---
class OpenAIProvider implements AIProviderInterface {
  name: AIProvider = 'openai';
  displayName = 'OpenAI GPT-4';

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async chat(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured. Add OPENAI_API_KEY to .env.local');
    }

    const allMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} — ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content ?? '',
      provider: this.name,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  async summarize(text: string): Promise<string> {
    const result = await this.chat([
      { role: 'user', content: `Summarize the following:\n\n${text}` },
    ]);
    return result.content;
  }
}

// --- ANTHROPIC PROVIDER (Future) ---
class AnthropicProvider implements AIProviderInterface {
  name: AIProvider = 'anthropic';
  displayName = 'Claude (Anthropic)';

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async chat(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env.local');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.filter(m => m.role !== 'system'),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} — ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text ?? '',
      provider: this.name,
      usage: {
        prompt_tokens: data.usage?.input_tokens ?? 0,
        completion_tokens: data.usage?.output_tokens ?? 0,
      },
    };
  }

  async summarize(text: string): Promise<string> {
    const result = await this.chat([
      { role: 'user', content: `Summarize the following:\n\n${text}` },
    ]);
    return result.content;
  }
}

// --- PROVIDER REGISTRY ---
const providers: Record<AIProvider, AIProviderInterface> = {
  grok: new GrokProvider(),
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  gemini: {
    name: 'gemini',
    displayName: 'Gemini (Google)',
    isAvailable: () => !!process.env.GOOGLE_AI_API_KEY,
    chat: async () => { throw new Error('Gemini provider not yet implemented'); },
    summarize: async () => { throw new Error('Gemini provider not yet implemented'); },
  },
};

// --- ACTIVE PROVIDER RESOLVER ---
export function getAIProvider(override?: AIProvider): AIProviderInterface {
  const preferred = override ?? (process.env.AI_PROVIDER as AIProvider) ?? 'grok';
  const provider = providers[preferred];

  if (provider && provider.isAvailable()) {
    return provider;
  }

  // Fallback to first available provider
  for (const p of Object.values(providers)) {
    if (p.isAvailable()) return p;
  }

  throw new Error(
    'No AI provider is configured. Please add an API key to .env.local (e.g., GROK_API_KEY)'
  );
}

export function listAvailableProviders(): { name: AIProvider; displayName: string; available: boolean }[] {
  return Object.values(providers).map(p => ({
    name: p.name,
    displayName: p.displayName,
    available: p.isAvailable(),
  }));
}

// --- WORKSPACE SYSTEM PROMPT ---
export function buildWorkspaceSystemPrompt(context?: {
  filesContent?: string[];
  notesContent?: string[];
  userName?: string;
}): string {
  const parts = [
    `You are the Lexinodix Flow AI assistant — an intelligent, calm, and precise workspace companion. Your role is to help users organize information, extract insights, and work more effectively with their files and notes.`,
    ``,
    `Your personality:`,
    `- Calm and precise, never verbose`,
    `- Insightful and analytical`,
    `- Focused on clarity and organization`,
    `- Premium and professional in tone`,
    ``,
    `Guidelines:`,
    `- Be concise. Prefer structured responses when appropriate.`,
    `- Focus on actionable insights.`,
    `- When summarizing, extract key themes and decisions.`,
    `- When answering questions about documents, be accurate and cite context.`,
  ];

  if (context?.userName) {
    parts.push(``, `User: ${context.userName}`);
  }

  if (context?.filesContent?.length) {
    parts.push(``, `--- ATTACHED FILES ---`);
    context.filesContent.forEach((content, i) => {
      parts.push(`File ${i + 1}: ${content.slice(0, 3000)}`);
    });
  }

  if (context?.notesContent?.length) {
    parts.push(``, `--- WORKSPACE NOTES ---`);
    context.notesContent.forEach((content, i) => {
      parts.push(`Note ${i + 1}: ${content.slice(0, 2000)}`);
    });
  }

  return parts.join('\n');
}
