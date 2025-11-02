/**
 * Unified barcode print template for consistent single and bulk printing
 */

export interface BarcodeData {
  barcode: string
  productName?: string
  price?: number
}

export const generatePrintHTML = (
  barcodes: BarcodeData[],
  printerSize: '58mm' | '80mm',
  formatPrice: (price: number) => string
): string => {
  const barcodeHTML = barcodes.map(item => `
    <div class="barcode-label">
      ${item.productName ? `<div class="product-name">${item.productName.toUpperCase()}</div>` : ''}
      <div class="barcode-image">
        <canvas class="barcode-canvas" data-barcode="${item.barcode}"></canvas>
      </div>
      <div class="barcode-number">${item.barcode}</div>
      ${item.price ? `<div class="price">${formatPrice(item.price)}</div>` : ''}
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Barcodes</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        /* Thermal printer specific CSS */
        @media print {
          @page {
            size: ${printerSize === '58mm' ? '58mm auto' : '80mm auto'};
            margin: 0;
          }
          
          body {
            margin: 0 !important;
            padding: 2mm !important;
          }
          
          .barcode-container {
            width: 100% !important;
          }
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
          justify-content: ${barcodes.length === 1 ? 'center' : 'flex-start'};
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
        
        .barcode-canvas {
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
        // Generate barcodes first
        function generateBarcodes() {
          const canvases = document.querySelectorAll('.barcode-canvas');
          canvases.forEach(canvas => {
            const barcode = canvas.getAttribute('data-barcode');
            if (barcode && window.JsBarcode) {
              JsBarcode(canvas, barcode, {
                format: 'CODE128',
                width: ${printerSize === '58mm' ? '1.0' : '1.5'},
                height: ${printerSize === '58mm' ? '15' : '20'},
                displayValue: false,
                margin: 0,
                background: '#ffffff',
                lineColor: '#000000'
              });
            }
          });
        }
        
        // Simple print control - content starts from top
        window.addEventListener('afterprint', function() {
          console.log('Barcode print completed - closing window');
          setTimeout(() => window.close(), 500);
        });
        
        // Add paper cut spacing at the end
        document.addEventListener('DOMContentLoaded', function() {
          const container = document.querySelector('.barcode-container');
          if (container) {
            const spacer = document.createElement('div');
            spacer.style.height = '5mm';
            spacer.style.width = '100%';
            container.appendChild(spacer);
          }
        });
        
        // Simple and reliable print function
        function doPrint() {
          setTimeout(() => {
            window.print();
          }, 2000);
        }
        
        // Wait for JsBarcode to load, then generate and print
        function waitForJsBarcodeAndPrint() {
          if (typeof window.JsBarcode !== 'undefined') {
            generateBarcodes();
            doPrint();
          } else {
            setTimeout(waitForJsBarcodeAndPrint, 100);
          }
        }
        
        // Start the process
        if (document.readyState === 'complete') {
          waitForJsBarcodeAndPrint();
        } else {
          window.addEventListener('load', waitForJsBarcodeAndPrint);
        }
        
        // Fallback
        setTimeout(() => {
          if (typeof window.JsBarcode !== 'undefined') {
            generateBarcodes();
          }
          doPrint();
        }, 4000);
      </script>
    </body>
    </html>
  `
}