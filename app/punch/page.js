'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, CheckCircle, AlertCircle, Clock, Smartphone } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const PING_INTERVAL_MS = 60000; // send a fresh GPS position once a minute during office hours

// Office hours: Monday-Saturday, 9 AM - 8 PM. Tracking runs automatically inside
// this window whenever the punch page is open, independent of the punch in/out
// buttons -- it's a passive presence signal, not tied to the attendance action.
function isWithinOfficeHours(date) {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) return false;
  const hours = date.getHours() + date.getMinutes() / 60;
  return hours >= 9 && hours < 20;
}

export default function PunchPage() {
  const { user, isLoaded } = useUser();
  const [employeeId, setEmployeeId] = useState('');

  // Auto-fill name when user is loaded
  useEffect(() => {
    if (isLoaded && user) {
        setEmployeeId(user.fullName || user.firstName || '');
    }
  }, [isLoaded, user]);


  const [workDetails, setWorkDetails] = useState('Office Punch In');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTracking, setIsTracking] = useState(false);
  const pingIntervalRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const withinOfficeHours = isWithinOfficeHours(currentTime);

  // Auto-start/stop pinging purely based on the office-hours window -- no punch
  // button involved. Re-evaluated on every clock tick (currentTime updates each
  // second above), so tracking switches on/off automatically at 9 AM / 8 PM
  // without needing a reload, and always cleans up on unmount.
  useEffect(() => {
    if (withinOfficeHours && employeeId) {
      startTracking(employeeId);
    } else {
      stopTracking();
    }
    return () => stopTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withinOfficeHours, employeeId]);

  const sendPing = (empId) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetch('/api/punch/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: empId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        }).catch((err) => console.error('Ping failed:', err));
      },
      (err) => console.error('Ping geo error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startTracking = (empId) => {
    if (pingIntervalRef.current) return; // already running, don't restart the interval
    setIsTracking(true);
    sendPing(empId); // immediate first ping
    pingIntervalRef.current = setInterval(() => sendPing(empId), PING_INTERVAL_MS);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const handlePunch = (type) => {
    if (!employeeId.trim()) {
      setStatus('error');
      setMessage('Please enter Employee ID.');
      return;
    }

    setStatus('loading');
    setMessage('Acquiring location...');

    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        savePunch(type, latitude, longitude);
      },
      (error) => {
        setStatus('error');
        setMessage('Unable to retrieve your location. Please ensure location services are enabled on your device and browser.');
        console.error("Geo Error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const savePunch = async (type, lat, lng) => {
    try {
      const payload = {
        employeeId,
        clientName: 'Office',
        areaName: 'Office',
        workDetails,
        type, 
        location: { lat, lng }
      };

      const response = await fetch('/api/punch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save punch');
      }

      setStatus('success');
      setMessage(`Successfully Punched ${type === 'in' ? 'IN' : 'OUT'} at ${new Date().toLocaleTimeString()}`);

      // Optional: clear input after success
      // setEmployeeId('');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Failed to save data to server.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Office Attendance</h1>
          <p className="text-blue-100 text-sm mt-1">Champion Security System</p>
          {isTracking ? (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
              </span>
              Live tracking active
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs font-medium text-blue-100/80">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Outside office hours (9 AM - 8 PM, Mon-Sat)
            </div>
          )}
        </div>

        {/* Clock Section */}
        <div className="p-6 text-center border-b border-slate-700">
          <div className="text-4xl font-mono font-bold text-slate-100 tracking-wider">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Input Section */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2">Employee ID / Name</label>
            <input 
              type="text" 
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-lg"
            />
          </div>



          <div>
             <label className="block text-slate-400 text-sm font-medium mb-2">Punch Type</label>
             <select 
               value={workDetails}
               onChange={(e) => setWorkDetails(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-lg"
             >
                <option value="Office Punch In">Office Punch In</option>
                <option value="Office Punch Out">Office Punch Out</option>
             </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handlePunch('in')}
              className="flex flex-col items-center justify-center p-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-900/20 group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-700/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5 text-emerald-100" />
              </div>
              <span className="font-bold text-lg">PUNCH IN</span>
              <span className="text-xs text-emerald-200 mt-1">Start Shift</span>
            </button>

            <button 
              onClick={() => handlePunch('out')}
              className="flex flex-col items-center justify-center p-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl transition-all shadow-lg shadow-rose-900/20 group"
            >
              <div className="w-10 h-10 rounded-full bg-rose-700/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-rose-100" />
              </div>
              <span className="font-bold text-lg">PUNCH OUT</span>
              <span className="text-xs text-rose-200 mt-1">End Shift</span>
            </button>
          </div>
        </div>

        {/* Status Message (Error/Loading only) */}
        {status !== 'idle' && status !== 'success' && (
          <div className={`p-4 mx-6 mb-6 rounded-xl flex items-start gap-3 text-sm ${
            status === 'error' ? 'bg-rose-900/50 text-rose-200 border border-rose-700/50' : 
            'bg-blue-900/50 text-blue-200 border border-blue-700/50'
          }`}>
            {status === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {status === 'loading' && <div className="w-5 h-5 shrink-0 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            <span className="font-medium mt-0.5">{message}</span>
          </div>
        )}

        <div className="px-6 py-4 bg-slate-900/50 text-center text-xs text-slate-500">
          GPS location required for attendance verification.
        </div>
      </div>

      {/* Success Modal Popup */}
      {status === 'success' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Punch Successful!</h2>
                  <p className="text-slate-600 mb-6">{message}</p>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30"
                  >
                      Done
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
