import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  users, 
  transactions, 
  outgoingItems, 
  settings, 
  shifts, 
  expenses 
} from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq, notInArray, and, ne } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    
    // Only ADMIN can perform database cleanup
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized. Only admin can perform database cleanup.' 
      }, { status: 403 })
    }

    console.log('🧹 Starting database cleanup (keeping products & categories)...')

    // Get current counts before cleanup
    const beforeCounts = {
      users: await db.select().from(users).then(rows => rows.length),
      transactions: await db.select().from(transactions).then(rows => rows.length),
      outgoingItems: await db.select().from(outgoingItems).then(rows => rows.length),
      settings: await db.select().from(settings).then(rows => rows.length),
      shifts: await db.select().from(shifts).then(rows => rows.length),
      expenses: await db.select().from(expenses).then(rows => rows.length),
    }

    // Perform cleanup in transaction
    const result = await db.transaction(async (tx) => {
      const deletedCounts = {
        outgoingItems: 0,
        transactions: 0,
        expenses: 0,
        shifts: 0,
        settings: 0,
        users: 0
      }

      // 1. Clear outgoing_items first (has foreign key references)
      console.log('🗑️  Clearing outgoing_items...')
      const outgoingResult = await tx.delete(outgoingItems)
      deletedCounts.outgoingItems = beforeCounts.outgoingItems

      // 2. Clear transactions
      console.log('🗑️  Clearing transactions...')
      const transactionResult = await tx.delete(transactions)
      deletedCounts.transactions = beforeCounts.transactions

      // 3. Clear expenses
      console.log('🗑️  Clearing expenses...')
      const expenseResult = await tx.delete(expenses)
      deletedCounts.expenses = beforeCounts.expenses

      // 4. Clear shifts
      console.log('🗑️  Clearing shifts...')
      const shiftResult = await tx.delete(shifts)
      deletedCounts.shifts = beforeCounts.shifts

      // 5. Clear non-essential settings (keep store info, logo, etc.)
      console.log('🗑️  Clearing non-essential settings...')
      const essentialSettings = [
        'store_name', 
        'store_address', 
        'store_phone', 
        'store_logo',
        'default_discount',
        'tax_rate'
      ]
      
      const settingsToDelete = await tx.select().from(settings)
        .where(notInArray(settings.key, essentialSettings))
      
      if (settingsToDelete.length > 0) {
        await tx.delete(settings)
          .where(notInArray(settings.key, essentialSettings))
        deletedCounts.settings = settingsToDelete.length
      }

      // 6. Clear users except admin (keep at least one admin user)
      console.log('🗑️  Clearing users (keeping admin users)...')
      
      // Get the first admin user (oldest)
      const adminUsers = await tx.select().from(users)
        .where(eq(users.role, 'ADMIN'))
        .orderBy(users.createdAt)
        .limit(1)

      if (adminUsers.length > 0) {
        const keepAdminId = adminUsers[0].id
        
        // Delete all users except the first admin
        const usersToDelete = await tx.select().from(users)
          .where(ne(users.id, keepAdminId))
        
        if (usersToDelete.length > 0) {
          await tx.delete(users).where(ne(users.id, keepAdminId))
          deletedCounts.users = usersToDelete.length
        }
      }

      return deletedCounts
    })

    // Get final counts after cleanup
    const afterCounts = {
      users: await db.select().from(users).then(rows => rows.length),
      transactions: await db.select().from(transactions).then(rows => rows.length),
      outgoingItems: await db.select().from(outgoingItems).then(rows => rows.length),
      settings: await db.select().from(settings).then(rows => rows.length),
      shifts: await db.select().from(shifts).then(rows => rows.length),
      expenses: await db.select().from(expenses).then(rows => rows.length),
    }

    console.log('✅ Database cleanup completed!')

    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully (products and categories preserved)',
      summary: {
        deleted: result,
        before: beforeCounts,
        after: afterCounts,
        preserved: {
          note: 'Products and categories were preserved',
          adminUser: 'One admin user kept for system access'
        }
      }
    })

  } catch (error) {
    console.error('Error during database cleanup:', error)
    return NextResponse.json({ 
      error: 'Database cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'