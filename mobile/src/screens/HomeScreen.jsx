import React, { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { submitPunch } from '../lib/api';
import { clearSession } from '../lib/storage';
import {
  startTracking,
  stopTracking,
  syncNow,
  onStatusChange,
  openSettings,
} from '../lib/tracker';

export default function HomeScreen({ name, onUnpair }) {
  const [track, setTrack] = useState({ active: false, lastSyncAt: null, pending: 0 });

  // Punch form state
  const [site, setSite] = useState('office'); // 'office' | 'client'
  const [clientName, setClientName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [punchStatus, setPunchStatus] = useState('idle'); // idle | loading | success | error
  const [punchMsg, setPunchMsg] = useState('');

  useEffect(() => onStatusChange(setTrack), []);

  const toggleTracking = async () => {
    try {
      if (track.active) {
        await stopTracking();
      } else {
        await startTracking();
      }
    } catch (err) {
      setPunchStatus('error');
      setPunchMsg(
        'Could not start tracking. Make sure location is set to "Allow all the time".'
      );
      openSettings();
    }
  };

  const doPunch = async (type) => {
    setPunchStatus('loading');
    setPunchMsg('Getting your location…');
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });
      const isOffice = site === 'office';
      await submitPunch({
        type,
        clientName: isOffice ? 'Office' : clientName || 'Client site',
        areaName: isOffice ? 'Office' : areaName || '',
        workDetails: isOffice
          ? `Office Punch ${type === 'in' ? 'In' : 'Out'}`
          : `Client Punch ${type === 'in' ? 'In' : 'Out'}`,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      });
      setPunchStatus('success');
      setPunchMsg(`Punched ${type === 'in' ? 'IN' : 'OUT'} at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setPunchStatus('error');
      setPunchMsg(err.message || 'Punch failed. Check your signal and try again.');
    }
  };

  const handleUnpair = async () => {
    if (!confirm('Unpair this phone? You will need a new code to use it again.')) return;
    await stopTracking();
    await clearSession();
    onUnpair();
  };

  const lastSync = track.lastSyncAt
    ? new Date(track.lastSyncAt).toLocaleTimeString()
    : 'never';

  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <p className="greeting">Hello,</p>
          <h1 className="name">{name}</h1>
        </div>
        <button className="btn ghost small" onClick={handleUnpair}>
          Unpair
        </button>
      </div>

      {/* Tracking status */}
      <div className={`card tracking ${track.active ? 'on' : 'off'}`}>
        <div className="tracking-row">
          <div>
            <div className="tracking-state">
              <span className={`dot ${track.active ? 'live' : ''}`} />
              {track.active ? 'Tracking active' : 'Tracking paused'}
            </div>
            <p className="hint tight">
              Last sync: {lastSync}
              {track.pending > 0 ? ` · ${track.pending} queued` : ''}
            </p>
          </div>
          <button
            className={`btn ${track.active ? 'danger' : 'primary'} small`}
            onClick={toggleTracking}
          >
            {track.active ? 'Stop' : 'Start'}
          </button>
        </div>
        {track.active && (
          <button className="btn ghost full" onClick={syncNow}>
            Sync now
          </button>
        )}
      </div>

      {/* Punch */}
      <div className="card">
        <h2>Punch In / Out</h2>

        <div className="segment">
          <button
            className={site === 'office' ? 'seg active' : 'seg'}
            onClick={() => setSite('office')}
          >
            Office
          </button>
          <button
            className={site === 'client' ? 'seg active' : 'seg'}
            onClick={() => setSite('client')}
          >
            Client site
          </button>
        </div>

        {site === 'client' && (
          <div className="fields">
            <input
              className="text-input"
              placeholder="Client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <input
              className="text-input"
              placeholder="Area / work details"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
            />
          </div>
        )}

        <div className="punch-grid">
          <button
            className="btn success"
            onClick={() => doPunch('in')}
            disabled={punchStatus === 'loading'}
          >
            Punch IN
          </button>
          <button
            className="btn danger"
            onClick={() => doPunch('out')}
            disabled={punchStatus === 'loading'}
          >
            Punch OUT
          </button>
        </div>

        {punchStatus !== 'idle' && (
          <div className={`alert ${punchStatus === 'error' ? 'error' : punchStatus === 'success' ? 'success' : 'info'}`}>
            {punchMsg}
          </div>
        )}
      </div>
    </div>
  );
}
