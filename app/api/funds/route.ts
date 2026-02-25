import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFundsByUserId, createFund, getAllFunds } from '@/lib/models/Fund';
import { canViewAll, canMutate } from '@/lib/rbac';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let funds;
        if (canViewAll(session.user.role)) {
            funds = await getAllFunds();
        } else {
            funds = await getFundsByUserId(session.user.id);
        }
        return NextResponse.json(funds);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!canMutate(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: read-only access' }, { status: 403 });
        }

        const body = await request.json();
        const { name, totalRaised, costOfCapitalRate, createdAt } = body;

        if (!name || totalRaised === undefined || costOfCapitalRate === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const fund = await createFund(session.user.id, {
            name,
            totalRaised,
            costOfCapitalRate,
            createdAt: createdAt ? new Date(createdAt) : undefined
        } as any);

        return NextResponse.json(fund, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
