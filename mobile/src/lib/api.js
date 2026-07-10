import { API_BASE_URL } from '../config';
import { getToken } from './storage';

// All requests go over native HTTP (CapacitorHttp is enabled in
// capacitor.config.json), which sidesteps browser CORS — the WebView's
// fetch() calls are proxied through the OS to the Vercel backend.

export async function registerDevice(pairingCode) {
  const res = await fetch(`${API_BASE_URL}/api/mobile/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairingCode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Pairing failed (${res.status})`);
  }
  return res.json(); // { deviceToken, employeeId, name }
}

export async function fetchAssignedWorks() {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/mobile/works`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load jobs (${res.status})`);
  }
  return res.json(); // [{ id, clientName, clientPhone, clientAddress, instructions, status }]
}

export async function fetchPunchHistory() {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/mobile/punches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load history (${res.status})`);
  }
  return res.json(); // [{ id, type, clientName, areaName, timestamp, workDetails }]
}

export async function submitPunch({ type, clientName, areaName, workDetails, location, workId }) {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}/api/mobile/punch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, clientName, areaName, workDetails, location, workId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Punch failed (${res.status})`);
  }
  return res.json();
}
