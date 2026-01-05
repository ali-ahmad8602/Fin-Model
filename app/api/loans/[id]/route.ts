import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getLoanById, updateLoan, deleteLoan } from '@/lib/models/Loan';

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
        const loan = await getLoanById(id, session.user.id);
        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        return NextResponse.json(loan);
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
        const updated = await updateLoan(id, session.user.id, body);

        if (!updated) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Loan updated successfully' });
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
        const deleted = await deleteLoan(id, session.user.id);

        if (!deleted) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Loan deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
