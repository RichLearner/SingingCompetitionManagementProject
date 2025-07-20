import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/zh-TW",
  "/en",
  "/zh-TW/voting/(.*)",
  "/en/voting/(.*)",
  "/zh-TW/scoreboard",
  "/en/scoreboard",
  "/zh-TW/unauthorized",
  "/en/unauthorized",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/zh-TW/sign-in(.*)",
  "/en/sign-in(.*)",
  "/zh-TW/sign-up(.*)",
  "/en/sign-up(.*)",
]);

// Define admin routes that require authentication
const isAdminRoute = createRouteMatcher([
  "/zh-TW/admin/(.*)",
  "/en/admin/(.*)",
]);

// Define judge routes that require authentication
const isJudgeRoute = createRouteMatcher([
  "/zh-TW/judge/(.*)",
  "/en/judge/(.*)",
]);

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ["zh-TW", "en"],
  defaultLocale: "zh-TW",
  localePrefix: "always",
});

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Handle authentication for protected routes
  if (isAdminRoute(req) || isJudgeRoute(req)) {
    await auth.protect();
  }

  // Skip internationalization for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Apply next-intl middleware for locale handling
  const intlResponse = intlMiddleware(req);

  // If intl middleware returned a response (redirect), use that
  if (intlResponse) {
    return intlResponse;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
