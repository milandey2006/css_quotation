import React, { useEffect, useState } from 'react';
import { getToken, getName, getOnDuty } from './lib/storage';
import { startTracking } from './lib/tracker';
import PairingScreen from './screens/PairingScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';

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

  return <HomeScreen name={session.name} onUnpair={loadSession} />;
}
