
interface Fund {
    id: string;
    totalRaised: number;
    costOfCapitalRate: number;
    createdAt: Date;
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

    // Logic from utils/analytics.ts
    let accumulatedUndeployedCost = 0;
    const inceptionDate = new Date(fund.createdAt);
    inceptionDate.setHours(0, 0, 0, 0);

    const events: { date: Date; change: number }[] = [];
    events.push({ date: inceptionDate, change: fund.totalRaised });

    loans.forEach(loan => {
        const loanStart = new Date(loan.startDate);
        loanStart.setHours(0, 0, 0, 0);
        // Simplified: ignoring upfront costs for this repro as user didn't mention them affecting the PRINCIPAL flow explicitly, 
        // but typically they reduce available capital. User's example "200k deployed" implies 200k principal.
        // I will stick to principal only for the repro to match the numbers "350k - 200k = 150k".
        events.push({ date: loanStart, change: -loan.principal });
    });

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningAvail = 0;
    let lastDate = inceptionDate;

    console.log('--- Event Log ---');

    // CURRENT LOGIC (Likely Day 0 start)
    for (const event of events) {
        if (event.date > today) break;

        const periodDays = Math.max(0, Math.floor((event.date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
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

const fund: Fund = {
    id: '1',
    totalRaised: 350000,
    costOfCapitalRate: 13.5,
    createdAt: new Date('2026-01-12')
};

const loans: Loan[] = [
    {
        fundId: '1',
        principal: 200000,
        startDate: new Date('2026-01-16'),
        status: 'ACTIVE'
    }
];

const today = '2026-01-19';

console.log(`Calculating for Today: ${today}`);
const cost = calculateUndeployedCost(fund, loans, today);
console.log(`Total Undeployed Cost: ${cost}`);

const expected = 393.75 + 168.75; // 562.5
console.log(`Expected (User): ${expected}`);

if (Math.abs(cost - expected) < 1) {
    console.log('PASS: Matches User Logic');
} else {
    console.log('FAIL: Does Not Match');
}
