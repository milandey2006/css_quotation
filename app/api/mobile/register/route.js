import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../../db';
import { employees, pairingAttempts } from '../../../../db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

// Brute-force guard: after this many failed pairing attempts from one IP within
// the window, that IP is locked out until the failures age out (~1 hour hold).
const MAX_FAILS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getIp(request) {
  const fwd = request.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || 'unknown';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const pairingCode = (body?.pairingCode || '').trim();

    if (!pairingCode) {
      return NextResponse.json({ error: 'Missing pairing code' }, { status: 400 });
    }

    const ip = getIp(request);
    const windowStart = new Date(Date.now() - WINDOW_MS);

    // How many times has this IP failed recently?
    const recentFails = await db
      .select()
      .from(pairingAttempts)
      .where(and(eq(pairingAttempts.ip, ip), gt(pairingAttempts.createdAt, windowStart)));

    if (recentFails.length >= MAX_FAILS) {
      return NextResponse.json(
        { error: 'Too many incorrect codes. Please try again after 1 hour.' },
        { status: 429 }
      );
    }

    const rows = await db
      .select()
      .from(employees)
      .where(and(eq(employees.pairingCode, pairingCode), gt(employees.pairingCodeExpiresAt, new Date())))
      .limit(1);

    const employee = rows[0];
    if (!employee) {
      // Record the failure and tidy this IP's stale rows so the table stays small.
      await db.insert(pairingAttempts).values({ ip });
      await db.delete(pairingAttempts).where(and(eq(pairingAttempts.ip, ip), lt(pairingAttempts.createdAt, windowStart)));

      const remaining = Math.max(0, MAX_FAILS - (recentFails.length + 1));
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Invalid or expired pairing code. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
              : 'Too many incorrect codes. Please try again after 1 hour.',
        },
        { status: 401 }
      );
    }

    const deviceToken = crypto.randomBytes(32).toString('hex');

    await db
      .update(employees)
      .set({
        deviceToken,
        deviceTokenCreatedAt: new Date(),
        pairingCode: null,
        pairingCodeExpiresAt: null,
      })
      .where(eq(employees.id, employee.id));

    // Successful pairing — clear this IP's failure history.
    await db.delete(pairingAttempts).where(eq(pairingAttempts.ip, ip));

    return NextResponse.json({ deviceToken, employeeId: employee.id, name: employee.name });
  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }
}
