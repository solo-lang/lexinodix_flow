'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, FileText, HardDrive, FolderOpen, Loader2, Clock } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import type { SearchResult } from '@/types';

const RECENT_SEARCHES_KEY = 'lexinodix_recent_searches';

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]');
  } catch { return []; }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches().filter(q => q !== query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([query, ...recent].slice(0, 6)));
}

const TYPE_ICONS = {
  note: FileText,
  file: HardDrive,
  workspace: FolderOpen,
};

const TYPE_LABELS = { note: 'Note', file: 'File', workspace: 'Workspace' };
const TYPE_HREFS: Record<string, (id: string) => string> = {
  note: id => `/notes/${id}`,
  file: id => `/files`,
  workspace: id => `/workspace/${id}`,
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const recentSearches = getRecentSearches();

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    saveRecentSearch(q.trim());

    startTransition(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.success ? data.data : []);
      setSearched(true);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const typeFilters = ['all', 'note', 'file', 'workspace'] as const;
  const [activeType, setActiveType] = useState<typeof typeFilters[number]>('all');

  const filteredResults = activeType === 'all'
    ? results
    : results.filter(r => r.type === activeType);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Search bar */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-gray pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes, files, workspaces…"
            autoFocus
            className="w-full pl-12 pr-4 py-4 bg-white border border-warm-border rounded-2xl text-base text-dark-navy placeholder:text-neutral-gray/50 focus:outline-none focus:border-dark-navy transition-all shadow-luxury"
          />
          {isPending && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-gray animate-spin" />
          )}
        </div>
      </form>

      {/* Recent searches (before searching) */}
      {!searched && recentSearches.length > 0 && (
        <div>
          <span className="text-label text-neutral-gray block mb-3">Recent Searches</span>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); performSearch(s); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-warm-border rounded-full text-xs text-dark-navy hover:border-dark-navy transition-colors"
              >
                <Clock className="w-3 h-3 text-neutral-gray" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && (
        <>
          {/* Type filters */}
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map(type => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-all',
                  activeType === type
                    ? 'bg-dark-navy text-white'
                    : 'bg-white text-neutral-gray border border-warm-border hover:text-dark-navy'
                )}
              >
                {type === 'all' ? `All (${results.length})` : `${TYPE_LABELS[type as keyof typeof TYPE_LABELS]}s (${results.filter(r => r.type === type).length})`}
              </button>
            ))}
          </div>

          {filteredResults.length > 0 ? (
            <div className="space-y-2">
              {filteredResults.map(result => {
                const Icon = TYPE_ICONS[result.type];
                const href = TYPE_HREFS[result.type]?.(result.id) ?? '/dashboard';
                return (
                  <Link
                    key={result.id}
                    href={href}
                    className="flex items-start gap-3 p-4 bg-white border border-warm-border rounded-xl hover:border-dark-navy transition-all group"
                  >
                    <Icon className="w-4 h-4 text-neutral-gray mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-semibold text-dark-navy truncate">{result.title}</h5>
                        <span className="text-[10px] text-neutral-gray bg-warm-hover px-1.5 py-0.5 rounded shrink-0">
                          {TYPE_LABELS[result.type]}
                        </span>
                      </div>
                      {result.excerpt && (
                        <p className="text-xs text-neutral-gray leading-relaxed line-clamp-2">{result.excerpt}</p>
                      )}
                      <p className="text-[10px] text-neutral-gray mt-1">{timeAgo(result.created_at)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-warm-accent mx-auto mb-3" />
              <p className="text-sm font-semibold text-dark-navy mb-1">No results found</p>
              <p className="text-xs text-neutral-gray">Try a different keyword or check your spelling</p>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!searched && recentSearches.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-warm-accent mx-auto mb-4" />
          <h3 className="font-sora text-base font-semibold text-dark-navy mb-2">Search your workspace</h3>
          <p className="text-sm text-neutral-gray">Find notes, files, and workspaces instantly</p>
        </div>
      )}
    </div>
  );
}
