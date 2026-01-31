import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { employees } from '../../../db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allEmployees = await db.select().from(employees).orderBy(desc(employees.createdAt));
    return NextResponse.json(allEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const joinDate = body.joinDate ? new Date(body.joinDate) : null;
    
    // Generate Custom Employee ID
    // Logic: CSS + 8 random digits
    const random8 = Math.floor(10000000 + Math.random() * 90000000);
    const employeeCode = `CSS${random8}`;

    const newEmployee = await db.insert(employees).values({
        ...body,
        employeeCode, // Save the custom code
        joinDate,
        basicSalary: Number(body.basicSalary || 0),
        advanceBalance: Number(body.advanceBalance || 0),
    }).returning();

    return NextResponse.json(newEmployee[0], { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
