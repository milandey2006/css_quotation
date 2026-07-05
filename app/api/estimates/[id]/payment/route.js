import { db } from '../../../../../db';
import { estimates } from '../../../../../db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { amount, date, method, note } = await request.json();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const [est] = await db.select().from(estimates).where(eq(estimates.id, parseInt(id)));
    if (!est) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });

    const existingPayments = Array.isArray(est.payments) ? est.payments : [];
    const newPayment = { amount: Number(amount), date, method: method || 'Cash', note: note || '' };
    const updatedPayments = [...existingPayments, newPayment];
    const newPaidAmount = updatedPayments.reduce((s, p) => s + Number(p.amount), 0);

    const [updated] = await db.update(estimates)
      .set({ payments: updatedPayments, paidAmount: Math.round(newPaidAmount) })
      .where(eq(estimates.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error adding payment:', error);
    return NextResponse.json({ error: 'Failed to add payment' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const index = parseInt(searchParams.get('index'));

    if (isNaN(index) || index < 0) {
      return NextResponse.json({ error: 'Invalid payment index' }, { status: 400 });
    }

    const [est] = await db.select().from(estimates).where(eq(estimates.id, parseInt(id)));
    if (!est) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });

    const existingPayments = Array.isArray(est.payments) ? est.payments : [];
    if (index >= existingPayments.length) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const updatedPayments = existingPayments.filter((_, i) => i !== index);
    const newPaidAmount = updatedPayments.reduce((s, p) => s + Number(p.amount), 0);

    const [updated] = await db.update(estimates)
      .set({ payments: updatedPayments, paidAmount: Math.round(newPaidAmount) })
      .where(eq(estimates.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
