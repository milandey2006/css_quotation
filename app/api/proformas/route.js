
import { db } from '../../../db';
import { proformas } from '../../../db/schema';
import { NextResponse } from 'next/server';
import { desc, sql } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    
    let query;
    if (searchParams.get('basic') === 'true') {
        query = db.select({
            id: proformas.id,
            publicId: proformas.publicId,
            quotationNo: proformas.quotationNo,
            date: proformas.date,
            clientName: proformas.clientName,
            totalAmount: proformas.totalAmount,
            status: proformas.status,
            createdAt: proformas.createdAt,
            receiverPhone: sql`${proformas.data}->'receiver'->>'phone'`,
            receiverCompany: sql`${proformas.data}->'receiver'->>'company'`,
            receiverName: sql`${proformas.data}->'receiver'->>'name'`,
            subject: sql`${proformas.data}->>'subject'`,
            itemsText: sql`${proformas.data}->>'items'`,
        }).from(proformas).orderBy(desc(proformas.createdAt));
    } else {
        query = db.select().from(proformas).orderBy(desc(proformas.createdAt));
    }

    if (limit) {
        query = query.limit(parseInt(limit));
    } else {
        query = query.limit(searchParams.get('basic') === 'true' ? 1000 : 500);
    }

    const allProformas = await query;
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
