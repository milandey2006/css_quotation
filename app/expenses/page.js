'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AppShell from '../components/ui/AppShell';
import PageHeader from '../components/ui/PageHeader';
import ResponsiveTable from '../components/ui/ResponsiveTable';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConfirmModal from '../components/ConfirmModal';
import ExpenseModal, { EXPENSE_CATEGORIES } from '../components/ExpenseModal';
import { Wallet, Plus, Edit, Trash2, CheckCircle2, Undo2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const CATEGORY_COLORS = {
  Conveyance: 'bg-blue-50 text-blue-700 border-blue-200',
  Fuel: 'bg-orange-50 text-orange-700 border-orange-200',
  Food: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Advance: 'bg-purple-50 text-purple-700 border-purple-200',
  Tools: 'bg-slate-100 text-slate-700 border-slate-200',
  Other: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function ExpensesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role;
      if (role !== 'admin' && role !== 'super-admin') {
        router.push('/');
      }
    }
  }, [isLoaded, user, router]);

  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const fetchData = async () => {
    try {
      const [expRes, empRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/employees'),
      ]);
      if (expRes.ok) setExpenses(await expRes.json());
      if (empRes.ok) {
        const empData = await empRes.json();
        if (Array.isArray(empData)) setEmployees(empData);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const toggleStatus = async (expense) => {
    const newStatus = expense.status === 'settled' ? 'pending' : 'settled';
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expense, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
      const settledLabel = expense.type === 'collected' ? 'remitted' : 'deducted';
      toast.success(newStatus === 'settled' ? `Marked as ${settledLabel}` : 'Marked as pending');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredExpenses = useMemo(() => expenses.filter(e => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (e.employeeName || '').toLowerCase().includes(q) ||
      (e.purpose || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.clientName || '').toLowerCase().includes(q);
    const matchesType = typeFilter === 'All' || e.type === typeFilter;
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    // e.date is a plain 'YYYY-MM-DD' string, so lexicographic comparison is
    // already chronological -- no Date parsing/timezone issues. Filling only
    // "From" picks that single date; filling both makes it a range.
    const matchesDate =
      dateFrom && dateTo ? e.date >= dateFrom && e.date <= dateTo :
      dateFrom ? e.date === dateFrom :
      dateTo ? e.date <= dateTo :
      true;
    return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesDate;
  }), [expenses, searchTerm, typeFilter, categoryFilter, statusFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const now = new Date();
    const isThisMonth = (e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const givenThisMonth = expenses.filter(e => e.type === 'given' && isThisMonth(e))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const pendingAdvance = expenses.filter(e => e.type === 'given' && e.category === 'Advance' && e.status === 'pending')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const owedByEmployees = expenses.filter(e => e.type === 'collected' && e.status === 'pending')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return { givenThisMonth, pendingAdvance, owedByEmployees };
  }, [expenses]);

  const columns = [
    {
      key: 'date', label: 'Date', mobile: 'meta',
      render: (e) => new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      key: 'type', label: 'Type', mobile: 'badge',
      render: (e) => (
        e.type === 'collected' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200">
            <ArrowDownLeft className="w-3 h-3" /> Collected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
            <ArrowUpRight className="w-3 h-3" /> Given
          </span>
        )
      ),
    },
    {
      key: 'employee', label: 'Employee', mobile: 'title',
      render: (e) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {(e.employeeName || '?').charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800">{e.employeeName}</span>
          {e.source === 'employee' && (
            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1 py-px uppercase tracking-wide" title="Logged by the employee from the mobile app">
              App
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category', label: 'Category / Client', mobile: 'meta',
      render: (e) => (
        e.type === 'collected' ? (
          <span className="text-slate-600">from <span className="font-medium text-slate-800">{e.clientName || '-'}</span></span>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.Other}`}>
            {e.category}
          </span>
        )
      ),
    },
    {
      key: 'purpose', label: 'Purpose', mobile: 'meta',
      render: (e) => (
        <div className="flex items-center gap-2">
          {e.receiptPhotoUrl && (
            <a href={e.receiptPhotoUrl} target="_blank" rel="noopener noreferrer" title="Receipt photo — tap to enlarge" className="flex-shrink-0">
              <img src={e.receiptPhotoUrl} alt="Receipt" className="w-8 h-8 rounded object-cover border border-slate-200" />
            </a>
          )}
          <span className="text-slate-600 truncate max-w-[200px] block" title={e.purpose}>{e.purpose || '-'}</span>
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount', mobile: 'highlight', align: 'right',
      render: (e) => <span className="font-bold text-slate-800">₹{Number(e.amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status', label: 'Status', mobile: 'badge',
      render: (e) => {
        const settledLabel = e.type === 'collected' ? 'Remitted' : 'Deducted';
        return (
          <button
            onClick={() => toggleStatus(e)}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
              e.status === 'settled'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title={e.status === 'settled' ? 'Click to mark as pending again' : `Click to mark as ${settledLabel.toLowerCase()}`}
          >
            {e.status === 'settled' ? <CheckCircle2 className="w-3 h-3" /> : <Undo2 className="w-3 h-3" />}
            {e.status === 'settled' ? settledLabel : 'Pending'}
          </button>
        );
      },
    },
    {
      key: 'actions', label: '', align: 'right', mobile: 'actions',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => { setEditingExpense(e); setModalOpen(true); }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmModal({ isOpen: true, id: e.id })}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">

        <PageHeader
          icon={Wallet}
          title="Expense Management"
          subtitle="Track payments given to employees and cash they've collected on the company's behalf."
          search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search employee, client, purpose...' }}
          actions={
            <Button icon={Plus} onClick={() => { setEditingExpense(null); setModalOpen(true); }}>
              Record Entry
            </Button>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Given This Month</p>
            <p className="text-2xl font-bold text-slate-900">₹{totals.givenThisMonth.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="p-4 bg-amber-50/60 border-amber-100">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Pending Advance (Salary)</p>
            <p className="text-2xl font-bold text-amber-700">₹{totals.pendingAdvance.toLocaleString('en-IN')}</p>
          </Card>
          <Card className="p-4 bg-purple-50/60 border-purple-100">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Owed by Employees</p>
            <p className="text-2xl font-bold text-purple-700">₹{totals.owedByEmployees.toLocaleString('en-IN')}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
          >
            <option value="All">Given &amp; Collected</option>
            <option value="given">Given to Employee</option>
            <option value="collected">Collected from Client</option>
          </select>
          {typeFilter !== 'collected' && (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          )}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="settled">Settled</option>
          </select>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              title="From date (leave To empty to search a single date)"
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              title="To date (optional -- leave empty to search a single date)"
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          {(searchTerm || typeFilter !== 'All' || categoryFilter !== 'All' || statusFilter !== 'All' || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearchTerm(''); setTypeFilter('All'); setCategoryFilter('All'); setStatusFilter('All'); setDateFrom(''); setDateTo(''); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 self-center"
            >
              Clear Filters
            </button>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="p-3 md:p-0">
            <ResponsiveTable
              columns={columns}
              rows={filteredExpenses}
              rowKey={(e) => e.id}
              loading={loading}
              emptyState="Nothing recorded yet. Click 'Record Entry' to add one."
            />
          </div>
        </Card>
      </div>

      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingExpense(null); }}
        employees={employees}
        expense={editingExpense}
        onSaved={() => fetchData()}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={() => {
          if (confirmModal.id) handleDelete(confirmModal.id);
        }}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? If it was a salary advance, the amount will be reversed from the employee's balance."
      />
    </AppShell>
  );
}
