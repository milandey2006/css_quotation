import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { salarySlips, employees } from '../../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const slips = await db.select().from(salarySlips).orderBy(desc(salarySlips.createdAt));
    return NextResponse.json(slips);
  } catch (error) {
    console.error('Error fetching salary slips:', error);
    return NextResponse.json({ error: 'Failed to fetch slips' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Basic validation could go here
    
    const newSlip = await db.insert(salarySlips).values({
        ...body,
        // Ensure numbers are numbers
        advanceSalary: Number(body.advanceSalary || 0),
        basicSalary: Number(body.basicSalary || 0),
        totalEarnings: Number(body.totalEarnings || 0),
        totalDeductions: Number(body.totalDeductions || 0),
        netPayable: Number(body.netPayable || 0),
        workDays: Number(body.workDays || 0),
        holidays: Number(body.holidays || 0),
        paidDays: Number(body.paidDays || 0),
    }).returning();

    // Update employee's running advance balance:
    // Closing = Opening + NewAdvanceGiven - DeductedThisMonth
    if (body.employeeId) {
        const opening = Number(body.openingAdvanceBalance || 0);
        const given   = Number(body.newAdvanceGiven || 0);
        const deducted = Number(body.deductions?.advance || 0);
        const newBalance = Math.max(0, opening + given - deducted);

        await db.update(employees)
            .set({ advanceBalance: newBalance })
            .where(eq(employees.id, Number(body.employeeId)));
    }

    return NextResponse.json(newSlip[0], { status: 201 });
  } catch (error) {
    console.error('Error creating salary slip:', error);
    return NextResponse.json({ error: 'Failed to create slip' }, { status: 500 });
  }
}
