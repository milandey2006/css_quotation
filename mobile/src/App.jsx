import React, { useEffect, useState } from 'react';
import { getToken, getName } from './lib/storage';
import PairingScreen from './screens/PairingScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';

export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null); // { name } when paired

  const loadSession = async () => {
    const token = await getToken();
    if (token) {
      setSession({ name: (await getName()) || 'Employee' });
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
