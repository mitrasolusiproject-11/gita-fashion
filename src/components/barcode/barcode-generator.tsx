'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'
import { formatPriceCompact } from '@/lib/format'

interface BarcodeGeneratorProps {
  value: string
  productName?: string
  price?: number
  width?: number
  height?: number
  showProductInfo?: boolean
  printerSize?: '58mm' | '80mm'
}

export default function BarcodeGenerator({ 
  value, 
  productName, 
  price, 
  width = 2, 
  height = 35,
  showProductInfo = true,
  printerSize = '58mm'
}: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        console.log('🔄 Generating barcode for:', value)
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: false, // We'll display the value manually
          fontSize: 16,
          textMargin: 0,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000'
        })
        console.log('✅ Barcode generated successfully')
      } catch (error) {
        console.error('❌ Error generating barcode:', error)
        // Fallback: show error message
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#ff0000'
            ctx.font = '12px Arial'
            ctx.fillText('Error generating barcode', 10, 20)
          }
        }
      }
    } else {
      console.log('⚠️ Canvas or value not available:', { canvas: !!canvasRef.current, value })
    }
  }, [value, width, height])

  const downloadBarcode = () => {
    if (printRef.current) {
      // Create a new canvas for the complete barcode label
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size (240px width, 160px height to match the label)
      canvas.width = 240 * 2 // Double for better quality
      canvas.height = 160 * 2
      ctx.scale(2, 2) // Scale for high DPI

      // Fill background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 240, 160)

      // Set font and text properties
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'

      let yPosition = 20

      // Draw product name
      if (showProductInfo && productName) {
        ctx.font = 'bold 12px Arial'
        const words = productName.toUpperCase().split(' ')
        let line = ''
        const maxWidth = 220
        const lineHeight = 14

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          const metrics = ctx.measureText(testLine)
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line.trim(), 120, yPosition)
            line = words[i] + ' '
            yPosition += lineHeight
          } else {
            line = testLine
          }
        }
        ctx.fillText(line.trim(), 120, yPosition)
        yPosition += 25
      }

      // Draw barcode from canvas
      if (canvasRef.current) {
        const barcodeCanvas = canvasRef.current
        const barcodeWidth = Math.min(barcodeCanvas.width, 220)
        const barcodeHeight = Math.min(barcodeCanvas.height, 60)
        const x = (240 - barcodeWidth) / 2
        ctx.drawImage(barcodeCanvas, x, yPosition, barcodeWidth, barcodeHeight)
        yPosition += barcodeHeight + 10
      }

      // Draw barcode number
      ctx.font = 'bold 14px Arial'
      ctx.letterSpacing = '2px'
      ctx.fillText(value, 120, yPosition)
      yPosition += 20

      // Draw price
      if (showProductInfo && price) {
        ctx.font = 'bold 16px Arial'
        ctx.fillText(formatPriceCompact(price), 120, yPosition)
      }

      // Download the canvas
      const link = document.createElement('a')
      link.download = `barcode-${value}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  const printBarcode = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Use unified template
    import('@/lib/barcode-print-template').then(({ generatePrintHTML }) => {
      const barcodeData = [{
        barcode: value,
        productName: showProductInfo ? productName : undefined,
        price: showProductInfo ? price : undefined
      }]
      
      const printContent = generatePrintHTML(barcodeData, printerSize, formatPriceCompact)
      
      // Safe approach for setting print content
      printWindow.document.open()
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Auto print when ready
      setTimeout(() => {
        printWindow.print()
      }, 100)
    }).catch(() => {
      // Fallback if import fails
      const fallbackContent = `
        <html><body>
          <p>Error loading print template. Please try again.</p>
          <script>setTimeout(() => window.close(), 2000);</script>
        </body></html>
      `
      printWindow.document.open()
      printWindow.document.write(fallbackContent)
      printWindow.document.close()
    })
  }

  return (
    <div className="space-y-4">
      {/* Preview Label */}
      <div ref={printRef} className="text-center">
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 text-gray-600">
            {printerSize === '58mm' ? '58mm Thermal Printer' : '80mm Thermal Printer'}
          </h4>
          <div 
            className={`barcode-label-${printerSize} inline-block p-2 bg-white`}
            style={{ 
              width: printerSize === '58mm' ? '200px' : '280px', 
              minHeight: printerSize === '58mm' ? '85px' : '100px' 
            }}
          >
            {/* Product Name */}
            {showProductInfo && productName && (
              <div 
                className={`product-name font-bold uppercase tracking-wide ${
                  printerSize === '58mm' ? 'text-xs' : 'text-sm'
                }`}
                style={{ 
                  height: printerSize === '58mm' ? '12px' : '16px', 
                  overflow: 'hidden',
                  margin: '0',
                  padding: '0',
                  lineHeight: '0.8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {productName}
              </div>
            )}
            
            {/* Barcode Image */}
            <div 
              className="barcode-image flex justify-center items-center"
              style={{ 
                margin: '0',
                padding: '0'
              }}
            >
              <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', margin: '0', padding: '0' }} />
            </div>
            
            {/* Barcode Number */}
            <div 
              className={`barcode-number font-bold tracking-wider ${
                printerSize === '58mm' ? 'text-sm' : 'text-lg tracking-widest'
              }`}
              style={{ 
                margin: '0',
                padding: '0',
                fontFamily: 'Courier New, monospace'
              }}
            >
              {value}
            </div>
            
            {/* Price */}
            {showProductInfo && price && (
              <div 
                className={`price font-bold ${
                  printerSize === '58mm' ? 'text-base' : 'text-xl'
                }`}
                style={{ 
                  margin: '0',
                  padding: '0'
                }}
              >
                {formatPriceCompact(price)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button onClick={downloadBarcode} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button onClick={printBarcode} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print {printerSize}
        </Button>
      </div>
    </div>
  )
}