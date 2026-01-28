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

    // Deduct Advance Balance from Employee if applicable
    // If openingAdvanceBalance is provided (from UI edit), use that as base.
    // Otherwise use SQL decrement (legacy behavior, though UI now sends it).
    if (body.employeeId) {
        let updateQuery = {};
        
        if (body.openingAdvanceBalance !== undefined) {
             // User specified a total balance in UI (or it was auto-loaded)
             // New Balance = Opening - CurrentDeduction
             const newBalance = Math.max(0, Number(body.openingAdvanceBalance) - Number(body.deductions?.advance || 0));
             updateQuery = { advanceBalance: newBalance };
        } else if (Number(body.deductions?.advance || 0) > 0) {
             // Fallback to direct deduction from DB value
             updateQuery = { advanceBalance: sql`${employees.advanceBalance} - ${Number(body.deductions.advance)}` };
        }

        if (Object.keys(updateQuery).length > 0) {
            await db.update(employees)
                .set(updateQuery)
                .where(eq(employees.id, Number(body.employeeId)));
        }
    }

    return NextResponse.json(newSlip[0], { status: 201 });
  } catch (error) {
    console.error('Error creating salary slip:', error);
    return NextResponse.json({ error: 'Failed to create slip' }, { status: 500 });
  }
}
