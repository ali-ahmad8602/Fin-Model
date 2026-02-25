"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Currency = 'USD' | 'AED';
const AED_RATE = 3.67;
const STORAGE_KEY = 'display-currency';

interface CurrencyContextType {
    currency: Currency;
    toggleCurrency: () => void;
    /** Format an amount (stored in USD) for display in the active currency */
    formatC: (amount: number) => string;
    /** Convert a user-entered amount in the active currency back to USD for storage */
    toUSD: (amount: number) => number;
    /** The symbol/prefix for the active currency */
    symbol: string;
    rate: number;
}

const CurrencyContext = createContext<CurrencyContextType>({
    currency: 'USD',
    toggleCurrency: () => { },
    formatC: (n) => `$${n.toFixed(2)}`,
    toUSD: (n) => n,
    symbol: '$',
    rate: 1,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrency] = useState<Currency>('USD');
    const [mounted, setMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'AED' || saved === 'USD') {
            setCurrency(saved);
        }
        setMounted(true);
    }, []);

    const toggleCurrency = useCallback(() => {
        setCurrency(prev => {
            const next = prev === 'USD' ? 'AED' : 'USD';
            localStorage.setItem(STORAGE_KEY, next);
            return next;
        });
    }, []);

    const formatC = useCallback((amount: number) => {
        if (currency === 'AED') {
            const converted = amount * AED_RATE;
            return `AED ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted)}`;
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }, [currency]);

    const toUSD = useCallback((amount: number) => {
        return currency === 'AED' ? amount / AED_RATE : amount;
    }, [currency]);

    const symbol = currency === 'AED' ? 'AED' : '$';
    const rate = currency === 'AED' ? AED_RATE : 1;

    // Prevent hydration mismatch — render USD until mounted
    if (!mounted) {
        return (
            <CurrencyContext.Provider value={{
                currency: 'USD',
                toggleCurrency: () => { },
                formatC: (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n),
                toUSD: (n) => n,
                symbol: '$',
                rate: 1,
            }}>
                {children}
            </CurrencyContext.Provider>
        );
    }

    return (
        <CurrencyContext.Provider value={{ currency, toggleCurrency, formatC, toUSD, symbol, rate }}>
            {children}
        </CurrencyContext.Provider>
    );
};
