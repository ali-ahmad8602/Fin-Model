"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@/types';
import { useRouter } from 'next/navigation';
import { loginAction, registerAction, changePasswordAction } from '@/app/actions/auth';

interface AuthContextType {
    user: User | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => void;
    changePassword: (oldPw: string, newPw: string) => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Hydrate from validation if needed, but for now strict persistence requires server session or cookie.
        // We will stick to basic "Session in Client State + LocalStorage Backup" for 'Remember Me' user experience,
        // but authentication is performed against Server Action.
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const user = await loginAction(credentials);
        setUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        router.push('/');
    };

    const register = async (credentials: RegisterCredentials) => {
        const user = await registerAction(credentials);
        setUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
        router.push('/login');
    };

    const changePassword = async (oldPw: string, newPw: string) => {
        if (!user) throw new Error('Not authenticated');
        await changePasswordAction(user.id, oldPw, newPw);

        // Update local state if needed
        const updatedUser = { ...user, password: newPw };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, changePassword, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
