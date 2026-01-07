import { Fund, Loan } from '@/types';
import { calculateAllocatedCostOfCapital, calculateVariableCosts, calculateInterest } from './finance';

export interface FundMetrics {
    totalRaised: number;
    deployedCapital: number;
    availableCapital: number;
    nplVolume: number;
    projectedIncome: number;
    totalExpenses: number; // Cost of Capital + Variable Costs
    netYield: number;
    nplRatio: number; // Percentage
    globalCost: {
        annual: number;
        monthly: number;
        weekly: number;
        daily: number;
    };
}

/**
 * Calculates aggregated metrics for a single fund based on its loans.
 */
export const calculateFundMetrics = (fund: Fund, loans: Loan[]): FundMetrics => {
    const fundLoans = loans.filter(l => l.fundId === fund.id);

    const deployedCapital = fundLoans
        .filter(l => l.status === 'ACTIVE' || l.status === 'DEFAULTED')
        .reduce((sum, loan) => sum + loan.principal, 0);

    const availableCapital = fund.totalRaised - deployedCapital;

    const nplLoans = fundLoans.filter(l => l.status === 'DEFAULTED');
    const nplVolume = nplLoans.reduce((sum, loan) => sum + loan.principal, 0);
    const nplRatio = fund.totalRaised > 0 ? (nplVolume / fund.totalRaised) * 100 : 0;

    // Global Cost Metrics (Annual Cost on Total Raised)
    const annualGlobalCost = fund.totalRaised * (fund.costOfCapitalRate / 100);
    const dailyGlobalCost = annualGlobalCost / 360; // 360-day basis
    const weeklyGlobalCost = dailyGlobalCost * 7;
    const monthlyGlobalCost = annualGlobalCost / 12;

    // Financials
    // For now, sticking to the request: "compare [Global Cost] with income".
    // I will return the metric and do the comparison in UI or here.

    // Financials
    let projectedIncome = 0;
    let totalAllocatedExpenses = 0;

    fundLoans.forEach(loan => {
        const days = loan.durationDays;
        const defaultedAmount = loan.defaultedAmount || 0;
        const activePrincipal = loan.principal - defaultedAmount; // Principal generating income

        // 1. Calculate Allocated Cost & Variable Cost on the *Original* Principal 
        // (assuming we raised the full amount initially and paid costs on it)
        const allocatedCost = calculateAllocatedCostOfCapital(loan.principal, fund.costOfCapitalRate, days);
        const variableCost = calculateVariableCosts(loan.principal, loan.variableCosts);

        // 2. Calculate Projected Income on *Active* Principal only
        // If defaultedAmount == principal (Full Default), activePrincipal is 0, so Interest is 0.
        const interestIncome = calculateInterest(activePrincipal, loan.interestRate, days);
        const processingFee = (loan.processingFeeRate && loan.status !== 'DEFAULTED') ? (loan.principal * (loan.processingFeeRate / 100)) : 0;

        // 3. Expense Logic
        // Base Expenses: Allocated Cost + Variable Costs
        let loanExpenses = allocatedCost + variableCost;

        // Add NPL Expense (The defaulted amount itself is a loss/expense)
        // Plus, we might consider the 'Lost Interest' as an opportunity cost, but for "Net Yield" (Cash basis), 
        // we simply don't get the income, and we lose the capital.
        loanExpenses += defaultedAmount;

        projectedIncome += interestIncome + processingFee;
        totalAllocatedExpenses += loanExpenses;
    });

    // Net Yield for the CARD (Deal Basis)
    const netYield = projectedIncome - totalAllocatedExpenses;

    return {
        totalRaised: fund.totalRaised,
        deployedCapital,
        availableCapital,
        nplVolume,
        projectedIncome,
        totalExpenses: totalAllocatedExpenses,
        netYield,
        nplRatio,
        globalCost: {
            annual: annualGlobalCost,
            monthly: monthlyGlobalCost,
            weekly: weeklyGlobalCost,
            daily: dailyGlobalCost
        }
    };
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const formatPercentage = (rate: number) => {
    return `${rate.toFixed(2)}%`;
};
