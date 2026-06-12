'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { buildShareSlug } from '../utils/shareSlug';
import { 
    Plus, Search, Trash2, Edit, FileText, 
    Filter, Calendar, ChevronDown, CheckCircle, 
    MoreHorizontal, ArrowUpRight, Menu, Printer, X, Eye, Share2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

export default function EstimatedListPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const [isPreview, setIsPreview] = useState(false);

  // Totals Calculation
  const calculateTotals = (items) => {
      return items.reduce((acc, item) => {
          const total = Number(item.totalAmount || 0);
          const paid = Number(item.paidAmount || 0);
          return {
              total: acc.total + total,
              paid: acc.paid + paid,
              balance: acc.balance + (total - paid)
          };
      }, { total: 0, paid: 0, balance: 0 });
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
    try {
      const res = await fetch('/api/estimates?basic=true');
      if (res.ok) {
        const data = await res.json();
        setEstimates(data);
      } else {
        console.error('Failed to fetch estimates');
      }
    } catch (error) {
      console.error('Error fetching estimates:', error);
    }
  };

  const deleteEstimate = async (id) => {
    try {
      const res = await fetch(`/api/estimates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEstimates(prev => prev.filter(e => e.id !== id));
        toast.success('Estimate deleted successfully');
      } else {
        toast.error('Failed to delete estimate');
      }
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast.error('Error deleting estimate');
    }
  };

  const filteredEstimates = estimates.filter(est => 
    (est.clientName || est.billTo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (est.billNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totals = calculateTotals(filteredEstimates);

  const StatusTab = ({ label, count, active }) => (
      <button 
        onClick={() => setActiveTab(label)}
        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            active 
            ? 'border-blue-600 text-blue-600' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
      >
          {label}
          <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              {count}
          </span>
      </button>
  );

  // Calculate counts
  const unpaidCount = estimates.filter(e => (Number(e.totalAmount) - Number(e.paidAmount || 0)) > 0).length;
  const paidCount = estimates.filter(e => (Number(e.totalAmount) - Number(e.paidAmount || 0)) <= 0).length;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
       {/* Sidebar */}
       <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-40 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-white/20 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar 
            activePage="Estimated" 
            onClose={() => setIsMobileMenuOpen(false)}
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

       {/* Overlay */}
       {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className={`flex-1 p-4 md:p-8 overflow-y-auto ${isPreview ? 'md:ml-0 bg-white z-50 fixed inset-0' : (isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64')}`}>
        <div className={`max-w-7xl mx-auto ${isPreview ? 'pt-0' : ''}`}>
            
            {/* Header / Top Bar */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 ${isPreview ? 'print:hidden' : ''}`}>
                <div className="flex items-center gap-2">
                    {!isPreview && <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600">
                        <Menu className="w-6 h-6" />
                    </button>}
                    <h1 className="text-2xl font-bold text-slate-800">Estimates {isPreview && 'Report'}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Date Range & Filter Mockup */}
                    {!isPreview && (
                        <>
                            <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 cursor-pointer hover:border-slate-300 transition-colors">
                                <span>All Time</span>
                                <ChevronDown className="w-4 h-4" />
                            </div>
                            
                            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>

                            <Link 
                                href="/estimated/create" 
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 text-sm font-semibold ml-auto md:ml-0"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Estimate</span>
                            </Link>
                        </>
                    )}

                    <button 
                        onClick={() => isPreview ? window.print() : setIsPreview(true)}
                        className={`flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium transition-colors ${isPreview ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Printer className="w-4 h-4" />
                        <span>{isPreview ? 'Print Report' : 'Print Preview'}</span>
                    </button>
                    
                    {isPreview && (
                         <button 
                            onClick={() => setIsPreview(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
                        >
                            <X className="w-4 h-4" />
                            <span>Close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Status Tabs */}
            {!isPreview && (
            <div className="bg-white border-b border-slate-200 px-6 flex overflow-x-auto no-scrollbar gap-2 mb-6 rounded-t-xl">
                <StatusTab label="All" count={estimates.length} active={activeTab === 'All'} />
                <StatusTab label="Unpaid" count={unpaidCount} active={activeTab === 'Unpaid'} />
                <StatusTab label="Overdue" count={0} active={activeTab === 'Overdue'} />
                <StatusTab label="Paid" count={paidCount} active={activeTab === 'Paid'} />
            </div>
            )}

            {/* Main Content Area */}
            <div className="space-y-4">
                
                {/* Search Bar Row - Styled like reference */}
                {!isPreview && (
                <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by Client name, Estimate No..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-transparent focus:outline-none text-sm text-slate-700 placeholder:text-slate-400"
                        />
                    </div>
                    {/* Add grid/list toggles or other controls here if needed */}
                </div>
                )}

                {/* Table */}
                <div className={`bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/40 ${isPreview ? 'border-none shadow-none bg-white' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4 w-16 text-center">#</th>
                                    <th className="px-6 py-4">Estimate No</th>
                                    <th className="px-6 py-4">Issued Date</th>
                                    <th className="px-6 py-4">Client Name</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Paid</th>
                                    <th className="px-6 py-4">Balance Due</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEstimates.length > 0 ? (
                                    filteredEstimates.map((est, index) => {
                                        const paid = Number(est.paidAmount) || 0;
                                        const total = Number(est.totalAmount) || 0;
                                        const balance = total - paid;
                                        const isPaid = balance <= 0;
                                        const isPartial = paid > 0 && balance > 0;

                                        return (
                                        <tr key={est.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 text-center text-slate-400 text-xs">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={`/estimated/create?id=${est.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                                                    {est.billNo}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(est.billDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                        {(est.clientName || est.billTo || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-slate-700 font-medium line-clamp-1">{(est.clientName || est.billTo || '').split('\n')[0]}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-700">
                                                ₹ {total.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-emerald-600 font-medium">
                                                ₹ {paid.toLocaleString('en-IN')}
                                            </td>
                                            <td className={`px-6 py-4 font-medium ${balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                ₹ {balance.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                 <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                     isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                     isPartial ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                     'bg-blue-50 text-blue-700 border-blue-100'
                                                 }`}>
                                                    {isPaid ? <CheckCircle className="w-3 h-3" /> : null}
                                                    {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Sent'}
                                                 </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!isPreview && (
                                                <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => window.open(`/preview/${est.id}?type=Estimate`, '_blank')}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if (!est.publicId) {
                                                                toast.info('This estimate needs a shareable link', {
                                                                    description: 'Please open this estimate and save it once to generate a shareable link.',
                                                                    duration: 5000
                                                                });
                                                                return;
                                                            }
                                                            const slug = buildShareSlug(est.clientName || est.billTo, est.billNo, est.publicId);
                                                            const shareUrl = `${window.location.origin}/estimate/${slug}`;
                                                            navigator.clipboard.writeText(shareUrl)
                                                                .then(() => toast.success('Share link copied to clipboard!'))
                                                                .catch(() => toast.error('Failed to copy link.'));
                                                        }}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Share"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => window.open(`/preview/${est.id}?type=Estimate&print=true`, '_blank')}
                                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="Print"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => router.push(`/estimated/create?id=${est.id}`)} 
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setConfirmModal({ isOpen: true, id: est.id })} 
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                    <FileText className="w-8 h-8 opacity-20" />
                                                </div>
                                                <p className="text-lg font-medium text-slate-600">No estimates found</p>
                                                <p className="text-sm">Create a new estimate to get started.</p>
                                                {searchTerm && <button onClick={() => setSearchTerm('')} className="text-blue-500 hover:text-blue-600 font-medium text-sm mt-2">Clear Search</button>}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer / Pagination Mockup */}
                {!isPreview && (
                <div className="flex justify-between items-center text-xs text-slate-500 px-2">
                    <p>Showing {filteredEstimates.length} results</p>
                    <div className="flex gap-2">
                         <button className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
                         <button className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
                )}
                
                {/* Print/Preview Footer with Totals */}
                <div className={`mt-8 border-t-2 border-slate-300 pt-4 flex justify-end gap-8 text-black print:flex ${isPreview ? 'flex' : 'hidden'}`}>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Quote</p>
                        <p className="text-xl font-bold font-mono">₹{totals.total.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Received</p>
                        <p className="text-xl font-bold font-mono text-emerald-600">₹{totals.paid.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Balance Due</p>
                        <p className="text-xl font-bold font-mono text-red-600">₹{totals.balance.toLocaleString('en-IN')}</p>
                    </div>
                </div>
                
                {/* Sticky Footer for Totals - Always Visible when not in preview for quick view */}
                {!isPreview && (
                     <div className="fixed bottom-0 left-0 right-0 md:ml-64 bg-white border-t border-slate-200 p-4 shadow-lg z-30 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm font-medium text-slate-500 hidden md:block">
                            Summary of visible estimates
                        </div>
                        <div className="flex gap-6 text-sm w-full md:w-auto justify-between md:justify-end">
                            <div>
                                <span className="text-slate-500 mr-2">Quote:</span>
                                <span className="font-bold text-slate-900">₹{totals.total.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 mr-2">Paid:</span>
                                <span className="font-bold text-emerald-600">₹{totals.paid.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                <span className="text-red-600 mr-2 font-medium">Due:</span>
                                <span className="font-bold text-red-700">₹{totals.balance.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Print Padding */}
                <div className="pb-24"></div> 
            </div>
        </div>
      </main>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={() => {
            if (confirmModal.id) deleteEstimate(confirmModal.id);
        }}
        title="Delete Estimate"
        message="Are you sure you want to permanently delete this estimate? This action cannot be undone."
      />
    </div>
  );
}
