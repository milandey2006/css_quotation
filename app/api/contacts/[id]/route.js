import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { contacts } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

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

    const [row] = await db.update(contacts).set({
      companyName: String(body.companyName || '').trim() || 'Untitled',
      officeAddress: body.officeAddress || null,
      rmaAddress: body.rmaAddress || null,
      products: body.products || null,
      notes: body.notes || null,
      people,
    }).where(eq(contacts.id, parseInt(id))).returning();

    if (!row) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error('Error updating contact:', e);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.delete(contacts).where(eq(contacts.id, parseInt(id)));
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Error deleting contact:', e);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
