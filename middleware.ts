import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    '/share(.*)',
    '/api/public(.*)',
    // Public APK download for field employees to install the mobile app.
    '/downloads(.*)',
    // Field-employee mobile app: authenticates via its own device bearer token, not a Clerk session.
    '/api/mobile(.*)',
    // Scheduled cleanup jobs invoked by Vercel Cron (no Clerk session); guarded by CRON_SECRET.
    '/api/cron(.*)',
    // Pretty public-viewer URLs for shared documents, e.g. /quotation/dura-exports-css-jun-2026-261-a8f3k9b2.
    // Must exclude the "create" and list pages of each section, which stay behind auth.
    /^\/quotation\/(?!create\b)[^/]+\/?$/,
    /^\/proforma\/(?!create\b)[^/]+\/?$/,
    /^\/estimate\/(?!create\b)[^/]+\/?$/,
]);

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect();
    }
}, { clockSkewInMs: 60000 });

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
