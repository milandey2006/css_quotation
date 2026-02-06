
import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { attendanceRemarks } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const allRemarks = await db.select().from(attendanceRemarks);
    return NextResponse.json(allRemarks);
  } catch (error) {
    console.error('Error fetching remarks:', error);
    return NextResponse.json({ error: 'Failed to fetch remarks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const isAdmin = currentUser.publicMetadata?.role === 'admin';

    if (!isAdmin) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { employeeId, date, remark } = await request.json();

    if (!employeeId || !date) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if remark exists for this employee/date
    const existing = await db.select().from(attendanceRemarks)
        .where(
            and(
                eq(attendanceRemarks.employeeId, employeeId),
                eq(attendanceRemarks.date, date)
            )
        );

    let result;
    if (existing.length > 0) {
        // Update
        result = await db.update(attendanceRemarks)
            .set({ remark, createdAt: new Date() })
            .where(eq(attendanceRemarks.id, existing[0].id))
            .returning();
    } else {
        // Insert
        result = await db.insert(attendanceRemarks)
            .values({ employeeId, date, remark })
            .returning();
    }

    return NextResponse.json(result[0]);

  } catch (error) {
    console.error('Error saving remark:', error);
    return NextResponse.json({ error: 'Failed to save remark' }, { status: 500 });
  }
}
