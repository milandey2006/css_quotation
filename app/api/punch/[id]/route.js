import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { punches } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clerkClient();
    const requester = await client.users.getUser(userId);
    const isAdmin = requester.publicMetadata?.role === 'admin';

    if (!isAdmin) {
         return NextResponse.json({ error: 'Forbidden. Only admins can delete attendance.' }, { status: 403 });
    }

    const { id } = await params;
    await db.delete(punches).where(eq(punches.id, parseInt(id)));

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting punch:', error);
    return NextResponse.json({ error: 'Failed to delete punch' }, { status: 500 });
  }
}
