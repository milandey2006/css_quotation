import { db } from '../../../../db';
import { receipts } from '../../../../db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, parseInt(id)));
    if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { clientName, clientAddress, invoiceNo, billingRef, description, amount, date, method, note } = await request.json();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const [updated] = await db.update(receipts)
      .set({
        clientName: clientName || '',
        clientAddress: clientAddress || '',
        invoiceNo: invoiceNo || '',
        billingRef: billingRef || '',
        description: description || '',
        amount: Math.round(Number(amount)),
        date: date || new Date().toISOString().split('T')[0],
        method: method || 'Cash',
        note: note || '',
      })
      .where(eq(receipts.id, parseInt(id)))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating receipt:', error);
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.delete(receipts).where(eq(receipts.id, parseInt(id)));
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
  }
}
