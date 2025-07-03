import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const country = request.geo?.country; // Access the user's country code

  console.log(request); // Log the geo information for debugging

  console.log(`User's country code: ${country}`);

  // Define allowed countries
  const allowedCountries = ["US", "CA", "GB"]; // Example: Allow US, Canada, and UK

  if (country && !allowedCountries.includes(country)) {
    // If the country is not in the allowed list, redirect to a blocked page
    return NextResponse.redirect(new URL("/blocked", request.url));
  }

  return NextResponse.next();
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
