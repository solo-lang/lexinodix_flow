'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import { formatFileSize, getFileIcon, getFileBadgeColor, getFileType, buildStoragePath, timeAgo } from '@/lib/utils';
import { HardDrive, Plus, Loader2, MoreHorizontal, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserFile } from '@/types';
import Link from 'next/link';

type Filter = 'all' | 'pdf' | 'docx' | 'txt' | 'image';

interface FileManagerProps {
  initialFiles: UserFile[];
  userId: string;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export default function FileManager({ initialFiles, userId }: FileManagerProps) {
  const [files, setFiles] = useState<UserFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const supabase = createClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    setUploading(true);

    for (const file of acceptedFiles) {
      try {
        const storagePath = buildStoragePath(userId, file.name);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(storagePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        // وضعنا الـ as any هنا مباشرة بعد اسم الجدول لتدمير قيود الـ TypeScript تماماً
        const fileType = getFileType(file.type);
        const { data: newFile, error: dbError } = await (supabase
          .from('files') as any)
          .insert({
            user_id: userId,
            name: storagePath.split('/').pop()!,
            original_name: file.name,
            storage_path: storagePath,
            file_type: fileType,
            mime_type: file.type,
            size_bytes: file.size,
            is_indexed: false,
            metadata: {},
          })
          .select()
          .single();

        if (dbError) throw dbError;
        if (newFile) setFiles(prev => [newFile, ...prev]);

      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setUploading(false);
  }, [userId, supabase]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const deleteFile = async (file: UserFile) => {
    // Remove from storage
    await supabase.storage.from('user-files').remove([file.storage_path]);
    // تأمين عملية الحذف أيضاً بـ as any
    await (supabase.from('files') as any).delete().eq('id', file.id).eq('user_id', userId);
    setFiles(prev => prev.filter(f => f.id !== file.id));
    setOpenMenu(null);
  };

  const filteredFiles = filter === 'all' ? files : files.filter(f => f.file_type === filter);
  const filters: { label: string; value: Filter }[] = [
    { label: 'All Assets', value: 'all' },
    { label: 'PDFs', value: 'pdf' },
    { label: 'Documents', value: 'docx' },
    { label: 'Text', value: 'txt' },
    { label: 'Images', value: 'image' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora text-xl font-bold text-dark-navy">Files Locker</h1>
          <p className="text-sm text-neutral-gray mt-1">{files.length} files stored securely</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-dark-navy bg-warm-hover scale-[1.01]'
            : 'border-warm-accent bg-white hover:bg-warm-surface hover:border-dark-navy'
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-dark-navy animate-spin" />
            <p className="text-sm font-semibold text-dark-navy">Uploading…</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">☁️</div>
            <h5 className="font-sora text-sm font-bold text-dark-navy mb-1">
              {isDragActive ? 'Drop your files here' : 'Drop files into the vault'}
            </h5>
            <p className="text-xs text-neutral-gray">PDF, DOCX, TXT, PNG, JPG up to 50MB</p>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full font-medium transition-all',
              filter === f.value
                ? 'bg-dark-navy text-white'
                : 'bg-white text-neutral-gray border border-warm-border hover:text-dark-navy hover:border-dark-navy'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* File List */}
      {filteredFiles.length > 0 ? (
        <div className="space-y-2">
          <span className="text-label text-neutral-gray block">
            {filter === 'all' ? 'All Files' : filters.find(f => f.value === filter)?.label}
            <span className="ml-2 font-normal lowercase text-[10px]">({filteredFiles.length})</span>
          </span>

          {filteredFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-4 bg-white border border-warm-border rounded-xl hover:border-dark-navy transition-all duration-200 group"
            >
              {/* File Type Icon */}
              <div className="w-10 h-12 bg-warm-surface border border-warm-border rounded-lg flex flex-col items-center justify-center gap-1 shrink-0">
                <span className={cn('text-[9px] font-bold uppercase', getFileBadgeColor(file.file_type).split(' ')[0])}>
                  {file.file_type.toUpperCase()}
                </span>
                <span className="text-lg leading-none">{getFileIcon(file.file_type)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <h6 className="text-sm font-semibold text-dark-navy truncate">{file.original_name}</h6>
                <p className="text-[11px] text-neutral-gray mt-0.5">
                  {formatFileSize(file.size_bytes)} · {timeAgo(file.created_at)}
                  {file.is_indexed && <span className="ml-2 text-emerald-600 font-medium">· AI indexed</span>}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/chat?file=${file.id}`}
                  className="p-1.5 rounded-lg text-neutral-gray hover:text-dark-navy hover:bg-warm-hover transition-colors"
                  title="Ask AI about this file"
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === file.id ? null : file.id)}
                    className="p-1.5 rounded-lg text-neutral-gray hover:text-dark-navy hover:bg-warm-hover transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {openMenu === file.id && (
                    <div className="absolute right-0 top-8 bg-white border border-warm-border rounded-xl shadow-luxury-lg z-10 min-w-[140px] py-1">
                      <button
                        onClick={() => deleteFile(file)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete file
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <HardDrive className="w-10 h-10 text-warm-accent mx-auto mb-3" />
          <p className="text-sm text-neutral-gray">
            {filter === 'all' ? 'No files uploaded yet' : `No ${filter} files`}
          </p>
        </div>
      )}
    </div>
  );
}
