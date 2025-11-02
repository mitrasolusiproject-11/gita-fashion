import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq, like, or, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const categoryName = searchParams.get('category')

    // Build query with filters
    let result
    
    if (search && categoryName) {
      // Both search and category filter
      result = await db.select({
        id: products.id,
        barcode: products.barcode,
        name: products.name,
        categoryId: products.categoryId,
        initialStock: products.initialStock,
        currentStock: products.currentStock,
        sellPrice: products.sellPrice,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name
      }).from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(
          or(
            like(products.name, `%${search}%`),
            like(products.barcode, `%${search}%`)
          ),
          eq(categories.name, categoryName)
        ))
    } else if (search) {
      // Only search filter
      result = await db.select({
        id: products.id,
        barcode: products.barcode,
        name: products.name,
        categoryId: products.categoryId,
        initialStock: products.initialStock,
        currentStock: products.currentStock,
        sellPrice: products.sellPrice,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name
      }).from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(or(
          like(products.name, `%${search}%`),
          like(products.barcode, `%${search}%`)
        ))
    } else if (categoryName) {
      // Only category filter
      result = await db.select({
        id: products.id,
        barcode: products.barcode,
        name: products.name,
        categoryId: products.categoryId,
        initialStock: products.initialStock,
        currentStock: products.currentStock,
        sellPrice: products.sellPrice,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name
      }).from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(categories.name, categoryName))
    } else {
      // No filters
      result = await db.select({
        id: products.id,
        barcode: products.barcode,
        name: products.name,
        categoryId: products.categoryId,
        initialStock: products.initialStock,
        currentStock: products.currentStock,
        sellPrice: products.sellPrice,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        categoryName: categories.name
      }).from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
    }

    // Transform the data to match frontend expectations
    const transformedResult = result.map(item => ({
      id: item.id,
      barcode: item.barcode,
      name: item.name,
      categoryId: item.categoryId,
      category: item.categoryName || 'Uncategorized',
      initialStock: item.initialStock,
      currentStock: item.currentStock,
      sellPrice: item.sellPrice,
      createdAt: item.createdAt
    }))

    return NextResponse.json(transformedResult)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { barcode, name, category, initialStock, sellPrice } = body

    // Find category ID by name
    let categoryId: string | null = null
    if (category) {
      const [categoryRecord] = await db.select().from(categories).where(eq(categories.name, category)).limit(1)
      categoryId = categoryRecord?.id || null
    }

    // Generate barcode if not provided
    const finalBarcode = barcode || `GF${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    // Insert product
    const insertData: any = {
      barcode: finalBarcode,
      name,
      initialStock,
      currentStock: initialStock,
      sellPrice
    }

    if (categoryId) {
      insertData.categoryId = categoryId
    }

    const [newProduct] = await db.insert(products).values(insertData).returning()

    // Get product with category for response
    const [productWithCategory] = await db.select({
      id: products.id,
      barcode: products.barcode,
      name: products.name,
      categoryId: products.categoryId,
      initialStock: products.initialStock,
      currentStock: products.currentStock,
      sellPrice: products.sellPrice,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      categoryName: categories.name
    }).from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, newProduct.id))

    // Transform the response to match frontend expectations
    const transformedProduct = {
      id: productWithCategory.id,
      barcode: productWithCategory.barcode,
      name: productWithCategory.name,
      categoryId: productWithCategory.categoryId,
      category: productWithCategory.categoryName || 'Uncategorized',
      initialStock: productWithCategory.initialStock,
      currentStock: productWithCategory.currentStock,
      sellPrice: productWithCategory.sellPrice,
      createdAt: productWithCategory.createdAt
    }

    return NextResponse.json(transformedProduct, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'