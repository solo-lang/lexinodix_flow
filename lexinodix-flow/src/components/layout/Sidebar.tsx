'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  HardDrive,
  MessageSquare,
  Search,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/workspace', label: 'Spaces', icon: FolderOpen },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/files', label: 'Files', icon: HardDrive },
  { href: '/chat', label: 'AI Flow', icon: MessageSquare },
  { href: '/search', label: 'Search', icon: Search },
];

interface SidebarProps {
  user: UserProfile;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-warm-surface border-r border-warm-border h-screen sticky top-0 shrink-0">
      {/* Brand */}
      <div className="p-6 border-b border-warm-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-dark-navy flex items-center justify-center text-white shadow-luxury relative overflow-hidden">
            <span className="font-sora font-bold text-base relative z-10">L</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-deep-blue to-transparent opacity-40" />
          </div>
          <div>
            <h1 className="font-sora text-sm font-bold text-dark-navy tracking-tight">Lexinodix Flow</h1>
            <p className="text-[10px] text-neutral-gray tracking-wider font-medium">Intelligence Workspace</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-dark-navy text-white shadow-luxury'
                    : 'text-neutral-gray hover:text-dark-navy hover:bg-warm-hover'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-white' : 'text-neutral-gray group-hover:text-dark-navy')} />
                <span className="font-sora text-xs tracking-wide">{item.label}</span>

                {item.href === '/chat' && (
                  <span className={cn('ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-warm-accent/20 text-warm-accent'
                  )}>
                    AI
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="p-4 border-t border-warm-border space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            pathname.startsWith('/settings')
              ? 'bg-dark-navy text-white'
              : 'text-neutral-gray hover:text-dark-navy hover:bg-warm-hover'
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="font-sora text-xs tracking-wide">Settings</span>
        </Link>

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-2">
          <div className="w-8 h-8 rounded-lg bg-warm-accent/30 flex items-center justify-center shrink-0">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              <span className="font-sora font-bold text-[11px] text-dark-navy">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-dark-navy truncate">
              {user.full_name ?? 'User'}
            </p>
            <p className="text-[10px] text-neutral-gray truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-neutral-gray hover:text-dark-navy hover:bg-warm-hover transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
