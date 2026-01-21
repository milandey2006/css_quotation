"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { DashboardCharts } from './components/DashboardCharts';
import { 
  Search, 
  Filter, 
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function Dashboard() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Quotations'); // 'Quotations' | 'Proformas'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, isLoaded } = useUser(); // Get user role
  const router = useRouter(); // For redirect

  useEffect(() => {
    if (isLoaded) {
        const role = user?.publicMetadata?.role;
        // If user is NOT admin, redirect to works
        if (role !== 'admin') {
            router.push('/works');
        } else {
            fetchDocuments(); // Only fetch if admin
        }
    }
  }, [activeTab, isLoaded, user, router]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'Proformas' ? '/api/proformas' : '/api/quotations';
      const res = await fetch(endpoint);
      const data = await res.json();
      setQuotations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
      try {
        // Optimistic update
        setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));

        const endpoint = activeTab === 'Proformas' ? `/api/proformas/${id}` : `/api/quotations/${id}`;
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              status: newStatus,
              ...quotations.find(q => q.id === id)
           })
        });

        if (!res.ok) {
            fetchDocuments(); // Revert on failure
            alert('Failed to update status');
        }
      } catch (error) {
        console.error('Error updating status:', error);
        fetchDocuments();
      }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        const endpoint = activeTab === 'Proformas' ? `/api/proformas/${id}` : `/api/quotations/${id}`;
        const res = await fetch(endpoint, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchDocuments(); // Refresh list
        } else {
          alert('Failed to delete');
        }
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const filteredQuotations = quotations.filter(q => 
    (q.clientName && q.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (q.quotationNo && q.quotationNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (q.data?.receiver?.phone && q.data.receiver.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans relative overflow-x-hidden">
      {/* Mobile Header / Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-40 flex justify-between items-center shadow-sm">
         <div className="font-bold text-slate-800">Champion Security</div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
         </button>
      </div>

      {/* Fixed Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <main className="min-w-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300 min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Welcome back, here's what's happening today.</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search quotations..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <LinkWithIcon href="/create" icon={Plus} label="Create New" />
            </div>
          </div>

          {/* Stats Section */}
          <DashboardStats quotations={quotations} />

          {/* Charts Section */}
          <DashboardCharts quotations={quotations} />

          {/* Recent Quotations Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Recent {activeTab}
              </h2>
              
              <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                      onClick={() => setActiveTab('Quotations')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'Quotations' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      Quotations
                  </button>
                  <button 
                      onClick={() => setActiveTab('Proformas')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'Proformas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      Proforma Invoices
                  </button>
              </div>

              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors hidden md:block">
                <Filter className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">{activeTab === 'Proformas' ? 'PI No' : 'Quotation No'}</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        Loading documents...
                      </td>
                    </tr>
                  ) : filteredQuotations.length === 0 ? (
                     <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        No {activeTab.toLowerCase()} found. Click "Create New" to start.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700">{q.quotationNo}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{q.clientName}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {new Date(q.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          ₹{(q.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={q.status || 'Active'} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {/* Status Actions - Always Visible */}
                             <ActionTooltip content="Mark as Passed">
                                 <button 
                                     onClick={() => handleStatusUpdate(q.id, 'Converted')}
                                     className={`p-2 rounded-lg transition-all ${
                                        q.status === 'Converted' 
                                            ? 'text-white bg-emerald-500 shadow-md shadow-emerald-500/30' 
                                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                     }`}
                                 >
                                     <CheckCircle className="w-4 h-4" />
                                 </button>
                             </ActionTooltip>

                             <ActionTooltip content="Mark as Failed">
                                 <button 
                                     onClick={() => handleStatusUpdate(q.id, 'Lost')}
                                     className={`p-2 rounded-lg transition-all ${
                                        q.status === 'Lost' 
                                            ? 'text-white bg-red-500 shadow-md shadow-red-500/30' 
                                            : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                     }`}
                                 >
                                     <XCircle className="w-4 h-4" />
                                 </button>
                             </ActionTooltip>
                             <div className="w-px h-4 bg-slate-200 mx-1"></div>

                            <ActionTooltip content="Preview">
                              <Link 
                                href={`/preview/${q.id}?type=${activeTab === 'Proformas' ? 'Proforma' : 'Quotation'}`} 
                                target="_blank"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </ActionTooltip>
                            
                            <ActionTooltip content="Edit">
                              <Link 
                                href={`/create?id=${q.id}&type=${activeTab === 'Proformas' ? 'Proforma' : 'Quotation'}`} 
                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            </ActionTooltip>

                            <ActionTooltip content="Delete">
                              <button 
                                onClick={() => handleDelete(q.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </ActionTooltip>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination / Footer of Table */}
            <div className="p-4 border-t border-slate-100 flex justify-center">
                <button className="text-sm text-blue-600 font-medium hover:underline">View All Quotations</button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// --- Helper Components ---

const LinkWithIcon = ({ href, icon: Icon, label }) => (
  <Link 
    href={href} 
    className="flex items-center justify-center md:justify-start gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
  >
    <Icon className="w-4 h-4" />
    {label}
  </Link>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-blue-50 text-blue-600 border-blue-200',
    Converted: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Lost: 'bg-red-50 text-red-600 border-red-200',
    Draft: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const defaultStyle = styles.Draft;

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status] || defaultStyle}`}>
      {status}
    </span>
  );
};

const ActionTooltip = ({ children, content }) => (
  <div className="group/tooltip relative">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);
