'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Link from 'next/link';
import { Menu, Plus, FileText, Trash2, Eye, Calendar, DollarSign, Edit } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SalarySlipsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
        const role = user?.publicMetadata?.role;
        if (role !== 'admin') {
            router.push('/'); // Redirect non-admins
        } else {
            fetchSlips();
        }
    }
  }, [isLoaded, user, router]);

  const fetchSlips = async () => {
    try {
        const res = await fetch('/api/salary');
        const data = await res.json();
        if (Array.isArray(data)) setSlips(data);
    } catch (e) {
        console.error('Error fetching slips:', e);
    } finally {
        setLoading(false);
    }
  };

  const deleteSlip = async (id) => {
      if(!confirm("Delete this salary slip?")) return;
      try {
          const res = await fetch(`/api/salary/${id}`, { method: 'DELETE' });
          if (res.ok) {
              setSlips(prev => prev.filter(s => s.id !== id));
          } else {
              alert("Failed to delete");
          }
      } catch (e) {
          console.error(e);
          alert("Error deleting slip");
      }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
       {/* Mobile Header */}
       <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-40 flex justify-between items-center shadow-sm h-16">
          <div className="font-bold text-slate-800">Champion Security</div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
             <Menu className="w-6 h-6" />
          </button>
      </div>

      <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 bg-slate-50 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="max-w-6xl mx-auto">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-blue-600" />
                        Salary Slips
                    </h1>
                    <p className="text-slate-500 mt-1">Manage and generate employee payslips.</p>
                </div>
                
                <Link 
                    href="/salary/create" 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Create New Slip
                </Link>
            </div>

            {loading ? (
                 <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                 </div>
            ) : slips.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
                    <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-700">No Salary Slips Generated</p>
                    <p className="text-sm mt-1">Click "Create New Slip" to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Month</th>
                                    <th className="px-6 py-4">Net Pay</th>
                                    <th className="px-6 py-4">Total Earnings</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {slips.map((slip) => (
                                    <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{slip.employeeName}</div>
                                            <div className="text-xs text-slate-500">{slip.designation}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {slip.monthYear}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                                                ₹{slip.netPayable?.toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            ₹{slip.totalEarnings?.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link 
                                                    href={`/salary/${slip.id}`}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View/Print"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link 
                                                    href={`/salary/${slip.id}/edit`}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => deleteSlip(slip.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
