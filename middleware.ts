import { auth } from './auth';

export const runtime = 'nodejs';

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // Public routes
    const isPublicRoute = pathname === '/login' || pathname === '/signup';

    // Redirect logged-in users away from auth pages
    if (isLoggedIn && isPublicRoute) {
        return Response.redirect(new URL('/', req.url));
    }

    // Redirect non-logged-in users to login
    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL('/login', req.url));
    }
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
