import React, { useEffect, useState } from 'react';
import { getToken, getName, getOnDuty, clearSession } from './lib/storage';
import { startTracking, stopTracking } from './lib/tracker';
import { checkForUpdate, getAppVersion } from './lib/update';
import PairingScreen from './screens/PairingScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import HistoryScreen from './screens/HistoryScreen.jsx';
import ExpensesScreen from './screens/ExpensesScreen.jsx';
import ReceiptsScreen from './screens/ReceiptsScreen.jsx';
import { fetchMe } from './lib/api';
import { startJobWatcher, stopJobWatcher, onNewJobs } from './lib/jobWatcher';

const TITLES = { home: 'Attendance', history: 'My History', expenses: 'My Expenses', receipts: 'Receipts' };

function PairedApp({ name, onUnpair }) {
  const [view, setView] = useState('home'); // 'home' | 'history' | 'expenses'
  const [menuOpen, setMenuOpen] = useState(false);
  const [update, setUpdate] = useState(null); // { url, versionName } when a newer build exists
  const [appVersion, setAppVersion] = useState('');
  const [canReceipts, setCanReceipts] = useState(false);
  const [newJobs, setNewJobs] = useState([]); // jobs assigned since the employee last looked
  const [jobsVersion, setJobsVersion] = useState(0); // bumps so Home reloads its job list

  useEffect(() => {
    checkForUpdate().then(setUpdate);
    getAppVersion().then(setAppVersion);
    // Receipts is permission-gated per employee (granted from the dashboard).
    fetchMe()
      .then((me) => setCanReceipts(!!me.receiptsAccess))
      .catch(() => setCanReceipts(false));

    // Watch for newly assigned jobs → Android notification + in-app banner.
    const off = onNewJobs((jobs) => {
      setNewJobs((prev) => [...prev, ...jobs.filter((j) => !prev.some((p) => p.id === j.id))]);
      setJobsVersion((v) => v + 1);
    });
    startJobWatcher();

    // Re-check for an app update every time the app comes back to the screen.
    // While punched in the process never restarts (the location service keeps
    // it alive), so a check only at launch would never show the banner.
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate().then(setUpdate);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      off();
      stopJobWatcher();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const openNewJobs = () => {
    setNewJobs([]);
    setView('home');
  };

  const go = (v) => {
    setView(v);
    setMenuOpen(false);
  };

  const handleUnpair = async () => {
    if (!confirm('Unpair this phone? You will need a new code to use it again.')) return;
    await stopTracking();
    stopJobWatcher();
    await clearSession();
    onUnpair();
  };

  return (
    <div className="app-shell">
      <header className="appbar">
        <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
        <span className="appbar-title">{TITLES[view] || 'Attendance'}</span>
        <span className="appbar-spacer" />
      </header>

      {update && (
        <a className="update-banner" href={update.url} target="_blank" rel="noreferrer">
          🔄 A new version is available — tap here to update
        </a>
      )}

      {newJobs.length > 0 && (
        <button className="job-banner" onClick={openNewJobs}>
          🆕 New job assigned: {newJobs.map((j) => j.clientName).join(', ')}
          <span className="job-banner-sub">Tap to view · choose "Client site" to punch in</span>
        </button>
      )}

      {menuOpen && (
        <div className="drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div className="drawer-logo">CS</div>
              <div>
                <div className="drawer-name">{name}</div>
                <div className="drawer-sub">Champion Security</div>
              </div>
            </div>
            <button className={`drawer-item ${view === 'home' ? 'active' : ''}`} onClick={() => go('home')}>
              Punch In / Out
            </button>
            <button className={`drawer-item ${view === 'history' ? 'active' : ''}`} onClick={() => go('history')}>
              My History
            </button>
            <button className={`drawer-item ${view === 'expenses' ? 'active' : ''}`} onClick={() => go('expenses')}>
              My Expenses
            </button>
            {canReceipts && (
              <button className={`drawer-item ${view === 'receipts' ? 'active' : ''}`} onClick={() => go('receipts')}>
                Receipts
              </button>
            )}
            <div className="drawer-spacer" />
            <button className="drawer-item danger" onClick={handleUnpair}>
              Unpair device
            </button>
            <div className="drawer-version">CSS · v{appVersion || '—'}</div>
          </div>
        </div>
      )}

      <div className="app-body">
        {view === 'home' && <HomeScreen jobsVersion={jobsVersion} />}
        {view === 'history' && <HistoryScreen />}
        {view === 'expenses' && <ExpensesScreen />}
        {view === 'receipts' && canReceipts && <ReceiptsScreen />}
      </div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null); // { name } when paired

  const loadSession = async () => {
    const token = await getToken();
    if (token) {
      setSession({ name: (await getName()) || 'Employee' });
      // If the employee was punched in when the app last closed / phone rebooted,
      // silently resume tracking so their shift isn't left untracked.
      if (await getOnDuty()) {
        startTracking().catch((e) => console.error('Failed to resume tracking:', e));
      }
    } else {
      setSession(null);
    }
    setReady(true);
  };

  useEffect(() => {
    loadSession();
  }, []);

  if (!ready) {
    return (
      <div className="screen center">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return <PairingScreen onPaired={loadSession} />;
  }

  return <PairedApp name={session.name} onUnpair={loadSession} />;
}
