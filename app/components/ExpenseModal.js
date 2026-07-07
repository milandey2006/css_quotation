"use client";
import { useState, useEffect } from 'react';
import { X, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { toast } from 'sonner';

export const EXPENSE_CATEGORIES = ['Conveyance', 'Fuel', 'Food', 'Advance', 'Tools', 'Other'];

export default function ExpenseModal({ isOpen, onClose, onSaved, employees, expense }) {
  const isEdit = !!expense;
  const [type, setType] = useState('given'); // 'given' | 'collected'
  const [employeeName, setEmployeeName] = useState('');
  const [category, setCategory] = useState('Conveyance');
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [saving, setSaving] = useState(false);

  // Only active employees are offered as suggestions -- someone marked
  // inactive/fired shouldn't keep showing up here, though their name can
  // still be typed manually if you need to record something after the fact.
  const activeEmployees = employees.filter(e => (e.status || 'active') === 'active');

  useEffect(() => {
    if (!isOpen) return;
    if (expense) {
      setType(expense.type || 'given');
      setEmployeeName(expense.employeeName || '');
      setCategory(expense.category || 'Conveyance');
      setClientName(expense.clientName || '');
      setAmount(expense.amount || '');
      setDate(expense.date || new Date().toISOString().split('T')[0]);
      setPurpose(expense.purpose || '');
    } else {
      setType('given');
      setEmployeeName('');
      setCategory('Conveyance');
      setClientName('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPurpose('');
    }
  }, [isOpen, expense]);

  if (!isOpen) return null;

  // A typed name only links to the advance-balance ledger if it exactly
  // matches an active employee; otherwise it's just recorded as free text
  // (e.g. a temp worker not yet in the Employees list).
  const matchedEmployee = activeEmployees.find(e => e.name.trim().toLowerCase() === employeeName.trim().toLowerCase());
  const willAffectBalance = type === 'given' && category === 'Advance' && matchedEmployee;

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!employeeName.trim()) { toast.error('Enter or select an employee'); return; }
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (type === 'collected' && !clientName.trim()) { toast.error('Enter which client the money was collected from'); return; }

    setSaving(true);
    try {
      const payload = {
        employeeId: matchedEmployee ? matchedEmployee.id : null,
        employeeName: matchedEmployee ? matchedEmployee.name : employeeName.trim(),
        type,
        category: type === 'given' ? category : undefined,
        clientName: type === 'collected' ? clientName.trim() : undefined,
        amount: amt,
        date,
        purpose,
      };
      const res = await fetch(isEdit ? `/api/expenses/${expense.id}` : '/api/expenses', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      toast.success(isEdit ? 'Expense updated' : `₹${amt.toLocaleString('en-IN')} recorded for ${payload.employeeName}`);
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            {isEdit ? 'Edit Entry' : 'Record Entry'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">

          {/* Type toggle -- two fundamentally different directions of money movement */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('given')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                type === 'given'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Given to Employee
            </button>
            <button
              type="button"
              onClick={() => setType('collected')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                type === 'collected'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Collected from Client
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {type === 'given' ? 'Employee' : 'Employee who collected it'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="expense-employee-suggestions"
              value={employeeName}
              onChange={e => setEmployeeName(e.target.value)}
              placeholder="Select from list or type a name"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <datalist id="expense-employee-suggestions">
              {activeEmployees.map(e => (
                <option key={e.id} value={e.name} />
              ))}
            </datalist>
            {type === 'given' && (
              matchedEmployee ? (
                <p className="text-xs text-slate-400 mt-1.5">
                  Current advance balance: <span className="font-semibold text-rose-600">₹{(matchedEmployee.advanceBalance || 0).toLocaleString('en-IN')}</span>
                </p>
              ) : employeeName.trim() && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Not an existing employee -- this will be recorded as a note only, without affecting any advance balance.
                </p>
              )
            )}
          </div>

          {type === 'collected' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Collected From (Client) <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Rini Dak"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount (₹) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {type === 'given' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      category === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Purpose / Note</label>
            <textarea
              rows={2}
              placeholder={type === 'given' ? "e.g. Auto fare for site visit at Andheri East" : "e.g. Cash payment collected on delivery"}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          {willAffectBalance && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 text-xs text-amber-700">
              This amount will be added to {matchedEmployee.name}'s advance balance, to be deducted from a future salary slip.
            </div>
          )}
          {type === 'collected' && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-3.5 py-2.5 text-xs text-purple-700">
              This tracks cash the employee is holding on the company's behalf. It does not touch any salary balance -- mark it "Remitted" once they've handed it over.
            </div>
          )}
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
            {isEdit ? 'Save Changes' : 'Record Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
