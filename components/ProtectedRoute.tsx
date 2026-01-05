"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Public routes
        const publicRoutes = ['/login', '/register'];
        if (publicRoutes.includes(pathname)) return;

        if (!isAuthenticated) {
            // Check storage first to avoid flash if possible (handled in Context hydration but async)
            // But Context hydration is inside detailed layout.
            // Simplified check:
            const stored = localStorage.getItem('currentUser');
            if (!stored) {
                router.push('/login');
            }
        }
    }, [isAuthenticated, pathname, router]);

    // If on public route, render
    if (['/login', '/register'].includes(pathname)) {
        return <>{children}</>;
    }

    // If authenticated (or optimistically waiting), render
    // Ideally we show loader if auth state is unknown, but since using generic check:
    return <>{children}</>;
};
