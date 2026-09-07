
import { db } from '../../../db';
import { quotations } from '../../../db/schema';
import { NextResponse } from 'next/server';
import { desc, sql, isNull, isNotNull } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const isBin = searchParams.get('bin') === 'true';

    // Bin view returns only soft-deleted rows; every other view excludes them,
    // so binned quotations drop out of the list and dashboard automatically.
    const binFilter = isBin ? isNotNull(quotations.deletedAt) : isNull(quotations.deletedAt);
    // Bin is ordered by when it was deleted (most recently binned first).
    const orderCol = isBin ? quotations.deletedAt : quotations.createdAt;

    let query;
    if (searchParams.get('basic') === 'true') {
        query = db.select({
            id: quotations.id,
            publicId: quotations.publicId,
            quotationNo: quotations.quotationNo,
            date: quotations.date,
            clientName: quotations.clientName,
            totalAmount: quotations.totalAmount,
            status: quotations.status,
            createdAt: quotations.createdAt,
            deletedAt: quotations.deletedAt,
            receiverPhone: sql`${quotations.data}->'receiver'->>'phone'`,
            receiverCompany: sql`${quotations.data}->'receiver'->>'company'`,
            receiverName: sql`${quotations.data}->'receiver'->>'name'`,
            subject: sql`${quotations.data}->>'subject'`,
            itemsText: sql`${quotations.data}->>'items'`,
        }).from(quotations).where(binFilter).orderBy(desc(orderCol));
    } else {
        query = db.select().from(quotations).where(binFilter).orderBy(desc(orderCol));
    }

    if (limit) {
        query = query.limit(parseInt(limit));
    } else {
        query = query.limit(searchParams.get('basic') === 'true' ? 1000 : 500);
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
