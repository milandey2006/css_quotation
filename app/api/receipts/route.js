import { db } from '../../../db';
import { receipts } from '../../../db/schema';
import { NextResponse } from 'next/server';
import { desc, count } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db.select().from(receipts).orderBy(desc(receipts.createdAt));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { clientName, clientAddress, invoiceNo, billingRef, description, amount, date, method, note } = await request.json();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Auto-generate receipt number: RCP-0001, RCP-0002, ...
    const [{ total }] = await db.select({ total: count() }).from(receipts);
    const receiptNo = `RCP-${String(Number(total) + 1).padStart(4, '0')}`;

    const [inserted] = await db.insert(receipts).values({
      receiptNo,
      clientName: clientName || '',
      clientAddress: clientAddress || '',
      invoiceNo: invoiceNo || '',
      billingRef: billingRef || Date.now().toString(),
      description: description || '',
      amount: Math.round(Number(amount)),
      date: date || new Date().toISOString().split('T')[0],
      method: method || 'Cash',
      note: note || '',
    }).returning();

    return NextResponse.json(inserted);
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 });
  }
}
