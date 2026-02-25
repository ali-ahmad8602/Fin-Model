import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updatePassword } from '@/lib/models/User';
import { isAdmin } from '@/lib/rbac';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, newPassword } = await req.json();

        if (!userId || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const success = await updatePassword(userId, newPassword);

        if (!success) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Admin password reset error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
