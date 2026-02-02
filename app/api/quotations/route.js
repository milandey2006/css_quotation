
import { db } from '../../../db';
import { quotations } from '../../../db/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let query = db.select().from(quotations).orderBy(desc(quotations.createdAt));

    if (limit) {
        query = query.limit(parseInt(limit));
    }

    const allQuotations = await query;
    return NextResponse.json(allQuotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { quotationNo, clientName, totalAmount, data, date } = body;

    const newQuotation = await db.insert(quotations).values({
      quotationNo,
      clientName,
      totalAmount,
      date: new Date(date),
      data,
      status: 'pending' // Default status
    }).returning();

    return NextResponse.json(newQuotation[0]);
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 });
  }
}
