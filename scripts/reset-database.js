#!/usr/bin/env node

/**
 * Database Reset Script for Gita Fashion
 * This script will completely reset the database and restore default data
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

async function resetDatabase() {
  try {
    console.log('🔄 Starting complete database reset...')

    // Check if database file exists
    const dbPath = path.join(process.cwd(), 'sqlite.db')
    
    if (fs.existsSync(dbPath)) {
      console.log('🗑️ Removing existing database file...')
      fs.unlinkSync(dbPath)
      console.log('✅ Database file removed')
    }

    console.log('🏗️ Running migrations...')
    execSync('npm run db:migrate', { stdio: 'inherit' })

    console.log('🌱 Seeding database with default data...')
    execSync('npm run db:seed', { stdio: 'inherit' })

    console.log('🎉 Database reset completed successfully!')
    console.log('')
    console.log('📋 Default accounts created:')
    console.log('   Admin: admin@gitafashion.com / admin123')
    console.log('   Kasir: kasir@gitafashion.com / kasir123')
    console.log('')
    console.log('🚀 You can now start the development server with: npm run dev')

  } catch (error) {
    console.error('❌ Error during database reset:', error.message)
    process.exit(1)
  }
}

// Run the reset
resetDatabase()