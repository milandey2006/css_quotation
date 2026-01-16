
import { db } from '../../../../db';
import { proformas } from '../../../../db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await db.select().from(proformas).where(eq(proformas.id, parseInt(id)));
    
    if (result.length === 0) {
        return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching proforma:', error);
    return NextResponse.json({ error: 'Failed to fetch proforma' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    console.log(`[API] Updating proforma ID: ${id}`);
    
    const body = await request.json();
    const { quotationNo, clientName, totalAmount, data, date, status } = body;

    // Validate date
    let parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        console.error(`[API] Invalid date received: ${date}`);
        parsedDate = new Date(); // Fallback to now
    }

    console.log('[API] Update Payload:', { quotationNo, clientName, totalAmount, date: parsedDate, status });

    const updatedProforma = await db.update(proformas)
        .set({
            quotationNo,
            clientName,
            totalAmount,
            date: parsedDate,
            data,
            status,
        })
        .where(eq(proformas.id, parseInt(id)))
        .returning();

    if (updatedProforma.length === 0) {
        console.error(`[API] Proforma ID ${id} not found or update failed.`);
        return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProforma[0]);
  } catch (error) {
    console.error('Error updating proforma:', error);
    return NextResponse.json({ error: 'Failed to update proforma: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.delete(proformas).where(eq(proformas.id, parseInt(id)));
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting proforma:', error);
    return NextResponse.json({ error: 'Failed to delete proforma' }, { status: 500 });
  }
}
