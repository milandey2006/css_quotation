import React, { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { submitPunch, fetchAssignedWorks } from '../lib/api';
import { clearSession, setOnDuty } from '../lib/storage';
import { startTracking, stopTracking } from '../lib/tracker';

export default function HomeScreen({ name, onUnpair }) {
  const [site, setSite] = useState('office'); // 'office' | 'client'
  const [punchStatus, setPunchStatus] = useState('idle'); // idle | loading | success | error
  const [punchMsg, setPunchMsg] = useState('');

  // Assigned jobs (only loaded/shown in client mode)
  const [works, setWorks] = useState([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [worksError, setWorksError] = useState('');
  const [selectedWorkId, setSelectedWorkId] = useState(null);

  const loadWorks = async () => {
    setWorksLoading(true);
    setWorksError('');
    try {
      setWorks(await fetchAssignedWorks());
    } catch (err) {
      setWorksError(err.message || 'Could not load your jobs.');
    } finally {
      setWorksLoading(false);
    }
  };

  useEffect(() => {
    if (site === 'client') loadWorks();
  }, [site]);

  const selectedWork = works.find((w) => w.id === selectedWorkId) || null;

  // Tracking follows the punch state — it starts silently on punch-in and stops
  // on punch-out, so an employee is only tracked while actually on the clock.
  const startShiftTracking = async () => {
    try {
      await startTracking();
      await setOnDuty(true);
    } catch (e) {
      console.error('startTracking failed:', e);
    }
  };
  const stopShiftTracking = async () => {
    try {
      await stopTracking();
    } catch (e) {
      console.error('stopTracking failed:', e);
    }
    await setOnDuty(false);
  };

  const doPunch = async (type) => {
    if (site === 'client' && !selectedWork) {
      setPunchStatus('error');
      setPunchMsg('Please select a job first.');
      return;
    }
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
        clientName: isOffice ? 'Office' : selectedWork.clientName,
        areaName: isOffice ? 'Office' : selectedWork.clientAddress || '',
        workDetails: isOffice
          ? `Office Punch ${type === 'in' ? 'In' : 'Out'}`
          : selectedWork.instructions || `Client Punch ${type === 'in' ? 'In' : 'Out'} for ${selectedWork.clientName}`,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      });

      if (type === 'in') await startShiftTracking();
      else await stopShiftTracking();

      setPunchStatus('success');
      setPunchMsg(`Punched ${type === 'in' ? 'IN' : 'OUT'} at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setPunchStatus('error');
      setPunchMsg(err.message || 'Punch failed. Check your signal and try again.');
    }
  };

  const handleUnpair = async () => {
    if (!confirm('Unpair this phone? You will need a new code to use it again.')) return;
    await stopShiftTracking();
    await clearSession();
    onUnpair();
  };

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
          <div className="works">
            {worksLoading ? (
              <p className="hint tight">Loading your jobs…</p>
            ) : worksError ? (
              <div className="alert error">
                {worksError}{' '}
                <button className="linklike" onClick={loadWorks}>
                  Retry
                </button>
              </div>
            ) : works.length === 0 ? (
              <p className="hint tight">No jobs assigned to you yet. Ask the office to assign one.</p>
            ) : (
              <div className="work-list">
                {works.map((w) => (
                  <button
                    key={w.id}
                    className={`work-item ${selectedWorkId === w.id ? 'selected' : ''}`}
                    onClick={() => setSelectedWorkId(w.id)}
                  >
                    <span className="work-name">{w.clientName}</span>
                    {w.clientAddress && <span className="work-addr">{w.clientAddress}</span>}
                  </button>
                ))}
              </div>
            )}

            {selectedWork && (
              <div className="work-detail">
                {selectedWork.clientAddress && (
                  <div className="detail-row">
                    <span className="detail-label">Address</span>
                    <span>{selectedWork.clientAddress}</span>
                  </div>
                )}
                {selectedWork.clientPhone && (
                  <div className="detail-row">
                    <span className="detail-label">Phone</span>
                    <a href={`tel:${selectedWork.clientPhone}`}>{selectedWork.clientPhone}</a>
                  </div>
                )}
                {selectedWork.instructions && (
                  <div className="detail-row">
                    <span className="detail-label">Task</span>
                    <span>{selectedWork.instructions}</span>
                  </div>
                )}
                {selectedWork.clientAddress && (
                  <a
                    className="btn ghost full"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedWork.clientAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Navigate
                  </a>
                )}
              </div>
            )}
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
