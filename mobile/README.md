# CSS Tracker — Field Employee App

A small Android app (Capacitor + React) for Champion Security's field employees.
It does two things:

1. **Background GPS tracking** — keeps sending the employee's location to the
   admin dashboard even when the phone screen is off (via a foreground service +
   the `@capacitor-community/background-geolocation` plugin).
2. **Punch In / Out** — Office or Client-site, replacing the old browser page.

It talks to the main web app's `/api/mobile/*` endpoints. Each phone authenticates
with a one-time **6-digit pairing code** (generated from the Employees page in the
dashboard) that it swaps for a long-lived device token.

---

## One-time setup before your FIRST build

### 1. Set the backend URL
Open [`src/config.js`](src/config.js) and replace the placeholder with your real
deployed URL (the Vercel address of the main web app), no trailing slash:

```js
export const API_BASE_URL = 'https://your-real-app.vercel.app';
```

### 2. Install a compatible JDK (this is the current blocker)
The Android build needs **JDK 17 or 21**. This machine currently only has JDK 8
(too old) and JDK 25 (too new for this Gradle version). The easiest fix is to
**finish installing Android Studio** — it bundles a correct JDK 21 (its "JBR").
After installing, point Gradle at it for this terminal session:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

(Adjust the path if Studio installed elsewhere.)

### 3. The signing keystore is already created
`css-tracker-release.keystore` and `keystore.properties` already exist in the
`android/` folder (both gitignored). **Back both files up somewhere safe** (e.g.
Google Drive). If you lose the keystore you can't ship updates that install over
the app already on employees' phones — you'd have to uninstall/reinstall on every
device. The password is recorded in `android/keystore.properties`.

---

## Building the installable APK

From this `mobile/` folder:

```powershell
# 1. Build the web app and copy it into the native project
npm run build:sync

# 2. Build the signed release APK
cd android
./gradlew assembleRelease
```

The finished APK lands at:

```
android/app/build/outputs/apk/release/app-release.apk
```

Copy that file to each employee's phone (WhatsApp, USB, Google Drive, etc.) and
open it to install. They'll need to allow "Install from unknown sources" once.

> Quick test build without signing: `./gradlew assembleDebug` →
> `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Per-phone setup (do this in person for each of the 5 phones)

1. Install and open the app.
2. In the dashboard → **Employees**, click the phone icon on that employee's row
   to generate a **6-digit code**. Read it to the employee; they type it into the
   app. (Code expires in 15 minutes, single use.)
3. Tap **Start** on the tracking card. Android will ask for location permission —
   choose **"Allow all the time"** (not just "while using the app"). Screen-off
   tracking does NOT work without this.
4. **Whitelist the app against battery optimization.** This is the #1 reason
   trackers silently die in the field. Path varies by brand:
   - Stock Android: Settings → Apps → CSS Tracker → Battery → **Unrestricted**.
   - Xiaomi/Redmi (MIUI): also Settings → Apps → CSS Tracker → **Autostart ON**,
     and set battery saver to **No restrictions**.
   - Oppo/Realme/Vivo: add to **Protected apps** / allow **background activity**.
5. Confirm a green dot appears for that employee on the **Live Tracking** page.

To move the app to a different phone later: **Unpair** in the app (or from the
Employees page), then generate a fresh code and pair the new phone.

---

## How it's wired (for future reference)

- **Static web app** (`src/`) built by Vite into `dist/`, wrapped by Capacitor.
- **`src/lib/tracker.js`** — starts the background watcher; each GPS fix is POSTed
  to `/api/mobile/ping` from JS. Failed posts (no signal) are buffered and retried,
  so a dead zone doesn't lose the trail. The foreground service keeps this JS
  alive while the screen is off.
- **`src/lib/api.js`** — pairing (`/register`) and punch (`/punch`) calls.
- **CapacitorHttp is enabled** (`capacitor.config.json`) so `fetch()` goes through
  native HTTP and isn't blocked by browser CORS.
- **`ACCESS_BACKGROUND_LOCATION`** is added in `android/app/src/main/AndroidManifest.xml`;
  the plugin merges in the other location/foreground-service/notification permissions.

## Updating the app later
Bump `versionCode` (and `versionName`) in `android/app/build.gradle`, then rebuild
and reinstall the new APK on each phone. Because it's signed with the same
keystore, it installs as an update (no uninstall needed).
