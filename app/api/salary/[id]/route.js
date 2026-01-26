import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { salarySlips } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
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
        const { id: _, ...updateData } = body;

        const updatedSlip = await db.update(salarySlips)
            .set(updateData)
            .where(eq(salarySlips.id, parseInt(id)))
            .returning();
            
        return NextResponse.json(updatedSlip[0]);
    } catch (error) {
        console.error('Error updating slip:', error);
        return NextResponse.json({ error: 'Failed to update slip' }, { status: 500 });
    }
}
