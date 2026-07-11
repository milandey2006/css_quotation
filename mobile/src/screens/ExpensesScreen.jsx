import React, { useEffect, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { fetchExpenses, submitExpense } from '../lib/api';

const CATEGORIES = ['Conveyance', 'Fuel', 'Food', 'Tools', 'Other'];

function fmtDate(d) {
  return new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function ExpensesScreen() {
  const [category, setCategory] = useState('Conveyance');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null); // { type, text }

  const [items, setItems] = useState([]);
  const [listStatus, setListStatus] = useState('loading'); // loading | done | error

  const load = async () => {
    setListStatus('loading');
    try {
      setItems(await fetchExpenses());
      setListStatus('done');
    } catch {
      setListStatus('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const takePhoto = async () => {
    try {
      const img = await Camera.getPhoto({
        quality: 55,
        width: 1024,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      if (img?.base64String) setPhoto(img.base64String);
    } catch (e) {
      console.log('Receipt photo cancelled/failed:', e?.message);
    }
  };

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      setMsg({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const result = await submitExpense({
        category,
        amount: Number(amount),
        purpose,
        date: new Date().toISOString().split('T')[0],
        photoBase64: photo || undefined,
      });
      // If a photo was attached but storage rejected it, tell the employee
      // rather than pretending it saved.
      if (photo && result && result.photoSaved === false) {
        setMsg({
          type: 'error',
          text: 'Expense saved, but the photo could not be uploaded. Please inform the office.',
        });
      } else {
        setMsg({ type: 'success', text: 'Expense submitted for reimbursement.' });
      }
      setAmount('');
      setPurpose('');
      setPhoto(null);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Could not submit expense.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen">
      <div className="card">
        <h2>Add Expense</h2>

        <label className="field-label">Category</label>
        <select className="text-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="field-label">Amount (₹)</label>
        <input
          className="text-input"
          type="number"
          inputMode="numeric"
          placeholder="e.g. 250"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <label className="field-label">Note</label>
        <input
          className="text-input"
          placeholder="What was it for?"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />

        {photo ? (
          <div className="photo-preview">
            <img src={`data:image/jpeg;base64,${photo}`} alt="Receipt" />
            <button className="btn ghost small" onClick={() => setPhoto(null)}>
              Remove photo
            </button>
          </div>
        ) : (
          <button className="btn ghost full" onClick={takePhoto}>
            📷 Add receipt photo (optional)
          </button>
        )}

        <button className="btn primary full submit-gap" onClick={submit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Expense'}
        </button>

        {msg && <div className={`alert ${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
      </div>

      <div className="card">
        <h2>My Expenses</h2>
        {listStatus === 'loading' ? (
          <p className="hint tight">Loading…</p>
        ) : listStatus === 'error' ? (
          <div className="alert error">
            Could not load.{' '}
            <button className="linklike" onClick={load}>
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="hint tight">No expenses logged yet.</p>
        ) : (
          <div className="expense-list">
            {items.map((e) => (
              <div key={e.id} className="expense-row">
                <div className="expense-main">
                  <span className="expense-cat">
                    {e.category}
                    {e.hasPhoto && <span className="clip"> 📎</span>}
                  </span>
                  {e.purpose ? <span className="expense-note">{e.purpose}</span> : null}
                </div>
                <div className="expense-right">
                  <span className="expense-amt">₹{e.amount}</span>
                  <span className={`expense-status ${e.status === 'settled' ? 'settled' : 'pending'}`}>
                    {e.status === 'settled' ? 'Settled' : 'Pending'}
                  </span>
                  <span className="expense-date">{fmtDate(e.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
