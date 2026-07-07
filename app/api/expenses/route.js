import { db } from '../../../db';
import { expenses, employees } from '../../../db/schema';
import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';

// Only a "given to employee, category=Advance" entry is an actual salary
// advance that should merge into employees.advanceBalance. Everything else --
// reimbursement-style categories (Conveyance/Fuel/Food/Tools/Other), and any
// "collected from client" entry -- is tracked for record-keeping only and must
// never touch the salary deduction balance.
const affectsAdvanceBalance = (exp) => exp.type === 'given' && exp.category === 'Advance';

export async function GET() {
  try {
    const data = await db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.createdAt));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { employeeId, employeeName, type, category, clientName, amount, date, purpose } = await request.json();

    if (!employeeName || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Employee and a valid amount are required' }, { status: 400 });
    }

    const roundedAmount = Math.round(Number(amount));
    const entryType = type === 'collected' ? 'collected' : 'given';

    const [inserted] = await db.insert(expenses).values({
      employeeId: employeeId || null,
      employeeName,
      type: entryType,
      category: entryType === 'given' ? (category || 'Conveyance') : null,
      clientName: entryType === 'collected' ? (clientName || '') : null,
      amount: roundedAmount,
      date: date || new Date().toISOString().split('T')[0],
      purpose: purpose || '',
      status: 'pending',
    }).returning();

    // Salary-advance money given now, to be recovered later -- adds straight
    // onto the running advance balance via an atomic DB-side increment (not a
    // client-supplied snapshot), so it can't clobber concurrent updates.
    if (employeeId && affectsAdvanceBalance(inserted)) {
      await db.update(employees)
        .set({ advanceBalance: sql`COALESCE(${employees.advanceBalance}, 0) + ${roundedAmount}` })
        .where(eq(employees.id, employeeId));
    }

    return NextResponse.json(inserted);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
