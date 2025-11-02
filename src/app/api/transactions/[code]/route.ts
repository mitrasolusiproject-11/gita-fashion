import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transactions, outgoingItems, users, products } from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params

    console.log('Looking for transaction with code:', code)

    // Get transaction with user info
    const [transaction] = await db.select({
      id: transactions.id,
      code: transactions.code,
      transactionDate: transactions.transactionDate,
      totalItems: transactions.totalItems,
      cashAmount: transactions.cashAmount,
      transferAmount: transactions.transferAmount,
      paymentStatus: transactions.paymentStatus,
      userId: transactions.userId,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      }
    }).from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.code, code))
      .limit(1)

    console.log('Found transaction:', transaction)

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Get transaction items with product details
    const items = await db.select({
      id: outgoingItems.id,
      transactionCode: outgoingItems.transactionCode,
      productBarcode: outgoingItems.barcode,
      productName: outgoingItems.productName,
      quantity: outgoingItems.quantity,
      price: outgoingItems.price,
      discountPercent: outgoingItems.discountPercent,
      discountAmount: outgoingItems.discountAmount,
      createdAt: outgoingItems.createdAt,
      product: {
        id: products.id,
        barcode: products.barcode,
        name: products.name,
        sellPrice: products.sellPrice
      }
    }).from(outgoingItems)
      .leftJoin(products, eq(outgoingItems.barcode, products.barcode))
      .where(eq(outgoingItems.transactionCode, code))

    console.log('Found items:', items)

    // Calculate totals
    const totalAmount = transaction.cashAmount + transaction.transferAmount
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalDiscount = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0)

    const response = {
      id: transaction.id,
      code: transaction.code,
      transactionDate: transaction.transactionDate,
      totalItems: transaction.totalItems,
      cashAmount: transaction.cashAmount,
      transferAmount: transaction.transferAmount,
      paymentStatus: transaction.paymentStatus,
      userId: transaction.userId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      user: transaction.user,
      items,
      totalAmount,
      subtotal,
      totalDiscount,
      cashierName: transaction.user?.name || 'Unknown'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'