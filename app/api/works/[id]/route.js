
import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { works } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updated = await db.update(works)
      .set({ status })
      .where(eq(works.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating work:', error);
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        await db.delete(works).where(eq(works.id, parseInt(id)));
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting work:', error);
        return NextResponse.json({ error: 'Failed to delete work' }, { status: 500 });
    }
}
