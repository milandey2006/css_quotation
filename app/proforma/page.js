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
  Share2
} from 'lucide-react';

export default function ProformaList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter(); 

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proformas?basic=true');
      if (!res.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setInvoices(data);
      } else {
        console.error('API returned non-array data:', data);
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching proformas:', error);
      setInvoices([]);
    } finally {
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

  const filteredInvoices = invoices.filter(q => {
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

  const columns = [
    {
      key: 'quotationNo', label: 'PI No', mobile: 'title',
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

         <ActionTooltip content="Share">
           <button
             onClick={() => {
                 if (!q.publicId) {
                     alert('This proforma is from an older version and does not have a shareable link yet.\n\nPlease click "Edit" and then "Save" once to generate a link.');
                     return;
                 }
                 const slug = buildShareSlug(q.clientName, q.quotationNo, q.publicId);
                 const shareUrl = `${window.location.origin}/proforma/${slug}`;
                 navigator.clipboard.writeText(shareUrl)
                     .then(() => alert('Share link copied!\n\n' + shareUrl))
                     .catch(() => alert('Failed to copy link. Copy manually:\n' + shareUrl));
             }}
             className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
           >
             <Share2 className="w-4 h-4" />
           </button>
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
      ),
    },
  ];

  return (
    <AppShell>
        <div className="max-w-7xl mx-auto">

          <PageHeader
            icon={FileText}
            title="Proforma Invoices"
            subtitle="Manage all your proforma invoices."
            search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search proformas...' }}
            actions={<Button href="/proforma/create" icon={Plus}>Create Proforma</Button>}
          />

          <Card className="overflow-hidden">
            <div className="p-3 md:p-0">
              <ResponsiveTable
                columns={columns}
                rows={filteredInvoices}
                rowKey={(q) => q.id}
                loading={loading}
                emptyState={<>No proformas found. Click &quot;Create Proforma&quot; to start.</>}
              />
            </div>

             <div className="p-4 border-t border-slate-100 flex justify-center text-xs text-slate-400">
                End of list
            </div>
          </Card>

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
