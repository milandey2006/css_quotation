import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { employees } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';

const PAIRING_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const client = await clerkClient();
  const requester = await client.users.getUser(userId);
  const role = requester.publicMetadata?.role;
  return role === 'admin' || role === 'super-admin';
}

export async function POST(request, { params }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Forbidden. Only admins can generate pairing codes.' }, { status: 403 });
    }

    const { id } = await params;
    const pairingCode = String(Math.floor(100000 + Math.random() * 900000));
    const pairingCodeExpiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MS);

    const updated = await db
      .update(employees)
      .set({ pairingCode, pairingCodeExpiresAt })
      .where(eq(employees.id, id))
      .returning();

    if (!updated[0]) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ pairingCode, pairingCodeExpiresAt });
  } catch (error) {
    console.error('Error generating pairing code:', error);
    return NextResponse.json({ error: 'Failed to generate pairing code' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Forbidden. Only admins can unpair devices.' }, { status: 403 });
    }

    const { id } = await params;
    await db
      .update(employees)
      .set({ deviceToken: null, deviceTokenCreatedAt: null, pairingCode: null, pairingCodeExpiresAt: null })
      .where(eq(employees.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unpairing device:', error);
    return NextResponse.json({ error: 'Failed to unpair device' }, { status: 500 });
  }
}
