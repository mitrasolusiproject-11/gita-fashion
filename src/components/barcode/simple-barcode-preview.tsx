'use client'

import { useEffect, useRef, useState } from 'react'

interface SimpleBarcodePreviewProps {
  value: string
  productName?: string
  price?: number
}

export default function SimpleBarcodePreview({ 
  value, 
  productName, 
  price 
}: SimpleBarcodePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState('Loading...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔄 SimpleBarcodePreview mounted with value:', value)
    setStatus('Initializing...')
    
    if (!value) {
      setError('No barcode value provided')
      setStatus('Error: No value')
      return
    }

    // Dynamic import to avoid SSR issues
    const generateBarcode = async () => {
      try {
        setStatus('Loading JsBarcode...')
        console.log('📦 Importing JsBarcode...')
        
        const JsBarcode = (await import('jsbarcode')).default
        console.log('✅ JsBarcode imported successfully')
        
        if (!canvasRef.current) {
          throw new Error('Canvas ref not available')
        }
        
        setStatus('Generating barcode...')
        console.log('🎨 Generating barcode on canvas...')
        
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000'
        })
        
        setStatus('Success!')
        console.log('✅ Barcode generated successfully!')
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('❌ Error generating barcode:', err)
        setError(errorMsg)
        setStatus(`Error: ${errorMsg}`)
        
        // Draw error on canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#ff0000'
            ctx.font = '12px Arial'
            ctx.fillText('Error: ' + errorMsg, 10, 20)
          }
        }
      }
    }

    generateBarcode()
  }, [value])

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="text-center space-y-2">
        {/* Status */}
        <div className="text-sm text-gray-600">
          Status: <span className={error ? 'text-red-600' : 'text-green-600'}>{status}</span>
        </div>
        
        {/* Product Name */}
        {productName && (
          <div className="font-bold text-sm uppercase">
            {productName}
          </div>
        )}
        
        {/* Canvas */}
        <div className="flex justify-center">
          <canvas 
            ref={canvasRef} 
            className="border border-gray-200"
            width={200}
            height={60}
          />
        </div>
        
        {/* Barcode Value */}
        <div className="font-mono text-sm font-bold">
          {value}
        </div>
        
        {/* Price */}
        {price && (
          <div className="font-bold text-lg">
            Rp {price.toLocaleString('id-ID')}
          </div>
        )}
        
        {/* Debug Info */}
        <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-100 rounded">
          <div>Value: {value || 'undefined'}</div>
          <div>Canvas: {canvasRef.current ? 'Available' : 'Not available'}</div>
          <div>Error: {error || 'None'}</div>
        </div>
      </div>
    </div>
  )
}