import React, { useEffect, useState } from 'react';
import { fetchPunchHistory } from '../lib/api';

function dayLabel(d) {
  const date = new Date(d);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(date, today)) return 'Today';
  if (same(date, yest)) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function timeLabel(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | done | error
  const [error, setError] = useState('');

  const load = async () => {
    setStatus('loading');
    setError('');
    try {
      setItems(await fetchPunchHistory());
      setStatus('done');
    } catch (e) {
      setError(e.message || 'Could not load history.');
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Group punches (already newest-first) by calendar day.
  const groups = [];
  let current = null;
  for (const p of items) {
    const key = new Date(p.timestamp).toDateString();
    if (!current || current.key !== key) {
      current = { key, label: dayLabel(p.timestamp), rows: [] };
      groups.push(current);
    }
    current.rows.push(p);
  }

  return (
    <div className="screen">
      <div className="card">
        <h2>My Punch History</h2>

        {status === 'loading' ? (
          <p className="hint tight">Loading…</p>
        ) : status === 'error' ? (
          <div className="alert error">
            {error}{' '}
            <button className="linklike" onClick={load}>
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="hint tight">No punches yet.</p>
        ) : (
          <div className="history">
            {groups.map((g) => (
              <div key={g.key} className="history-day">
                <p className="history-date">{g.label}</p>
                {g.rows.map((p) => (
                  <div key={p.id} className="history-row">
                    <span className={`punch-badge ${p.type === 'in' ? 'in' : 'out'}`}>
                      {p.type === 'in' ? 'IN' : 'OUT'}
                    </span>
                    <span className="history-place">{p.clientName || 'Site'}</span>
                    <span className="history-time">{timeLabel(p.timestamp)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
