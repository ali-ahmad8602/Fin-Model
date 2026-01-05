"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const { user, changePassword, logout } = useAuth();
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (newPw !== confirmPw) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            await changePassword(oldPw, newPw);
            setMessage({ type: 'success', text: 'Password updated successfully' });
            setOldPw('');
            setNewPw('');
            setConfirmPw('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update password' });
        }
    };

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
            </Link>

            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full border border-gray-200">
                            <User className="w-6 h-6 text-gray-700" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>

                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input
                                type="password" required
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                value={oldPw} onChange={e => setOldPw(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password" required
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                value={newPw} onChange={e => setNewPw(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input
                                type="password" required
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                            />
                        </div>

                        {message.text && (
                            <div className={`text-sm font-medium p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        >
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
