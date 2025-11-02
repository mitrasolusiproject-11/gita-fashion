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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No backup file uploaded' }, { status: 400 })
    }

    if (!file.name.endsWith('.json')) {
      return NextResponse.json({ error: 'Invalid file format. Please upload a JSON backup file.' }, { status: 400 })
    }

    const text = await file.text()
    let backupData: any

    try {
      backupData = JSON.parse(text)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }

    // Validate backup structure
    if (!backupData.metadata || !backupData.data) {
      return NextResponse.json({ error: 'Invalid backup file structure' }, { status: 400 })
    }

    const { data } = backupData
    let restoredCount = 0
    const errors: string[] = []

    try {
      // Clear existing data first (safer approach)
      console.log('🗑️ Clearing existing data...')
      
      // Delete in reverse order of dependencies
      await db.delete(outgoingItems)
      await db.delete(transactions)
      await db.delete(expenses)
      await db.delete(shifts)
      await db.delete(products)
      await db.delete(categories)
      // Keep users for authentication
      
      console.log('✅ Existing data cleared')
      
      // Restore in order to respect foreign key constraints
      
      // 1. Categories first (no dependencies)
      if (data.categories && Array.isArray(data.categories)) {
        console.log(`📂 Restoring ${data.categories.length} categories...`)
        for (const category of data.categories) {
          try {
            await db.insert(categories).values({
              id: category.id,
              name: category.name,
              createdAt: new Date(category.createdAt),
              updatedAt: new Date(category.updatedAt || category.createdAt)
            })
            restoredCount++
          } catch (error) {
            errors.push(`Category ${category.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
        console.log(`✅ Categories restored: ${data.categories.length}`)
      }

      // 2. Users (skip - keep existing users for authentication)
      console.log('👤 Skipping users restore (keeping existing users for security)')
      
      // Note: We don't restore users to prevent authentication issues
      // Admin can manually recreate users if needed

      // 3. Products (depends on categories)
      if (data.products && Array.isArray(data.products)) {
        console.log(`📦 Restoring ${data.products.length} products...`)
        for (const product of data.products) {
          try {
            await db.insert(products).values({
              id: product.id,
              barcode: product.barcode,
              name: product.name,
              categoryId: product.categoryId,
              initialStock: product.initialStock,
              currentStock: product.currentStock,
              sellPrice: product.sellPrice,
              createdAt: new Date(product.createdAt),
              updatedAt: new Date(product.updatedAt || product.createdAt)
            })
            restoredCount++
          } catch (error) {
            errors.push(`Product ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
        console.log(`✅ Products restored: ${data.products.length}`)
      }

      // 4. Settings
      if (data.settings && Array.isArray(data.settings)) {
        for (const setting of data.settings) {
          try {
            await db.insert(settings).values(setting).onConflictDoUpdate({
              target: settings.key,
              set: {
                value: setting.value,
                updatedAt: new Date()
              }
            })
            restoredCount++
          } catch (error) {
            errors.push(`Setting ${setting.key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // 5. Transactions (depends on users)
      if (data.transactions && Array.isArray(data.transactions)) {
        for (const transaction of data.transactions) {
          try {
            await db.insert(transactions).values(transaction).onConflictDoUpdate({
              target: transactions.code,
              set: {
                totalItems: transaction.totalItems,
                cashAmount: transaction.cashAmount,
                transferAmount: transaction.transferAmount,
                bankName: transaction.bankName,
                paymentStatus: transaction.paymentStatus,
                updatedAt: new Date()
              }
            })
            restoredCount++
          } catch (error) {
            errors.push(`Transaction ${transaction.code}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // 6. Outgoing Items (depends on transactions)
      if (data.outgoingItems && Array.isArray(data.outgoingItems)) {
        for (const item of data.outgoingItems) {
          try {
            await db.insert(outgoingItems).values(item)
            restoredCount++
          } catch (error) {
            errors.push(`Outgoing Item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // 7. Shifts (depends on users)
      if (data.shifts && Array.isArray(data.shifts)) {
        for (const shift of data.shifts) {
          try {
            await db.insert(shifts).values(shift).onConflictDoUpdate({
              target: shifts.id,
              set: {
                endTime: shift.endTime,
                endingCash: shift.endingCash,
                totalSales: shift.totalSales,
                totalTransactions: shift.totalTransactions,
                totalExpenses: shift.totalExpenses,
                status: shift.status,
                notes: shift.notes,
                updatedAt: new Date()
              }
            })
            restoredCount++
          } catch (error) {
            errors.push(`Shift ${shift.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // 8. Expenses (depends on users and shifts)
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const expense of data.expenses) {
          try {
            await db.insert(expenses).values(expense)
            restoredCount++
          } catch (error) {
            errors.push(`Expense ${expense.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Database restored successfully. ${restoredCount} records processed.`,
        restoredCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10), // Limit to first 10 errors
        metadata: backupData.metadata
      })

    } catch (error) {
      console.error('Error during restore:', error)
      return NextResponse.json({ 
        error: 'Error during restore process', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error restoring database:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'