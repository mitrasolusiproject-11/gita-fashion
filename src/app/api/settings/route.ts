import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { settings } from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      currency: 'IDR',
      taxRate: '10',
      printerName: 'Thermal Printer 80mm',
      paperSize: '80mm',
      printLogo: 'true',
      printFooter: 'true',
      footerText: 'Terima kasih atas kunjungan Anda!'
    }

    return NextResponse.json({ ...defaultSettings, ...settingsObj })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Update or insert each setting
    for (const [key, value] of Object.entries(body)) {
      const [existingSetting] = await db.select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1)

      if (existingSetting) {
        await db.update(settings)
          .set({ 
            value: String(value),
            updatedAt: new Date()
          })
          .where(eq(settings.key, key))
      } else {
        await db.insert(settings).values({
          key,
          value: String(value)
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'