import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../db';
import { expenses } from '../../../../../db/schema';
import { authenticateDevice } from '../../_lib/auth';

const ALLOWED_CATEGORIES = ['Conveyance', 'Fuel', 'Food', 'Tools', 'Other'];

// Lets an employee fix a mistake in an expense they logged themselves — e.g. a
// wrong amount. Only allowed while the expense is still "pending"; once the
// office marks it Settled (reimbursed), it's locked to keep the paper trail
// accurate.
export async function PUT(request, { params }) {
  try {
    const employee = await authenticateDevice(request);
    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const expenseId = parseInt(id, 10);

    const [existing] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    if (existing.employeeId !== employee.id) {
      return NextResponse.json({ error: 'Not your expense' }, { status: 403 });
    }
    if (existing.status !== 'pending') {
      return NextResponse.json({ error: 'This expense has already been settled and can no longer be edited.' }, { status: 409 });
    }

    const { category, amount, purpose } = await request.json();

    const roundedAmount = Math.round(Number(amount));
    if (!roundedAmount || Number.isNaN(roundedAmount) || roundedAmount <= 0) {
      return NextResponse.json({ error: 'Enter a valid amount' }, { status: 400 });
    }
    const cat = ALLOWED_CATEGORIES.includes(category) ? category : existing.category;

    const [updated] = await db
      .update(expenses)
      .set({ category: cat, amount: roundedAmount, purpose: purpose ?? existing.purpose })
      .where(eq(expenses.id, expenseId))
      .returning();

    return NextResponse.json({
      id: updated.id,
      category: updated.category,
      amount: updated.amount,
      date: updated.date,
      purpose: updated.purpose,
      status: updated.status,
      hasPhoto: !!updated.receiptPhotoUrl,
    });
  } catch (error) {
    console.error('Error editing mobile expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}
