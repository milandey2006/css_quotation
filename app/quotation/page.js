"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '../components/ui/AppShell';
import PageHeader from '../components/ui/PageHeader';
import ResponsiveTable from '../components/ui/ResponsiveTable';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { buildShareSlug } from '../utils/shareSlug';
import {
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

export default function QuotationList() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotations?basic=true');
      const data = await res.json();
      setQuotations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
      try {
        setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));

        const res = await fetch(`/api/quotations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              ...quotations.find(q => q.id === id),
              status: newStatus
           })
        });

        if (!res.ok) {
            fetchDocuments();
            toast.error('Failed to update status');
        } else {
            toast.success('Status updated');
        }
      } catch (error) {
        console.error('Error updating status:', error);
        fetchDocuments();
      }
  };

  const handleDelete = async (id) => {
      try {
        const res = await fetch(`/api/quotations/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchDocuments();
          toast.success('Quotation deleted successfully');
        } else {
          toast.error('Failed to delete quotation');
        }
      } catch (error) {
        console.error('Error deleting:', error);
        toast.error('Error deleting quotation');
      }
  };

  const filteredQuotations = quotations.filter(q => {
    const term = searchTerm.toLowerCase();
    
    if (
        (q.clientName && q.clientName.toLowerCase().includes(term)) ||
        (q.quotationNo && q.quotationNo.toLowerCase().includes(term)) ||
        (q.receiverPhone && q.receiverPhone.toLowerCase().includes(term)) ||
        (q.receiverCompany && q.receiverCompany.toLowerCase().includes(term)) ||
        (q.receiverName && q.receiverName.toLowerCase().includes(term)) ||
        (q.subject && q.subject.toLowerCase().includes(term)) ||
        (q.data?.subject && q.data.subject.toLowerCase().includes(term))
    ) {
        return true;
    }

    let items = q.items || q.data?.items;
    if (!items && q.itemsText) {
        try { items = JSON.parse(q.itemsText); } catch(e) {}
    }

    if (items && Array.isArray(items)) {
        return items.some(item => 
            (item.make && String(item.make).toLowerCase().includes(term)) ||
            (item.description && String(item.description).toLowerCase().includes(term))
        );
    }
    
    return false;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotations = filteredQuotations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

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
        <div className="text-slate-600 text-sm truncate max-w-[200px] cursor-pointer hover:whitespace-normal hover:overflow-visible hover:relative z-10 bg-transparent hover:bg-white hover:shadow-lg hover:p-2 rounded-lg transition-all" title={q.subject || q.data?.subject}>
          {q.subject || q.data?.subject || '-'}
        </div>
      ),
    },
    {
      key: 'date', label: 'Date', mobile: 'meta',
      render: (q) => new Date(q.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
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
             href={`/preview/${q.id}?type=Quotation`}
             target="_blank"
             className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
           >
             <Eye className="w-4 h-4" />
           </Link>
         </ActionTooltip>

         <ActionTooltip content="Duplicate">
           <Link
             href={`/quotation/create?cloneId=${q.id}`}
             className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
           >
             <Copy className="w-4 h-4" />
           </Link>
         </ActionTooltip>

         <ActionTooltip content="Edit">
           <Link
             href={`/quotation/create?id=${q.id}`}
             className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
           >
             <Edit className="w-4 h-4" />
           </Link>
         </ActionTooltip>

         <ActionTooltip content="Share">
           <button
             onClick={() => {
                 if (!q.publicId) {
                     toast.warning('This quotation is from an older version and does not have a shareable link yet. Please click "Edit" and then "Save" once to generate a link.', { duration: 5000 });
                     return;
                 }
                 const slug = buildShareSlug(q.clientName, q.quotationNo, q.publicId);
                 const shareUrl = `${window.location.origin}/quotation/${slug}`;
                 navigator.clipboard.writeText(shareUrl)
                     .then(() => toast.success('Share link copied!'))
                     .catch(() => toast.error('Failed to copy link.'));
             }}
             className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
           >
             <Share2 className="w-4 h-4" />
           </button>
         </ActionTooltip>

         <ActionTooltip content="Delete">
           <button
             onClick={() => setConfirmModal({ isOpen: true, id: q.id })}
             className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
           >
             <Trash2 className="w-4 h-4" />
           </button>
         </ActionTooltip>
        </div>
      ),
    },
  ];

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <AppShell>
        <div className="max-w-7xl mx-auto">
          
          <PageHeader
            icon={FileText}
            title="Quotations"
            subtitle="Manage and track your official quotations."
            search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search quotations...' }}
            actions={<Button href="/quotation/create" icon={Plus}>Create Quotation</Button>}
          />

          <Card className="overflow-hidden">
            <div className="p-3 md:p-0">
              <ResponsiveTable
                columns={columns}
                rows={currentQuotations}
                rowKey={(q) => q.id}
                loading={loading}
                emptyState={<>No quotations found. Click &quot;Create Quotation&quot; to start.</>}
              />
            </div>

             <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4 rounded-b-2xl">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-500">
                    <div>
                        Showing {filteredQuotations.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredQuotations.length)} of {filteredQuotations.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap font-medium text-slate-600">Rows per page:</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 max-w-full pb-2 md:pb-0">
                    <button 
                        onClick={goToPreviousPage} 
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-white transition-colors shadow-sm font-medium"
                    >
                        Prev
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Show few pages around current page to avoid clutter if many pages
                        if (totalPages > 7) {
                            if (page !== 1 && page !== totalPages && Math.abs(currentPage - page) > 1) {
                                if (page === 2 || page === totalPages - 1) {
                                    return <span key={page} className="px-2 text-slate-400">...</span>;
                                }
                                return null;
                            }
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3.5 py-1.5 text-sm font-semibold border rounded-lg transition-all shadow-sm ${
                                    currentPage === page 
                                    ? 'bg-blue-600 text-white border-blue-600 scale-105' 
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {page}
                            </button>
                        );
                    })}

                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-white transition-colors shadow-sm font-medium"
                    >
                        Next
                    </button>
                </div>
            </div>
          </Card>

          <ConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ isOpen: false, id: null })}
            onConfirm={() => {
                if (confirmModal.id) handleDelete(confirmModal.id);
                setConfirmModal({ isOpen: false, id: null });
            }}
            title="Delete Quotation"
            message="Are you sure you want to permanently delete this quotation? This action cannot be undone."
          />

        </div>
    </AppShell>
  );
}

const ActionTooltip = ({ children, content }) => (
  <div className="group/tooltip relative">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);
