import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth-simple'
import { 
  users, 
  categories, 
  products, 
  transactions, 
  outgoingItems, 
  settings, 
  shifts, 
  expenses 
} from '@/lib/schema'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all data from all tables
    const [
      allUsers,
      allCategories,
      allProducts,
      allTransactions,
      allOutgoingItems,
      allSettings,
      allShifts,
      allExpenses
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(categories),
      db.select().from(products),
      db.select().from(transactions),
      db.select().from(outgoingItems),
      db.select().from(settings),
      db.select().from(shifts),
      db.select().from(expenses)
    ])

    const backupData = {
      metadata: {
        backupDate: new Date().toISOString(),
        version: '1.0.0',
        appName: 'Gita Fashion POS',
        totalRecords: {
          users: allUsers.length,
          categories: allCategories.length,
          products: allProducts.length,
          transactions: allTransactions.length,
          outgoingItems: allOutgoingItems.length,
          settings: allSettings.length,
          shifts: allShifts.length,
          expenses: allExpenses.length
        }
      },
      data: {
        users: allUsers.map(user => ({
          ...user,
          password: '[ENCRYPTED]' // Don't export actual passwords
        })),
        categories: allCategories,
        products: allProducts,
        transactions: allTransactions,
        outgoingItems: allOutgoingItems,
        settings: allSettings,
        shifts: allShifts,
        expenses: allExpenses
      }
    }

    const fileName = `gita-fashion-backup-${new Date().toISOString().split('T')[0]}.json`
    
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'