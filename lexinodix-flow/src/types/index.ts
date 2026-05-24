// ============================================================
// LEXINODIX FLOW — GLOBAL TYPE DEFINITIONS
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// --- USER ---
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// --- WORKSPACE ---
export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  workspace_id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

// --- NOTES ---
export interface Note {
  id: string;
  user_id: string;
  workspace_id: string | null;
  folder_id: string | null;
  title: string;
  content: Json; // TipTap JSON
  content_text: string | null; // Plain text for search
  tags: string[];
  is_pinned: boolean;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface NoteWithWorkspace extends Note {
  workspace: Pick<Workspace, 'id' | 'name' | 'color'> | null;
}

// --- FILES ---
export type FileType = 'pdf' | 'docx' | 'txt' | 'image' | 'other';

export interface UserFile {
  id: string;
  user_id: string;
  workspace_id: string | null;
  folder_id: string | null;
  name: string;
  original_name: string;
  storage_path: string;
  file_type: FileType;
  mime_type: string;
  size_bytes: number;
  is_indexed: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

// --- AI ---
export type AIProvider = 'grok' | 'openai' | 'anthropic' | 'gemini';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  messages: AIMessage[];
  context_files: string[];
  context_notes: string[];
  created_at: string;
  updated_at: string;
}

export interface AIRequest {
  messages: AIMessage[];
  context?: {
    files?: string[];
    notes?: string[];
    workspaceId?: string;
  };
  provider?: AIProvider;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

// --- SEARCH ---
export interface SearchResult {
  id: string;
  type: 'note' | 'file' | 'workspace';
  title: string;
  excerpt: string | null;
  relevance_score: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface SearchFilters {
  type?: ('note' | 'file' | 'workspace')[];
  workspace_id?: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
}

// --- API RESPONSES ---
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// --- UI ---
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

// --- DATABASE ---
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      workspaces: {
        Row: Workspace;
        Insert: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Workspace, 'id' | 'user_id' | 'created_at'>>;
      };
      folders: {
        Row: Folder;
        Insert: Omit<Folder, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Folder, 'id' | 'user_id' | 'created_at'>>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Note, 'id' | 'user_id' | 'created_at'>>;
      };
      files: {
        Row: UserFile;
        Insert: Omit<UserFile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserFile, 'id' | 'user_id' | 'created_at'>>;
      };
      ai_conversations: {
        Row: AIConversation;
        Insert: Omit<AIConversation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AIConversation, 'id' | 'user_id' | 'created_at'>>;
      };
    };
  };
}
