'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { WORKSPACE_COLORS } from '@/lib/utils';
import { ArrowLeft, Check } from 'lucide-react';

const WORKSPACE_ICONS = ['📁', '🚀', '💡', '📊', '🎯', '🔬', '📚', '🎨', '⚙️', '🌿', '💎', '🏗️'];

export default function NewWorkspacePage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(WORKSPACE_COLORS[0]);
  const [icon, setIcon] = useState('📁');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // BUG FIX: use .select() array + rows[0] instead of .single()
    const { data: rows, error: dbError } = await supabase
      .from('workspaces')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        color,
        icon,
      })
      .select('id');

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    const newId = rows?.[0]?.id;
    if (newId) {
      router.push(`/workspace/${newId}`);
    } else {
      setError('Workspace created but could not retrieve ID. Please refresh.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/workspace" className="p-2 rounded-xl text-neutral-gray hover:text-dark-navy hover:bg-warm-hover transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-sora text-xl font-bold text-dark-navy">New Workspace</h1>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-4 p-5 bg-white border border-warm-border rounded-2xl">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-luxury" style={{ backgroundColor: color }}>
            {icon}
          </div>
          <div>
            <p className="font-sora text-base font-bold text-dark-navy">{name || 'Workspace name'}</p>
            <p className="text-xs text-neutral-gray">{description || 'Description…'}</p>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-gray mb-2">Workspace Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Product Strategy 2026" required maxLength={100} className="input-field" />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-gray mb-2">Description (Optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this workspace for?" rows={3} maxLength={500} className="input-field resize-none" />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-gray mb-2">Icon</label>
          <div className="flex gap-2 flex-wrap">
            {WORKSPACE_ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)}
                className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${icon === ic ? 'bg-dark-navy shadow-luxury scale-110' : 'bg-warm-hover hover:bg-warm-border'}`}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-gray mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {WORKSPACE_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className="w-8 h-8 rounded-lg relative transition-transform hover:scale-110"
                style={{ backgroundColor: c }}>
                {color === c && <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading || !name.trim()} className="btn-primary">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating…
            </span>
          ) : 'Create Workspace'}
        </button>
      </form>
    </div>
  );
}
