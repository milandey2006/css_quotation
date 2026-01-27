
import { db } from '../../../../db';
import { estimates } from '../../../../db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await db.select().from(estimates).where(eq(estimates.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Combine the relational columns back into the full data object for the frontend
    const est = result[0];
    const responseData = {
        ...est.data,
        id: est.id.toString(), // Ensure ID is string for frontend compatibility if needed
        createdAt: est.createdAt,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json({ error: 'Failed to fetch estimate' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { billNo, billDate, totalAmount, paidAmount, status, ...data } = body;

    const updatedEstimate = await db.update(estimates)
      .set({
        billNo,
        billDate: new Date(billDate),
        clientName: body.billTo,
        totalAmount,
        paidAmount,
        status: status || 'pending',
        data: body,
      })
      .where(eq(estimates.id, parseInt(id)))
      .returning();

    if (updatedEstimate.length === 0) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    return NextResponse.json(updatedEstimate[0]);
  } catch (error) {
    console.error('Error updating estimate:', error);
    return NextResponse.json({ error: 'Failed to update estimate' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.delete(estimates).where(eq(estimates.id, parseInt(id)));
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json({ error: 'Failed to delete estimate' }, { status: 500 });
  }
}
