"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
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

export default function ProformaList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const router = useRouter(); 

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proformas');
      const data = await res.json();
      setInvoices(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching proformas:', error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
      try {
        setInvoices(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));

        const res = await fetch(`/api/proformas/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              status: newStatus,
              ...invoices.find(q => q.id === id)
           })
        });

        if (!res.ok) {
            fetchDocuments();
            alert('Failed to update status');
        }
      } catch (error) {
        console.error('Error updating status:', error);
        fetchDocuments();
      }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this proforma invoice?')) {
      try {
        const res = await fetch(`/api/proformas/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchDocuments();
        } else {
          alert('Failed to delete');
        }
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const filteredInvoices = invoices.filter(q => 
    (q.clientName && q.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (q.quotationNo && q.quotationNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (q.data?.receiver?.phone && q.data.receiver.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans relative overflow-x-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-40 flex justify-between items-center shadow-sm">
         <div className="font-bold text-slate-800">Champion Security</div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
         </button>
      </div>

      <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={`min-w-0 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300 min-h-screen ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-8 h-8 text-blue-600" />
                  Proforma Invoices
              </h1>
              <p className="text-slate-500 text-sm mt-1">Manage all your proforma invoices.</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search proformas..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <LinkWithIcon href="/proforma/create" icon={Plus} label="Create Proforma" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">PI No</th>
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
                  ) : filteredInvoices.length === 0 ? (
                     <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        No proformas found. Click "Create Proforma" to start.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((q) => (
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
                                href={`/preview/${q.id}?type=Proforma`} 
                                target="_blank"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </ActionTooltip>
                            
                            <ActionTooltip content="Edit">
                              <Link 
                                href={`/proforma/create?id=${q.id}`} 
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
            
             <div className="p-4 border-t border-slate-100 flex justify-center text-xs text-slate-400">
                End of list
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

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
    Active: 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse', 
    Converted: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Lost: 'bg-red-50 text-red-600 border-red-200',
    Draft: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${styles[status] || styles.Draft}`}>
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
