import { Preferences } from '@capacitor/preferences';

// Small persistent key/value store (survives app restarts). Holds the device
// bearer token issued at pairing time and the employee's display name.
const TOKEN_KEY = 'deviceToken';
const NAME_KEY = 'employeeName';

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
}
