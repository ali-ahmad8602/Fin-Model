import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFundById, updateFund, deleteFund } from '@/lib/models/Fund';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const fund = await getFundById(id, session.user.id);
        if (!fund) {
            return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
        }

        return NextResponse.json(fund);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const updated = await updateFund(id, session.user.id, body);

        if (!updated) {
            return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Fund updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const deleted = await deleteFund(id, session.user.id);

        if (!deleted) {
            return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Fund deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
