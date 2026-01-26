import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { salarySlips } from '../../../db/schema';
import { desc } from 'drizzle-orm';

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

    return NextResponse.json(newSlip[0], { status: 201 });
  } catch (error) {
    console.error('Error creating salary slip:', error);
    return NextResponse.json({ error: 'Failed to create slip' }, { status: 500 });
  }
}
