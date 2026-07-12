import React, { useEffect, useState } from 'react';
import { getToken, getName, getOnDuty, clearSession } from './lib/storage';
import { startTracking, stopTracking } from './lib/tracker';
import { checkForUpdate, getAppVersion } from './lib/update';
import PairingScreen from './screens/PairingScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import HistoryScreen from './screens/HistoryScreen.jsx';
import ExpensesScreen from './screens/ExpensesScreen.jsx';

const TITLES = { home: 'Attendance', history: 'My History', expenses: 'My Expenses' };

function PairedApp({ name, onUnpair }) {
  const [view, setView] = useState('home'); // 'home' | 'history' | 'expenses'
  const [menuOpen, setMenuOpen] = useState(false);
  const [update, setUpdate] = useState(null); // { url, versionName } when a newer build exists
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    checkForUpdate().then(setUpdate);
    getAppVersion().then(setAppVersion);
  }, []);

  const go = (v) => {
    setView(v);
    setMenuOpen(false);
  };

  const handleUnpair = async () => {
    if (!confirm('Unpair this phone? You will need a new code to use it again.')) return;
    await stopTracking();
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
            <div className="drawer-spacer" />
            <button className="drawer-item danger" onClick={handleUnpair}>
              Unpair device
            </button>
            <div className="drawer-version">CSS · v{appVersion || '—'}</div>
          </div>
        </div>
      )}

      <div className="app-body">
        {view === 'home' && <HomeScreen />}
        {view === 'history' && <HistoryScreen />}
        {view === 'expenses' && <ExpensesScreen />}
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
