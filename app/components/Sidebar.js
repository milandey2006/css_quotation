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
  PieChart,
  Table,
  Clock,
  Briefcase
} from 'lucide-react';

import { UserButton, useUser } from "@clerk/nextjs";

const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role; // 'admin' or undefined/other

  // Define menu items with visibility logic
  // Define menu items with visibility logic
  const allMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['admin'] },
    { name: 'Quotation', icon: FileText, href: '/create', roles: ['admin'] },
    { name: 'Estimated', icon: FileText, href: '/estimated', roles: ['admin'] },
    { name: 'Worksheet', icon: Table, href: '/worksheet', roles: ['admin'] },
    { name: 'Attendance', icon: Clock, href: '/attendance', roles: ['admin'] }, // Admin only
    { name: 'Punch In/Out', icon: Clock, href: '/punch', roles: ['user'] }, // User only
    { name: 'Work List', icon: Briefcase, href: '/works', roles: ['admin', 'user'] },
    { name: 'Assign Work', icon: User, href: '/works/create', roles: ['admin'] },
    { name: 'Settings', icon: Settings, href: '/settings', roles: ['admin'] },
  ];

  // Filter based on role
  // If role is NOT 'admin', assume 'user'
  const currentRole = role === 'admin' ? 'admin' : 'user';

  const menuItems = allMenuItems.filter(item => item.roles.includes(currentRole));

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

                <div className="mb-4 scale-125">
                    <UserButton />
                </div>
                <h2 className="text-lg font-bold tracking-wide text-center">{user?.fullName || 'User'}</h2>
                <div className="mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-700 text-slate-300 border border-slate-600">
                    {currentRole}
                </div>
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
        </div>
    </>
  );
};

export default Sidebar;
