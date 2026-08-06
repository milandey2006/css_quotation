import React, { useEffect, useRef, useState } from 'react';
import { fetchReceipts, saveReceiptRecord } from '../lib/api';
import { saveReceipt, shareReceipt } from '../lib/exportReceipt';
import ReceiptDocument from '../components/ReceiptDocument.jsx';

const METHODS = ['Cash', 'UPI / GPay', 'Bank / NEFT', 'Cheque'];
const BLANK = {
  clientName: '',
  clientAddress: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  method: 'Cash',
  invoiceNo: '',
  description: '',
  note: '',
};

export default function ReceiptsScreen() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [items, setItems] = useState([]);
  const [listStatus, setListStatus] = useState('loading'); // loading | done | error
  const [listError, setListError] = useState('');

  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [receiptNo, setReceiptNo] = useState('');
  const [billingRef, setBillingRef] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null); // { type, text }

  const docRef = useRef(null);

  const load = async () => {
    setListStatus('loading');
    try {
      setItems(await fetchReceipts());
      setListStatus('done');
    } catch (e) {
      setListError(e.message || 'Could not load receipts.');
      setListStatus('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => {
    setForm(BLANK);
    setEditingId(null);
    setReceiptNo('');
    setBillingRef(Date.now().toString());
    setMsg(null);
    setView('form');
  };

  const openEdit = (r) => {
    setForm({
      clientName: r.clientName || '',
      clientAddress: r.clientAddress || '',
      amount: String(r.amount ?? ''),
      date: r.date || new Date().toISOString().split('T')[0],
      method: r.method || 'Cash',
      invoiceNo: r.invoiceNo || '',
      description: r.description || '',
      note: r.note || '',
    });
    setEditingId(r.id);
    setReceiptNo(r.receiptNo || '');
    setBillingRef(r.billingRef || '');
    setMsg(null);
    setView('form');
  };

  const handleSave = async () => {
    if (!form.clientName.trim()) {
      setMsg({ type: 'error', text: 'Enter the client name.' });
      return;
    }
    if (!Number(form.amount) || Number(form.amount) <= 0) {
      setMsg({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const saved = await saveReceiptRecord({ ...form, amount: Number(form.amount) }, editingId);
      setReceiptNo(saved.receiptNo || '');
      setBillingRef(saved.billingRef || billingRef);
      setEditingId(saved.id);
      setMsg({ type: 'success', text: editingId ? 'Receipt updated.' : `Receipt ${saved.receiptNo} saved.` });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'Could not save receipt.' });
    } finally {
      setSaving(false);
    }
  };

  // Save/share are only meaningful once the receipt has its number from the server.
  const doExport = async (mode, format) => {
    if (!receiptNo) {
      setMsg({ type: 'error', text: 'Save the receipt first, then download or share.' });
      return;
    }
    setBusy(`${mode}-${format}`);
    setMsg(null);
    try {
      if (mode === 'save') {
        const { fileName, label } = await saveReceipt(docRef.current, format, receiptNo);
        setMsg({ type: 'success', text: `Saved to ${label}: ${fileName}` });
      } else {
        await shareReceipt(docRef.current, format, receiptNo);
      }
    } catch (e) {
      console.error(e);
      // Surface the real reason — a generic message makes field issues impossible
      // to diagnose over the phone.
      const detail = e?.message ? ` (${e.message})` : '';
      setMsg({ type: 'error', text: `Could not ${mode} the ${format.toUpperCase()}${detail}` });
    } finally {
      setBusy('');
    }
  };

  const previewData = { ...form, receiptNo, billingRef };

  if (view === 'list') {
    return (
      <div className="screen">
        <div className="card">
          <h2>Receipts</h2>
          <p className="hint">Create a receipt for a client on site, then save or share it.</p>
          <button className="btn primary full" onClick={openNew}>+ New Receipt</button>
        </div>

        <div className="card">
          <h2>My Receipts</h2>
          {listStatus === 'loading' ? (
            <p className="hint tight">Loading…</p>
          ) : listStatus === 'error' ? (
            <div className="alert error">
              {listError} <button className="linklike" onClick={load}>Retry</button>
            </div>
          ) : items.length === 0 ? (
            <p className="hint tight">No receipts yet.</p>
          ) : (
            <div className="expense-list">
              {items.map((r) => (
                <button key={r.id} className="expense-row receipt-row" onClick={() => openEdit(r)}>
                  <div className="expense-main">
                    <span className="expense-cat">{r.clientName || '—'}</span>
                    <span className="expense-note">{r.receiptNo} · {r.method}</span>
                  </div>
                  <div className="expense-right">
                    <span className="expense-amt">₹{Number(r.amount).toLocaleString('en-IN')}</span>
                    <span className="expense-date">
                      {new Date(r.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="card">
        <div className="form-head">
          <h2>{editingId ? 'Edit Receipt' : 'New Receipt'}</h2>
          <button className="btn ghost small" onClick={() => { setView('list'); load(); }}>Back</button>
        </div>
        {receiptNo && <p className="hint tight">{receiptNo}</p>}

        <label className="field-label">Client Name *</label>
        <input className="text-input" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g. Pranay Sir" />

        <label className="field-label">Client Address</label>
        <input className="text-input" value={form.clientAddress} onChange={(e) => set('clientAddress', e.target.value)} placeholder="e.g. King Circle, Mumbai" />

        <label className="field-label">Amount (₹) *</label>
        <input className="text-input" type="number" inputMode="numeric" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />

        <label className="field-label">Payment Date</label>
        <input className="text-input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />

        <label className="field-label">Payment Method</label>
        <select className="text-input" value={form.method} onChange={(e) => set('method', e.target.value)}>
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <label className="field-label">Invoice / Reference No.</label>
        <input className="text-input" value={form.invoiceNo} onChange={(e) => set('invoiceNo', e.target.value)} placeholder="e.g. CSS/2025/-088" />

        <label className="field-label">Description (optional)</label>
        <input className="text-input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Defaults to Invoice #…" />

        <label className="field-label">Note / UTR / Cheque No. (optional)</label>
        <input className="text-input" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Optional" />

        <button className="btn primary full submit-gap" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : editingId ? 'Update Receipt' : 'Save Receipt'}
        </button>

        {msg && <div className={`alert ${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
      </div>

      <div className="card">
        <h2>Save / Share</h2>
        <p className="hint">
          {receiptNo ? 'Choose a format.' : 'Save the receipt first to enable these.'}
        </p>

        <p className="field-label">Save to device</p>
        <div className="export-grid">
          {['pdf', 'png', 'jpeg'].map((f) => (
            <button key={f} className="btn ghost" disabled={!receiptNo || !!busy} onClick={() => doExport('save', f)}>
              {busy === `save-${f}` ? '…' : f.toUpperCase()}
            </button>
          ))}
        </div>

        <p className="field-label">Share</p>
        <div className="export-grid">
          {['pdf', 'png', 'jpeg'].map((f) => (
            <button key={f} className="btn ghost" disabled={!receiptNo || !!busy} onClick={() => doExport('share', f)}>
              {busy === `share-${f}` ? '…' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* The real A4 document. Rendered off-screen (not display:none, which would
          make it uncapturable) purely so it can be exported as PDF/PNG/JPEG. */}
      <div className="doc-offscreen" aria-hidden="true">
        <ReceiptDocument ref={docRef} data={previewData} />
      </div>
    </div>
  );
}
