import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { locationPings, employees } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Latest ping per employee (DISTINCT ON requires the leading ORDER BY column
    // to match the distinct column, so we order by employeeId first, then recency).
    const rows = await db
      .selectDistinctOn([locationPings.employeeId], {
        employeeId: locationPings.employeeId,
        employeeName: employees.name,
        lat: locationPings.lat,
        lng: locationPings.lng,
        accuracy: locationPings.accuracy,
        battery: locationPings.battery,
        recordedAt: locationPings.recordedAt,
      })
      .from(locationPings)
      .innerJoin(employees, eq(employees.id, locationPings.employeeId))
      .orderBy(locationPings.employeeId, desc(locationPings.recordedAt));

    const formatted = rows.map((r) => ({
      ...r,
      recordedAt: r.recordedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching live locations:', error);
    return NextResponse.json({ error: 'Failed to fetch live locations' }, { status: 500 });
  }
}
