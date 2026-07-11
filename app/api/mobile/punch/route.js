import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { db } from '../../../../db';
import { punches, works } from '../../../../db/schema';
import { authenticateDevice } from '../_lib/auth';

export async function POST(request) {
  try {
    const employee = await authenticateDevice(request);
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientName, areaName, type, location, workDetails, workId, photoBase64 } = body;

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

    // When the punch is against an assigned job, move that job's status along
    // automatically: punch-in marks it Active (someone's on site), punch-out
    // marks it Done. Saves the office from updating it by hand.
    if (workId) {
      const updates = { status: type === 'in' ? 'active' : 'completed' };

      // Optional proof-of-work photo taken at client punch-out → Vercel Blob.
      // Best-effort: if the upload fails (e.g. storage not configured), the punch
      // is still recorded — the photo just isn't attached.
      if (type === 'out' && photoBase64) {
        try {
          const base64 = String(photoBase64).replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64, 'base64');
          const blob = await put(`work-${workId}-${Date.now()}.jpg`, buffer, {
            access: 'public',
            contentType: 'image/jpeg',
          });
          updates.completionPhotoUrl = blob.url;
        } catch (e) {
          console.error('Completion photo upload failed (punch still recorded):', e);
        }
      }

      await db.update(works).set(updates).where(eq(works.id, Number(workId)));
    }

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error('Error saving mobile punch:', error);
    return NextResponse.json({ error: 'Failed to save punch' }, { status: 500 });
  }
}
