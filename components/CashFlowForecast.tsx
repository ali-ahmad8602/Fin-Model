"use client";

import React from 'react';
import { Fund, Loan } from '@/types';
import { calculateCashFlowForecast } from '@/utils/cashflow';
import { calculateRealizedImYield } from '@/utils/analytics';
import { useCurrency } from '@/context/CurrencyContext';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface CashFlowForecastProps {
    fund: Fund;
    loans: Loan[];
}

export const CashFlowForecast: React.FC<CashFlowForecastProps> = ({ fund, loans }) => {
    const { formatC } = useCurrency();
    const [selectedTimeframe, setSelectedTimeframe] = React.useState<number | null>(null);
    const { projections, summary } = calculateCashFlowForecast(fund, loans, 12);

    const toggleTimeframe = (days: number) => {
        if (selectedTimeframe === days) {
            setSelectedTimeframe(null);
        } else {
            setSelectedTimeframe(days);
        }
    };

    // Filter out today's initial state for the table
    let futureProjections = projections.filter(p => p.expectedRepayments > 0);

    // Filter by timeframe if selected
    if (selectedTimeframe) {
        const today = new Date();
        const cutoffDate = new Date(today.getTime() + selectedTimeframe * 24 * 60 * 60 * 1000);
        futureProjections = futureProjections.filter(p => new Date(p.date) <= cutoffDate);
    }

    const timeframeCardClass = (days: number) => `
        cursor-pointer transition-all border-2 
        ${selectedTimeframe === days
            ? 'border-indigo-500 bg-indigo-50/30 scale-[1.02] shadow-sm'
            : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50/50'}
    `;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <button
                    onClick={() => toggleTimeframe(30)}
                    className={`text-left p-4 rounded-xl ${timeframeCardClass(30)}`}
                >
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Next 30 Days</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{formatC(summary.next30Days)}</p>
                    <p className="text-xs text-gray-500 mt-1">Expected Repayments</p>
                </button>

                <button
                    onClick={() => toggleTimeframe(60)}
                    className={`text-left p-4 rounded-xl ${timeframeCardClass(60)}`}
                >
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Next 60 Days</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{formatC(summary.next60Days)}</p>
                    <p className="text-xs text-gray-500 mt-1">Expected Repayments</p>
                </button>

                <button
                    onClick={() => toggleTimeframe(90)}
                    className={`text-left p-4 rounded-xl ${timeframeCardClass(90)}`}
                >
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Next 90 Days</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{formatC(summary.next90Days)}</p>
                    <p className="text-xs text-gray-500 mt-1">Expected Repayments</p>
                </button>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Peak Available</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{formatC(summary.peakAvailable)}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(summary.peakDate).toLocaleDateString()}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Realized IM Yield</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                        {formatC(calculateRealizedImYield(fund, loans))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Procured Till Date</p>
                </div>
            </div>

            {/* Repayment Schedule Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Repayment Schedule</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {selectedTimeframe
                                ? `Showing expected repayments for the next ${selectedTimeframe} days`
                                : 'All expected repayments from active loans'}
                        </p>
                    </div>
                    {selectedTimeframe && (
                        <button
                            onClick={() => setSelectedTimeframe(null)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>

                {futureProjections.length > 0 ? (
                    // ... existing table logic ...
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expected Repayments
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Borrower(s)
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Available After
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {futureProjections.map((projection, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(projection.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                                            {formatC(projection.expectedRepayments)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="space-y-1">
                                                {projection.events.map((event, eventIdx) => (
                                                    <div key={eventIdx} className="flex items-center gap-2">
                                                        <span>{event.borrowerName}</span>
                                                        {event.installmentNumber && (
                                                            <span className="text-xs text-gray-500">
                                                                ({event.installmentNumber}/{event.totalInstallments})
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400">
                                                            {formatC(event.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                            {formatC(projection.cumulativeAvailable)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No upcoming repayments scheduled</p>
                        <p className="text-xs text-gray-400 mt-1">All active loans have been repaid or defaulted</p>
                    </div>
                )}
            </div>
        </div>
    );
};
