import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { punches } from '../../../../db/schema';
import { authenticateDevice } from '../_lib/auth';

export async function POST(request) {
  try {
    const employee = await authenticateDevice(request);
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientName, areaName, type, location, workDetails } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const inserted = await db.insert(punches).values({
      employeeId: employee.name,
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
    console.error('Error saving mobile punch:', error);
    return NextResponse.json({ error: 'Failed to save punch' }, { status: 500 });
  }
}
