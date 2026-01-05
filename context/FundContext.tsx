"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Fund, Loan, LoanStatus } from '@/types';
import { getFundsAction, addFundAction } from '@/app/actions/funds';
import { getLoansAction, addLoanAction, updateLoanStatusAction, deleteLoanAction } from '@/app/actions/loans';

interface FundContextType {
    funds: Fund[];
    loans: Loan[];
    addFund: (fund: Omit<Fund, 'id'>) => Promise<void>;
    addLoan: (loan: Omit<Loan, 'id'>) => Promise<void>;
    updateLoanStatus: (loanId: string, status: LoanStatus, defaultedAmount?: number) => Promise<void>;
    getFundLoans: (fundId: string) => Loan[];
    deleteLoan: (loanId: string) => Promise<void>;
}

const FundContext = createContext<FundContextType | undefined>(undefined);

export const FundProvider = ({ children }: { children: ReactNode }) => {
    const [funds, setFunds] = useState<Fund[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);

    const refreshData = async () => {
        const [f, l] = await Promise.all([getFundsAction(), getLoansAction()]);
        setFunds(f);
        setLoans(l);
    };

    // Initial Load
    useEffect(() => {
        refreshData();
    }, []);

    const addFund = async (fundData: Omit<Fund, 'id'>) => {
        const newFund = await addFundAction(fundData);
        setFunds(prev => [newFund, ...prev]);
    };

    const addLoan = async (loanData: Omit<Loan, 'id'>) => {
        const newLoan = await addLoanAction(loanData);
        setLoans(prev => [newLoan, ...prev]);
    };

    const updateLoanStatus = async (loanId: string, status: LoanStatus, defaultedAmount?: number) => {
        await updateLoanStatusAction(loanId, status, defaultedAmount);
        setLoans(prev => prev.map(loan =>
            loan.id === loanId ? { ...loan, status, defaultedAmount: defaultedAmount || 0 } : loan
        ));
    };

    const deleteLoan = async (loanId: string) => {
        await deleteLoanAction(loanId);
        setLoans(prev => prev.filter(l => l.id !== loanId));
    };

    const getFundLoans = (fundId: string) => loans.filter(l => l.fundId === fundId);

    return (
        <FundContext.Provider value={{ funds, loans, addFund, addLoan, updateLoanStatus, getFundLoans, deleteLoan }}>
            {children}
        </FundContext.Provider>
    );
};

export const useFund = () => {
    const context = useContext(FundContext);
    if (!context) throw new Error('useFund must be used within a FundProvider');
    return context;
};
