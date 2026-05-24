import NoteEditor from '@/components/features/notes/NoteEditor';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Note' };

export default function NewNotePage() {
  return (
    <div className="-mx-6 lg:-mx-8 -mt-6 lg:-mt-8 h-[calc(100vh-64px)]">
      <NoteEditor />
    </div>
  );
}
