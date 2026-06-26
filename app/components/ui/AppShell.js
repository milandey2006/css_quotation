"use client";
import { useState } from 'react';
import Sidebar from '../Sidebar';
import MobileTopBar from './MobileTopBar';
import BottomTabBar from './BottomTabBar';
import { cn } from '../../lib/cn';

export default function AppShell({ children, className }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="bg-slate-50 min-h-screen font-sans relative overflow-x-hidden">
      <MobileTopBar onMenuClick={() => setIsMobileMenuOpen(true)} />

      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main
        className={cn(
          'min-w-0 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300 min-h-screen',
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64',
          className
        )}
      >
        {children}
      </main>

      <BottomTabBar onMoreClick={() => setIsMobileMenuOpen(true)} />
    </div>
  );
}
