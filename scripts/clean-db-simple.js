#!/usr/bin/env node

/**
 * Simple Database Cleanup Script
 * Cleans all tables except products and categories
 */

const Database = require('better-sqlite3')
const path = require('path')

// Database path
const dbPath = path.join(__dirname, '..', 'sqlite.db')

console.log('🧹 Starting database cleanup (keeping products & categories)...')
console.log(`📁 Database: ${dbPath}`)

try {
  const db = new Database(dbPath)
  
  console.log('\n📊 Checking current data...')
  
  // Get current counts
  const getUserCount = db.prepare('SELECT COUNT(*) as count FROM users')
  const getTransactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions')
  const getOutgoingCount = db.prepare('SELECT COUNT(*) as count FROM outgoing_items')
  const getShiftCount = db.prepare('SELECT COUNT(*) as count FROM shifts')
  const getExpenseCount = db.prepare('SELECT COUNT(*) as count FROM expenses')
  const getProductCount = db.prepare('SELECT COUNT(*) as count FROM products')
  const getCategoryCount = db.prepare('SELECT COUNT(*) as count FROM categories')
  
  const before = {
    users: getUserCount.get().count,
    transactions: getTransactionCount.get().count,
    outgoingItems: getOutgoingCount.get().count,
    shifts: getShiftCount.get().count,
    expenses: getExpenseCount.get().count,
    products: getProductCount.get().count,
    categories: getCategoryCount.get().count
  }
  
  console.log(`👥 Users: ${before.users}`)
  console.log(`🧾 Transactions: ${before.transactions}`)
  console.log(`📤 Outgoing Items: ${before.outgoingItems}`)
  console.log(`🕐 Shifts: ${before.shifts}`)
  console.log(`💸 Expenses: ${before.expenses}`)
  console.log(`📦 Products: ${before.products} (WILL BE KEPT)`)
  console.log(`📂 Categories: ${before.categories} (WILL BE KEPT)`)
  
  console.log('\n⚠️  WARNING: This will delete transaction data!')
  console.log('⏳ Starting cleanup...')
  
  // Start cleanup transaction
  const cleanup = db.transaction(() => {
    console.log('\n🗑️  Deleting data...')
    
    // Delete in correct order (foreign key constraints)
    const deleteOutgoing = db.prepare('DELETE FROM outgoing_items')
    const deleteTransactions = db.prepare('DELETE FROM transactions')
    const deleteExpenses = db.prepare('DELETE FROM expenses')
    const deleteShifts = db.prepare('DELETE FROM shifts')
    const deleteNonAdminUsers = db.prepare("DELETE FROM users WHERE role != 'ADMIN'")
    const deleteNonEssentialSettings = db.prepare(`
      DELETE FROM settings 
      WHERE key NOT IN ('store_name', 'store_address', 'store_phone', 'store_logo')
    `)
    
    const result1 = deleteOutgoing.run()
    console.log(`   ✅ Deleted ${result1.changes} outgoing items`)
    
    const result2 = deleteTransactions.run()
    console.log(`   ✅ Deleted ${result2.changes} transactions`)
    
    const result3 = deleteExpenses.run()
    console.log(`   ✅ Deleted ${result3.changes} expenses`)
    
    const result4 = deleteShifts.run()
    console.log(`   ✅ Deleted ${result4.changes} shifts`)
    
    const result5 = deleteNonAdminUsers.run()
    console.log(`   ✅ Deleted ${result5.changes} non-admin users`)
    
    const result6 = deleteNonEssentialSettings.run()
    console.log(`   ✅ Deleted ${result6.changes} non-essential settings`)
    
    return {
      outgoingItems: result1.changes,
      transactions: result2.changes,
      expenses: result3.changes,
      shifts: result4.changes,
      users: result5.changes,
      settings: result6.changes
    }
  })
  
  const deleted = cleanup()
  
  // Get final counts
  const after = {
    users: getUserCount.get().count,
    transactions: getTransactionCount.get().count,
    outgoingItems: getOutgoingCount.get().count,
    shifts: getShiftCount.get().count,
    expenses: getExpenseCount.get().count,
    products: getProductCount.get().count,
    categories: getCategoryCount.get().count
  }
  
  console.log('\n📊 Final status:')
  console.log(`👥 Users: ${after.users} (admin only)`)
  console.log(`🧾 Transactions: ${after.transactions}`)
  console.log(`📤 Outgoing Items: ${after.outgoingItems}`)
  console.log(`🕐 Shifts: ${after.shifts}`)
  console.log(`💸 Expenses: ${after.expenses}`)
  console.log(`📦 Products: ${after.products} ✅ PRESERVED`)
  console.log(`📂 Categories: ${after.categories} ✅ PRESERVED`)
  
  console.log('\n🎯 Summary:')
  console.log(`✅ ${after.products} products preserved`)
  console.log(`✅ ${after.categories} categories preserved`)
  console.log(`✅ ${after.users} admin user(s) preserved`)
  console.log(`🗑️  ${deleted.transactions} transactions deleted`)
  console.log(`🗑️  ${deleted.outgoingItems} outgoing items deleted`)
  console.log(`🗑️  ${deleted.shifts} shifts deleted`)
  console.log(`🗑️  ${deleted.expenses} expenses deleted`)
  console.log(`🗑️  ${deleted.users} non-admin users deleted`)
  
  db.close()
  
  console.log('\n🎉 Database cleanup completed successfully!')
  console.log('📦 All products and categories have been preserved')
  console.log('🧹 Transaction history and user data have been cleared')
  
} catch (error) {
  console.error('\n❌ Error during cleanup:')
  console.error(error.message)
  process.exit(1)
}