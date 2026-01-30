// import { getDatabase } from '../lib/mongodb'; // Removed static import
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load .env manually
try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;

        const firstEquals = trimmedLine.indexOf('=');
        if (firstEquals === -1) return;

        const key = trimmedLine.substring(0, firstEquals).trim();
        let value = trimmedLine.substring(firstEquals + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (key && value) {
            process.env[key] = value;
        }
    });

    // Debug: Check if URI is loaded (masked)
    const uri = process.env.MONGODB_URI;
    if (uri) {
        console.log(`Loaded MONGODB_URI: ${uri.substring(0, 15)}...`);
    } else {
        console.error('MONGODB_URI not found in .env');
    }
} catch (e) {
    console.error('Could not load .env file', e);
}

// Copying necessary interfaces and logic to avoid import issues if not transpiled correctly
// or just re-implementing the core logic for debugging

async function run() {
    try {
        const { getDatabase } = await import('../lib/mongodb');
        const db = await getDatabase();
        console.log('Connected to DB');

        // 1. Find the Fund(s)
        const fundsCollection = db.collection('funds');
        const allFunds = await fundsCollection.find({ name: { $regex: 'Disrupt', $options: 'i' } }).toArray();

        console.log(`Found ${allFunds.length} funds matching 'Disrupt':`);

        for (const fund of allFunds) {
            console.log(`\n=== Fund: ${fund.name} (ID: ${fund._id}) ===`);
            console.log(`Total Raised: ${fund.totalRaised}`);
            console.log(`CoC Rate: ${fund.costOfCapitalRate}`);
            console.log(`Created At: ${fund.createdAt}`);

            // 2. Find Loans for this Fund
            const loansCollection = db.collection('loans');
            // Try both string and ObjectId for fundId
            const loans = await loansCollection.find({
                $or: [
                    { fundId: fund._id.toString() },
                    { fundId: fund._id }
                ]
            }).toArray();

            console.log(`Found ${loans.length} loans for this fund.`);
            loans.forEach(l => {
                console.log(`- Loan ${l._id}: Principal ${l.principal}, Start ${l.startDate}, Status ${l.status}`);
            });

            // 3. Calculate CoC
            // Use user's date? Or Today?
            const today = new Date();
            // Try specific date that might match 1818.75
            // 1818.75 / (450000 * 0.135 / 360) = 10.77 days
            // If capital is 450k and rate 13.5%.

            const result = calculateUndeployedCost(fund, loans, today);
            console.log(`Total CoC (Today): ${result}`);

            // Reverse engineer Days?
            if (fund.totalRaised > 0 && loans.length === 0) {
                const daily = (fund.totalRaised * (fund.costOfCapitalRate / 100) / 360);
                const days = 1818.75 / daily;
                console.log(`Days needed to reach 1818.75: ${days}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

// --- Logic from utils/analytics.ts (Simplified/Copied) ---

function calculateUndeployedCost(fund: any, loans: any[], today: Date) {
    today.setHours(0, 0, 0, 0);

    let accumulatedUndeployedCost = 0;
    const inceptionDate = new Date(fund.createdAt);
    inceptionDate.setHours(0, 0, 0, 0);

    const events: { date: Date; change: number }[] = [];
    events.push({ date: inceptionDate, change: fund.totalRaised });

    loans.forEach(loan => {
        const loanStart = new Date(loan.startDate);
        loanStart.setHours(0, 0, 0, 0);
        // Assuming Principal reduces available capital
        events.push({ date: loanStart, change: -loan.principal });

        // Add Repayments if any? For undeployed cost, repayments increase capital.
        // Checking analytics.ts logic...
        if (loan.repaymentType === 'MONTHLY' && loan.installments && loan.installments.length > 0) {
            const numInst = loan.installments.length;
            const principalReturn = loan.principal / numInst;
            loan.installments.forEach((inst: any) => {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                events.push({ date: dueDate, change: principalReturn });
            });
        }
    });

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningAvail = 0;
    let lastDate = inceptionDate;

    console.log('--- Calculation Log ---');

    for (const event of events) {
        if (event.date > today) break;

        const periodDaysRaw = Math.max(0, Math.floor((event.date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
        const isFromInception = lastDate.getTime() === inceptionDate.getTime();
        // APPLIED FIX: Exclude Inception Date
        const periodDays = (isFromInception && periodDaysRaw > 0) ? periodDaysRaw - 1 : periodDaysRaw;

        if (periodDays > 0 && runningAvail > 0) {
            const cost = (runningAvail * (fund.costOfCapitalRate / 100) / 360) * periodDays;
            console.log(`Period: ${lastDate.toISOString().split('T')[0]} to ${event.date.toISOString().split('T')[0]} (${periodDays} days)`);
            console.log(`Capital: ${runningAvail}, Cost: ${cost.toFixed(4)}`);
            accumulatedUndeployedCost += cost;
        }

        runningAvail += event.change;
        lastDate = event.date;
    }

    // Final period until Today
    const finalDays = Math.max(0, Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
    if (finalDays > 0 && runningAvail > 0) {
        const cost = (runningAvail * (fund.costOfCapitalRate / 100) / 360) * finalDays;
        console.log(`Final Period: ${lastDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]} (${finalDays} days)`);
        console.log(`Capital: ${runningAvail}, Cost: ${cost.toFixed(4)}`);
        accumulatedUndeployedCost += cost;
    }

    return accumulatedUndeployedCost;
}

run();
