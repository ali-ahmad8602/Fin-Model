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
}

export interface Loan {
    id: string;
    fundId: string;
    borrowerName: string;
    principal: number;
    interestRate: number; // % PA
    startDate: string; // ISO Date
    durationDays: number; // Tenure in days
    status: LoanStatus;
    variableCosts: CostItem[];
    repaymentType: RepaymentType;
    installments: Installment[];
    defaultedAmount?: number; // Amount marked as NPL (Partial or Full)
}

export interface Fund {
    id: string;
    name: string;
    totalRaised: number;
    costOfCapitalRate: number; // % PA
}

export interface User {
    id: string;
    email: string;
    name: string;
    password?: string; // Optional in state, required in storage
    role: 'ADMIN' | 'VIEWER';
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    name: string;
}
