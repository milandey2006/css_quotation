import { NextResponse } from 'next/server';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '../../../../db';
import { receipts } from '../../../../db/schema';
import { authenticateDevice } from '../_lib/auth';

// Receipts are permission-gated per employee (granted from the dashboard's
// Settings page), since not every field employee should be able to issue one.
async function authorize(request) {
  const employee = await authenticateDevice(request);
  if (!employee) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (employee.receiptsAccess !== 'true') {
    return { error: NextResponse.json({ error: 'You do not have permission to create receipts.' }, { status: 403 }) };
  }
  return { employee };
}

// The receipts this employee raised, newest first.
export async function GET(request) {
  try {
    const { employee, error } = await authorize(request);
    if (error) return error;

    const rows = await db
      .select()
      .from(receipts)
      .where(eq(receipts.employeeId, employee.id))
      .orderBy(desc(receipts.createdAt))
      .limit(100);

    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error fetching mobile receipts:', err);
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { employee, error } = await authorize(request);
    if (error) return error;

    const { clientName, clientAddress, invoiceNo, description, amount, date, method, note } = await request.json();

    if (!clientName || !String(clientName).trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }
    const amt = Math.round(Number(amount));
    if (!amt || Number.isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 });
    }

    // Same numbering scheme as the dashboard: RCP-0001, RCP-0002, ...
    const [{ total }] = await db.select({ total: count() }).from(receipts);
    const receiptNo = `RCP-${String(Number(total) + 1).padStart(4, '0')}`;

    const [inserted] = await db.insert(receipts).values({
      receiptNo,
      clientName: clientName || '',
      clientAddress: clientAddress || '',
      invoiceNo: invoiceNo || '',
      billingRef: Date.now().toString(),
      description: description || '',
      amount: amt,
      date: date || new Date().toISOString().split('T')[0],
      method: method || 'Cash',
      note: note || '',
      employeeId: employee.id,
      source: 'employee',
    }).returning();

    return NextResponse.json(inserted);
  } catch (err) {
    console.error('Error creating mobile receipt:', err);
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 });
  }
}
