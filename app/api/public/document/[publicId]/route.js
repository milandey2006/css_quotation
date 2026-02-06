
import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { quotations, proformas, estimates } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { publicId } = await params;

    if (!publicId) {
        return NextResponse.json({ error: 'Missing Public ID' }, { status: 400 });
    }

    // Search Quotations
    const quote = await db.select().from(quotations).where(eq(quotations.publicId, publicId));
    if (quote.length > 0) {
        return NextResponse.json({ type: 'Quotation', data: quote[0].data, meta: quote[0] });
    }

    // Search Proformas
    const proforma = await db.select().from(proformas).where(eq(proformas.publicId, publicId));
    if (proforma.length > 0) {
        return NextResponse.json({ type: 'Proforma', data: proforma[0].data, meta: proforma[0] });
    }

    // Search Estimates
    const estimate = await db.select().from(estimates).where(eq(estimates.publicId, publicId));
    if (estimate.length > 0) {
        // Estimates store data slightly differently (root spread in preview usually, but let's see how DB stores it)
        // Schema says: data: jsonb('data').notNull()
        // So we return consistent structure
        return NextResponse.json({ type: 'Estimate', data: estimate[0].data, meta: estimate[0], isEstimate: true });
    }

    return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  } catch (error) {
    console.error('Error fetching public document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
