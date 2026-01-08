"use client";

import React from 'react';
import { useFund } from '@/context/FundContext';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CashFlowForecast } from '@/components/CashFlowForecast';

export default function RepaymentsPage() {
    const params = useParams();
    const { funds, loans } = useFund();

    const fundId = params.id as string;
    const fund = funds.find(f => f.id === fundId);
    const fundLoans = loans.filter(l => l.fundId === fundId);

    if (!fund) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-xl font-bold mb-4">Fund Not Found</h2>
                <Link href="/" className="text-blue-600 hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6">
                <Link
                    href={`/funds/${fundId}`}
                    className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Fund
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Cash Flow Forecast</h1>
                        <p className="text-gray-500 mt-1">{fund.name}</p>
                    </div>
                </div>
            </div>

            <CashFlowForecast fund={fund} loans={fundLoans} />
        </main>
    );
}
