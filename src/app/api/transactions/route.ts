import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transactions, outgoingItems, products } from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allTransactions = await db.select({
      id: transactions.id,
      code: transactions.code,
      transactionDate: transactions.transactionDate,
      totalItems: transactions.totalItems,
      cashAmount: transactions.cashAmount,
      transferAmount: transactions.transferAmount,
      bankName: transactions.bankName,
      paymentStatus: transactions.paymentStatus,
      userId: transactions.userId,
      createdAt: transactions.createdAt
    }).from(transactions).orderBy(desc(transactions.createdAt))

    return NextResponse.json(allTransactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
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
    const { items, paymentMethod, cashAmount, transferAmount, bankName } = body

    // Generate transaction code
    const transactionCode = `TRX${Date.now()}`
    
    // Calculate total items
    const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0)

    // Create transaction
    const [newTransaction] = await db.insert(transactions).values({
      code: transactionCode,
      totalItems,
      cashAmount: cashAmount || 0,
      transferAmount: transferAmount || 0,
      bankName: bankName || null,
      paymentStatus: 'PAID',
      userId: session.id
    }).returning()

    // Create outgoing items
    for (const item of items) {
      // Get product name if not provided
      let productName = item.name
      if (!productName) {
        const [product] = await db.select().from(products).where(eq(products.barcode, item.barcode)).limit(1)
        productName = product?.name || 'Unknown Product'
      }

      await db.insert(outgoingItems).values({
        barcode: item.barcode,
        productName: productName,
        quantity: item.quantity,
        transactionCode: transactionCode,
        price: item.price,
        discountPercent: item.discountPercent || 0,
        discountAmount: item.discountAmount || item.discount || 0
      })

      // Update product stock
      const [product] = await db.select().from(products).where(eq(products.barcode, item.barcode)).limit(1)
      if (product) {
        await db.update(products)
          .set({ currentStock: product.currentStock - item.quantity })
          .where(eq(products.barcode, item.barcode))
      }
    }

    return NextResponse.json({ 
      success: true, 
      id: newTransaction.id,
      code: transactionCode,
      transactionCode,
      transaction: newTransaction 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'