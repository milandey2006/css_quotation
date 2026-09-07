"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '../../components/ui/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import ResponsiveTable from '../../components/ui/ResponsiveTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../../components/ConfirmModal';

export default function QuotationBin() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, no: '' });

  useEffect(() => {
    fetchBin();
  }, []);

  const fetchBin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotations?basic=true&bin=true');
      const data = await res.json();
      setQuotations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    // optimistic remove from bin list
    setQuotations(prev => prev.filter(q => q.id !== id));
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: 'PATCH' });
      if (res.ok) {
        toast.success('Quotation restored');
      } else {
        toast.error('Failed to restore');
        fetchBin();
      }
    } catch (error) {
      console.error('Error restoring:', error);
      toast.error('Error restoring quotation');
      fetchBin();
    }
  };

  const handlePermanentDelete = async (id) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
    try {
      const res = await fetch(`/api/quotations/${id}?permanent=true`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Permanently deleted');
      } else {
        toast.error('Failed to delete');
        fetchBin();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Error deleting quotation');
      fetchBin();
    }
  };

  const filtered = quotations.filter(q => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      (q.clientName && q.clientName.toLowerCase().includes(term)) ||
      (q.quotationNo && q.quotationNo.toLowerCase().includes(term)) ||
      (q.subject && q.subject.toLowerCase().includes(term)) ||
      (q.receiverCompany && q.receiverCompany.toLowerCase().includes(term)) ||
      (q.receiverName && q.receiverName.toLowerCase().includes(term))
    );
  });

  const columns = [
    {
      key: 'quotationNo', label: 'Quotation No', mobile: 'title',
      render: (q) => <span className="font-medium text-slate-700">{q.quotationNo}</span>,
    },
    {
      key: 'clientName', label: 'Client', mobile: 'subtitle',
      render: (q) => <div className="font-medium text-slate-800">{q.clientName}</div>,
    },
    {
      key: 'subject', label: 'Subject', mobile: 'meta',
      render: (q) => (
        <div className="text-slate-600 text-sm truncate max-w-[200px]" title={q.subject}>
          {q.subject || '-'}
        </div>
      ),
    },
    {
      key: 'deletedAt', label: 'Deleted On', mobile: 'meta',
      render: (q) => q.deletedAt
        ? new Date(q.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-',
    },
    {
      key: 'totalAmount', label: 'Total Amount', mobile: 'highlight',
      render: (q) => `₹${(q.totalAmount || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'status', label: 'Status', mobile: 'badge',
      render: (q) => <Badge status={q.status || 'Active'} />,
    },
    {
      key: 'actions', label: '', align: 'right', mobile: 'actions',
      render: (q) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleRestore(q.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            title="Restore to quotations"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore
          </button>
          <button
            onClick={() => setConfirmModal({ isOpen: true, id: q.id, no: q.quotationNo })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            title="Delete forever"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Forever
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Trash2}
          title="Bin"
          subtitle="Deleted quotations. Restore them, or delete forever. Binned quotations don't count in dashboard totals."
          search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search bin...' }}
          actions={<Button href="/quotation" icon={ArrowLeft} variant="secondary">Back to Quotations</Button>}
        />

        <Card className="overflow-hidden">
          <div className="p-3 md:p-0">
            <ResponsiveTable
              columns={columns}
              rows={filtered}
              rowKey={(q) => q.id}
              loading={loading}
              emptyState={<>The Bin is empty. Deleted quotations will appear here.</>}
            />
          </div>
        </Card>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, id: null, no: '' })}
          onConfirm={() => {
            if (confirmModal.id) handlePermanentDelete(confirmModal.id);
            setConfirmModal({ isOpen: false, id: null, no: '' });
          }}
          title="Delete Forever"
          message={`Permanently delete ${confirmModal.no || 'this quotation'}? This cannot be undone.`}
        />
      </div>
    </AppShell>
  );
}
