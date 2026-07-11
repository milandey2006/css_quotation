import React, { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { submitPunch, fetchAssignedWorks } from '../lib/api';
import { setOnDuty, setPunchState, getPunchState } from '../lib/storage';
import { startTracking, stopTracking } from '../lib/tracker';

function timeLabel(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HomeScreen() {
  const [site, setSite] = useState('office'); // 'office' | 'client'
  const [punchStatus, setPunchStatus] = useState('idle'); // idle | loading | success | error
  const [punchMsg, setPunchMsg] = useState('');
  const [punchInfo, setPunchInfo] = useState(null); // { status:'in'|'out', label, at }

  // Assigned jobs (only loaded/shown in client mode)
  const [works, setWorks] = useState([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [worksError, setWorksError] = useState('');
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [photo, setPhoto] = useState(null); // base64 completion photo (optional)

  const takePhoto = async () => {
    try {
      const img = await Camera.getPhoto({
        quality: 55,
        width: 1024,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera, // force a live photo, not the gallery
      });
      if (img?.base64String) setPhoto(img.base64String);
    } catch (e) {
      // User cancelled the camera, or permission denied — photo is optional, so
      // just carry on without one.
      console.log('Photo capture cancelled/failed:', e?.message);
    }
  };

  useEffect(() => {
    getPunchState().then(setPunchInfo);
  }, []);

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
      const label = isOffice ? 'Office' : selectedWork.clientName;
      await submitPunch({
        type,
        clientName: isOffice ? 'Office' : selectedWork.clientName,
        areaName: isOffice ? 'Office' : selectedWork.clientAddress || '',
        workDetails: isOffice
          ? `Office Punch ${type === 'in' ? 'In' : 'Out'}`
          : selectedWork.instructions || `Client Punch ${type === 'in' ? 'In' : 'Out'} for ${selectedWork.clientName}`,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        workId: isOffice ? undefined : selectedWork.id,
        // Completion photo only applies to a client punch-out.
        photoBase64: !isOffice && type === 'out' ? photo : undefined,
      });

      if (type === 'in') await startShiftTracking();
      else await stopShiftTracking();

      // Persist the current punch state so it survives the app being killed.
      const info = { status: type, label, at: new Date().toISOString() };
      await setPunchState(info);
      setPunchInfo(info);

      setPunchStatus('success');
      setPunchMsg(`Punched ${type === 'in' ? 'IN' : 'OUT'} at ${new Date().toLocaleTimeString()}`);

      // A punch-out marks the job Done server-side, so it drops off this list.
      if (!isOffice && type === 'out') {
        setSelectedWorkId(null);
        setPhoto(null);
        loadWorks();
      }
    } catch (err) {
      setPunchStatus('error');
      setPunchMsg(err.message || 'Punch failed. Check your signal and try again.');
    }
  };

  const isIn = punchInfo?.status === 'in';

  return (
    <div className="screen">
      {/* Persistent punch-status banner — the employee can always see whether
          they're currently punched in, even after reopening the app. */}
      <div className={`punch-status ${isIn ? 'in' : 'out'}`}>
        <span className={`ps-dot ${isIn ? 'live' : ''}`} />
        <div className="ps-text">
          {isIn ? (
            <>
              <div className="ps-title">You're PUNCHED IN</div>
              <div className="ps-sub">
                {punchInfo.label} · since {timeLabel(punchInfo.at)}
              </div>
            </>
          ) : (
            <>
              <div className="ps-title">You're punched out</div>
              {punchInfo?.at && (
                <div className="ps-sub">
                  Last: {punchInfo.label} at {timeLabel(punchInfo.at)}
                </div>
              )}
            </>
          )}
        </div>
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
                    onClick={() => {
                      setSelectedWorkId(w.id);
                      setPhoto(null);
                    }}
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

                {/* Optional proof-of-work photo, attached when they punch OUT. */}
                {photo ? (
                  <div className="photo-preview">
                    <img src={`data:image/jpeg;base64,${photo}`} alt="Completion" />
                    <button className="btn ghost small" onClick={() => setPhoto(null)}>
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <button className="btn ghost full" onClick={takePhoto}>
                    📷 Add completion photo (optional)
                  </button>
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
