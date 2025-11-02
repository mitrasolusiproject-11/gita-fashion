#!/usr/bin/env node

/**
 * Debug CSV Parsing Script for Gita Fashion
 * This script will show how CSV is parsed
 */

import fs from 'fs'
import path from 'path'

function debugCSV() {
  try {
    console.log('🔍 Debugging CSV parsing...')

    const csvPath = path.join(process.cwd(), 'templates', 'template-produk-friendly.csv')
    const text = fs.readFileSync(csvPath, 'utf-8')
    
    console.log('📄 Raw CSV content:')
    console.log('---')
    console.log(text)
    console.log('---')
    
    const lines = text.split('\n').filter(line => line.trim())
    console.log(`📊 Total lines: ${lines.length}`)
    
    if (lines.length < 2) {
      console.log('❌ File must contain header and at least one data row')
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    console.log('📋 Headers:', headers)
    console.log(`📊 Header count: ${headers.length}`)
    
    const dataLines = lines.slice(1)
    console.log(`📊 Data lines: ${dataLines.length}`)
    
    console.log('\n🔍 Parsing each data line:')
    
    for (let i = 0; i < dataLines.length; i++) {
      console.log(`\nRow ${i + 2}:`)
      console.log(`Raw: "${dataLines[i]}"`)
      
      const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      console.log(`Parsed values: [${values.map(v => `"${v}"`).join(', ')}]`)
      console.log(`Value count: ${values.length}`)
      
      if (values.length < 5) {
        console.log(`❌ INSUFFICIENT DATA: Expected 5, got ${values.length}`)
      } else {
        const [barcode, name, categoryValue, sellPriceStr, initialStockStr] = values
        console.log(`✅ Parsed:`)
        console.log(`  - Barcode: "${barcode}"`)
        console.log(`  - Name: "${name}"`)
        console.log(`  - Category: "${categoryValue}"`)
        console.log(`  - Price: "${sellPriceStr}"`)
        console.log(`  - Stock: "${initialStockStr}"`)
        
        if (!barcode || !name || !categoryValue || !sellPriceStr || !initialStockStr) {
          console.log(`❌ MISSING FIELDS: Some fields are empty`)
        }
      }
    }

  } catch (error) {
    console.error('❌ Error debugging CSV:', error)
  }
}

// Run the debug
debugCSV()