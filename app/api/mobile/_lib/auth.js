import { db } from '../../../../db';
import { employees } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function authenticateDevice(request) {
  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return null;

  const token = match[1];
  const rows = await db.select().from(employees).where(eq(employees.deviceToken, token)).limit(1);
  return rows[0] || null;
}
