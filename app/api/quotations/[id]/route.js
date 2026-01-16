
import { db } from '../../../../db';
import { quotations } from '../../../../db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { id } = await params; // Await params in Next.js 15
    const result = await db.select().from(quotations).where(eq(quotations.id, parseInt(id)));
    
    if (result.length === 0) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // Await params
    
    // Log for debugging
    console.log(`[API] Updating quotation ID: ${id}`);
    
    const body = await request.json();
    const { quotationNo, clientName, totalAmount, data, date, status } = body;

    // Validate date
    let parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        console.error(`[API] Invalid date received: ${date}`);
        parsedDate = new Date(); // Fallback to now
    }

    console.log('[API] Update Payload:', { quotationNo, clientName, totalAmount, date: parsedDate, status });

    const updatedQuotation = await db.update(quotations)
        .set({
            quotationNo,
            clientName,
            totalAmount,
            date: parsedDate,
            data,
            status,
            // updatedAt: new Date() // Schema doesn't have updatedAt yet, need to add column or remove this
        })
        .where(eq(quotations.id, parseInt(id)))
        .returning();

    if (updatedQuotation.length === 0) {
        console.error(`[API] Quotation ID ${id} not found or update failed.`);
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json(updatedQuotation[0]);
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json({ error: 'Failed to update quotation: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params; // Await params
    await db.delete(quotations).where(eq(quotations.id, parseInt(id)));
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  }
}
