import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { put } from '@vercel/blob';
import { db } from '../../../../db';
import { expenses } from '../../../../db/schema';
import { authenticateDevice } from '../_lib/auth';

// Categories a field employee may log from the app. "Advance" is deliberately
// excluded — that's an admin-only entry that affects salary balances.
const ALLOWED_CATEGORIES = ['Conveyance', 'Fuel', 'Food', 'Tools', 'Other'];

// The employee's own expense entries, most recent first.
export async function GET(request) {
  try {
    const employee = await authenticateDevice(request);
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(expenses)
      .where(eq(expenses.employeeId, employee.id))
      .orderBy(desc(expenses.date), desc(expenses.createdAt))
      .limit(100);

    const formatted = rows.map((r) => ({
      id: r.id,
      category: r.category,
      amount: r.amount,
      date: r.date,
      purpose: r.purpose,
      status: r.status,
      hasPhoto: !!r.receiptPhotoUrl,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching mobile expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const employee = await authenticateDevice(request);
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, amount, purpose, date, photoBase64 } = body;

    const roundedAmount = Math.round(Number(amount));
    if (!roundedAmount || Number.isNaN(roundedAmount) || roundedAmount <= 0) {
      return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 });
    }
    const cat = ALLOWED_CATEGORIES.includes(category) ? category : 'Other';

    // Optional receipt photo → Vercel Blob (best-effort; expense saves regardless).
    let receiptPhotoUrl = null;
    if (photoBase64) {
      try {
        const base64 = String(photoBase64).replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        const blob = await put(`expense-${employee.id}-${Date.now()}.jpg`, buffer, {
          access: 'public',
          contentType: 'image/jpeg',
        });
        receiptPhotoUrl = blob.url;
      } catch (e) {
        console.error('Receipt photo upload failed (expense still saved):', e);
      }
    }

    const [inserted] = await db
      .insert(expenses)
      .values({
        employeeId: employee.id,
        employeeName: employee.name,
        type: 'given', // reimbursement-style; never affects advance balance (only category=Advance does, which is blocked here)
        category: cat,
        amount: roundedAmount,
        date: date || new Date().toISOString().split('T')[0],
        purpose: purpose || '',
        status: 'pending',
        receiptPhotoUrl,
        source: 'employee',
      })
      .returning();

    return NextResponse.json({
      id: inserted.id,
      category: inserted.category,
      amount: inserted.amount,
      date: inserted.date,
      status: inserted.status,
      hasPhoto: !!inserted.receiptPhotoUrl,
      // So the app can warn the employee when a photo was taken but storage
      // rejected it (e.g. BLOB_READ_WRITE_TOKEN not configured), instead of
      // silently dropping it.
      photoProvided: !!photoBase64,
      photoSaved: !!receiptPhotoUrl,
    });
  } catch (error) {
    console.error('Error creating mobile expense:', error);
    return NextResponse.json({ error: 'Failed to save expense' }, { status: 500 });
  }
}
