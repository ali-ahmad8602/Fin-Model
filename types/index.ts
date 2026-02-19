export interface CostItem {
    id: string;
    name: string;
    percentage: number;
}

export type LoanStatus = 'ACTIVE' | 'CLOSED' | 'DEFAULTED';
export type RepaymentType = 'BULLET' | 'MONTHLY';

export interface Installment {
    id: string;
    dueDate: string;
    amount: number;
    principalComponent: number;
    interestComponent: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    paidDate?: string;       // ISO date — when payment was actually received
    lateFee?: number;        // Flat amount — user-entered late fee
}

export interface Loan {
    id: string;
    fundId: string;
    borrowerName: string;
    principal: number;
    interestRate: number; // % PA
    processingFeeRate?: number; // % of Principal
    startDate: string; // ISO Date
    durationDays: number; // Tenure in days
    status: LoanStatus;
    variableCosts: CostItem[];
    repaymentType: RepaymentType;
    installments: Installment[];
    defaultedAmount?: number; // Amount marked as NPL (Partial or Full)
    bulletPayment?: {
        paidDate: string;    // ISO date — when bullet repayment was received
        lateFee?: number;    // Flat amount — user-entered late fee
    };
}

export interface CapitalRaise {
    id: string;
    amount: number;
    date: string; // ISO Date
}

export interface Fund {
    id: string;
    userId: string;
    name: string;
    totalRaised: number;
    costOfCapitalRate: number; // % PA
    createdAt: string; // ISO Date
    capitalRaises?: CapitalRaise[];
}
