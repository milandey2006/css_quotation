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

const Sidebar = ({ isOpen, onClose, isCollapsed, toggleSidebar }) => {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role;
  // Define menu items with visibility logic
  const allMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['admin'] },
    { name: 'Quotation', icon: FileText, href: '/create', roles: ['admin'] },
    { name: 'Estimated', icon: FileText, href: '/estimated', roles: ['admin'] },
    { name: 'Worksheet', icon: Table, href: '/worksheet', roles: ['admin'] },
    { name: 'Salary Slips', icon: FileText, href: '/salary', roles: ['admin'] }, 
    { name: 'Employees', icon: User, href: '/employees', roles: ['admin'] },
    { name: 'Attendance', icon: Clock, href: '/attendance', roles: ['admin'] },
    { name: 'Punch In/Out', icon: Clock, href: '/punch', roles: ['user'] },
    { name: 'Work List', icon: Briefcase, href: '/works', roles: ['admin', 'user'] },
    { name: 'Assign Work', icon: User, href: '/works/create', roles: ['admin'] },
    { name: 'Settings', icon: Settings, href: '/settings', roles: ['admin'] },
  ];

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
        <div className={`h-screen bg-[#1e293b] text-white flex flex-col shadow-2xl fixed left-0 top-0 overflow-y-auto z-50 transition-all duration-300 ease-in-out 
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'}`}
        >
            {/* Profile Section */}
            <div className={`p-4 flex flex-col items-center border-b border-slate-700/50 relative transition-all ${isCollapsed ? 'py-6' : 'p-8'}`}>
                <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className={`mb-4 transition-transform ${isCollapsed ? 'scale-100' : 'scale-125'}`}>
                    <UserButton />
                </div>
                {!isCollapsed && (
                    <>
                        <h2 className="text-lg font-bold tracking-wide text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">{user?.fullName || 'User'}</h2>
                        <div className="mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-700 text-slate-300 border border-slate-600">
                            {currentRole}
                        </div>
                    </>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-2">
                {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={() => onClose && onClose()} 
                    title={isCollapsed ? item.name : ''}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                        isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                    >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-blue-400'} transition-colors`} />
                    {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden transition-all delay-100">{item.name}</span>}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            {item.name}
                        </div>
                    )}
                    </Link>
                );
                })}
            </nav>

            {/* Collapse Toggle */}
            <div className="p-4 border-t border-slate-700/50 hidden md:flex justify-end">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                    {isCollapsed ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    ) : (
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                    )}
                </button>
            </div>
        </div>
    </>
  );
};

export default Sidebar;
