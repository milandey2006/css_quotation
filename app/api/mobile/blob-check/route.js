import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// TEMPORARY diagnostic: verifies the Vercel Blob token is wired into this
// deployment by writing a tiny test file. Remove after confirming.
export async function GET() {
  try {
    const blob = await put('healthcheck.txt', `ok ${Date.now()}`, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'text/plain',
    });
    return NextResponse.json({ blobOk: true, url: blob.url });
  } catch (e) {
    return NextResponse.json({ blobOk: false, error: e?.message || String(e) });
  }
}
