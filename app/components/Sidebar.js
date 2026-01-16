"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  User, 
  LogOut,
  Bell,
  PieChart
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  ];

  return (
    <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                onClick={onClose}
            />
        )}

        {/* Sidebar */}
        <div className={`h-screen w-64 bg-[#1e293b] text-white flex flex-col shadow-2xl fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Profile Section */}
            <div className="p-8 flex flex-col items-center border-b border-slate-700/50 relative">
                <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg ring-4 ring-blue-500/20">
                CSS
                </div>
                <h2 className="text-lg font-bold tracking-wide">Champion Security</h2>
                <p className="text-xs text-slate-400 mt-1">admin@champion.com</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-2">
                {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => onClose && onClose()} // Close on click mobile
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                    >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-blue-400'} transition-colors`} />
                    <span className="font-medium">{item.name}</span>
                    </Link>
                );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-700/50">
                <button className="flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-all">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    </>
  );
};

export default Sidebar;
