import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { locationPings } from '../../../../db/schema';
import { authenticateDevice } from '../_lib/auth';

// A ping's recordedAt is the real moment the GPS fix was taken on the device.
// The app buffers pings when it's offline and syncs the backlog later, so a
// legitimately old timestamp is normal — we only reject the two things that
// signal a broken/replaying client: timestamps from the future, or ones so old
// they can't be a real offline backlog.
const MAX_FUTURE_DRIFT_MS = 2 * 60 * 1000; // 2 min of clock skew tolerance
const MAX_PAST_AGE_MS = 48 * 60 * 60 * 1000; // 48h of offline backlog tolerance

export async function POST(request) {
  try {
    const employee = await authenticateDevice(request);
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lat, lng, accuracy, recordedAt, battery } = body;

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const recordedDate = recordedAt ? new Date(recordedAt) : new Date();
    const ageMs = Date.now() - recordedDate.getTime(); // positive = in the past
    if (Number.isNaN(recordedDate.getTime()) || ageMs < -MAX_FUTURE_DRIFT_MS || ageMs > MAX_PAST_AGE_MS) {
      return NextResponse.json({ error: 'Invalid or stale timestamp' }, { status: 400 });
    }

    await db.insert(locationPings).values({
      employeeId: employee.id,
      lat: String(latNum),
      lng: String(lngNum),
      accuracy: accuracy != null ? String(accuracy) : null,
      battery: battery != null ? String(battery) : null,
      recordedAt: recordedDate,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error saving location ping:', error);
    return NextResponse.json({ error: 'Failed to save ping' }, { status: 500 });
  }
}
