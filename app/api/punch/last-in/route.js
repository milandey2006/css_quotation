import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { punches } from '../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const clientName = searchParams.get('clientName');

    if (!employeeId || !clientName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get the most recent punch 'in' for this employee and client
    const recentPunch = await db.select()
      .from(punches)
      .where(
        and(
          eq(punches.employeeId, employeeId),
          eq(punches.clientName, clientName),
          eq(punches.type, 'in')
        )
      )
      .orderBy(desc(punches.timestamp))
      .limit(1);

    if (recentPunch.length > 0) {
      return NextResponse.json({
        timestamp: recentPunch[0].timestamp.toISOString()
      });
    }

    return NextResponse.json({ timestamp: null });
  } catch (error) {
    console.error('Error fetching last punch in:', error);
    return NextResponse.json({ error: 'Failed to fetch last punch' }, { status: 500 });
  }
}
