import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { contacts } from '../../../db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const all = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
    return NextResponse.json(all);
  } catch (e) {
    console.error('Error fetching contacts:', e);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.companyName || !String(body.companyName).trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const people = Array.isArray(body.people)
      ? body.people
          .map(p => ({
            name: (p.name || '').trim(),
            designation: (p.designation || '').trim(),
            mobile: (p.mobile || '').trim(),
            email: (p.email || '').trim(),
          }))
          .filter(p => p.name || p.mobile || p.email || p.designation)
      : [];

    const [row] = await db.insert(contacts).values({
      companyName: String(body.companyName).trim(),
      officeAddress: body.officeAddress || null,
      rmaAddress: body.rmaAddress || null,
      products: body.products || null,
      notes: body.notes || null,
      people,
    }).returning();

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('Error creating contact:', e);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
