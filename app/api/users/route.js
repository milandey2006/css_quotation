import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    
    // Fetch the user details directly to get fresh metadata
    const currentUser = await client.users.getUser(userId);
    const role = currentUser.publicMetadata?.role;
    
    console.log('API: Validating Admin. Fetched Role:', role);

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    // Reuse the client to fetch list
    const users = await client.users.getUserList();
    console.log('API: Fetched users from Clerk:', users.data.length);


    // Map to simple structure
    const userList = users.data.map(user => ({
      id: user.id,
      name: user.fullName || user.firstName || 'User',
      email: user.primaryEmailAddress?.emailAddress,
    }));

    return NextResponse.json(userList);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
        error: 'Failed to fetch users', 
        details: error.message,
        stack: error.stack 
    }, { status: 500 });
  }
}
