import { Capacitor } from '@capacitor/core';

// =============================================================================
//  BACKEND URL
// =============================================================================
// The public HTTPS address of the Champion Security web app (the Vercel
// deployment). The phone app posts pairing, punch, GPS-ping, expense, and
// receipt requests here.
//
//  - Native (Android APK): must be the absolute deployed URL, because the app
//    runs from the device bundle, not from the web server. CapacitorHttp proxies
//    these calls through the OS so browser CORS never applies.
//  - PWA (iPhone "Add to Home Screen"): the app is served from the SAME origin
//    as the API (quotation.championsecuritysystem.com/app), so we use a relative
//    base ('') and every request stays same-origin — no CORS, no config to keep
//    in sync.
//  - Vite dev (npm run dev): hit the live backend directly so the UI can be
//    previewed; cross-origin calls may be blocked by CORS, which is fine for a
//    pure UI preview.
const PROD_ORIGIN = 'https://quotation.championsecuritysystem.com';

export const API_BASE_URL = Capacitor.isNativePlatform()
  ? PROD_ORIGIN
  : import.meta.env.DEV
    ? PROD_ORIGIN
    : ''; // deployed PWA → same-origin relative URLs

// App version, shown in the menu. Kept in sync with the Android versionName.
export const APP_VERSION = '1.5';

// How far the phone must move (metres) before a new GPS ping is recorded. Lower
// = more precise trail but more battery/data. 25m is a sensible field default.
export const DISTANCE_FILTER_M = 25;
