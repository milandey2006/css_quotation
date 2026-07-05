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

// Tracking pings arrive roughly once a minute (see app/punch/page.js). Anyone
// whose last ping is within this window is considered "currently live" --
// generous enough to survive a couple of missed/delayed pings.
const PING_FRESHNESS_MS = 3 * 60 * 1000;

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
  const [pings, setPings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [focusedId, setFocusedId] = useState(null);

  const fetchData = async () => {
    try {
      const [punchRes, pingRes] = await Promise.all([
        fetch('/api/punch'),
        fetch('/api/punch/ping'),
      ]);
      if (punchRes.ok) setPunches(await punchRes.json());
      if (pingRes.ok) setPings(await pingRes.json());
    } catch (error) {
      console.error('Failed to fetch live data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // refresh underlying data every 15s
    return () => clearInterval(interval);
  }, []);

  // Live-ticking clock, used only for display text (elapsed/"updated Xm ago").
  // Kept out of the memoized data below so it can't cause the map to re-fly
  // every second -- see LiveMap.js for the full story on that bug.
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const isOffice = (p) => (p?.clientName || '').toLowerCase() === 'office';

  // Latest OPEN punch-in per employee -- used only to enrich the live list with
  // context (Office vs. client site, shift start time). It no longer gates who
  // shows up as "live": tracking now runs automatically during office hours,
  // independent of the punch in/out buttons.
  const openPunchByEmployee = useMemo(() => {
    const latestByEmployee = {};
    punches.forEach(p => {
      if (!latestByEmployee[p.employeeId] || new Date(p.timestamp) > new Date(latestByEmployee[p.employeeId].timestamp)) {
        latestByEmployee[p.employeeId] = p;
      }
    });
    const openOnly = {};
    Object.values(latestByEmployee).forEach(p => {
      if (p.type === 'in') openOnly[p.employeeId] = p;
    });
    return openOnly;
  }, [punches]);

  // Anyone whose last ping is fresh is "live" right now. Deliberately not
  // dependent on `now` -- freshness is evaluated against the pings/punch data
  // itself, which already refreshes every 15s via the poll above, so this only
  // recomputes when real data changes rather than every clock tick.
  const liveEmployees = useMemo(() => {
    const cutoff = Date.now() - PING_FRESHNESS_MS;
    return pings
      .filter(ping => new Date(ping.updatedAt).getTime() > cutoff)
      .map(ping => {
        const punch = openPunchByEmployee[ping.employeeId];
        return {
          id: ping.employeeId,
          employeeId: ping.employeeId,
          lat: ping.lat,
          lng: ping.lng,
          updatedAt: ping.updatedAt,
          isOffice: isOffice(punch),
          clientName: punch?.clientName,
          punchTimestamp: punch?.timestamp,
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [pings, openPunchByEmployee]);

  const mapPoints = useMemo(() => liveEmployees.map(le => ({
    id: le.id,
    employeeId: le.employeeId,
    lat: le.lat,
    lng: le.lng,
    isOffice: le.isOffice,
    clientName: le.clientName,
    punchTimestamp: le.punchTimestamp,
    lastPingAt: le.updatedAt,
  })), [liveEmployees]);

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
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Live Tracking
                  <span className="text-slate-400 font-normal text-sm">· {liveEmployees.length} live</span>
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
                Currently Tracked
              </p>
              <p className="text-[11px] text-slate-400 px-1 -mt-2">
                Auto-tracked 9 AM - 8 PM, Mon-Sat, independent of Punch In/Out
              </p>

              {loading ? (
                <div className="p-6 text-center text-slate-400 text-sm">Loading live status...</div>
              ) : liveEmployees.length === 0 ? (
                <div className="p-6 text-center">
                  <Radio className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-sm">No one is currently being tracked</p>
                  <p className="text-slate-400 text-xs mt-1">Employees appear here while the punch page is open during office hours.</p>
                </div>
              ) : (
                liveEmployees.map(le => (
                  <button
                    key={le.id}
                    onClick={() => setFocusedId(le.id)}
                    className={`w-full text-left rounded-xl border p-3 flex items-center gap-3 transition-colors cursor-pointer ${
                      focusedId === le.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {le.employeeId.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${le.punchTimestamp ? (le.isOffice ? 'bg-emerald-500' : 'bg-indigo-500') : 'bg-amber-500'}`}></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate flex items-center gap-1.5">
                        {le.employeeId}
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          LIVE
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {le.punchTimestamp ? (le.isOffice ? 'Office' : (le.clientName || 'Client site')) : 'On Duty'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {le.punchTimestamp && (
                        <p className="text-xs font-bold text-emerald-600 font-mono flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {formatElapsed(le.punchTimestamp, now)}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatAgo(le.updatedAt, now)}</p>
                    </div>
                  </button>
                ))
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

function formatAgo(timestamp, now) {
  const diffMs = Math.max(0, now - new Date(timestamp));
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'updated just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `updated ${hours}h ${minutes % 60}m ago`;
}
