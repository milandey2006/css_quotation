"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { getPrimaryNavItemsForRole } from '../../lib/navItems';
import { cn } from '../../lib/cn';

export default function BottomTabBar({ onMoreClick }) {
  const pathname = usePathname();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const items = getPrimaryNavItemsForRole(role);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] flex items-stretch">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-blue-600' : 'text-slate-400'
            )}
          >
            <item.icon className={cn('w-5 h-5', isActive && 'text-blue-600')} />
            {item.name}
          </Link>
        );
      })}

      <button
        onClick={onMoreClick}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-slate-400"
      >
        <Menu className="w-5 h-5" />
        More
      </button>
    </nav>
  );
}
