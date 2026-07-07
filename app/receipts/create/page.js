"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Printer, Save, Calendar, ImageDown } from 'lucide-react';
import ReceiptPreview from '../../components/ReceiptPreview';
import { downloadElementAsImage } from '../../lib/downloadImage';

function CreateReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobileView, setMobileView] = useState('edit'); // 'edit' | 'preview'
  const previewRef = useRef(null);

  const [data, setData] = useState({
    receiptNo: '',
    clientName: '',
    clientAddress: '',
    invoiceNo: '',
    billingRef: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Cash',
    note: '',
  });

  // Auto-generate a billing reference for a brand-new receipt so it shows in the preview.
  useEffect(() => {
    if (!id) {
      setData(prev => prev.billingRef ? prev : { ...prev, billingRef: Date.now().toString() });
    }
  }, [id]);

  // Load existing receipt for view/print/edit
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/receipts/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(receipt => setData({
        receiptNo: receipt.receiptNo || '',
        clientName: receipt.clientName || '',
        clientAddress: receipt.clientAddress || '',
        invoiceNo: receipt.invoiceNo || '',
        billingRef: receipt.billingRef || '',
        description: receipt.description || '',
        amount: receipt.amount || '',
        date: receipt.date || new Date().toISOString().split('T')[0],
        method: receipt.method || 'Cash',
        note: receipt.note || '',
      }))
      .catch(() => toast.error('Failed to load receipt'))
      .finally(() => setLoading(false));
  }, [id]);

  // PDF filename when printing
  useEffect(() => {
    document.title = data.receiptNo
      ? `Receipt ${data.receiptNo} - ${data.clientName || 'Client'}`
      : 'Champion Security System Receipt';
  }, [data.receiptNo, data.clientName]);

  const set = (k, v) => setData(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    const amt = parseFloat(data.amount);
    if (!data.clientName.trim()) { toast.error('Enter the client name'); return; }
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }

    setIsSaving(true);
    try {
      const res = await fetch(id ? `/api/receipts/${id}` : '/api/receipts', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, amount: amt }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setData(prev => ({ ...prev, receiptNo: saved.receiptNo }));
      toast.success(id ? 'Receipt updated' : `Receipt ${saved.receiptNo} saved`);
      if (!id) {
        // Move into edit mode for the newly created receipt so Print/re-save work on it
        router.replace(`/receipts/create?id=${saved.id}`);
      }
    } catch {
      toast.error('Failed to save receipt');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (!data.receiptNo) {
      toast.info('Save the receipt first, then print.');
      return;
    }
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!data.receiptNo) {
      toast.info('Save the receipt first, then download.');
      return;
    }
    setIsDownloading(true);
    try {
      await downloadElementAsImage(previewRef.current, `Receipt_${data.receiptNo.replace(/\//g, '-')}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save image');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Receipt...</div>;
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col md:flex-row md:h-screen md:overflow-hidden print:min-h-0 print:h-auto print:overflow-visible print:block print:bg-white">

      {/* Back button */}
      <div className="fixed top-4 left-4 z-50 flex gap-2 print:hidden">
        <button
          onClick={() => router.push('/receipts')}
          className="p-2 bg-white text-slate-600 rounded-lg shadow-md border border-slate-200 hover:text-blue-600 hover:border-blue-400 transition-all flex items-center gap-2"
          title="Back to Receipts"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="hidden md:inline font-medium text-sm">Back to Receipts</span>
        </button>
      </div>

      {/* Mobile Edit/Preview toggle */}
      <div className="md:hidden fixed top-4 right-4 z-50 flex bg-white rounded-lg shadow-md border border-slate-200 p-1 gap-1 print:hidden">
        <button
          onClick={() => setMobileView('edit')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mobileView === 'edit' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
        >
          Edit
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mobileView === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
        >
          Preview
        </button>
      </div>

      {/* Form pane */}
      <div className={`w-full md:w-[400px] lg:w-[450px] md:h-full overflow-y-auto flex-shrink-0 bg-white border-r border-gray-200 z-10 print:hidden pt-16 md:pt-6 ${mobileView === 'edit' ? 'block' : 'hidden'} md:block`}>
        <div className="p-6 space-y-5">
          <div className="md:pl-32">
            <h1 className="text-xl font-bold text-slate-900">{id ? 'Edit Receipt' : 'New Receipt'}</h1>
            {data.receiptNo && <p className="text-xs text-slate-400 font-mono mt-1">{data.receiptNo}</p>}
          </div>

          <div>
            <label className={labelCls}>Client Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Pranay Sir"
              value={data.clientName}
              onChange={e => set('clientName', e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Client Address</label>
            <textarea
              rows={2}
              placeholder="e.g. King Circle, Mumbai"
              value={data.clientAddress}
              onChange={e => set('clientAddress', e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Amount (₹) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={data.amount}
                onChange={e => set('amount', e.target.value)}
                className={`${inputCls} pl-8 font-bold`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Payment Date</label>
              <input
                type="date"
                value={data.date}
                onChange={e => set('date', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Payment Method</label>
              <select
                value={data.method}
                onChange={e => set('method', e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option>Cash</option>
                <option>UPI / GPay</option>
                <option>Bank / NEFT</option>
                <option>Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Invoice / Reference No.</label>
            <input
              type="text"
              placeholder="e.g. CSS/2025/-088"
              value={data.invoiceNo}
              onChange={e => set('invoiceNo', e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
            <input
              type="text"
              placeholder="Defaults to 'Invoice #<ref>' if left blank"
              value={data.description}
              onChange={e => set('description', e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Note / UTR / Cheque No. <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
            <input
              type="text"
              placeholder="Optional"
              value={data.note}
              onChange={e => set('note', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm font-semibold disabled:opacity-60"
            >
              {isSaving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Save className="w-4 h-4" />}
              {id ? 'Update Receipt' : 'Save Receipt'}
            </button>
            <button
              onClick={handlePrint}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all border ${
                data.receiptNo
                  ? 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                  : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all border disabled:opacity-60 ${
                data.receiptNo
                  ? 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                  : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              }`}
              title="Save as Image"
            >
              {isDownloading
                ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                : <ImageDown className="w-4 h-4" />}
            </button>
          </div>

          {!data.receiptNo && (
            <p className="text-xs text-slate-400 text-center">Receipt number is generated when you save.</p>
          )}
        </div>
      </div>

      {/* Preview pane */}
      <div className={`flex-1 h-full overflow-y-auto overflow-x-auto bg-gray-200 p-4 md:p-8 justify-center relative print:w-full print:h-auto print:overflow-visible print:p-0 print:m-0 print:bg-white print:block print:static pt-20 md:pt-8 ${mobileView === 'preview' ? 'flex' : 'hidden'} md:flex`}>
        <div className="receipt-print-wrapper transform scale-[0.5] sm:scale-[0.6] md:scale-[0.55] lg:scale-[0.7] xl:scale-[0.85] 2xl:scale-100 origin-top transition-transform duration-300 ease-out print:transform-none">
          <ReceiptPreview ref={previewRef} data={data} />
        </div>
      </div>
    </main>
  );
}

export default function CreateReceipt() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreateReceiptContent />
    </Suspense>
  );
}
