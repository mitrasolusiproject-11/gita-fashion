#!/usr/bin/env node

/**
 * Check Categories Script for Gita Fashion
 * This script will show all categories in the database
 */

import { db } from '../src/lib/db'
import { categories } from '../src/lib/schema'

async function checkCategories() {
  try {
    console.log('📂 Checking categories in database...')

    const allCategories = await db.select().from(categories)
    
    if (allCategories.length === 0) {
      console.log('❌ No categories found in database')
      console.log('💡 Run "npm run db:seed" to create default categories')
      return
    }

    console.log('✅ Categories found:')
    console.log('ID\t\tName')
    console.log('---\t\t----')
    
    allCategories.forEach(category => {
      console.log(`${category.id}\t\t${category.name}`)
    })

    console.log('')
    console.log('📋 For CSV import, use these Category IDs:')
    allCategories.forEach(category => {
      console.log(`- ${category.name}: ${category.id}`)
    })

  } catch (error) {
    console.error('❌ Error checking categories:', error)
    process.exit(1)
  }
}

// Run the check
checkCategories()