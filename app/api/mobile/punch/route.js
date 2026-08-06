import { NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { db } from '../../../../db';
import { punches, works, worksheets } from '../../../../db/schema';
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

      const [workRow] = await db.update(works).set(updates).where(eq(works.id, Number(workId))).returning();

      // On punch-out, log the finished job into the Worksheet — mirrors what the
      // office's own punch-out flow (app/works/page.js) already does — so field
      // completions logged via the mobile app show up in the Worksheet too.
      if (type === 'out' && workRow) {
        const [lastIn] = await db.select()
          .from(punches)
          .where(and(
            eq(punches.employeeId, employee.name),
            eq(punches.clientName, inserted[0].clientName),
            eq(punches.type, 'in')
          ))
          .orderBy(desc(punches.timestamp))
          .limit(1);

        const now = new Date();
        await db.insert(worksheets).values({
          date: now.toISOString().split('T')[0],
          work: workRow.instructions || `Work for ${workRow.clientName}`,
          person: employee.name,
          client: `${workRow.clientName}${workRow.clientPhone ? `\n${workRow.clientPhone}` : ''}`,
          startTime: lastIn ? new Date(lastIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          endTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: workRow.clientAddress || (location ? `${location.lat}, ${location.lng}` : ''),
          products: '',
          report: 'Completed via Mobile App Punch Out',
          status: 'COMPLETED',
        });
      }
    }

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error('Error saving mobile punch:', error);
    return NextResponse.json({ error: 'Failed to save punch' }, { status: 500 });
  }
}
