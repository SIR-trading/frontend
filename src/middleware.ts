import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const country = request.geo?.country; // Access the user's country code
  const requestHeaders = new Headers(request.headers);

  // Define allowed countries
  const blockedCountries = ["US", "CA", "RU", "KP", "IR", "CU", "SY"]; // Example: Allow US, Canada, and UK
  requestHeaders.set("x-url", request.url);
  requestHeaders.set("x-country", country ?? "unknown");

  if (country && blockedCountries.includes(country)) {
    // If the country is not in the allowed list, redirect to a blocked page
    return NextResponse.redirect(new URL("/blocked", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
