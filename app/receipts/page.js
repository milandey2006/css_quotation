'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { Menu, Search, Receipt, Plus, Printer, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

const METHOD_COLORS = {
  'Cash':        'bg-emerald-50 text-emerald-700 border-emerald-100',
  'UPI / GPay':  'bg-violet-50 text-violet-700 border-violet-100',
  'Bank / NEFT': 'bg-blue-50 text-blue-700 border-blue-100',
  'Cheque':      'bg-amber-50 text-amber-700 border-amber-100',
};

export default function ReceiptsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetch('/api/receipts')
      .then(r => r.json())
      .then(data => setReceipts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteReceipt = async (id) => {
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setReceipts(prev => prev.filter(r => r.id !== id));
      toast.success('Receipt deleted');
    } catch {
      toast.error('Failed to delete receipt');
    }
  };

  const filtered = receipts.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (r.clientName || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.receiptNo || '').toLowerCase().includes(q) ||
      (r.note || '').toLowerCase().includes(q);
    const matchMethod = filterMethod === 'All' || r.method === filterMethod;
    return matchSearch && matchMethod;
  });

  const totalCollected = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-40 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-white/20 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar
          activePage="Receipts"
          onClose={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <main className={`flex-1 p-4 md:p-8 overflow-y-auto ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} pt-20 md:pt-8`}>
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600">
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-6 h-6 text-blue-600" />
                  Receipts
                </h1>
                <p className="text-slate-500 text-sm">{receipts.length} receipt{receipts.length !== 1 ? 's' : ''} total</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-right">
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Total Collected</p>
                <p className="text-lg font-bold text-emerald-700">₹{totalCollected.toLocaleString('en-IN')}</p>
              </div>
              <Link
                href="/receipts/create"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 text-sm font-semibold whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Create Receipt
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client, description, receipt no..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <select
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
            >
              <option value="All">All Methods</option>
              <option>Cash</option>
              <option>UPI / GPay</option>
              <option>Bank / NEFT</option>
              <option>Cheque</option>
            </select>
          </div>

          {/* Table / Empty State */}
          <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                <Receipt className="w-12 h-12 opacity-20" />
                <p className="font-semibold text-slate-500 text-base">No receipts yet</p>
                <p className="text-sm text-center max-w-xs">Create a receipt to record a payment received from a client.</p>
                <Link
                  href="/receipts/create"
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Receipt
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Receipt No</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <Link href={`/receipts/create?id=${r.id}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">
                            {r.receiptNo}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {(r.clientName || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-slate-800 font-medium">{r.clientName || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={r.description}>{r.description || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${METHOD_COLORS[r.method] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                            {r.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                          ₹{Number(r.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => router.push(`/receipts/create?id=${r.id}`)}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View / Print"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/receipts/create?id=${r.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmModal({ isOpen: true, id: r.id })}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/60">
                  <span className="text-xs text-slate-400">{filtered.length} receipt{filtered.length !== 1 ? 's' : ''}</span>
                  <div>
                    <span className="text-xs text-slate-400 mr-2">Total shown:</span>
                    <span className="text-base font-bold text-emerald-700">₹{totalCollected.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={() => {
          if (confirmModal.id) deleteReceipt(confirmModal.id);
        }}
        title="Delete Receipt"
        message="Are you sure you want to permanently delete this receipt? This action cannot be undone."
      />
    </div>
  );
}
