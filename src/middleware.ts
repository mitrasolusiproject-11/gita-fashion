import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'gita-fashion-secret-key-2024'

function verifyTokenFromCookie(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/login') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Check authentication for dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const session = verifyTokenFromCookie(token)
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Role-based access control
    const userRole = session.role

    // Admin-only routes
    if (pathname.startsWith('/dashboard/settings') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Admin and Manager only routes
    if (
      (pathname.startsWith('/dashboard/products') || 
       pathname.startsWith('/dashboard/customers')) && 
      !['ADMIN', 'MANAGER'].includes(userRole)
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

// Use Node.js runtime for middleware
export const runtime = 'nodejs'