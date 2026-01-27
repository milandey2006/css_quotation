
import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { works } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, userId, clientName, clientPhone, clientAddress, instructions } = body; 
    
    // Allow updating any of the fields
    // (Simplified check or just proceed building updateData)

    const updateData = {};
    if (status) updateData.status = status;
    if (userId !== undefined) updateData.userId = userId;
    if (body.userIds !== undefined) updateData.userIds = body.userIds; // Handle multi-user update
    if (clientName) updateData.clientName = clientName;
    if (clientPhone) updateData.clientPhone = clientPhone;
    if (clientAddress) updateData.clientAddress = clientAddress;
    if (instructions) updateData.instructions = instructions;

    const updated = await db.update(works)
      .set(updateData)
      .where(eq(works.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating work:', error);
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 });
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
             return NextResponse.json({ error: 'Forbidden. Only admins can delete work.' }, { status: 403 });
        }

        const { id } = await params;
        await db.delete(works).where(eq(works.id, parseInt(id)));
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting work:', error);
        return NextResponse.json({ error: 'Failed to delete work' }, { status: 500 });
    }
}
