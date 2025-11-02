'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getClientSession, clientSignOut } from '@/lib/auth-client'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshSession: () => {}
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
    
    // Listen for storage events (when login happens in another tab)
    const handleStorageChange = () => {
      checkSession()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check session when window gets focus
    window.addEventListener('focus', checkSession)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', checkSession)
    }
  }, [])

  const checkSession = async () => {
    try {
      const user = await getClientSession()
      setUser(user)
    } catch (error) {
      console.error('Session check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await clientSignOut()
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const refreshSession = () => {
    checkSession()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}