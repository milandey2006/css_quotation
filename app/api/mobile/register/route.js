import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../../db';
import { employees } from '../../../../db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(request) {
  try {
    const body = await request.json();
    const pairingCode = (body?.pairingCode || '').trim();

    if (!pairingCode) {
      return NextResponse.json({ error: 'Missing pairing code' }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(employees)
      .where(and(eq(employees.pairingCode, pairingCode), gt(employees.pairingCodeExpiresAt, new Date())))
      .limit(1);

    const employee = rows[0];
    if (!employee) {
      return NextResponse.json({ error: 'Invalid or expired pairing code' }, { status: 401 });
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

    return NextResponse.json({ deviceToken, employeeId: employee.id, name: employee.name });
  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }
}
