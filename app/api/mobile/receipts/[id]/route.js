import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../db';
import { receipts } from '../../../../../db/schema';
import { authenticateDevice } from '../../_lib/auth';

// Employees may edit a receipt they raised (to fix a typo), but never delete
// one — deletion stays admin-only on the dashboard, so the receipt trail can't
// be erased from the field.
export async function PUT(request, { params }) {
  try {
    const employee = await authenticateDevice(request);
    if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (employee.receiptsAccess !== 'true') {
      return NextResponse.json({ error: 'You do not have permission to edit receipts.' }, { status: 403 });
    }

    const { id } = await params;
    const receiptId = parseInt(id, 10);

    const [existing] = await db.select().from(receipts).where(eq(receipts.id, receiptId));
    if (!existing) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    if (existing.employeeId !== employee.id) {
      return NextResponse.json({ error: 'Not your receipt' }, { status: 403 });
    }

    const { clientName, clientAddress, invoiceNo, description, amount, date, method, note } = await request.json();

    const amt = Math.round(Number(amount));
    if (!amt || Number.isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 });
    }

    const [updated] = await db.update(receipts)
      .set({
        clientName: clientName || existing.clientName,
        clientAddress: clientAddress ?? existing.clientAddress,
        invoiceNo: invoiceNo ?? existing.invoiceNo,
        description: description ?? existing.description,
        amount: amt,
        date: date || existing.date,
        method: method || existing.method,
        note: note ?? existing.note,
      })
      .where(eq(receipts.id, receiptId))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating mobile receipt:', err);
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}
