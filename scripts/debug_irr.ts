
// --- XIRR LOGIC ---
const MAX_ITERATIONS = 100;
const TOLERANCE = 1e-6;

export interface CashFlow {
    amount: number;
    date: Date;
}

export const calculateXIRR = (cashFlows: CashFlow[], guess = 0.1): number | null => {
    if (!cashFlows || cashFlows.length === 0) return null;

    let x0 = guess;
    let x1 = 0;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const fValue = f(x0, cashFlows);
        const fPrimeValue = fPrime(x0, cashFlows);

        if (Math.abs(fPrimeValue) < TOLERANCE) {
            return null; // Derivative too close to 0
        }

        x1 = x0 - fValue / fPrimeValue;

        if (Math.abs(x1 - x0) < TOLERANCE) {
            return x1;
        }

        x0 = x1;
    }

    return null; // Failed to converge
};

const f = (rate: number, cashFlows: CashFlow[]): number => {
    const startDate = cashFlows[0].date;
    return cashFlows.reduce((sum, cf) => {
        const days = (cf.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + cf.amount / Math.pow(1 + rate, days / 365);
    }, 0);
};

const fPrime = (rate: number, cashFlows: CashFlow[]): number => {
    const startDate = cashFlows[0].date;
    return cashFlows.reduce((sum, cf) => {
        const days = (cf.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum - (days / 365) * cf.amount * Math.pow(1 + rate, -days / 365 - 1);
    }, 0);
};

// --- FINANCE LOGIC ---
const DAYS_IN_YEAR = 360;

const calculateLoanIRR = (
    principal: number,
    interestRate: number,
    processingFeeRate: number = 0,
    startDate: string,
    durationDays: number,
    repaymentType: 'BULLET' | 'MONTHLY',
    installments?: { dueDate: string; amount: number }[]
): number | null => {
    const cashFlows: CashFlow[] = [];
    const loanStartDate = new Date(startDate);
    loanStartDate.setHours(0, 0, 0, 0);

    // Initial outflow: -Principal (FEE EXCLUDED)
    cashFlows.push({
        amount: -principal,
        date: loanStartDate
    });

    if (installments && installments.length > 0 && repaymentType === 'MONTHLY') {
        const totalInterest = (principal * (interestRate / 100) * durationDays) / DAYS_IN_YEAR;
        const numInstallments = installments.length;
        const principalPerInstallment = principal / numInstallments;
        const interestPerInstallment = totalInterest / numInstallments;
        // FEE EXCLUDED
        const totalPerInstallment = principalPerInstallment + interestPerInstallment;

        installments.forEach((inst) => {
            cashFlows.push({
                amount: totalPerInstallment,
                date: new Date(inst.dueDate)
            });
        });
    } else {
        if (repaymentType === 'BULLET') {
            const interest = (principal * (interestRate / 100) * durationDays) / DAYS_IN_YEAR;
            const totalRepayable = principal + interest;
            const dueDate = new Date(loanStartDate);
            dueDate.setDate(dueDate.getDate() + durationDays);

            cashFlows.push({
                amount: totalRepayable,
                date: dueDate
            });
        } else {
            // MONTHLY
            const months = Math.max(1, Math.floor(durationDays / 30));
            const totalInterest = (principal * (interestRate / 100) * durationDays) / DAYS_IN_YEAR;

            const principalPerMonth = principal / months;
            const interestPerMonth = totalInterest / months;
            const totalPerMonth = principalPerMonth + interestPerMonth;

            for (let i = 1; i <= months; i++) {
                const dueDate = new Date(loanStartDate);
                dueDate.setDate(dueDate.getDate() + (i * 30));

                cashFlows.push({
                    amount: totalPerMonth,
                    date: dueDate
                });
            }
        }
    }

    return calculateXIRR(cashFlows);
};


// --- TEST EXECUTION ---
// --- USER EXAMPLE SIMULATION ---
const startDate = new Date(); // To ensure valid date handling
startDate.setHours(0, 0, 0, 0);

console.log('\n--- USER EXAMPLE SIMULATION (300k, 24%, 90 days) ---');
const irrBullet = calculateLoanIRR(300000, 24, 0, startDate.toISOString(), 90, 'BULLET');
console.log(`IRR Bullet (Expected ~26.8%): ${irrBullet ? (irrBullet * 100).toFixed(4) + '%' : 'null'}`);

const calculateReducingBalanceIRR = (
    principal: number,
    interestRate: number,
    durationDays: number
): number | null => {
    const cashFlows: CashFlow[] = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    cashFlows.push({ amount: -principal, date: startDate });

    const months = Math.max(1, Math.floor(durationDays / 30));
    // PMT Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const monthlyRate = (interestRate / 100) / 12;
    // Calculate EMI (Equated Monthly Installment)
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

    for (let i = 1; i <= months; i++) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (i * 30));
        cashFlows.push({ amount: emi, date: dueDate });
    }

    return calculateXIRR(cashFlows);
};

console.log('\n--- REDUCING BALANCE SIMULATION ---');
// Reducing balance should give ~24-26% IRR
const irrReducing = calculateReducingBalanceIRR(300000, 24, 90);
console.log(`IRR Reducing Balance: ${irrReducing ? (irrReducing * 100).toFixed(4) + '%' : 'null'}`);

