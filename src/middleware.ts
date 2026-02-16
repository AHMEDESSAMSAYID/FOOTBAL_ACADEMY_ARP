import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
]);

const isSignUpRoute = createRouteMatcher(['/sign-up(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // Allow sign-up only with invitation ticket, redirect all others to sign-in
  if (isSignUpRoute(request) && !request.nextUrl.searchParams.has('__clerk_ticket')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (!isPublicRoute(request) && !isSignUpRoute(request)) {
    await auth.protect();
  }

  // Pass pathname to server components via header
  const response = NextResponse.next();
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
