export { }; // Force module scope

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

    // CURRENT LOGIC (Suspected Buggy -> Fixed Logic)
    if (fund.capitalRaises && fund.capitalRaises.length > 0) {
        let totalExplicitRaises = 0;
        fund.capitalRaises.forEach(raise => {
            const raiseDate = new Date(raise.date);
            raiseDate.setHours(0, 0, 0, 0);
            events.push({ date: raiseDate, change: raise.amount });
            totalExplicitRaises += raise.amount;
        });

        const implicitInitial = fund.totalRaised - totalExplicitRaises;
        if (implicitInitial > 0) {
            events.push({ date: inceptionDate, change: implicitInitial });
        }
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
// Initial: $100k on Jan 1.
// Raise: $50k on Jan 20.
// Total Raised: $150k.
// Capital Raises Array: Only has the new $50k raise!
const fund: Fund = {
    id: '1',
    totalRaised: 150000,
    costOfCapitalRate: 10,
    createdAt: new Date('2026-01-01'),
    capitalRaises: [
        { id: 'r1', amount: 50000, date: '2026-01-20' }
    ]
};

const loans: Loan[] = []; // No loans to keep it simple

const today = '2026-01-30';

console.log(`Calculating Bug Repro for Today: ${today}`);
const cost = calculateUndeployedCost(fund, loans, today);
console.log(`Total Undeployed Cost: ${cost}`);

// Expected Behavior (if bug exists):
// Only sees $50k starting Jan 20.
// Misses the $100k from Jan 1 to Jan 20.
// And misses the $100k base from Jan 20 to Jan 30 (only sees 50k).
// Wait, runningAvail will be 0 until Jan 20. 
// Then 50k from Jan 20.
// Total will be very low compared to what it should be (on 100k then 150k).
