'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, User, Shield, Check, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
       if (user?.publicMetadata?.role !== 'admin') {
           router.push('/works');
           return;
       }
       fetchUsers();
    }
  }, [isLoaded, user, router]);

  const fetchUsers = async () => {
      try {
          const res = await fetch('/api/users');
          const data = await res.json();
          if (Array.isArray(data)) {
              setUsers(data);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const updateUserRole = async (userId, newRole) => {
      if (!confirm(`Are you sure you want to make this user a ${newRole}?`)) return;

      // Optimistic update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

      try {
          const res = await fetch(`/api/users/${userId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: newRole })
          });
          
          if (!res.ok) {
              throw new Error('Failed to update');
          }
          alert('Role updated successfully.');
      } catch (err) {
          console.error(err);
          alert('Failed to update role. Please try again.');
          fetchUsers(); // Revert
      }
  };

  const deleteUser = async (userId) => {
      if (!confirm("Are you sure you want to PERMANENTLY delete this user? This cannot be undone.")) return;

      setUsers(prev => prev.filter(u => u.id !== userId)); // Optimistic

      try {
          const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
          if (!res.ok) {
               const data = await res.json();
               throw new Error(data.error || 'Failed to delete');
          }
          alert('User deleted successfully.');
      } catch (err) {
          console.error(err);
          alert(err.message);
          fetchUsers(); // Revert
      }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
       {/* Mobile Menu Button */}
       <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-blue-600"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-40 bg-white shadow-xl md:shadow-none ${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r border-slate-200`}>
        <Sidebar 
            activePage="Settings" 
            onClose={() => setIsMobileMenuOpen(false)}
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
      
       {/* Overlay */}
       {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 p-4 md:p-8 overflow-y-auto ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="max-w-4xl mx-auto">
            
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Settings & User Management
                </h1>
                <p className="text-slate-500 mt-1">Manage system users and their access roles.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-slate-800">All Users</h2>
                    <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">
                        {users.length} Registered
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Last Login</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-slate-900">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={user.role || 'user'}
                                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-all ${
                                                user.role === 'admin' 
                                                ? 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500' 
                                                : 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-blue-500'
                                            }`}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => deleteUser(user.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete User"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}
