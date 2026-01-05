"use client";

import React, { useState } from 'react';
import { useFund } from '@/context/FundContext';
import { FundCard } from '@/components/FundCard';
import { LoanList } from '@/components/LoanList';
import { LoanBuilder } from '@/components/LoanBuilder'; // Ensure index export or direct
import { useParams, useRouter } from 'next/navigation'; // Correct hook for app directory
import { ArrowLeft, Plus, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function FundDetailsPage() {
    const params = useParams(); // params.id
    const router = useRouter();
    const { funds, loans, addLoan, updateLoanStatus, deleteLoan } = useFund();

    // ...



    const fundId = params.id as string;
    const fund = funds.find(f => f.id === fundId);
    const fundLoans = loans.filter(l => l.fundId === fundId);

    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CLOSED' | 'DEFAULTED'>('ACTIVE');
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

    if (!fund) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-xl font-bold mb-4">Fund Not Found</h2>
                <Link href="/" className="text-blue-600 hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    const handleSaveLoan = (loanData: any) => {
        addLoan(loanData);
        setIsLoanModalOpen(false);
    };

    const filteredLoans = fundLoans.filter(l => l.status === activeTab);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6">
                <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </Link>
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-gray-900">{fund.name}</h1>
                </div>
            </div>

            {/* Summary Card */}
            <div className="mb-10">
                <FundCard fund={fund} loans={fundLoans} />
            </div>

            {/* Loan Management Section */}
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                        {(['ACTIVE', 'CLOSED', 'DEFAULTED'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'DEFAULTED' ? 'NPL / Defaulted' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                                <span className="ml-2 bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                    {fundLoans.filter(l => l.status === tab).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={`/funds/${fundId}/repayments`}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50/50 rounded-lg hover:bg-blue-100 transition-colors shadow-sm text-sm font-medium"
                        >
                            <Calendar className="w-4 h-4" />
                            Repayments
                        </Link>
                        <button
                            onClick={() => setIsLoanModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Structure Deal
                        </button>
                    </div>
                </div>

                <LoanList
                    loans={filteredLoans}
                    onStatusChange={updateLoanStatus}
                    onDelete={deleteLoan}
                />
            </div>

            {/* Loan Builder Modal */}
            {isLoanModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
                        <LoanBuilder
                            fund={fund}
                            onSave={handleSaveLoan}
                            onCancel={() => setIsLoanModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </main>
    );
}
