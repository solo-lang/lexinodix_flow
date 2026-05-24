'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, MessageSquare, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/workspace', label: 'Spaces', icon: FolderOpen },
  { href: '/chat', label: 'AI Flow', icon: MessageSquare },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/settings', label: 'Config', icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-warm-border z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map(tab => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 flex-1 transition-colors',
                isActive ? 'text-dark-navy' : 'text-neutral-gray'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold font-sora tracking-wider">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
