import { App as CapApp } from '@capacitor/app';
import { API_BASE_URL } from '../config';

// Checks the hosted version.json against the installed app version. Returns
// { url, versionName } when a newer version is available, else null. Fully
// best-effort — any failure (offline, web preview, etc.) just returns null so
// the app carries on normally.
export async function checkForUpdate() {
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
