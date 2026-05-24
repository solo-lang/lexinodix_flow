'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatFileSize } from '@/lib/utils';
import { User, Sparkles, HardDrive, Shield, LogOut, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types';

type Tab = 'profile' | 'ai' | 'storage' | 'security';

interface Props {
  profile: UserProfile;
  stats: { noteCount: number; fileCount: number; totalBytes: number };
  aiProviders: { name: string; displayName: string; available: boolean }[];
  activeProvider: string;
}

const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB

export default function SettingsClient({ profile, stats, aiProviders, activeProvider }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('profile');
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'ai', label: 'AI Provider', icon: Sparkles },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const saveProfile = async () => {
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const storagePercent = Math.min((stats.totalBytes / STORAGE_LIMIT) * 100, 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sora text-xl font-bold text-dark-navy">Settings</h1>
        <p className="text-sm text-neutral-gray mt-1">Manage your workspace preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tab sidebar */}
        <nav className="lg:w-48 flex lg:flex-col gap-1 flex-wrap">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  tab === t.id
                    ? 'bg-dark-navy text-white shadow-luxury'
                    : 'text-neutral-gray hover:text-dark-navy hover:bg-warm-hover'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-sora text-xs">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="flex-1 bg-white border border-warm-border rounded-2xl p-6 shadow-luxury">

          {/* Profile */}
          {tab === 'profile' && (
            <div className="space-y-6">
              <h3 className="font-sora text-base font-semibold text-dark-navy">Profile</h3>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-warm-accent/30 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-sora font-bold text-xl text-dark-navy">
                      {(profile.full_name ?? profile.email).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-navy">{profile.full_name ?? 'No name set'}</p>
                  <p className="text-xs text-neutral-gray">{profile.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-gray mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-gray mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="input-field opacity-60 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-neutral-gray mt-1.5">Email cannot be changed here</p>
                </div>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-dark-navy text-white rounded-xl text-sm font-semibold hover:bg-deep-blue transition-colors disabled:opacity-60"
              >
                {saved ? <Check className="w-4 h-4" /> : null}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* AI Provider */}
          {tab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-sora text-base font-semibold text-dark-navy">AI Provider</h3>
                <p className="text-xs text-neutral-gray mt-1">
                  Configure which AI model powers your workspace. Set API keys in your <code className="bg-warm-hover px-1 py-0.5 rounded text-[11px]">.env.local</code> file.
                </p>
              </div>

              <div className="space-y-3">
                {aiProviders.map(provider => (
                  <div
                    key={provider.name}
                    className={cn(
                      'flex items-center justify-between p-4 border rounded-xl transition-all',
                      provider.name === activeProvider
                        ? 'border-dark-navy bg-warm-surface'
                        : 'border-warm-border'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        provider.available ? 'bg-dark-navy' : 'bg-warm-hover'
                      )}>
                        <Sparkles className={cn('w-4 h-4', provider.available ? 'text-white' : 'text-neutral-gray')} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-dark-navy">{provider.displayName}</p>
                        <p className="text-[11px] text-neutral-gray">
                          {provider.available ? (
                            provider.name === activeProvider ? '✦ Currently active' : 'API key configured'
                          ) : (
                            'Add API key to enable'
                          )}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                      provider.available
                        ? provider.name === activeProvider
                          ? 'bg-dark-navy text-white'
                          : 'bg-emerald-50 text-emerald-700'
                        : 'bg-warm-hover text-neutral-gray'
                    )}>
                      {provider.name === activeProvider ? 'Active' : provider.available ? 'Ready' : 'Not set'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-warm-surface border border-warm-border rounded-xl">
                <p className="text-xs text-dark-navy font-semibold mb-2">To change providers:</p>
                <p className="text-xs text-neutral-gray leading-relaxed">
                  Open <code className="bg-white px-1 py-0.5 rounded border border-warm-border">.env.local</code> and set <code className="bg-white px-1 py-0.5 rounded border border-warm-border">AI_PROVIDER=grok</code> (or openai, anthropic, gemini) along with the corresponding API key.
                </p>
              </div>
            </div>
          )}

          {/* Storage */}
          {tab === 'storage' && (
            <div className="space-y-6">
              <h3 className="font-sora text-base font-semibold text-dark-navy">Spatial Storage</h3>

              <div className="p-5 border border-warm-border rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-dark-navy">Storage Used</span>
                  <span className="text-sm text-neutral-gray">{formatFileSize(stats.totalBytes)} of 10 GB</span>
                </div>
                <div className="w-full h-2 bg-warm-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dark-navy rounded-full transition-all duration-500"
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-gray">{storagePercent.toFixed(1)}% used</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 border border-warm-border rounded-xl text-center">
                  <p className="font-sora text-2xl font-bold text-dark-navy">{stats.noteCount}</p>
                  <p className="text-xs text-neutral-gray mt-1">Notes</p>
                </div>
                <div className="p-4 border border-warm-border rounded-xl text-center">
                  <p className="font-sora text-2xl font-bold text-dark-navy">{stats.fileCount}</p>
                  <p className="text-xs text-neutral-gray mt-1">Files</p>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {tab === 'security' && (
            <div className="space-y-6">
              <h3 className="font-sora text-base font-semibold text-dark-navy">Security Standards</h3>

              <div className="space-y-2">
                {[
                  { label: 'Row-Level Security (RLS)', status: 'Active', ok: true },
                  { label: 'Encrypted file storage', status: 'Active', ok: true },
                  { label: 'Secure session handling', status: 'Active', ok: true },
                  { label: 'Auto trash cleanup', status: 'Every 90 days', ok: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 border border-warm-border rounded-xl">
                    <span className="text-sm text-dark-navy">{item.label}</span>
                    <span className={cn('text-xs font-semibold', item.ok ? 'text-emerald-600' : 'text-neutral-gray')}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-warm-border">
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect Workspace Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
