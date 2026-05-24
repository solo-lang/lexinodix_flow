'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import type { UserProfile } from '@/types';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Home',
  '/workspace': 'Spaces',
  '/notes': 'Notes Studio',
  '/files': 'Files Locker',
  '/chat': 'AI Flow',
  '/search': 'Search',
  '/settings': 'Settings',
};

interface TopBarProps {
  user: UserProfile;
}

export default function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'Flow';

  const firstName = user.full_name?.split(' ')[0] ?? 'there';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="h-16 border-b border-warm-border bg-warm-surface/80 backdrop-blur-sm flex items-center justify-between px-6 lg:px-8 shrink-0">
      <div>
        <h2 className="font-sora text-base font-semibold text-dark-navy">{title}</h2>
        {pathname === '/dashboard' && (
          <p className="text-xs text-neutral-gray mt-0.5">
            {getGreeting()}, {firstName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/search"
          className="flex items-center gap-2 px-3 py-2 bg-warm-hover rounded-xl text-sm text-neutral-gray hover:text-dark-navy transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Search…</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 bg-white border border-warm-border rounded text-[10px] font-mono text-neutral-gray">⌘K</kbd>
        </Link>

        <div className="w-8 h-8 rounded-lg bg-warm-accent/30 flex items-center justify-center">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
          ) : (
            <span className="font-sora font-bold text-[11px] text-dark-navy">
              {(user.full_name ?? user.email).slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
