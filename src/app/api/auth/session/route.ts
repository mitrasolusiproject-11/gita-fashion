import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Simple response for now - client will handle auth via localStorage
    return NextResponse.json({ 
      user: null,
      message: 'Use client-side auth check' 
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}

export const runtime = 'nodejs'