/**
 * Utility functions for barcode generation and printing
 */

export interface BarcodeConfig {
  width: number
  height: number
  printerSize: '58mm' | '80mm'
}

/**
 * Generate barcode canvas data URL using JsBarcode
 */
export const generateBarcodeDataURL = (
  barcode: string, 
  config: BarcodeConfig
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    
    // Dynamically import JsBarcode
    import('jsbarcode').then((JsBarcode) => {
      try {
        JsBarcode.default(canvas, barcode, {
          format: 'CODE128',
          width: config.printerSize === '58mm' ? 1.0 : 1.5,
          height: config.printerSize === '58mm' ? 15 : 20,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000'
        })
        
        resolve(canvas.toDataURL('image/png'))
      } catch (error) {
        console.error('Error generating barcode:', error)
        // Fallback: generate simple barcode pattern
        resolve(generateSimpleBarcodeDataURL(barcode, config))
      }
    }).catch(() => {
      // Fallback if JsBarcode fails to load
      resolve(generateSimpleBarcodeDataURL(barcode, config))
    })
  })
}

/**
 * Generate simple barcode pattern as fallback
 */
export const generateSimpleBarcodeDataURL = (
  barcode: string, 
  config: BarcodeConfig
): string => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const width = config.printerSize === '58mm' ? 180 : 240
  const height = config.printerSize === '58mm' ? 15 : 20
  
  canvas.width = width
  canvas.height = height

  // Fill background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  
  // Generate barcode pattern
  ctx.fillStyle = '#000000'
  
  // Create a more realistic barcode pattern
  const chars = barcode.split('')
  const barWidth = width / (chars.length * 3) // 3 bars per character
  
  chars.forEach((char, index) => {
    const charCode = char.charCodeAt(0)
    const x = index * barWidth * 3
    
    // Generate 3 bars per character with varying widths
    const bar1Width = barWidth * (0.5 + (charCode % 3) * 0.2)
    const bar2Width = barWidth * (0.3 + (charCode % 2) * 0.3)
    const bar3Width = barWidth * (0.4 + (charCode % 4) * 0.15)
    
    ctx.fillRect(x, 0, bar1Width, height)
    ctx.fillRect(x + barWidth, 0, bar2Width, height)
    ctx.fillRect(x + barWidth * 2, 0, bar3Width, height)
  })

  return canvas.toDataURL('image/png')
}

/**
 * Generate print-ready HTML for multiple barcodes
 */
export const generateBulkPrintHTML = async (
  products: Array<{
    barcode: string
    name: string
    sellPrice: number
  }>,
  quantities: Record<string, number>,
  printerSize: '58mm' | '80mm',
  formatPrice: (price: number) => string
): Promise<string> => {
  const config: BarcodeConfig = {
    width: printerSize === '58mm' ? 180 : 240,
    height: printerSize === '58mm' ? 15 : 20,
    printerSize
  }

  let barcodeHTML = ''
  
  for (const product of products) {
    const quantity = quantities[product.barcode] || 1
    const barcodeDataURL = await generateBarcodeDataURL(product.barcode, config)
    
    for (let i = 0; i < quantity; i++) {
      barcodeHTML += `
        <div class="barcode-label">
          <div class="product-name">${product.name.toUpperCase()}</div>
          <div class="barcode-image">
            <img src="${barcodeDataURL}" alt="Barcode ${product.barcode}" />
          </div>
          <div class="barcode-number">${product.barcode}</div>
          <div class="price">${formatPrice(product.sellPrice)}</div>
        </div>
      `
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Barcodes - ${products.length} Products</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: Arial, sans-serif; 
          margin: 0;
          padding: 3mm;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .barcode-container {
          display: flex;
          flex-wrap: wrap;
          gap: 1mm;
          justify-content: flex-start;
          align-items: flex-start;
        }
        
        .barcode-label {
          width: ${printerSize === '58mm' ? '54mm' : '76mm'};
          height: ${printerSize === '58mm' ? '24mm' : '28mm'};
          padding: 0.5mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          page-break-inside: avoid;
          break-inside: avoid;
          background: white;
          box-sizing: border-box;
          border: 1px solid #ddd;
          position: relative;
          gap: 0;
          margin-bottom: 1mm;
        }
        
        .product-name {
          font-size: ${printerSize === '58mm' ? '5pt' : '7pt'} !important;
          font-weight: bold !important;
          text-align: center !important;
          line-height: 0.8 !important;
          height: ${printerSize === '58mm' ? '3mm' : '4mm'};
          overflow: hidden;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          word-wrap: break-word;
          hyphens: auto;
          color: #000 !important;
          text-transform: uppercase;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .barcode-image {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .barcode-image img {
          max-width: 100% !important;
          height: ${printerSize === '58mm' ? '15px' : '20px'} !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .barcode-number {
          font-size: ${printerSize === '58mm' ? '7pt' : '10pt'} !important;
          font-weight: bold !important;
          letter-spacing: 1px !important;
          margin: 0 !important;
          padding: 0 !important;
          color: #000 !important;
          font-family: 'Courier New', monospace !important;
        }
        
        .price {
          font-size: ${printerSize === '58mm' ? '9pt' : '12pt'} !important;
          font-weight: bold !important;
          color: #000 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        @media print {
          body { 
            margin: 0 !important; 
            padding: 2mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .barcode-container {
            gap: 0 !important;
          }
          
          .barcode-label { 
            margin: 0 !important;
            margin-bottom: 0.5mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: none !important;
            orphans: 1;
            widows: 1;
          }
          
          .product-name {
            font-size: ${printerSize === '58mm' ? '5pt' : '7pt'} !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .barcode-image {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .barcode-number {
            font-size: ${printerSize === '58mm' ? '7pt' : '10pt'} !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .price {
            font-size: ${printerSize === '58mm' ? '9pt' : '12pt'} !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="barcode-container">
        ${barcodeHTML}
      </div>
      
      <script>
        // Simple and reliable print timing (same as single print)
        function simplePrint() {
          // Wait for everything to be ready
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 1000);
          }, 2000); // Fixed 2 second delay
        }
        
        // Multiple triggers to ensure reliability
        if (document.readyState === 'complete') {
          simplePrint();
        } else {
          window.addEventListener('load', simplePrint);
          document.addEventListener('DOMContentLoaded', simplePrint);
        }
        
        // Fallback trigger
        setTimeout(simplePrint, 3000);
      </script>
    </body>
    </html>
  `
}