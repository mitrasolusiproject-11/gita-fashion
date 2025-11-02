import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { settings } from '@/lib/schema'

export async function GET(request: NextRequest) {
  try {
    const allSettings = await db.select().from(settings)
    
    // Convert to key-value object
    const settingsObj = allSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    // Default values if not set
    const defaultSettings = {
      storeName: 'Gita Fashion',
      storeAddress: 'Jl. Fashion Street No. 123, Jakarta',
      storePhone: '021-12345678',
      storeEmail: 'info@gitafashion.com',
      footerText: 'Terima kasih atas kunjungan Anda!'
    }

    return NextResponse.json({ ...defaultSettings, ...settingsObj })
  } catch (error) {
    console.error('Error fetching public settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'