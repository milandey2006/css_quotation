import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { employees } from '../../../db/schema';
import { desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // deviceToken/pairingCode are bearer secrets for the mobile app — never send the raw
    // values to the browser, just a derived "paired" flag and non-secret timestamps.
    const allEmployees = await db.select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      name: employees.name,
      designation: employees.designation,
      mobile: employees.mobile,
      email: employees.email,
      address: employees.address,
      panNo: employees.panNo,
      aadhaarNo: employees.aadhaarNo,
      uanNo: employees.uanNo,
      bankAccountNo: employees.bankAccountNo,
      ifscCode: employees.ifscCode,
      joinDate: employees.joinDate,
      basicSalary: employees.basicSalary,
      advanceBalance: employees.advanceBalance,
      status: employees.status,
      createdAt: employees.createdAt,
      isPaired: sql`(${employees.deviceToken} is not null)`,
      deviceTokenCreatedAt: employees.deviceTokenCreatedAt,
      pairingCodeExpiresAt: employees.pairingCodeExpiresAt,
    }).from(employees).orderBy(desc(employees.createdAt));
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
