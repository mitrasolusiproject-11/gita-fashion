import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { db } from '@/lib/db'
import { settings } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `logo-${timestamp}.${extension}`
    
    // Save file to public/uploads directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await writeFile(join(uploadsDir, '.gitkeep'), '')
    }
    
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    const logoUrl = `/uploads/${filename}`

    // Save logo URL to database settings
    try {
      // Check if logo setting exists
      const existingSetting = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'logoUrl'))
        .limit(1)

      if (existingSetting.length > 0) {
        // Update existing setting
        await db
          .update(settings)
          .set({ 
            value: logoUrl,
            updatedAt: new Date()
          })
          .where(eq(settings.key, 'logoUrl'))
      } else {
        // Insert new setting
        await db.insert(settings).values({
          key: 'logoUrl',
          value: logoUrl,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      // Clean up old logo files (optional)
      // You might want to implement this to avoid accumulating files
      
      return NextResponse.json({ 
        success: true, 
        logoUrl,
        message: 'Logo uploaded successfully' 
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database operation fails
      try {
        await unlink(filepath)
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError)
      }
      return NextResponse.json({ error: 'Failed to save logo setting' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get current logo URL from database
    const logoSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'logoUrl'))
      .limit(1)

    const logoUrl = logoSetting.length > 0 ? logoSetting[0].value : '/logo-gita-fashion.svg'

    return NextResponse.json({ logoUrl })
  } catch (error) {
    console.error('Error fetching logo:', error)
    return NextResponse.json({ error: 'Failed to fetch logo' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    // Reset logo to default
    const defaultLogoUrl = '/logo-gita-fashion.svg'

    // Update database setting
    const existingSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'logoUrl'))
      .limit(1)

    if (existingSetting.length > 0) {
      // Get old logo URL to potentially clean up file
      const oldLogoUrl = existingSetting[0].value
      
      // Update to default
      await db
        .update(settings)
        .set({ 
          value: defaultLogoUrl,
          updatedAt: new Date()
        })
        .where(eq(settings.key, 'logoUrl'))

      // Clean up old uploaded file (if it's not the default)
      if (oldLogoUrl && oldLogoUrl.startsWith('/uploads/')) {
        try {
          const oldFilepath = join(process.cwd(), 'public', oldLogoUrl)
          if (existsSync(oldFilepath)) {
            await unlink(oldFilepath)
          }
        } catch (unlinkError) {
          console.error('Error cleaning up old logo file:', unlinkError)
          // Don't fail the request if cleanup fails
        }
      }
    } else {
      // Insert default setting
      await db.insert(settings).values({
        key: 'logoUrl',
        value: defaultLogoUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return NextResponse.json({ 
      success: true, 
      logoUrl: defaultLogoUrl,
      message: 'Logo reset to default' 
    })

  } catch (error) {
    console.error('Error resetting logo:', error)
    return NextResponse.json({ error: 'Failed to reset logo' }, { status: 500 })
  }
}