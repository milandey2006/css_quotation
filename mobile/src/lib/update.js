import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { API_BASE_URL, APP_VERSION } from '../config';

// Checks the hosted version.json against the installed app version. Returns
// { url, versionName } when a newer version is available, else null. Fully
// best-effort — any failure (offline, web preview, etc.) just returns null so
// the app carries on normally.

// The installed app's version name (e.g. "1.5"), for display.
export async function getAppVersion() {
  // On the PWA there is no native container to query; the page is always the
  // latest served by the server, so just report the build constant.
  if (!Capacitor.isNativePlatform()) return APP_VERSION;
  try {
    const info = await CapApp.getInfo();
    return info.version || APP_VERSION;
  } catch {
    return APP_VERSION;
  }
}

export async function checkForUpdate() {
  // A PWA updates itself — the next launch loads the current files from the
  // server — so there's never an APK to sideload. Skip the banner entirely.
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const info = await CapApp.getInfo(); // { version, build } — build = Android versionCode
    const installed = parseInt(info.build, 10) || 0;

    const res = await fetch(`${API_BASE_URL}/downloads/version.json?t=${Date.now()}`);
    if (!res.ok) return null;
    const data = await res.json();

    if (Number(data.latestVersionCode) > installed) {
      return { url: data.url, versionName: data.versionName };
    }
    return null;
  } catch {
    return null;
  }
}
