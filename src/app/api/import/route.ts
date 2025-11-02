import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth-simple'
import { products, categories } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!type || !['products', 'categories'].includes(type)) {
      return NextResponse.json({ error: 'Invalid import type' }, { status: 400 })
    }

    const text = await file.text()
    
    // Handle different line endings and filter empty lines
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'File must contain header and at least one data row' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const dataLines = lines.slice(1)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    if (type === 'products') {
      // Expected headers: Barcode, Nama Produk, Kategori (or Kategori ID), Harga Jual, Stok Awal
      const requiredHeaders = ['Barcode', 'Nama Produk', 'Harga Jual', 'Stok Awal']
      const categoryHeader = headers.find(h => h.toLowerCase().includes('kategori'))
      
      if (!categoryHeader) {
        requiredHeaders.push('Kategori')
      }
      
      const missingHeaders = requiredHeaders.filter(h => !headers.some(header => header.toLowerCase().includes(h.toLowerCase())))
      
      if (missingHeaders.length > 0) {
        return NextResponse.json({ 
          error: `Missing required headers: ${missingHeaders.join(', ')}` 
        }, { status: 400 })
      }

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          
          if (values.length < 5) {
            errors.push(`Row ${i + 2}: Insufficient data (got ${values.length} columns, expected 5)`)
            errorCount++
            continue
          }

          const [barcode, name, categoryValue, sellPriceStr, initialStockStr] = values
          
          if (!barcode || !name || !categoryValue || !sellPriceStr || !initialStockStr) {
            errors.push(`Row ${i + 2}: Missing required fields`)
            errorCount++
            continue
          }

          const sellPrice = parseFloat(sellPriceStr)
          const initialStock = parseInt(initialStockStr)

          if (isNaN(sellPrice) || isNaN(initialStock)) {
            errors.push(`Row ${i + 2}: Invalid price or stock value`)
            errorCount++
            continue
          }

          // Find category by ID or name
          let existingCategory
          
          // First try to find by ID (UUID format)
          if (categoryValue.includes('-') && categoryValue.length > 30) {
            [existingCategory] = await db.select().from(categories).where(eq(categories.id, categoryValue)).limit(1)
          }
          
          // If not found by ID, try to find by name
          if (!existingCategory) {
            [existingCategory] = await db.select().from(categories).where(eq(categories.name, categoryValue)).limit(1)
          }
          
          if (!existingCategory) {
            errors.push(`Row ${i + 2}: Category '${categoryValue}' not found`)
            errorCount++
            continue
          }
          
          const categoryId = existingCategory.id

          // Check if product already exists
          const [existingProduct] = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1)
          
          if (existingProduct) {
            // Update existing product
            await db.update(products)
              .set({
                name,
                categoryId,
                sellPrice,
                initialStock,
                currentStock: initialStock,
                updatedAt: new Date()
              })
              .where(eq(products.barcode, barcode))
          } else {
            // Insert new product
            await db.insert(products).values({
              barcode,
              name,
              categoryId,
              sellPrice,
              initialStock,
              currentStock: initialStock
            })
          }

          successCount++
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error)
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          errorCount++
        }
      }
    } else if (type === 'categories') {
      // Expected headers: ID, Nama Kategori
      const requiredHeaders = ['ID', 'Nama Kategori']
      const missingHeaders = requiredHeaders.filter(h => !headers.some(header => header.toLowerCase().includes(h.toLowerCase())))
      
      if (missingHeaders.length > 0) {
        return NextResponse.json({ 
          error: `Missing required headers: ${missingHeaders.join(', ')}` 
        }, { status: 400 })
      }

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          
          if (values.length < 2) {
            errors.push(`Row ${i + 2}: Insufficient data`)
            errorCount++
            continue
          }

          const [id, name] = values
          
          if (!id || !name) {
            errors.push(`Row ${i + 2}: Missing required fields`)
            errorCount++
            continue
          }

          // Check if category already exists
          const [existingCategory] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
          
          if (existingCategory) {
            // Update existing category
            await db.update(categories)
              .set({
                name,
                updatedAt: new Date()
              })
              .where(eq(categories.id, id))
          } else {
            // Insert new category
            await db.insert(categories).values({
              id,
              name
            })
          }

          successCount++
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error)
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          errorCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${successCount} successful, ${errorCount} errors`,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Limit to first 10 errors
    })

  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'