import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { barcode } = await params

    const [product] = await db.select({
      id: products.id,
      barcode: products.barcode,
      name: products.name,
      categoryId: products.categoryId,
      initialStock: products.initialStock,
      currentStock: products.currentStock,
      sellPrice: products.sellPrice,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      category: {
        id: categories.id,
        name: categories.name
      }
    }).from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.barcode, barcode))
      .limit(1)

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { barcode } = await params
    const body = await request.json()
    const { name, category, sellPrice } = body

    // Find category ID by name
    let categoryId = null
    if (category) {
      const [categoryRecord] = await db.select().from(categories).where(eq(categories.name, category)).limit(1)
      categoryId = categoryRecord?.id || null
    }

    // Update product
    const [updatedProduct] = await db.update(products)
      .set({
        name,
        categoryId,
        sellPrice,
        updatedAt: new Date()
      })
      .where(eq(products.barcode, barcode))
      .returning()

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get product with category and transform response
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
      category: {
        id: categories.id,
        name: categories.name
      }
    }).from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.barcode, barcode))

    // Transform response to match frontend expectations
    const transformedProduct = {
      id: productWithCategory.id,
      barcode: productWithCategory.barcode,
      name: productWithCategory.name,
      category: productWithCategory.category?.name || 'Uncategorized',
      initialStock: productWithCategory.initialStock,
      currentStock: productWithCategory.currentStock,
      sellPrice: productWithCategory.sellPrice,
      createdAt: productWithCategory.createdAt
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { barcode } = await params
    const body = await request.json()
    const { action, amount } = body

    if (action === 'updateStock') {
      // Get current product
      const [currentProduct] = await db.select()
        .from(products)
        .where(eq(products.barcode, barcode))
        .limit(1)

      if (!currentProduct) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // Update stock by adding the amount
      const newStock = currentProduct.currentStock + amount

      const [updatedProduct] = await db.update(products)
        .set({
          currentStock: newStock,
          updatedAt: new Date()
        })
        .where(eq(products.barcode, barcode))
        .returning()

      // Get product with category and transform response
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
        category: {
          id: categories.id,
          name: categories.name
        }
      }).from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.barcode, barcode))

      // Transform response to match frontend expectations
      const transformedProduct = {
        id: productWithCategory.id,
        barcode: productWithCategory.barcode,
        name: productWithCategory.name,
        category: productWithCategory.category?.name || 'Uncategorized',
        initialStock: productWithCategory.initialStock,
        currentStock: productWithCategory.currentStock,
        sellPrice: productWithCategory.sellPrice,
        createdAt: productWithCategory.createdAt
      }

      return NextResponse.json(transformedProduct)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { barcode } = await params

    const deletedProduct = await db.delete(products)
      .where(eq(products.barcode, barcode))
      .returning()

    if (deletedProduct.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'