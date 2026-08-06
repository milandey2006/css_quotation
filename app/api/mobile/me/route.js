import { NextResponse } from 'next/server';
import { authenticateDevice } from '../_lib/auth';

// Who am I + what am I allowed to do. The app calls this on launch so it can
// show/hide permission-gated features (e.g. Receipts) for this employee.
export async function GET(request) {
  const employee = await authenticateDevice(request);
  if (!employee) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    id: employee.id,
    name: employee.name,
    receiptsAccess: employee.receiptsAccess === 'true',
  });
}
