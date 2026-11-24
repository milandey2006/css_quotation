import { registerPlugin, Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getToken, getPunchState } from './storage';
import { API_BASE_URL, DISTANCE_FILTER_M } from '../config';

// The community background-geolocation plugin. Unlike the paid Transistor
// plugin (which posts pings itself, natively), this one hands each location to
// the JS callback below. A foreground service keeps the app process — and this
// JS — alive while the screen is off, so the callback keeps firing and we do
// the HTTP POST ourselves. Anything that fails to POST (no signal) is buffered
// and retried on the next successful ping, so a dead zone doesn't lose the trail.
//
// This plugin is NATIVE-ONLY. On the PWA (iPhone "Add to Home Screen") there is
// no native background service — iOS Safari suspends JS when the screen is off —
// so on web we fall back to a FOREGROUND watch (Geolocation.watchPosition) that
// posts pings only while the app is actually open. That still captures a trail
// during a visit and, crucially, the location at punch-in / punch-out, which is
// the part that matters most.
const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');
const isNative = Capacitor.isNativePlatform();

const MAX_BUFFER = 500; // cap the offline backlog so memory can't grow unbounded

let watcherId = null;      // native background watcher id
let webWatchId = null;     // web (foreground) Geolocation watch id
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
  return { active: watcherId != null || webWatchId != null, lastSyncAt, pending: buffer.length };
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

// Builds the ongoing punch-reminder notification text from the saved punch
// state, e.g. "Punched IN · Office" / "Since 10:30 am — tap to open & punch out".
async function reminderText() {
  const state = await getPunchState();
  const where = state?.label || 'On duty';
  const since = state?.at
    ? new Date(state.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  return {
    title: `Punched IN · ${where}`,
    message: `${since ? `Since ${since} — ` : ''}remember to punch out when you leave`,
  };
}

export async function startTracking() {
  if (!isNative) {
    // PWA: foreground-only watch. Normalises the browser Geolocation shape to the
    // { latitude, longitude, accuracy, time } the ping builder expects.
    if (webWatchId != null) return webWatchId;
    webWatchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 20000 },
      (position, error) => {
        if (error || !position) return;
        handleLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          time: position.timestamp,
        });
      }
    );
    emit();
    return webWatchId;
  }

  if (watcherId != null) return watcherId;

  // Android 13+ hides notifications unless POST_NOTIFICATIONS is granted at
  // runtime (the location plugin only asks for location). Ask once here so the
  // punch reminder below is actually visible. Best-effort: tracking still runs
  // if the employee declines.
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') await LocalNotifications.requestPermissions();
  } catch {
    /* ignore */
  }

  const { title, message } = await reminderText();
  watcherId = await BackgroundGeolocation.addWatcher(
    {
      // Android forces a persistent notification while an app uses background
      // location. We use it as the employee's PUNCH REMINDER: it appears on
      // punch-in, can't be swiped away, and disappears only on punch-out (when
      // the watcher is removed). Tapping it opens the app.
      backgroundMessage: message,
      backgroundTitle: title,
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
  if (!isNative) {
    if (webWatchId == null) return;
    await Geolocation.clearWatch({ id: webWatchId });
    webWatchId = null;
    emit();
    return;
  }
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
    if (!isNative) return; // no-op on the web PWA
    await BackgroundGeolocation.openSettings();
  } catch {
    /* not available on all platforms */
  }
}
