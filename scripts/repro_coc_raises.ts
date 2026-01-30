
interface CapitalRaise {
    id: string;
    amount: number;
    date: string;
}

interface Fund {
    id: string;
    totalRaised: number;
    costOfCapitalRate: number;
    createdAt: Date;
    capitalRaises?: CapitalRaise[];
}

interface Loan {
    fundId: string;
    principal: number;
    startDate: Date;
    status: string;
    variableCosts?: any;
    installments?: any[];
    repaymentType?: string;
    durationDays?: number;
}

function calculateUndeployedCost(fund: Fund, loans: Loan[], todayStr: string) {
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);

    let accumulatedUndeployedCost = 0;
    const inceptionDate = new Date(fund.createdAt);
    inceptionDate.setHours(0, 0, 0, 0);

    const events: { date: Date; change: number }[] = [];

    // NEW LOGIC: Use Capital Raises if available
    if (fund.capitalRaises && fund.capitalRaises.length > 0) {
        fund.capitalRaises.forEach(raise => {
            const raiseDate = new Date(raise.date);
            raiseDate.setHours(0, 0, 0, 0);
            events.push({ date: raiseDate, change: raise.amount });
        });
    } else {
        events.push({ date: inceptionDate, change: fund.totalRaised });
    }

    loans.forEach(loan => {
        const loanStart = new Date(loan.startDate);
        loanStart.setHours(0, 0, 0, 0);
        events.push({ date: loanStart, change: -loan.principal });
    });

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningAvail = 0;
    let lastDate = inceptionDate;

    console.log('--- Event Log ---');

    for (const event of events) {
        if (event.date > today) break;

        const periodDaysRaw = Math.max(0, Math.floor((event.date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
        const isFromInception = lastDate.getTime() === inceptionDate.getTime();
        const periodDays = (isFromInception && periodDaysRaw > 0) ? periodDaysRaw - 1 : periodDaysRaw;

        if (periodDays > 0 && runningAvail > 0) {
            const cost = (runningAvail * (fund.costOfCapitalRate / 100) / 360) * periodDays;
            console.log(`Period: ${lastDate.toISOString().split('T')[0]} to ${event.date.toISOString().split('T')[0]} (${periodDays} days)`);
            console.log(`Capital: ${runningAvail}, Cost: ${cost}`);
            accumulatedUndeployedCost += cost;
        }

        runningAvail += event.change;
        lastDate = event.date;
    }

    const finalDays = Math.max(0, Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
    if (finalDays > 0 && runningAvail > 0) {
        const cost = (runningAvail * (fund.costOfCapitalRate / 100) / 360) * finalDays;
        console.log(`Final Period: ${lastDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]} (${finalDays} days)`);
        console.log(`Capital: ${runningAvail}, Cost: ${cost}`);
        accumulatedUndeployedCost += cost;
    }

    return accumulatedUndeployedCost;
}

// SCENARIO:
// Fund Created Jan 1.
// Raise 1: $100k on Jan 1.
// Raise 2: $100k on Jan 15.
// Loan 1: $50k on Jan 20.
// Today: Jan 30.
// Rate: 10%
const fund: Fund = {
    id: '1',
    totalRaised: 200000, // Aggregate
    costOfCapitalRate: 10,
    createdAt: new Date('2026-01-01'),
    capitalRaises: [
        { id: 'r1', amount: 100000, date: '2026-01-01' },
        { id: 'r2', amount: 100000, date: '2026-01-15' }
    ]
};

const loans: Loan[] = [
    {
        fundId: '1',
        principal: 50000,
        startDate: new Date('2026-01-20'),
        status: 'ACTIVE'
    }
];

const today = '2026-01-30';

console.log(`Calculating with Multiple Raises for Today: ${today}`);
const cost = calculateUndeployedCost(fund, loans, today);
console.log(`Total Undeployed Cost: ${cost}`);

// Expected:
// Period 1 (Jan 1 - Jan 15): 14 days on $100k. Cost = 100k * (0.1/360) * 14 = 388.88
// Period 2 (Jan 15 - Jan 20): 5 days on $200k. Cost = 200k * (0.1/360) * 5 = 277.77
// Loan Deployed Jan 20 (-50k). Avail = 150k.
// Period 3 (Jan 20 - Jan 30): 10 days on $150k. Cost = 150k * (0.1/360) * 10 = 416.66
// Total = 388.88 + 277.77 + 416.66 = 1083.31 approx
