import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { salarySlips, employees } from '../../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const slip = await db.select().from(salarySlips).where(eq(salarySlips.id, parseInt(id)));
    
    if (slip.length === 0) {
      return NextResponse.json({ error: 'Slip not found' }, { status: 404 });
    }

    return NextResponse.json(slip[0]);
  } catch (error) {
    console.error('Error fetching slip:', error);
    return NextResponse.json({ error: 'Failed to fetch slip' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const client = await clerkClient();
        const currentUser = await client.users.getUser(userId);
        const isAdmin = currentUser.publicMetadata?.role === 'admin';

        if (!isAdmin) {
             return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        await db.delete(salarySlips).where(eq(salarySlips.id, parseInt(id)));
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting slip:', error);
        return NextResponse.json({ error: 'Failed to delete slip' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        // Remove id from body to avoid update error
        const { id: _, dateOfJoining, lopDays, ...rest } = body;

        // Explicitly construct update object to avoid passing unknown fields that cause 500
        const updateData = {
            employeeName: rest.employeeName,
            employeeId: rest.employeeId,
            designation: rest.designation,
            monthYear: rest.monthYear,
            aadhaarNo: rest.aadhaarNo,
            panNo: rest.panNo,
            uanNo: rest.uanNo,
            utrNo: rest.utrNo,
            earnings: rest.earnings,
            deductions: rest.deductions,
            advanceSalary: rest.advanceSalary,
            basicSalary: rest.basicSalary,
            totalEarnings: rest.totalEarnings,
            totalDeductions: rest.totalDeductions,
            netPayable: rest.netPayable,
            workDays: rest.workDays,
            holidays: rest.holidays,
            paidDays: rest.paidDays,
            // Add other fields if missing from this list but present in schema
        };

        // Remove undefined keys so we don't overwrite with null unless intentional
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedSlip = await db.update(salarySlips)
            .set(updateData)
            .where(eq(salarySlips.id, parseInt(id)))
            .where(eq(salarySlips.id, parseInt(id)))
            .returning();
            
        // Update Employee Balance Logic for PUT
        // This acts as a "correction" sync. 
        // We assume the user sees the 'Total' in UI, adjusts it if needed, and 'Remaining' is what they expect to be the new balance.
        if (body.employeeId && body.openingAdvanceBalance !== undefined) {
             const newBalance = Math.max(0, Number(body.openingAdvanceBalance) - Number(body.deductions?.advance || 0));
             await db.update(employees)
                .set({ advanceBalance: newBalance })
                .where(eq(employees.id, Number(body.employeeId)));
        }

        return NextResponse.json(updatedSlip[0]);
    } catch (error) {
        console.error('Error updating slip:', error);
        return NextResponse.json({ error: 'Failed to update slip' }, { status: 500 });
    }
}
