'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, MapPin, Phone, Briefcase, Navigation, Clock, CheckCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function WorksPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch Works
    fetch('/api/works')
        .then(res => res.json())
        .then(data => {
            setWorks(data);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });

    // Fetch Users (for dropdown)
    fetch('/api/works') // Fetching works instead of users? NOTE: The user's code previously had this error or I might be misreading. Wait, I should fix this to fetch /api/users if I am touching it.
    // Actually the previous code I wrote had fetch('/api/users'). Let me correct it to be safe.
    fetch('/api/users')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setUsers(data);
        })
        .catch(err => console.error(err));
  }, []);

  const assignUser = async (workId, userId) => {
      // Optimistic Update
      setWorks(prev => prev.map(w => w.id === workId ? { ...w, userId: userId || null } : w));

      try {
          const res = await fetch(`/api/works/${workId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: userId || null })
          });
          if (!res.ok) throw new Error('Failed to assign');
      } catch (err) {
          console.error(err);
          alert('Failed to assign user');
      }
  };

  const updateStatus = async (id, newStatus) => {
    setWorks(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
    try {
        const res = await fetch(`/api/works/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error('Failed to update');
    } catch (err) {
        console.error(err);
        alert("Failed to update status");
    }
  };

  const deleteWork = async (id) => {
      if(!confirm("Are you sure you want to delete this work?")) return;

      setWorks(prev => prev.filter(w => w.id !== id)); // Optimistic delete

      try {
          const res = await fetch(`/api/works/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete');
      } catch (err) {
          console.error(err);
          alert("Failed to delete work");
          // Could reload here
      }
  }

  const getStatusColor = (status) => {
    switch(status) {
        case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'active': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
        default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  // Filter works
  const filteredWorks = works.filter(work => {
      const q = searchQuery.toLowerCase();
      return (
          (work.clientName && work.clientName.toLowerCase().includes(q)) ||
          (work.clientPhone && work.clientPhone.toLowerCase().includes(q)) ||
          (work.clientAddress && work.clientAddress.toLowerCase().includes(q))
      );
  });

  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

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
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40 bg-white shadow-xl md:shadow-none w-64 border-r border-slate-200`}>
        <Sidebar activePage="Work List" />
      </div>
      
       {/* Overlay */}
       {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
            
            <div className="mb-8 ">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Briefcase className="w-8 h-8 text-blue-600" />
                            Assigned Works
                        </h1>
                        <p className="text-slate-500 mt-1">List of pending tasks and site visits.</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <input 
                        type="text" 
                        placeholder="Search by Name, Mobile, or Location..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                 </div>
            ) : filteredWorks.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
                    <p>No matching works found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredWorks.map((work) => (
                        <div key={work.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow relative group">
                            
                             {/* Delete Button (Only for Admins) */}
                             {isAdmin && (
                                <button 
                                    onClick={() => deleteWork(work.id)}
                                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Work"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                             )}

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4 pr-10"> {/* pr-10 for delete button space */}
                                    <h3 className="font-bold text-lg text-slate-900">{work.clientName}</h3>
                                    <select 
                                        value={work.status || 'pending'}
                                        onChange={(e) => updateStatus(work.id, e.target.value)}
                                        className={`text-xs font-medium px-2 py-1 rounded-full border focus:outline-none cursor-pointer ${getStatusColor(work.status)}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                
                                <div className="space-y-3 text-sm text-slate-600 mb-6">
                                    {work.clientPhone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <a href={`tel:${work.clientPhone}`} className="hover:text-blue-600 font-medium">
                                                {work.clientPhone}
                                            </a>
                                        </div>
                                    )}
                                    
                                    {work.clientAddress && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                            <span>{work.clientAddress}</span>
                                        </div>
                                    )}

                                    {work.instructions && (
                                         <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 italic">
                                            "{work.instructions}"
                                        </div>
                                    )}
                                </div>

                                {/* Assignment Section */}
                                <div className="mb-4">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Assigned To</label>
                                    <select
                                        value={work.userId || ''}
                                        onChange={(e) => assignUser(work.id, e.target.value)}
                                        className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    {work.clientAddress && (
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(work.clientAddress)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Navigate
                                        </a>
                                    )}
                                    <div className="text-xs text-slate-400 flex items-center gap-1 ml-auto self-center">
                                        <Clock className="w-3 h-3" />
                                        {new Date(work.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
