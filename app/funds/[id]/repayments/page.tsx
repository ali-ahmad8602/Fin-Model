"use client";

import React, { useMemo } from 'react';
import { useFund } from '@/context/FundContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/analytics';
import { calculateInterest, calculateVariableCosts } from '@/utils/finance';

// Helper to add days to a date
const addDays = (dateStr: string, days: number): Date => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date;
};

// Calculate Date Difference in Days
const getDaysDifference = (targetDate: Date, today: Date): number => {
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function RepaymentsPage() {
    const params = useParams();
    const { funds, loans } = useFund();
    const fundId = params.id as string;

    const fund = funds.find(f => f.id === fundId);
    const fundLoans = loans.filter(l => l.fundId === fundId && l.status === 'ACTIVE'); // Only Active loans have upcoming repayments

    const today = new Date(); // In a real app, might want to set this to 00:00:00

    // Process loans into repayment items
    const sortedRepayments = useMemo(() => {
        // Flatten all scheduled payments (Installments or Bullet)
        const scheduled = fundLoans.flatMap(loan => {
            if (loan.installments && loan.installments.length > 0) {
                return loan.installments
                    .filter(inst => inst.status === 'PENDING' || inst.status === 'OVERDUE') // Only show pending/overdue
                    .map(inst => {
                        const dueDate = new Date(inst.dueDate);
                        // Fix Date Parsing if ISO string
                        const daysDiff = getDaysDifference(dueDate, today);
                        return {
                            id: inst.id,
                            loanId: loan.id,
                            borrowerName: loan.borrowerName,
                            dueDate,
                            daysDiff,
                            totalDue: inst.amount,
                            principal: inst.principalComponent
                        };
                    });
            } else {
                // Fallback for Bullet Loans (Legacy or Simple Bullet)
                const dueDate = addDays(loan.startDate, loan.durationDays);
                const daysDiff = getDaysDifference(dueDate, today);

                // Calculate Total Repayment (Principal + Interest)
                const interest = calculateInterest(loan.principal, loan.interestRate, loan.durationDays);
                const totalDue = loan.principal + interest;

                return [{
                    id: loan.id, // Use Loan ID for single bullet
                    loanId: loan.id,
                    borrowerName: loan.borrowerName,
                    dueDate,
                    daysDiff,
                    totalDue,
                    principal: loan.principal
                }];
            }
        });

        // Split into Overdue and Upcoming
        const overdue = scheduled
            .filter(item => item.daysDiff < 0)
            .sort((a, b) => a.daysDiff - b.daysDiff); // Ascending (Most negative first)

        const upcoming = scheduled
            .filter(item => item.daysDiff >= 0)
            .sort((a, b) => a.daysDiff - b.daysDiff); // Ascending (Soonest first)

        return { overdue, upcoming };
    }, [fundLoans]);

    if (!fund) return <div>Fund not found</div>;

    return (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <Link href={`/funds/${fundId}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Fund
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Repayments Schedule</h1>
                <p className="text-gray-500">Upcoming and Overdue payments for <span className="font-semibold text-black">{fund.name}</span></p>
            </div>

            <div className="space-y-8">
                {/* OVERDUE SECTION */}
                {sortedRepayments.overdue.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden">
                        <div className="p-4 bg-red-100/50 border-b border-red-200 flex items-center gap-2 text-red-800">
                            <AlertCircle className="w-5 h-5" />
                            <h2 className="font-bold">Overdue Payments</h2>
                            <span className="bg-red-200 text-red-900 text-xs px-2 py-0.5 rounded-full font-bold ml-2">
                                {sortedRepayments.overdue.length} Alert{sortedRepayments.overdue.length > 1 && 's'}
                            </span>
                        </div>
                        <div className="divide-y divide-red-100">
                            {sortedRepayments.overdue.map(item => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-red-50/80">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.borrowerName}</h3>
                                        <p className="text-xs text-red-600 font-semibold mt-1">
                                            Due {item.dueDate.toLocaleDateString()} ({Math.abs(item.daysDiff)} days overdue)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{formatCurrency(item.totalDue)}</p>
                                        <p className="text-xs text-gray-500">Principal: {formatCurrency(item.principal)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* UPCOMING SECTION */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 text-gray-800">
                        <Calendar className="w-5 h-5" />
                        <h2 className="font-bold">Upcoming Payments</h2>
                    </div>
                    {sortedRepayments.upcoming.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-100" />
                            <p>No upcoming payments scheduled.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {sortedRepayments.upcoming.map(item => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 text-blue-700 font-bold text-xs h-10 w-10 flex flex-col items-center justify-center rounded-lg border border-blue-100">
                                            <span>{item.dueDate.getDate()}</span>
                                            <span className="text-[10px] uppercase">{item.dueDate.toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{item.borrowerName}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.daysDiff <= 7 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                                                {item.daysDiff === 0 ? 'Due Today' : `In ${item.daysDiff} days`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{formatCurrency(item.totalDue)}</p>
                                        <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                            Interest: {formatCurrency(item.totalDue - item.principal)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
