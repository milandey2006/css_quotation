
import { db } from '../../../db';
import { proformas } from '../../../db/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allProformas = await db.select().from(proformas).orderBy(desc(proformas.createdAt));
    return NextResponse.json(allProformas);
  } catch (error) {
    console.error('Error fetching proformas:', error);
    return NextResponse.json({ error: 'Failed to fetch proformas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { quotationNo, clientName, totalAmount, data, date } = body;

    const newProforma = await db.insert(proformas).values({
      quotationNo, // Keeping same column name 'quotationNo' for mapping simplicity, but it stores PI No
      clientName,
      totalAmount,
      date: new Date(date),
      data,
      status: 'pending' // Default status
    }).returning();

    return NextResponse.json(newProforma[0]);
  } catch (error) {
    console.error('Error creating proforma:', error);
    return NextResponse.json({ error: 'Failed to create proforma' }, { status: 500 });
  }
}
