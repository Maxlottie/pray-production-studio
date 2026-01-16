import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Auth temporarily disabled for demo purposes
// TODO: Re-enable auth by reverting this file
export function middleware(request: NextRequest) {
  // Allow all requests without authentication
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
