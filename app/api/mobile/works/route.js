import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { works } from '../../../../db/schema';
import { desc } from 'drizzle-orm';
import { authenticateDevice } from '../_lib/auth';

// Returns the jobs assigned to the authenticated field employee that are still
// open (not completed/cancelled), so the mobile app can show them for punch-in.
export async function GET(request) {
  try {
    const employee = await authenticateDevice(request);
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Small dataset (a handful of works) — fetch and filter in memory, matching
    // the convention in app/api/works/route.js for jsonb-array membership.
    const allWorks = await db.select().from(works).orderBy(desc(works.createdAt));

    const assigned = allWorks
      .filter((w) => {
        const ids = Array.isArray(w.employeeIds) ? w.employeeIds.map(Number) : [];
        const isOpen = w.status !== 'completed' && w.status !== 'cancelled';
        return isOpen && ids.includes(employee.id);
      })
      .map((w) => ({
        id: w.id,
        clientName: w.clientName,
        clientPhone: w.clientPhone,
        clientAddress: w.clientAddress,
        instructions: w.instructions,
        status: w.status,
      }));

    return NextResponse.json(assigned);
  } catch (error) {
    console.error('Error fetching assigned works:', error);
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 });
  }
}
