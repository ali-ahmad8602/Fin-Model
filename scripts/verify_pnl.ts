import { calculateFundMetrics } from '../utils/analytics';
import { Fund, Loan } from '../types';

// Mock Data
const fund: Fund = {
    id: 'fund-1',
    userId: 'user-1',
    name: 'Test Fund',
    totalRaised: 100000,
    costOfCapitalRate: 10, // 10% PA
    createdAt: new Date('2026-01-01').toISOString()
};

const loans: Loan[] = [
    {
        id: 'loan-1',
        fundId: 'fund-1',
        borrowerName: 'Borrower A',
        principal: 50000,
        interestRate: 20, // 20% PA
        processingFeeRate: 2, // 2% = 1000
        startDate: new Date('2026-01-01').toISOString(),
        durationDays: 365,
        status: 'ACTIVE',
        variableCosts: [{ id: 'vc-1', name: 'Broker', percentage: 1 }], // 1% = 500
        repaymentType: 'BULLET',
        installments: []
    }
];

// Run Calculation
const metrics = calculateFundMetrics(fund, loans);

console.log('--- PnL Verification ---');

// 1. Income
const interestIncome = metrics.projectedIncome;
const processingFees = metrics.totalProcessingFees;
const totalIncome = interestIncome + processingFees;

console.log(`Interest Income (Exp: ~10000): ${interestIncome.toFixed(2)}`);
console.log(`Processing Fees (Exp: 1000): ${processingFees.toFixed(2)}`);
console.log(`Total Income: ${totalIncome.toFixed(2)}`);

// 2. Expenses
const deployedCoC = metrics.totalAllocatedCostOfCapital;
// Undeployed: 50k for 365 days @ 10% = ~5000
// (Actually utils logic might vary slightly based on day counting)
const undeployedCoC = metrics.accumulatedUndeployedCost;
const variableCosts = metrics.totalUpfrontCostsDeployed;
const totalExpenses = deployedCoC + undeployedCoC + variableCosts;

console.log(`CoC Deployed (Exp: ~5000): ${deployedCoC.toFixed(2)}`);
console.log(`CoC Undeployed (Exp: ~5000 approx): ${undeployedCoC.toFixed(2)}`); // 50k undeployed for whole year
console.log(`Variable Costs (Exp: 500): ${variableCosts.toFixed(2)}`);
console.log(`Total Expenses: ${totalExpenses.toFixed(2)}`);

// 3. Net PnL
const netPnL = totalIncome - totalExpenses;
console.log(`Net PnL: ${netPnL.toFixed(2)}`);

if (processingFees === 1000 && variableCosts === 500) {
    console.log('PASS: Static components match');
} else {
    console.log('FAIL: Static components mismatch');
}
