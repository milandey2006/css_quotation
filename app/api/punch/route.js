
import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { punches } from '../../../db/schema';
import { desc } from 'drizzle-orm';

export async function POST(request) {
  try {
    const body = await request.json();
    const { employeeId, clientName, areaName, type, location, workDetails } = body;

    if (!employeeId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const inserted = await db.insert(punches).values({
      employeeId,
      clientName: clientName || '',
      areaName: areaName || '',
      type,
      workDetails: workDetails || '',
      lat: String(location?.lat || ''),
      lng: String(location?.lng || ''),
      timestamp: new Date(),
    }).returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error('Error saving punch:', error);
    return NextResponse.json({ error: 'Failed to save punch' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await db.select().from(punches).orderBy(desc(punches.timestamp));
    
    // Format for frontend compatibility
    const formatted = data.map(record => ({
      ...record,
      timestamp: record.timestamp.toISOString(),
      location: record.lat && record.lng ? { lat: Number(record.lat), lng: Number(record.lng) } : null,
      // Reconstitute mapLink if needed by frontend
      mapLink: record.lat && record.lng ? `https://www.google.com/maps?q=${record.lat},${record.lng}` : '#'
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching punches:', error);
    return NextResponse.json({ error: 'Failed to fetch punches' }, { status: 500 });
  }
}
