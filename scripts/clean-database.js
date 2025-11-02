#!/usr/bin/env node

/**
 * Database Cleanup Script for Gita Fashion
 * This script will clean all data from the database while keeping the schema
 */

import { db } from '../src/lib/db.js'
import { 
  users, 
  categories, 
  products, 
  transactions, 
  transactionItems,
  customers,
  shifts,
  expenses,
  settings
} from '../src/lib/schema.js'

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...')

    // Delete data in correct order (respecting foreign key constraints)
    console.log('📊 Deleting transaction items...')
    await db.delete(transactionItems)

    console.log('💳 Deleting transactions...')
    await db.delete(transactions)

    console.log('📦 Deleting products...')
    await db.delete(products)

    console.log('📂 Deleting categories...')
    await db.delete(categories)

    console.log('👥 Deleting customers...')
    await db.delete(customers)

    console.log('⏰ Deleting shifts...')
    await db.delete(shifts)

    console.log('💸 Deleting expenses...')
    await db.delete(expenses)

    console.log('⚙️ Deleting settings...')
    await db.delete(settings)

    console.log('👤 Deleting users...')
    await db.delete(users)

    console.log('✅ Database cleanup completed successfully!')
    console.log('💡 Run "npm run db:seed" to restore default data')

  } catch (error) {
    console.error('❌ Error during database cleanup:', error)
    process.exit(1)
  }
}

// Run the cleanup
cleanDatabase()