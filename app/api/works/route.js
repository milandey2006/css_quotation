
import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { works } from '../../../db/schema';
import { desc } from 'drizzle-orm';

export async function POST(request) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, clientAddress, instructions } = body;

    if (!clientName) {
      return NextResponse.json({ error: 'Client Name is required' }, { status: 400 });
    }

    const inserted = await db.insert(works).values({
      clientName,
      clientPhone: clientPhone || '',
      clientAddress: clientAddress || '',
      instructions: instructions || '',
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
    const data = await db.select().from(works).orderBy(desc(works.createdAt));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching works:', error);
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 });
  }
}
