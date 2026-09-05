import { NextResponse } from 'next/server';

// Body: { imageBase64: "data:image/jpeg;base64,..." }
// Response: { companyName, officeAddress, rmaAddress, products, notes, people: [{name, designation, mobile, email}] }
//
// Calls Google Gemini's REST API directly (skipping the deprecated
// @google/generative-ai SDK, which fails on newer model aliases). Nothing
// about the card is stored server-side — the image passes through only to
// Gemini.

// Lite Flash: fastest and least contended tier — perfect for OCR-style tasks
// like reading a business card. If it starts producing bad results, promote to
// 'gemini-flash-latest' or a pinned 'gemini-3.5-flash'.
const MODEL = 'gemini-flash-lite-latest';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = `You are extracting contact details from a business card image.
Return ONLY a JSON object matching this exact shape (omit or leave empty any field not present on the card):
{
  "companyName": string,
  "officeAddress": string,
  "rmaAddress": string,
  "products": string,
  "notes": string,
  "people": [
    { "name": string, "designation": string, "mobile": string, "email": string }
  ]
}

Rules:
- companyName is the brand / firm name printed on the card (not the individual's name).
- If the card lists what the company sells / product lines / services, put that in "products" as a concise comma-separated summary.
- Each named person on the card becomes one entry in "people". If a person has multiple phone numbers, join them with " / " in "mobile". Same for multiple emails in "email".
- If the card has only phone/email but no printed person name, still add one people entry with the phone/email and an empty "name".
- Put the website URL (if any) into "notes" as "Website: <url>".
- "rmaAddress" only if the card explicitly labels a returns / RMA / service address; otherwise leave empty.
- Do NOT invent details. If unsure, leave the field empty.`;

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Card scanning is not configured. Add GEMINI_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    // Accept either a single-image legacy shape { imageBase64 } or the new
    // multi-image shape { images: [...] } so the front+back scan flow works
    // without breaking any older callers.
    let rawImages = [];
    if (Array.isArray(body?.images)) rawImages = body.images.filter(Boolean);
    else if (typeof body?.imageBase64 === 'string') rawImages = [body.imageBase64];

    if (rawImages.length === 0) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }
    if (rawImages.length > 2) {
      return NextResponse.json({ error: 'Up to 2 images (front + back) supported' }, { status: 400 });
    }

    const imageParts = [];
    for (const raw of rawImages) {
      if (typeof raw !== 'string') continue;
      const match = raw.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/jpeg';
      const base64 = match ? match[2] : raw;
      if (base64.length > 8 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image too large (max ~6 MB per side)' }, { status: 413 });
      }
      imageParts.push({ inlineData: { mimeType, data: base64 } });
    }

    // When we send both sides, add a hint so the model treats them as one card.
    const promptText = imageParts.length > 1
      ? PROMPT + '\n\nNote: The images are the FRONT and BACK of the SAME business card. Merge fields from both into a single result.'
      : PROMPT;

    const geminiRes = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              ...imageParts,
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) {
      const msg = geminiData?.error?.message || `Gemini ${geminiRes.status}`;
      console.error('Gemini API error:', msg);
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const safe = {
      companyName: String(parsed.companyName || '').trim(),
      officeAddress: String(parsed.officeAddress || '').trim(),
      rmaAddress: String(parsed.rmaAddress || '').trim(),
      products: String(parsed.products || '').trim(),
      notes: String(parsed.notes || '').trim(),
      people: Array.isArray(parsed.people)
        ? parsed.people.map(p => ({
            name: String(p?.name || '').trim(),
            designation: String(p?.designation || '').trim(),
            mobile: String(p?.mobile || '').trim(),
            email: String(p?.email || '').trim(),
          }))
        : [],
    };

    return NextResponse.json(safe);
  } catch (err) {
    console.error('Card scan failed:', err);
    return NextResponse.json({ error: err?.message || 'Failed to read the card' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
