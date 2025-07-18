import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

const isAdminRoute = createRouteMatcher([
  "/zh-TW/admin/(.*)",
  "/en/admin/(.*)",
]);

const isJudgeRoute = createRouteMatcher([
  "/zh-TW/judge/(.*)",
  "/en/judge/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Handle locale routing
  const { pathname } = req.nextUrl;

  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = ["zh-TW", "en"].every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect to /zh-TW if locale is missing (except for auth routes)
  if (
    pathnameIsMissingLocale &&
    !pathname.startsWith("/sign-in") &&
    !pathname.startsWith("/sign-up")
  ) {
    return NextResponse.redirect(new URL(`/zh-TW${pathname}`, req.url));
  }

  // Handle authentication for protected routes
  if (isAdminRoute(req) || isJudgeRoute(req)) {
    await auth.protect();
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
