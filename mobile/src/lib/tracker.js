import { registerPlugin } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { getToken } from './storage';
import { API_BASE_URL, DISTANCE_FILTER_M } from '../config';

// The community background-geolocation plugin. Unlike the paid Transistor
// plugin (which posts pings itself, natively), this one hands each location to
// the JS callback below. A foreground service keeps the app process — and this
// JS — alive while the screen is off, so the callback keeps firing and we do
// the HTTP POST ourselves. Anything that fails to POST (no signal) is buffered
// and retried on the next successful ping, so a dead zone doesn't lose the trail.
const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');

const MAX_BUFFER = 500; // cap the offline backlog so memory can't grow unbounded

let watcherId = null;
let buffer = [];
let lastSyncAt = null;

// Simple pub/sub so the Home screen can show live tracking status.
const listeners = new Set();
export function onStatusChange(fn) {
  listeners.add(fn);
  fn(getStatus());
  return () => listeners.delete(fn);
}
export function getStatus() {
  return { active: watcherId != null, lastSyncAt, pending: buffer.length };
}
function emit() {
  const s = getStatus();
  listeners.forEach((fn) => fn(s));
}

async function getBatteryPercent() {
  try {
    const info = await Device.getBatteryInfo();
    if (info?.batteryLevel != null) return Math.round(info.batteryLevel * 100);
  } catch {
    /* battery info is best-effort */
  }
  return null;
}

// Returns 'ok' (accepted), 'drop' (client error — don't retry), or throws
// (network/5xx — worth retrying later).
async function postPing(ping, token) {
  const res = await fetch(`${API_BASE_URL}/api/mobile/ping`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ping),
  });
  if (res.ok || res.status === 204) return 'ok';
  if (res.status >= 400 && res.status < 500) return 'drop'; // e.g. too-old backlog
  throw new Error(`ping failed ${res.status}`);
}

async function flushBuffer(token) {
  if (!buffer.length) return;
  const queued = buffer;
  buffer = [];
  for (const ping of queued) {
    try {
      await postPing(ping, token); // 'ok' or 'drop' → discard either way
    } catch {
      buffer.push(ping); // still failing → keep for next time
    }
  }
  if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER);
}

async function handleLocation(location) {
  const token = await getToken();
  if (!token) return; // unpaired; nothing to do

  const ping = {
    lat: location.latitude,
    lng: location.longitude,
    accuracy: location.accuracy,
    recordedAt: new Date(location.time || Date.now()).toISOString(),
    battery: await getBatteryPercent(),
  };

  try {
    await flushBuffer(token);
    await postPing(ping, token);
    lastSyncAt = Date.now();
  } catch {
    if (buffer.length < MAX_BUFFER) buffer.push(ping);
  }
  emit();
}

export async function startTracking() {
  if (watcherId != null) return watcherId;
  watcherId = await BackgroundGeolocation.addWatcher(
    {
      // Android forces a persistent notification while an app uses background
      // location — it can't be hidden. Kept deliberately neutral so it reads as
      // a generic "app is running" notice rather than drawing attention to GPS.
      backgroundMessage: 'App is running.',
      backgroundTitle: 'Champion Security',
      requestPermissions: true,
      stale: false,
      distanceFilter: DISTANCE_FILTER_M,
    },
    (location, error) => {
      if (error) {
        console.error('Background geolocation error:', error);
        return;
      }
      handleLocation(location);
    }
  );
  emit();
  return watcherId;
}

export async function stopTracking() {
  if (watcherId == null) return;
  await BackgroundGeolocation.removeWatcher({ id: watcherId });
  watcherId = null;
  emit();
}

// Manual "sync now" — best-effort flush of any buffered pings.
export async function syncNow() {
  const token = await getToken();
  if (token) await flushBuffer(token);
  emit();
}

// Opens the OS app-settings screen so a user can grant "Allow all the time"
// location permission if they declined it during the watcher's request flow.
export async function openSettings() {
  try {
    await BackgroundGeolocation.openSettings();
  } catch {
    /* not available on all platforms */
  }
}
