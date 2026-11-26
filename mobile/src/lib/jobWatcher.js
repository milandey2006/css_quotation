import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { fetchAssignedWorks } from './api';
import { getToken } from './storage';

// "New job assigned" alerts WITHOUT a push service (no Firebase): the app checks
// GET /api/mobile/works itself and compares against the job ids it has already
// seen (persisted). A job id it hasn't seen before = newly assigned → notify.
//
// When it runs:
//  - every 2 minutes while the app's JS is alive — always while the app is open,
//    and also with the screen off while the employee is PUNCHED IN (the
//    background-location foreground service keeps the app process alive);
//  - whenever the app comes back to the foreground;
//  - piggy-backed on GPS pings (tracker.js calls maybeCheck()).
// When punched out with the app closed nothing runs — they'll get the alert the
// next time they open the app.
//
// Android: a real system notification (LocalNotifications). iPhone PWA: iOS
// can't show notifications from a web page, so only the in-app banner (App.jsx
// subscribes via onNewJobs) is shown.

export const SEEN_KEY = 'seenWorkIds';
const INTERVAL_MS = 2 * 60 * 1000;
const isNative = Capacitor.isNativePlatform();

let timer = null;
let lastCheck = 0;
let checking = false;

const listeners = new Set();
export function onNewJobs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function getSeen() {
  const { value } = await Preferences.get({ key: SEEN_KEY });
  if (value == null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function setSeen(ids) {
  await Preferences.set({ key: SEEN_KEY, value: JSON.stringify(ids) });
}

async function notify(jobs) {
  if (!isNative) return;
  try {
    await LocalNotifications.schedule({
      notifications: jobs.map((w) => {
        const where = [w.clientName, w.clientAddress].filter(Boolean).join(' · ');
        return {
          id: 100000 + (Number(w.id) % 100000), // stable per job, fits int32
          title: 'New job assigned to you',
          body: where || 'Open the app to see the details',
          largeBody: [where, w.instructions ? `Task: ${w.instructions}` : '']
            .filter(Boolean)
            .join('\n'),
          smallIcon: 'ic_stat_notify',
          iconColor: '#2563eb',
        };
      }),
    });
  } catch (e) {
    console.error('Job notification failed:', e);
  }
}

export async function checkForNewJobs() {
  if (checking) return;
  checking = true;
  lastCheck = Date.now();
  try {
    if (!(await getToken())) return;
    const works = await fetchAssignedWorks();
    const ids = works.map((w) => w.id);
    const seen = await getSeen();

    // First run on this phone (fresh pair / just updated): remember what's
    // already assigned without alerting about old jobs.
    if (seen === null) {
      await setSeen(ids);
      return;
    }

    const fresh = works.filter((w) => !seen.includes(w.id));
    await setSeen(ids);
    if (!fresh.length) return;

    listeners.forEach((fn) => fn(fresh));
    await notify(fresh);
  } catch {
    /* offline / server hiccup — try again next tick */
  } finally {
    checking = false;
  }
}

// Cheap throttled check for callers that fire often (GPS pings).
export function maybeCheck() {
  if (Date.now() - lastCheck > INTERVAL_MS) checkForNewJobs();
}

function onVisible() {
  if (document.visibilityState === 'visible') checkForNewJobs();
}

export async function startJobWatcher() {
  if (timer) return;
  if (isNative) {
    // Android 13+ hides notifications unless this runtime permission is granted.
    try {
      const { display } = await LocalNotifications.checkPermissions();
      if (display !== 'granted') await LocalNotifications.requestPermissions();
    } catch {
      /* ignore */
    }
  }
  checkForNewJobs();
  timer = setInterval(checkForNewJobs, INTERVAL_MS);
  document.addEventListener('visibilitychange', onVisible);
}

export function stopJobWatcher() {
  if (timer) clearInterval(timer);
  timer = null;
  document.removeEventListener('visibilitychange', onVisible);
}
