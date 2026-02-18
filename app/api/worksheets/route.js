
import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { worksheets } from '../../../db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allWorksheets = await db.select().from(worksheets).orderBy(desc(worksheets.date));
    return NextResponse.json(allWorksheets);
  } catch (error) {
    console.error('Error fetching worksheets:', error);
    return NextResponse.json({ error: 'Failed to fetch worksheets' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, work, person, client, startTime, endTime, location, products, report, status, payment, remark } = body;
    
    const newWorksheet = await db.insert(worksheets).values({
      date,
      work,
      person,
      client,
      startTime,
      endTime,
      location,
      products,
      report,
      status: status || 'Pending',
      payment,
      remark
    }).returning();

    return NextResponse.json(newWorksheet[0]);
  } catch (error) {
    console.error('Error creating worksheet:', error);
    return NextResponse.json({ error: 'Failed to create worksheet' }, { status: 500 });
  }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
             return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const updatedWorksheet = await db.update(worksheets)
            .set(updates)
            .where(eq(worksheets.id, id))
            .returning();
        
        return NextResponse.json(updatedWorksheet[0]);

    } catch (error) {
        console.error('Error updating worksheet:', error);
        return NextResponse.json({ error: 'Failed to update worksheet' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.delete(worksheets).where(eq(worksheets.id, id));

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
         console.error('Error deleting worksheet:', error);
         return NextResponse.json({ error: 'Failed to delete worksheet' }, { status: 500 });
    }
}
