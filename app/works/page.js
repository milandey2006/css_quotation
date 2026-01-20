'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, MapPin, Phone, Briefcase, Navigation, Clock, CheckCircle } from 'lucide-react';

export default function WorksPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const updateStatus = async (id, newStatus) => {
    // Optimistic update
    setWorks(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));

    try {
        const res = await fetch(`/api/works/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!res.ok) {
            throw new Error('Failed to update');
        }
    } catch (err) {
        console.error(err);
        alert("Failed to update status");
        // Revert on error could be implemented here by re-fetching
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
            
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase className="w-8 h-8 text-blue-600" />
                        Assigned Works
                    </h1>
                    <p className="text-slate-500 mt-1">List of pending tasks and site visits.</p>
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                 </div>
            ) : works.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
                    <p>No work assigned yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {works.map((work) => (
                        <div key={work.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
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
