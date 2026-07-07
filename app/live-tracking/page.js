'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import { Menu, RefreshCw, Radio, Clock } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Leaflet touches `window` on import, so it can't run during SSR.
const LiveMap = dynamic(() => import('../components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
      Loading map...
    </div>
  ),
});

// An open punch-in older than this is treated as a forgotten punch-out, not
// someone still on duty (see onDutyEmployees below for the full reasoning).
const STALE_PUNCH_HOURS = 16;

export default function LiveTrackingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role;
      if (role !== 'admin' && role !== 'super-admin') {
        router.push('/');
      }
    }
  }, [isLoaded, user, router]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [punches, setPunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [focusedId, setFocusedId] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/punch');
      if (res.ok) setPunches(await res.json());
    } catch (error) {
      console.error('Failed to fetch punches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // refresh underlying data every 15s
    return () => clearInterval(interval);
  }, []);

  // Live-ticking clock, used only for display text (elapsed time). Kept out of
  // the memoized data below so it can't cause the map to re-fly every second --
  // see LiveMap.js for the full story on that bug.
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const isOffice = (p) => (p?.clientName || '').toLowerCase() === 'office';

  // An employee is "on duty" right now if their most recent punch overall is an
  // 'in' with no later 'out' -- i.e. they haven't clocked out of anything yet --
  // AND that punch-in happened recently. Without the staleness cutoff, anyone
  // who simply forgets to punch out even once (or leaves the company) stays
  // stuck showing as "on duty" forever, since there's never a later 'out' to
  // close it. STALE_PUNCH_HOURS is generous enough to cover a full workday
  // (office hours are 9am-8pm) plus buffer, without hiding someone genuinely
  // still on a long shift.
  //
  // Note: this shows each employee's location as captured AT PUNCH-IN, not a
  // continuously moving position. Real-time GPS pinging while punched in was
  // tried and dropped -- it only works while a worker keeps the punch page open
  // in the foreground, which isn't how people actually use their phones (they
  // punch in, then lock the screen or switch apps, and the browser kills the
  // background timer). A punch-in/out snapshot is what's reliable.
  const onDutyEmployees = useMemo(() => {
    const byEmployee = {};
    punches.forEach(p => {
      if (!byEmployee[p.employeeId] || new Date(p.timestamp) > new Date(byEmployee[p.employeeId].timestamp)) {
        byEmployee[p.employeeId] = p;
      }
    });

    const cutoff = Date.now() - STALE_PUNCH_HOURS * 60 * 60 * 1000;

    return Object.values(byEmployee)
      .filter(p => p.type === 'in' && new Date(p.timestamp).getTime() > cutoff)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [punches]);

  const mapPoints = useMemo(() => onDutyEmployees
    .filter(p => p.location)
    .map(p => ({
      id: p.id,
      employeeId: p.employeeId,
      lat: p.location.lat,
      lng: p.location.lng,
      isOffice: isOffice(p),
      clientName: p.clientName,
      punchTimestamp: p.timestamp,
    })), [onDutyEmployees]);

  const focusPoint = mapPoints.find(m => m.id === focusedId) || null;

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative">
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-40 flex justify-between items-center shadow-sm h-16">
        <div className="font-bold text-slate-800">Champion Security</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={`flex-1 overflow-hidden pt-16 md:pt-0 bg-slate-100 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <div className="flex flex-col md:flex-row h-full">

          {/* Map */}
          <div className="relative flex-1 min-h-[45vh] md:min-h-0">
            <LiveMap points={mapPoints} focusPoint={focusPoint} now={now} />

            {/* Floating header over the map */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg px-4 py-2.5 pointer-events-auto">
                <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-500" />
                  Live Tracking
                  <span className="text-slate-400 font-normal text-sm">· {onDutyEmployees.length} on duty</span>
                </h1>
              </div>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-md text-slate-600 rounded-2xl shadow-lg hover:bg-white transition-colors text-sm font-medium pointer-events-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Side list */}
          <div className="w-full md:w-[380px] flex-shrink-0 bg-white border-t md:border-t-0 md:border-l border-slate-200 overflow-y-auto">
            <div className="p-4 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">
                Currently On Duty
              </p>
              <p className="text-[11px] text-slate-400 px-1 -mt-2">
                Location shown is from punch-in, not continuously live
              </p>

              {loading ? (
                <div className="p-6 text-center text-slate-400 text-sm">Loading...</div>
              ) : onDutyEmployees.length === 0 ? (
                <div className="p-6 text-center">
                  <Radio className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-sm">No one is currently punched in</p>
                </div>
              ) : (
                onDutyEmployees.map(p => {
                  const hasPoint = mapPoints.some(pt => pt.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => hasPoint && setFocusedId(p.id)}
                      className={`w-full text-left rounded-xl border p-3 flex items-center gap-3 transition-colors ${
                        focusedId === p.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                      } ${hasPoint ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {p.employeeId.charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${isOffice(p) ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm truncate">{p.employeeId}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {isOffice(p) ? 'Office' : (p.clientName || 'Client site')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-emerald-600 font-mono flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {formatElapsed(p.timestamp, now)}
                        </p>
                        {!hasPoint && (
                          <p className="text-[10px] text-slate-300 mt-0.5">no GPS</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function formatElapsed(timestamp, now) {
  const diffMs = now - new Date(timestamp);
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}
