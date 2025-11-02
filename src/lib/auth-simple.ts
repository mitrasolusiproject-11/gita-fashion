import { cookies } from 'next/headers'
import { db } from './db'
import { users } from './schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'gita-fashion-secret-key-2024'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!user) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return null
  }
}

export function createToken(user: User): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): User | null {
  try {
    return jwt.verify(token, JWT_SECRET) as User
  } catch (error) {
    return null
  }
}

export async function getSession(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | undefined

    if (request) {
      // For API routes with request object
      token = request.cookies.get('auth-token')?.value
    } else {
      // For server components - simplified approach
      try {
        const cookieStore = await cookies()
        token = cookieStore.get('auth-token')?.value
      } catch (cookieError) {
        // Fallback - return null if cookies not available
        return null
      }
    }

    if (!token) {
      return null
    }

    return verifyToken(token)
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}