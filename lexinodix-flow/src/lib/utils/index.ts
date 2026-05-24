import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

// --- CLASS NAMES ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- DATE FORMATTING ---
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
  return format(new Date(date), pattern);
}

// --- FILE UTILITIES ---
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileType(mimeType: string): 'pdf' | 'docx' | 'txt' | 'image' | 'other' {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (mimeType === 'text/plain') return 'txt';
  if (mimeType.startsWith('image/')) return 'image';
  return 'other';
}

export function getFileIcon(type: string): string {
  const icons: Record<string, string> = {
    pdf: '📄',
    docx: '📝',
    txt: '📃',
    image: '🖼️',
    other: '📎',
  };
  return icons[type] ?? '📎';
}

export function getFileBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    pdf: 'text-red-700 bg-red-50',
    docx: 'text-blue-700 bg-blue-50',
    txt: 'text-gray-700 bg-gray-50',
    image: 'text-purple-700 bg-purple-50',
  };
  return colors[type] ?? 'text-neutral-gray bg-warm-hover';
}

// --- TEXT UTILITIES ---
export function truncate(text: string, length = 80): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '…';
}

export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function extractPlainText(tiptapJson: unknown): string {
  if (!tiptapJson || typeof tiptapJson !== 'object') return '';
  const json = tiptapJson as { content?: unknown[] };
  if (!json.content) return '';

  function extractText(node: unknown): string {
    if (!node || typeof node !== 'object') return '';
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === 'text' && n.text) return n.text;
    if (n.content) return n.content.map(extractText).join(' ');
    return '';
  }

  return json.content.map(extractText).join(' ').replace(/\s+/g, ' ').trim();
}

// --- VALIDATION ---
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- STORAGE PATH ---
export function buildStoragePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}_${sanitized}`;
}

// --- NOTE TITLE EXTRACTION ---
export function extractNoteTitle(tiptapJson: unknown): string {
  if (!tiptapJson || typeof tiptapJson !== 'object') return 'Untitled Note';
  const json = tiptapJson as { content?: unknown[] };
  if (!json.content?.length) return 'Untitled Note';

  const firstBlock = json.content[0] as { type?: string; content?: { text?: string }[] };
  if (firstBlock?.content?.length) {
    const text = firstBlock.content.map(n => n.text ?? '').join('');
    if (text.trim()) return text.trim().slice(0, 100);
  }

  return 'Untitled Note';
}

// --- WORKSPACE COLORS ---
export const WORKSPACE_COLORS = [
  '#011C26', // dark-navy
  '#072A40', // deep-blue
  '#BFACA4', // warm-accent
  '#4F5459', // neutral-gray
  '#6B8E7F', // sage
  '#8B7B6B', // earth
  '#5B6E8C', // slate-blue
  '#7A6E5F', // warm-brown
];
