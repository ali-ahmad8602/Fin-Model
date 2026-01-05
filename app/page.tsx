"use client";

import React, { useState } from 'react';
import { useFund } from '@/context/FundContext';
import { FundCard } from '@/components/FundCard';
import { Plus, LogOut } from 'lucide-react';
import { Fund } from '@/types';
import { useSession, signOut } from 'next-auth/react';

export default function Dashboard() {
  const { funds, loans, addFund, loading } = useFund();
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newFundName, setNewFundName] = useState('');
  const [newFundAmount, setNewFundAmount] = useState('');
  const [newFundRate, setNewFundRate] = useState('14');

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    await addFund({
      name: newFundName,
      totalRaised: Number(newFundAmount),
      costOfCapitalRate: Number(newFundRate)
    });
    setIsModalOpen(false);
    setNewFundName('');
    setNewFundAmount('');
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20">
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Overview</h1>
          <p className="text-gray-500">Manage your funds, capital deployment, and risk.</p>
          {session?.user && (
            <p className="text-sm text-gray-400 mt-1">Welcome, {session.user.name}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Fund
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {funds.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No funds active. Start by creating a fund.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 font-medium hover:underline"
            >
              Create your first fund
            </button>
          </div>
        ) : (
          funds.map(fund => (
            <FundCard
              key={fund.id}
              fund={fund}
              loans={loans.filter(l => l.fundId === fund.id)}
            />
          ))
        )}
      </div>

      {/* Simple Modal for MVP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Fund</h2>
            <form onSubmit={handleCreateFund} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fund Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="e.g. Disrupt Fund IV"
                  value={newFundName}
                  onChange={e => setNewFundName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Raised Capital ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="1500000"
                  value={newFundAmount}
                  onChange={e => setNewFundAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost of Capital (% PA)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="14"
                  value={newFundRate}
                  onChange={e => setNewFundRate(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Create Fund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
