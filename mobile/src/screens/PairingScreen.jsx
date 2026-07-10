import React, { useState } from 'react';
import { registerDevice } from '../lib/api';
import { saveSession } from '../lib/storage';

export default function PairingScreen({ onPaired }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [message, setMessage] = useState('');

  const handlePair = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setStatus('error');
      setMessage('Enter the 6-digit code from the office.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const { deviceToken, name } = await registerDevice(trimmed);
      await saveSession({ deviceToken, name });
      onPaired();
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Pairing failed. Check the code and try again.');
    }
  };

  return (
    <div className="screen">
      <div className="header">
        <div className="logo-badge">CS</div>
        <h1>Champion Security</h1>
        <p className="subtitle">Field Employee App</p>
      </div>

      <div className="card">
        <h2>Pair this phone</h2>
        <p className="hint">
          Ask the office for your 6-digit pairing code, then enter it below. You
          only do this once.
        </p>

        <input
          className="code-input"
          type="tel"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />

        {status === 'error' && <div className="alert error">{message}</div>}

        <button
          className="btn primary"
          onClick={handlePair}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Pairing…' : 'Pair Device'}
        </button>
      </div>
    </div>
  );
}
