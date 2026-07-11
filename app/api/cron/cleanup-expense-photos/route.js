import { NextResponse } from 'next/server';
import { and, lt, isNotNull, eq } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { db } from '../../../../db';
import { expenses } from '../../../../db/schema';

const RETENTION_DAYS = 10;

// Runs daily (see vercel.json crons). Deletes expense receipt photos older than
// RETENTION_DAYS from Blob storage and unlinks them, but KEEPS the expense record
// itself for accounting. Keeps Blob storage from growing without bound.
export async function GET(request) {
  // If a CRON_SECRET is configured, require it (Vercel sends it automatically on
  // scheduled invocations). If it's not set, allow — the job is idempotent and
  // only ever removes already-expired photos.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const stale = await db
      .select()
      .from(expenses)
      .where(and(isNotNull(expenses.receiptPhotoUrl), lt(expenses.createdAt, cutoff)));

    let deleted = 0;
    for (const row of stale) {
      try {
        await del(row.receiptPhotoUrl);
      } catch (e) {
        // Blob may already be gone — still clear the DB link below.
        console.error(`Blob delete failed for expense ${row.id}:`, e?.message);
      }
      await db
        .update(expenses)
        .set({ receiptPhotoUrl: null })
        .where(eq(expenses.id, row.id));
      deleted += 1;
    }

    return NextResponse.json({ ok: true, cleaned: deleted });
  } catch (error) {
    console.error('Expense photo cleanup failed:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
