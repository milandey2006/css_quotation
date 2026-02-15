import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

export async function PATCH(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    
    // Check if requester is super-admin
    const requester = await client.users.getUser(userId);
    if (requester.publicMetadata?.role !== 'super-admin') {
         return NextResponse.json({ error: 'Forbidden. Super Admin required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
        return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Update metadata
    await client.users.updateUserMetadata(id, {
        publicMetadata: {
            role: role
        }
    });

    return NextResponse.json({ message: 'Role updated successfully', role });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clerkClient();
    
    // Check if requester is super-admin
    const requester = await client.users.getUser(userId);
    if (requester.publicMetadata?.role !== 'super-admin') {
         return NextResponse.json({ error: 'Forbidden. Super Admin required.' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent deleting self
    if (id === userId) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await client.users.deleteUser(id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
