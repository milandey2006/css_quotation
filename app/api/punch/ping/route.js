import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { employeeLocations } from '../../../../db/schema';
import { sql } from 'drizzle-orm';

// Upserts the single latest GPS position for an employee while they're punched
// in, so Live Tracking can move their dot instead of leaving it fixed at the
// punch-in spot. One row per employee -- no breadcrumb history is kept.
export async function POST(request) {
  try {
    const { employeeId, lat, lng } = await request.json();

    if (!employeeId || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.insert(employeeLocations)
      .values({ employeeId, lat: String(lat), lng: String(lng), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: employeeLocations.employeeId,
        set: { lat: String(lat), lng: String(lng), updatedAt: new Date() },
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving location ping:', error);
    return NextResponse.json({ error: 'Failed to save location ping' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await db.select().from(employeeLocations);
    const formatted = rows.map(r => ({
      employeeId: r.employeeId,
      lat: Number(r.lat),
      lng: Number(r.lng),
      updatedAt: r.updatedAt.toISOString(),
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching location pings:', error);
    return NextResponse.json({ error: 'Failed to fetch location pings' }, { status: 500 });
  }
}
