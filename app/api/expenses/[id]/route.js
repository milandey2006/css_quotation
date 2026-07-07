import { db } from '../../../../db';
import { expenses, employees } from '../../../../db/schema';
import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

// Only a "given to employee, category=Advance" entry merges into the salary
// advance balance -- see app/api/expenses/route.js for the full reasoning.
const affectsAdvanceBalance = (exp) => exp.type === 'given' && exp.category === 'Advance';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const expenseId = parseInt(id);
    const { employeeId, employeeName, type, category, clientName, amount, date, purpose, status } = await request.json();

    const [existing] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    if (!employeeName || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Employee and a valid amount are required' }, { status: 400 });
    }

    const newAmount = Math.round(Number(amount));
    const newEmployeeId = employeeId || null;
    const entryType = type === 'collected' ? 'collected' : 'given';
    const newCategory = entryType === 'given' ? (category || 'Conveyance') : null;

    // Reconcile the advance balance by fully reversing whatever effect the OLD
    // row had, then fully applying whatever effect the NEW row has. This one
    // rule correctly handles every case -- amount changed, employee changed,
    // category changed, or type flipped between given/collected -- without
    // needing separate branches for each.
    const oldEffect = existing.employeeId && affectsAdvanceBalance(existing) ? existing.amount : 0;
    const newEffect = newEmployeeId && affectsAdvanceBalance({ type: entryType, category: newCategory }) ? newAmount : 0;

    if (oldEffect) {
      await db.update(employees)
        .set({ advanceBalance: sql`COALESCE(${employees.advanceBalance}, 0) - ${oldEffect}` })
        .where(eq(employees.id, existing.employeeId));
    }
    if (newEffect) {
      await db.update(employees)
        .set({ advanceBalance: sql`COALESCE(${employees.advanceBalance}, 0) + ${newEffect}` })
        .where(eq(employees.id, newEmployeeId));
    }

    const [updated] = await db.update(expenses)
      .set({
        employeeId: newEmployeeId,
        employeeName,
        type: entryType,
        category: newCategory,
        clientName: entryType === 'collected' ? (clientName || '') : null,
        amount: newAmount,
        date: date || existing.date,
        purpose: purpose || '',
        status: status || existing.status,
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const expenseId = parseInt(id);

    const [existing] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    // Reverse the balance effect -- this expense no longer happened.
    if (existing.employeeId && affectsAdvanceBalance(existing)) {
      await db.update(employees)
        .set({ advanceBalance: sql`COALESCE(${employees.advanceBalance}, 0) - ${existing.amount}` })
        .where(eq(employees.id, existing.employeeId));
    }

    await db.delete(expenses).where(eq(expenses.id, expenseId));
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
