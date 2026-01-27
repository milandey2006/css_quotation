
import { db } from '../../../db';
import { estimates } from '../../../db/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(estimates).orderBy(desc(estimates.billDate));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { billNo, billDate, clientName, totalAmount, paidAmount, status, ...data } = body;

    const newEstimate = await db.insert(estimates).values({
      billNo,
      billDate: new Date(billDate),
      clientName: body.billTo, // Mapping billTo from frontend to clientName
      totalAmount,
      paidAmount,
      status: status || 'pending',
      data: body, // Store the full body as JSON for flexibility
    }).returning();

    return NextResponse.json(newEstimate[0]);
  } catch (error) {
    console.error('Error creating estimate:', error);
    return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 });
  }
}
