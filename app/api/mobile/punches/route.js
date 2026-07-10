import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { punches } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateDevice } from '../_lib/auth';

// The authenticated employee's own punch history (office + client), most recent
// first, so the mobile app can show them their in/out times. punches.employeeId
// is the free-text employee name — the same value the mobile punch route writes.
export async function GET(request) {
  try {
    const employee = await authenticateDevice(request);
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(punches)
      .where(eq(punches.employeeId, employee.name))
      .orderBy(desc(punches.timestamp))
      .limit(200);

    const formatted = rows.map((r) => ({
      id: r.id,
      type: r.type,
      clientName: r.clientName,
      areaName: r.areaName,
      workDetails: r.workDetails,
      timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching punch history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
