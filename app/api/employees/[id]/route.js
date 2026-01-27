import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { employees } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const joinDate = body.joinDate ? new Date(body.joinDate) : null;

    const updatedEmployee = await db.update(employees)
      .set({
        ...body,
        joinDate,
        basicSalary: Number(body.basicSalary || 0),
      })
      .where(eq(employees.id, id))
      .returning();

    return NextResponse.json(updatedEmployee[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.delete(employees).where(eq(employees.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
