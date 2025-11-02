#!/usr/bin/env node

/**
 * Clean Database Script - Keep Products & Categories Only
 * 
 * This script will clean all database tables EXCEPT:
 * - products
 * - categories
 * 
 * Tables that will be CLEARED:
 * - users (except admin user)
 * - transactions
 * - outgoing_items
 * - settings (except essential settings)
 * - shifts
 * - expenses
 */

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database path
const dbPath = path.join(__dirname, '..', 'sqlite.db')

console.log('🧹 Starting database cleanup (keeping products & categories)...')
console.log(`📁 Database path: ${dbPath}`)

try {
  // Open database connection
  const db = new Database(dbPath)
  
  console.log('\n📊 Current database status:')
  
  // Check current record counts
  const counts = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
    products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
    transactions: db.prepare('SELECT COUNT(*) as count FROM transactions').get().count,
    outgoing_items: db.prepare('SELECT COUNT(*) as count FROM outgoing_items').get().count,
    settings: db.prepare('SELECT COUNT(*) as count FROM settings').get().count,
    shifts: db.prepare('SELECT COUNT(*) as count FROM shifts').get().count,
    expenses: db.prepare('SELECT COUNT(*) as count FROM expenses').get().count,
  }
  
  console.log(`👥 Users: ${counts.users}`)
  console.log(`📂 Categories: ${counts.categories} (WILL BE KEPT)`)
  console.log(`📦 Products: ${counts.products} (WILL BE KEPT)`)
  console.log(`🧾 Transactions: ${counts.transactions}`)
  console.log(`📤 Outgoing Items: ${counts.outgoing_items}`)
  console.log(`⚙️  Settings: ${counts.settings}`)
  console.log(`🕐 Shifts: ${counts.shifts}`)
  console.log(`💸 Expenses: ${counts.expenses}`)
  
  console.log('\n🚨 WARNING: This will delete all data except products and categories!')
  console.log('⏳ Starting cleanup in 3 seconds...')
  
  // Wait 3 seconds
  await sleep(3000)
  
  // Start transaction for atomic operations
  const cleanup = db.transaction(() => {
    console.log('\n🧹 Cleaning database tables...')
    
    // 1. Clear outgoing_items first (has foreign key references)
    console.log('🗑️  Clearing outgoing_items...')
    const outgoingResult = db.prepare('DELETE FROM outgoing_items').run()
    console.log(`   ✅ Deleted ${outgoingResult.changes} outgoing items`)
    
    // 2. Clear transactions
    console.log('🗑️  Clearing transactions...')
    const transactionResult = db.prepare('DELETE FROM transactions').run()
    console.log(`   ✅ Deleted ${transactionResult.changes} transactions`)
    
    // 3. Clear expenses
    console.log('🗑️  Clearing expenses...')
    const expenseResult = db.prepare('DELETE FROM expenses').run()
    console.log(`   ✅ Deleted ${expenseResult.changes} expenses`)
    
    // 4. Clear shifts
    console.log('🗑️  Clearing shifts...')
    const shiftResult = db.prepare('DELETE FROM shifts').run()
    console.log(`   ✅ Deleted ${shiftResult.changes} shifts`)
    
    // 5. Clear non-essential settings (keep store info, logo, etc.)
    console.log('🗑️  Clearing non-essential settings...')
    const settingsResult = db.prepare(`
      DELETE FROM settings 
      WHERE key NOT IN (
        'store_name', 
        'store_address', 
        'store_phone', 
        'store_logo',
        'default_discount',
        'tax_rate'
      )
    `).run()
    console.log(`   ✅ Deleted ${settingsResult.changes} settings (kept essential store settings)`)
    
    // 6. Clear users except admin (keep at least one admin user)
    console.log('🗑️  Clearing users (keeping admin users)...')
    const userResult = db.prepare(`
      DELETE FROM users 
      WHERE role != 'ADMIN' 
      OR id NOT IN (
        SELECT id FROM users 
        WHERE role = 'ADMIN' 
        ORDER BY created_at ASC 
        LIMIT 1
      )
    `).run()
    console.log(`   ✅ Deleted ${userResult.changes} users (kept admin user)`)
    
    console.log('\n✅ Database cleanup completed!')
  })
  
  // Execute cleanup transaction
  cleanup()
  
  // Show final counts
  console.log('\n📊 Final database status:')
  const finalCounts = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
    products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
    transactions: db.prepare('SELECT COUNT(*) as count FROM transactions').get().count,
    outgoing_items: db.prepare('SELECT COUNT(*) as count FROM outgoing_items').get().count,
    settings: db.prepare('SELECT COUNT(*) as count FROM settings').get().count,
    shifts: db.prepare('SELECT COUNT(*) as count FROM shifts').get().count,
    expenses: db.prepare('SELECT COUNT(*) as count FROM expenses').get().count,
  }
  
  console.log(`👥 Users: ${finalCounts.users} (admin only)`)
  console.log(`📂 Categories: ${finalCounts.categories} ✅ PRESERVED`)
  console.log(`📦 Products: ${finalCounts.products} ✅ PRESERVED`)
  console.log(`🧾 Transactions: ${finalCounts.transactions}`)
  console.log(`📤 Outgoing Items: ${finalCounts.outgoing_items}`)
  console.log(`⚙️  Settings: ${finalCounts.settings} (essential only)`)
  console.log(`🕐 Shifts: ${finalCounts.shifts}`)
  console.log(`💸 Expenses: ${finalCounts.expenses}`)
  
  // Show preserved data summary
  console.log('\n🎯 Data Preservation Summary:')
  console.log(`✅ ${finalCounts.categories} categories preserved`)
  console.log(`✅ ${finalCounts.products} products preserved`)
  console.log(`✅ ${finalCounts.users} admin user preserved`)
  console.log(`✅ ${finalCounts.settings} essential settings preserved`)
  
  // Close database connection
  db.close()
  
  console.log('\n🎉 Database cleanup completed successfully!')
  console.log('📦 All products and categories have been preserved')
  console.log('🧹 Transaction history, shifts, and expenses have been cleared')
  console.log('👤 Only admin user remains for fresh start')
  
} catch (error) {
  console.error('\n❌ Error during database cleanup:')
  console.error(error.message)
  console.error('\n🔧 Troubleshooting:')
  console.error('1. Make sure the database file exists')
  console.error('2. Ensure no other processes are using the database')
  console.error('3. Check file permissions')
  process.exit(1)
}

// Helper function for async sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Main execution wrapper
async function main() {
  // Move all the main logic here
}