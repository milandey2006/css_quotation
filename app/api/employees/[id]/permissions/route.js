import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { employees } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Dedicated route for mobile-app permissions. Deliberately NOT reusing the
// employee PUT route: that one spreads the whole body and re-coerces salary /
// joinDate, so a partial update from here would wipe those fields.
async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const client = await clerkClient();
  const requester = await client.users.getUser(userId);
  const role = requester.publicMetadata?.role;
  return role === 'admin' || role === 'super-admin';
}

export async function PATCH(request, { params }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Forbidden. Only admins can change permissions.' }, { status: 403 });
    }

    const { id } = await params;
    const { receiptsAccess } = await request.json();

    const updated = await db
      .update(employees)
      .set({ receiptsAccess: receiptsAccess ? 'true' : 'false' })
      .where(eq(employees.id, id))
      .returning({ id: employees.id, name: employees.name, receiptsAccess: employees.receiptsAccess });

    if (!updated[0]) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating employee permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
