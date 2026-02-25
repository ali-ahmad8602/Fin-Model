"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Key, ChevronDown, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserRecord {
    _id: string;
    name: string;
    email: string;
    role: string;
    status?: string;
}

const ROLE_OPTIONS = [
    { value: 'fund_manager', label: 'Fund Manager' },
    { value: 'cro', label: 'CRO' },
    { value: 'viewer', label: 'Viewer (Read-Only)' },
];

const ROLE_COLORS: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800',
    cro: 'bg-blue-100 text-blue-800',
    fund_manager: 'bg-gray-100 text-gray-700',
    viewer: 'bg-amber-100 text-amber-800',
};

export default function AdminPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Password reset modal
    const [resetTarget, setResetTarget] = useState<UserRecord | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    // Role change
    const [changingRole, setChangingRole] = useState<string | null>(null);

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            if (session?.user?.role !== 'super_admin') {
                router.push('/');
                return;
            }
            fetchUsers();
        }
    }, [sessionStatus]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleResetPassword = async () => {
        if (!resetTarget || !newPassword) return;
        setResetting(true);
        try {
            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: resetTarget._id, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                showMessage('success', `Password reset for ${resetTarget.name}`);
                setResetTarget(null);
                setNewPassword('');
            } else {
                showMessage('error', data.error || 'Failed to reset password');
            }
        } catch {
            showMessage('error', 'An error occurred');
        } finally {
            setResetting(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setChangingRole(userId);
        try {
            const res = await fetch('/api/users/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole, status: 'active' }),
            });
            if (res.ok) {
                showMessage('success', 'Role updated');
                fetchUsers();
            } else {
                showMessage('error', 'Failed to update role');
            }
        } catch {
            showMessage('error', 'An error occurred');
        } finally {
            setChangingRole(null);
        }
    };

    const handleToggleStatus = async (user: UserRecord) => {
        const newStatus = user.status === 'active' ? 'rejected' : 'active';
        try {
            const res = await fetch('/api/users/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, role: user.role, status: newStatus }),
            });
            if (res.ok) {
                showMessage('success', newStatus === 'active' ? `${user.name} activated` : `${user.name} deactivated`);
                fetchUsers();
            }
        } catch {
            showMessage('error', 'An error occurred');
        }
    };

    if (sessionStatus === 'loading' || loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-10">
                <p className="text-gray-500 text-center py-20">Loading...</p>
            </div>
        );
    }

    if (session?.user?.role !== 'super_admin') return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                        <p className="text-sm text-gray-500">Manage users, roles, and passwords</p>
                    </div>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Dashboard
                </Link>
            </div>

            {/* Toast Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <h2 className="font-semibold text-gray-900">All Users ({users.length})</h2>
                </div>

                {users.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No users found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                                    <th className="px-5 py-3 font-medium">User</th>
                                    <th className="px-5 py-3 font-medium">Role</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        {/* User Info */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                                                    {user.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="px-5 py-4">
                                            {user.role === 'super_admin' ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS.super_admin}`}>
                                                    Super Admin
                                                </span>
                                            ) : (
                                                <div className="relative inline-block">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                        disabled={changingRole === user._id}
                                                        className="appearance-none bg-transparent border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                                                    >
                                                        {ROLE_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                                </div>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                                user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {user.status || 'unknown'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {user.role !== 'super_admin' && (
                                                    <>
                                                        <button
                                                            onClick={() => { setResetTarget(user); setNewPassword(''); }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                                        >
                                                            <Key className="w-3.5 h-3.5" />
                                                            Reset Password
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(user)}
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${user.status === 'active'
                                                                ? 'text-red-700 bg-red-50 hover:bg-red-100'
                                                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                                                }`}
                                                        >
                                                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Password Reset Modal */}
            {resetTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-2 mb-4">
                            <Key className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Setting a new password for <strong>{resetTarget.name}</strong> ({resetTarget.email})
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                placeholder="Enter new password (min 6 chars)"
                                minLength={6}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setResetTarget(null); setNewPassword(''); }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={resetting || newPassword.length < 6}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {resetting ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
