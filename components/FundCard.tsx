"use client";

import React from 'react';
import { Fund, Loan } from '@/types';
import { calculateFundMetrics, formatCurrency, formatPercentage } from '@/utils/analytics';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, DollarSign, Wallet } from 'lucide-react';
import Link from 'next/link';

interface FundCardProps {
    fund: Fund;
    loans: Loan[];
}

export const FundCard: React.FC<FundCardProps> = ({ fund, loans }) => {
    const metrics = calculateFundMetrics(fund, loans);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{fund.name}</h3>
                    <p className="text-sm text-gray-500">Cost of Capital: <span className="font-medium text-amber-600">{fund.costOfCapitalRate}% PA</span></p>
                </div>
                <Link
                    href={`/funds/${fund.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    View Details <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-gray-100">
                {/* Capital Column */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wider">Capital</span>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Raised</p>
                        <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.totalRaised)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Deployed</p>
                            <p className="text-sm font-medium text-emerald-600">{formatCurrency(metrics.deployedCapital)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Available</p>
                            <p className="text-sm font-medium text-blue-600">{formatCurrency(metrics.availableCapital)}</p>
                        </div>
                    </div>
                </div>

                {/* Financials Column */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wider">Projected Returns</span>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Net Yield</p>
                        <div className="flex items-baseline gap-2">
                            <p className={`text-lg font-semibold ${metrics.netYield >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(metrics.netYield)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Income</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(metrics.projectedIncome)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Expenses</p>
                            <p className="text-sm font-medium text-red-500">{formatCurrency(metrics.totalExpenses)}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500 font-medium">Global Cost ({fund.costOfCapitalRate}%)</p>
                                <p className="text-xs font-bold text-amber-600">{formatCurrency(metrics.globalCost.annual)}/yr</p>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-400">
                                <div>
                                    <span className="block">Daily</span>
                                    <span className="font-medium text-gray-600">{formatCurrency(metrics.globalCost.daily)}</span>
                                </div>
                                <div>
                                    <span className="block">Weekly</span>
                                    <span className="font-medium text-gray-600">{formatCurrency(metrics.globalCost.weekly)}</span>
                                </div>
                                <div>
                                    <span className="block">Monthly</span>
                                    <span className="font-medium text-gray-600">{formatCurrency(metrics.globalCost.monthly)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Column */}
                <div className="p-6 space-y-4 bg-gray-50/30">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wider">Risk (NPL)</span>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">NPL Volume</p>
                        <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.nplVolume)}</p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">Ratio</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500"
                                    style={{ width: `${Math.min(metrics.nplRatio, 100)}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium text-gray-700">{formatPercentage(metrics.nplRatio)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
