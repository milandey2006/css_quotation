'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, MapPin, Phone, Briefcase, Navigation, Clock, CheckCircle, Edit, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function WorksPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  // --- Edit Handlers ---
  const handleEditClick = (work) => {
      setEditingWork({ ...work });
      setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
      const { name, value } = e.target;
      setEditingWork(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
      if (!editingWork) return;
      setIsSaving(true);
      try {
          const res = await fetch(`/api/works/${editingWork.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  clientName: editingWork.clientName,
                  clientPhone: editingWork.clientPhone,
                  clientAddress: editingWork.clientAddress,
                  instructions: editingWork.instructions
              })
          });

          if (!res.ok) throw new Error('Failed to update');

          // Update local state
          setWorks(prev => prev.map(w => w.id === editingWork.id ? { ...w, ...editingWork } : w));
          setIsEditModalOpen(false);
          setEditingWork(null);
      } catch (err) {
          console.error(err);
          alert('Failed to save changes');
      } finally {
          setIsSaving(false);
      }
  };

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
       {/* Mobile Menu Button - Consistent Header Style */}
       <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-40 flex justify-between items-center shadow-sm h-16">
          <div className="font-bold text-slate-800">Champion Security</div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
             <Menu className="w-6 h-6" />
          </button>
      </div>

      {/* Sidebar */}
      <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Main Content */}
      <main className={`flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 bg-slate-50 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
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
                            
                             {/* Admin Actions */}
                             {isAdmin && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={() => handleEditClick(work)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Edit Work"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => deleteWork(work.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete Work"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                             )}

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4 pr-16"> {/* Increased padding-right for buttons */}
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

      {/* Edit Modal */}
      {isEditModalOpen && editingWork && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg text-gray-800">Edit Work Details</h3>
                      <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-4 text-black">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                          <input 
                              name="clientName"
                              value={editingWork.clientName}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="e.g. Acme Corp"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input 
                              name="clientPhone"
                              value={editingWork.clientPhone}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="e.g. +91 9876543210"
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <textarea 
                              name="clientAddress"
                              value={editingWork.clientAddress}
                              onChange={handleEditChange}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                              placeholder="Full address..."
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                          <textarea 
                              name="instructions"
                              value={editingWork.instructions || ''}
                              onChange={handleEditChange}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                              placeholder="Special instructions for the technician..."
                          />
                      </div>

                      </div>

                  <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                      <button 
                          onClick={() => setIsEditModalOpen(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-200 transition-all flex items-center gap-2"
                      >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
