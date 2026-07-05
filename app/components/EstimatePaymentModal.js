"use client";
import { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, IndianRupee, Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from './ConfirmModal';
import PaymentReceiptModal from './PaymentReceiptModal';

export default function EstimatePaymentModal({ isOpen, onClose, estimate, onPaymentSaved }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('Cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [receiptPreviewIndex, setReceiptPreviewIndex] = useState(null);
  // Mirrors estimate.payments/paidAmount locally so a delete updates this modal
  // immediately, instead of showing stale data until it's closed and reopened.
  const [localPayments, setLocalPayments] = useState([]);
  const [localPaidAmount, setLocalPaidAmount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setMethod('Cash');
      setNote('');
      setConfirmDeleteIndex(null);
      setReceiptPreviewIndex(null);
      setLocalPayments(Array.isArray(estimate?.payments) ? estimate.payments : []);
      setLocalPaidAmount(Number(estimate?.paidAmount) || 0);
    }
  }, [isOpen, estimate]);

  if (!isOpen || !estimate) return null;

  const total = Number(estimate.totalAmount) || 0;
  const remaining = Math.max(0, total - localPaidAmount);
  const payments = localPayments;

  // estimate.clientName holds the full "Bill To" text (name on the first line,
  // address on the following lines) -- split it the same way the receipt format expects.
  const billToLines = (estimate.clientName || estimate.billTo || '').split('\n');
  const receiptClientName = (billToLines[0] || '').trim();
  const receiptClientAddress = billToLines.slice(1).join('\n').trim();

  const buildReceiptData = (payment) => {
    const datePart = payment.date ? payment.date.replace(/-/g, '') : '';
    return {
      clientName: receiptClientName,
      clientAddress: receiptClientAddress,
      invoiceNo: estimate.billNo,
      billingRef: `EST${estimate.id}-${datePart}`,
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      note: payment.note,
    };
  };

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, date, method, note }),
      });
      if (!res.ok) throw new Error('Failed to save payment');
      const updated = await res.json();
      setLocalPayments(Array.isArray(updated.payments) ? updated.payments : []);
      setLocalPaidAmount(Number(updated.paidAmount) || 0);
      toast.success(`₹${parsed.toLocaleString('en-IN')} payment recorded`);
      onPaymentSaved(updated);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error saving payment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (index) => {
    setDeletingIndex(index);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}/payment?index=${index}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete payment');
      const updated = await res.json();
      setLocalPayments(Array.isArray(updated.payments) ? updated.payments : []);
      setLocalPaidAmount(Number(updated.paidAmount) || 0);
      toast.success('Payment removed');
      onPaymentSaved(updated);
    } catch (err) {
      toast.error(err.message || 'Error deleting payment');
    } finally {
      setDeletingIndex(null);
      setConfirmDeleteIndex(null);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${receiptPreviewIndex !== null ? 'invisible' : ''}`}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Record Payment</h2>
            <p className="text-xs text-slate-400 mt-0.5">{estimate.billNo} · {estimate.clientName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5 bg-slate-50/60">

          {/* Amount Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Total</p>
              <p className="text-sm font-bold text-slate-800">₹{total.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 text-center">
              <p className="text-[10px] text-emerald-600 uppercase font-semibold tracking-wider mb-1">Received</p>
              <p className="text-sm font-bold text-emerald-700">₹{localPaidAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-rose-50 rounded-xl border border-rose-100 p-3 text-center">
              <p className="text-[10px] text-rose-500 uppercase font-semibold tracking-wider mb-1">Balance</p>
              <p className="text-sm font-bold text-rose-600">₹{remaining.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-3">Payment History</h3>
              <div className="space-y-2">
                {payments.map((p, i) => (
                  <div key={i} className="flex justify-between items-center gap-2 text-xs text-slate-600 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <span className="font-medium">{p.date}</span>
                      <span className="text-slate-400 ml-2">({p.method})</span>
                      {p.note && <span className="block text-[10px] text-slate-400">Ref: {p.note}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-emerald-600">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => setReceiptPreviewIndex(i)}
                        className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="View / print receipt"
                      >
                        <Receipt size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteIndex(i)}
                        disabled={deletingIndex === i}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                        title="Delete payment"
                      >
                        {deletingIndex === i
                          ? <div className="w-3.5 h-3.5 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Payment Form */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
            <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">New Payment</h3>

            {/* Amount */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Method</label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer"
                >
                  <option>Cash</option>
                  <option>UPI / GPay</option>
                  <option>Bank / NEFT</option>
                  <option>Cheque</option>
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Transaction Ref / UTR / Cheque No.</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-colors disabled:opacity-60"
          >
            {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Save Payment
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDeleteIndex !== null}
        onClose={() => setConfirmDeleteIndex(null)}
        onConfirm={() => {
          if (confirmDeleteIndex !== null) handleDeletePayment(confirmDeleteIndex);
        }}
        title="Delete Payment"
        message="Are you sure you want to remove this payment? The balance due will be recalculated."
      />

      <PaymentReceiptModal
        isOpen={receiptPreviewIndex !== null}
        onClose={() => setReceiptPreviewIndex(null)}
        receiptData={receiptPreviewIndex !== null ? buildReceiptData(payments[receiptPreviewIndex]) : null}
      />
    </div>
  );
}
