// File: apps/web/middleware.ts

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define which routes are public (don't require sign-in)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  // Let's add the root homepage to be public for now to avoid redirects
  '/', 
]);

export default clerkMiddleware(async (auth, request) => {
  // We don't need to protect any routes for now.
  // The <SignedIn> and <SignedOut> components will handle the UI.
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: [ '/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};