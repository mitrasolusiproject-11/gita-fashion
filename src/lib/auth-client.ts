'use client'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export async function clientSignIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Important for cookies
    })

    const data = await response.json()

    if (response.ok) {
      // Store user in localStorage as backup
      localStorage.setItem('user', JSON.stringify(data.user))
      return { success: true, user: data.user }
    } else {
      return { success: false, error: data.error || 'Login failed' }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Network error' }
  }
}

export async function clientSignOut(): Promise<void> {
  try {
    await fetch('/api/auth/signout', { 
      method: 'POST',
      credentials: 'include'
    })
    localStorage.removeItem('user')
  } catch (error) {
    console.error('Signout error:', error)
  }
}

export async function getClientSession(): Promise<User | null> {
  try {
    // First try to get from server
    const response = await fetch('/api/auth/session', {
      credentials: 'include'
    })
    const data = await response.json()
    
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
      return data.user
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('user')
    if (stored) {
      return JSON.parse(stored)
    }
    
    return null
  } catch (error) {
    console.error('Session error:', error)
    
    // Fallback to localStorage
    const stored = localStorage.getItem('user')
    if (stored) {
      return JSON.parse(stored)
    }
    
    return null
  }
}