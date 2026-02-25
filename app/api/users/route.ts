import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { canManageUsers, isAdmin } from '@/lib/rbac';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !canManageUsers(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDatabase();
        const users = db.collection<User>('users');

        let filter: any;
        if (isAdmin(session.user.role)) {
            // Super admin sees ALL users except themselves
            filter = { _id: { $ne: session.user.id } };
        } else {
            // CRO sees fund_managers, viewers, and pending/rejected users
            filter = {
                $or: [
                    { role: 'fund_manager' },
                    { role: 'viewer' },
                    { role: { $exists: false } },
                    { status: 'pending' },
                    { status: 'rejected' }
                ]
            };
        }

        const managers = await users.find(
            filter,
            { projection: { password: 0 } }
        ).toArray();

        return NextResponse.json(managers);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
