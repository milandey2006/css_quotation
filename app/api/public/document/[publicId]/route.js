
import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { quotations, proformas, estimates } from '../../../../../db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { publicId: slugParam } = await params;

    if (!slugParam) {
        return NextResponse.json({ error: 'Missing Public ID' }, { status: 400 });
    }

    // Extract UUID from slug. Supports:
    //   1. Full UUID:      "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    //   2. Combined slug:  "john-doe-css-feb-2026-261-a8f3k9b2"
    //                       (last 8 chars are the first 8 hex digits of the UUID without dashes)
    const fullUuidMatch = slugParam.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
    const shortHexMatch = !fullUuidMatch && slugParam.match(/([a-f0-9]{8})$/i);

    if (!fullUuidMatch && !shortHexMatch) {
        return NextResponse.json({ error: 'Invalid share link' }, { status: 400 });
    }

    // Helper: build a WHERE condition depending on which format we have
    const makeWhere = (table) => {
      if (fullUuidMatch) {
        return eq(table.publicId, fullUuidMatch[1]);
      }
      // For the short hex, match rows where REPLACE(public_id, '-', '') LIKE 'a8f3k9b2%'
      const prefix = shortHexMatch[1].toLowerCase();
      return sql`REPLACE(${table.publicId}::text, '-', '') LIKE ${prefix + '%'}`;
    };

    // Search Quotations
    const quote = await db.select().from(quotations).where(makeWhere(quotations));
    if (quote.length > 0) {
        return NextResponse.json({ type: 'Quotation', data: quote[0].data, meta: quote[0] });
    }

    // Search Proformas
    const proforma = await db.select().from(proformas).where(makeWhere(proformas));
    if (proforma.length > 0) {
        return NextResponse.json({ type: 'Proforma', data: proforma[0].data, meta: proforma[0] });
    }

    // Search Estimates
    const estimate = await db.select().from(estimates).where(makeWhere(estimates));
    if (estimate.length > 0) {
        return NextResponse.json({ type: 'Estimate', data: estimate[0].data, meta: estimate[0], isEstimate: true });
    }

    return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  } catch (error) {
    console.error('Error fetching public document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
