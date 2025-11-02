import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, transactions, outgoingItems } from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq, gte, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch all products
    const allProducts = await db.select({
      id: products.id,
      name: products.name,
      barcode: products.barcode,
      currentStock: products.currentStock,
      sellPrice: products.sellPrice,
      categoryId: products.categoryId
    }).from(products)

    // Fetch today's transactions
    const todayTransactions = await db.select()
      .from(transactions)
      .where(
        and(
          gte(transactions.transactionDate, today),
          eq(transactions.paymentStatus, 'PAID')
        )
      )

    // Fetch recent transactions (last 10)
    const recentTransactions = await db.select()
      .from(transactions)
      .orderBy(transactions.createdAt)
      .limit(10)

    // Calculate statistics
    const totalProducts = allProducts.length
    const lowStockProducts = allProducts.filter(p => (p.currentStock || 0) <= 5)
    
    const todaySales = todayTransactions.reduce((sum, t) => 
      sum + (t.cashAmount || 0) + (t.transferAmount || 0), 0
    )
    
    const todayTransactionCount = todayTransactions.length
    
    const todayItems = todayTransactions.reduce((sum, t) => 
      sum + (t.totalItems || 0), 0
    )

    return NextResponse.json({
      totalProducts,
      todaySales,
      todayTransactions: todayTransactionCount,
      todayItems,
      lowStockCount: lowStockProducts.length,
      recentTransactions: recentTransactions.slice(0, 5),
      lowStockProducts: lowStockProducts.slice(0, 5)
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'