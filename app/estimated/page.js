'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { Plus, Search, Trash2, Edit, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EstimatedListPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('estimates') || '[]');
    // Sort by date desc
    data.sort((a, b) => new Date(b.updatedAt || b.billDate) - new Date(a.updatedAt || a.billDate));
    setEstimates(data);
  }, []);

  const deleteEstimate = (id) => {
    if (confirm('Are you sure you want to delete this estimate?')) {
      const updated = estimates.filter(e => e.id !== id);
      setEstimates(updated);
      localStorage.setItem('estimates', JSON.stringify(updated));
    }
  };

  const filteredEstimates = estimates.filter(est => 
    est.billTo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    est.billNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
       {/* Sidebar */}
       <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out z-40 bg-white shadow-xl md:shadow-none w-64 border-r border-slate-200`}>
        <Sidebar activePage="Estimated" />
      </div>

      <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="flex justify-between items-center">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900">Estimated Documents</h1>
                   <p className="text-slate-500 text-sm">Manage and create estimates</p>
                </div>
                <Link 
                   href="/estimated/create" 
                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                >
                   <Plus className="w-5 h-5" />
                   <span className="font-medium">Create New</span>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by Client or Bill No..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Bill No</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Client</th>
                            <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredEstimates.length > 0 ? (
                            filteredEstimates.map(est => (
                                <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{est.billNo}</td>
                                    <td className="px-6 py-4 text-slate-600">{new Date(est.billDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-800 line-clamp-1 max-w-xs">{est.billTo.split('\n')[0]}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">₹ {est.totalAmount?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* We rely on the Create page's print preview for viewing, so Edit is effectively "View" */}
                                            <button 
                                                onClick={() => router.push(`/estimated/create?id=${est.id}`)} 
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => deleteEstimate(est.id)} 
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="w-8 h-8 opacity-20" />
                                        <p>No estimates found.</p>
                                        {searchTerm && <button onClick={() => setSearchTerm('')} className="text-blue-500 hover:text-blue-600">Clear Search</button>}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
      </main>
    </div>
  );
}
