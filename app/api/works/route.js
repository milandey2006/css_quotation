
import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { works } from '../../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const isAdmin = currentUser.publicMetadata?.role === 'admin';
    
    // Only admin can assign works
    if (!isAdmin) {
         return NextResponse.json({ error: 'Unauthorized. Only admins can assign work.' }, { status: 403 });
    }

    const body = await request.json();
    const { clientName, clientPhone, clientAddress, instructions, assignedUserId } = body;

    if (!clientName) {
      return NextResponse.json({ error: 'Client Name is required' }, { status: 400 });
    }

    const inserted = await db.insert(works).values({
      clientName,
      clientPhone: clientPhone || '',
      clientAddress: clientAddress || '',
      instructions: instructions || '',
      userId: assignedUserId || null,
      status: 'pending',
      createdAt: new Date(),
    }).returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error('Error saving work:', error);
    return NextResponse.json({ error: 'Failed to save work' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const isAdmin = currentUser.publicMetadata?.role === 'admin';

    let data;
    if (isAdmin) {
        // Admin sees all works
        data = await db.select().from(works).orderBy(desc(works.createdAt));
    } else {
        // User sees ONLY their assigned works
        data = await db.select().from(works).where(eq(works.userId, userId)).orderBy(desc(works.createdAt));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching works:', error);
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 });
  }
}
