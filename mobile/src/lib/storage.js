import { Preferences } from '@capacitor/preferences';

// Small persistent key/value store (survives app restarts). Holds the device
// bearer token issued at pairing time and the employee's display name.
const TOKEN_KEY = 'deviceToken';
const NAME_KEY = 'employeeName';
const ON_DUTY_KEY = 'onDuty';

export async function saveSession({ deviceToken, name }) {
  await Preferences.set({ key: TOKEN_KEY, value: deviceToken });
  await Preferences.set({ key: NAME_KEY, value: name || '' });
}

export async function getToken() {
  const { value } = await Preferences.get({ key: TOKEN_KEY });
  return value || null;
}

export async function getName() {
  const { value } = await Preferences.get({ key: NAME_KEY });
  return value || null;
}

export async function clearSession() {
  await Preferences.remove({ key: TOKEN_KEY });
  await Preferences.remove({ key: NAME_KEY });
  await Preferences.remove({ key: ON_DUTY_KEY });
}

// On-duty flag: true between a punch-in and the next punch-out. Persisted so
// tracking can resume automatically if the app is reopened or the phone reboots
// while the employee is still on shift.
export async function setOnDuty(value) {
  await Preferences.set({ key: ON_DUTY_KEY, value: value ? '1' : '0' });
}

export async function getOnDuty() {
  const { value } = await Preferences.get({ key: ON_DUTY_KEY });
  return value === '1';
}
