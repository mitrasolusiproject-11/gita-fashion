'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus, ShoppingCart, Scan, Package, CreditCard, Banknote, Printer, Percent } from 'lucide-react'

interface Product {
  id: string
  barcode: string
  name: string
  category: string
  currentStock: number
  sellPrice: number
}

interface CartItem {
  id: string
  barcode: string
  name: string
  price: number
  quantity: number
  discount: number
  discountType: 'percentage' | 'amount'
}

export default function POSPage() {
  const { user } = useAuth()
  const [barcode, setBarcode] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashAmount, setCashAmount] = useState(0)
  const [transferAmount, setTransferAmount] = useState(0)
  const [bankName, setBankName] = useState('')
  const [lastTransaction, setLastTransaction] = useState<any>(null)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [showDiscountDialog, setShowDiscountDialog] = useState(false)
  const [discountItem, setDiscountItem] = useState<CartItem | null>(null)
  const [discountValue, setDiscountValue] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage')
  const [storeSettings, setStoreSettings] = useState<any>(null)

  useEffect(() => {
    fetchProducts()
    fetchStoreSettings()
  }, [])

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch('/api/settings/public')
      if (response.ok) {
        const data = await response.json()
        setStoreSettings(data)
      }
    } catch (error) {
      console.error('Error fetching store settings:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data.slice(0, 10) : []) // Show first 10 products
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    }
  }

  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert('Stok produk habis!')
      return
    }

    const existingItem = cart.find(item => item.barcode === product.barcode)

    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        alert('Quantity melebihi stok yang tersedia!')
        return
      }
      setCart(cart.map(item =>
        item.barcode === product.barcode
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      const newItem: CartItem = {
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        price: product.sellPrice,
        quantity: 1,
        discount: 0,
        discountType: 'percentage'
      }
      setCart([...cart, newItem])
    }
  }

  const scanBarcode = async () => {
    if (!barcode.trim()) return

    try {
      const response = await fetch(`/api/products/${barcode}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const product = await response.json()
        addToCart(product)
        setBarcode('')
      } else {
        alert('Produk tidak ditemukan!')
      }
    } catch (error) {
      console.error('Error scanning barcode:', error)
      alert('Terjadi kesalahan saat scan barcode')
    }
  }

  const updateQuantity = (barcode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(barcode)
      return
    }

    const product = products.find(p => p.barcode === barcode)
    if (product && newQuantity > product.currentStock) {
      alert('Quantity melebihi stok yang tersedia!')
      return
    }

    setCart(cart.map(item =>
      item.barcode === barcode
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const removeFromCart = (barcode: string) => {
    setCart(cart.filter(item => item.barcode !== barcode))
  }

  const clearCart = () => {
    setCart([])
  }

  const openDiscountDialog = (item: CartItem) => {
    setDiscountItem(item)
    setDiscountValue(item.discount)
    setDiscountType(item.discountType)
    setShowDiscountDialog(true)
  }

  const applyDiscount = () => {
    if (!discountItem) return

    const updatedCart = cart.map(item => {
      if (item.barcode === discountItem.barcode) {
        return {
          ...item,
          discount: discountValue,
          discountType: discountType
        }
      }
      return item
    })

    setCart(updatedCart)
    setShowDiscountDialog(false)
    setDiscountItem(null)
    setDiscountValue(0)
  }

  const calculateItemDiscount = (item: CartItem) => {
    const subtotal = item.price * item.quantity
    if (item.discountType === 'percentage') {
      return (subtotal * item.discount) / 100
    } else {
      return item.discount
    }
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const subtotal = item.price * item.quantity
      const discount = calculateItemDiscount(item)
      return total + subtotal - discount
    }, 0)
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const calculateTotalDiscount = () => {
    return cart.reduce((total, item) => total + calculateItemDiscount(item), 0)
  }

  const setAutoAmount = (method: string) => {
    const total = calculateTotal()
    if (method === 'cash') {
      setCashAmount(total)
      setTransferAmount(0)
    } else if (method === 'transfer') {
      setTransferAmount(total)
      setCashAmount(0)
    }
  }

  const processPayment = async () => {
    if (cart.length === 0) {
      alert('Keranjang kosong!')
      return
    }

    const total = calculateTotal()
    const totalPaid = cashAmount + transferAmount

    if (totalPaid < total) {
      alert('Jumlah pembayaran kurang!')
      return
    }

    setIsProcessingPayment(true)

    try {
      const transactionData = {
        items: cart.map(item => ({
          barcode: item.barcode,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          discountPercent: item.discountType === 'percentage' ? item.discount : 0,
          discountAmount: calculateItemDiscount(item)
        })),
        cashAmount,
        transferAmount,
        bankName: transferAmount > 0 ? bankName : null
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
        credentials: 'include'
      })

      if (response.ok) {
        const transaction = await response.json()
        // Simpan data untuk struk sebelum clear cart
        const receiptData = {
          ...transaction,
          items: cart,
          cashAmount,
          transferAmount,
          user: user
        }
        setLastTransaction(receiptData)
        setShowPaymentDialog(false)
        setShowReceiptDialog(true)
        clearCart()
        setCashAmount(0)
        setTransferAmount(0)
        setBankName('')
        alert('Transaksi berhasil!')
      } else {
        const errorData = await response.json()
        alert(`Gagal memproses transaksi: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Terjadi kesalahan saat memproses pembayaran')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const printReceipt = () => {
    if (!lastTransaction) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Transaksi - ${lastTransaction.code}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          
          /* Thermal printer specific CSS */
          @media print {
            @page {
              size: 58mm auto;
              margin: 0;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .receipt {
              width: 100% !important;
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: 'Roboto', sans-serif; 
            font-size: 12px; 
            margin: 0; 
            padding: 0; 
            line-height: 1.2;
            width: 100%;
          }
          .receipt { 
            width: 100%; 
            max-width: 180px; 
            margin: 0; 
            padding: 2px;
          }
          
          /* Thermal 80mm Support */
          @media print and (min-width: 80mm) {
            .receipt { 
              max-width: 260px !important; /* 68.8mm - optimal untuk 80mm */
              padding: 3px !important;
            }
            body {
              font-size: 13px !important;
            }
            .header h2 {
              font-size: 18px !important;
            }
            .header p {
              font-size: 12px !important;
            }
            .item {
              font-size: 12px !important;
            }
          }
          
          /* Alternative: Manual 80mm class */
          .receipt-80mm { 
            max-width: 260px !important;
            padding: 3px !important;
          }
          .receipt-80mm body {
            font-size: 13px !important;
          }
          .receipt-80mm .header h2 {
            font-size: 18px !important;
          }
          .receipt-80mm .header p {
            font-size: 12px !important;
          }
          .receipt-80mm .item {
            font-size: 12px !important;
          }
          .header { 
            text-align: center; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 8px; 
            margin-bottom: 8px; 
          }
          .header h2 { 
            margin: 0 0 2px 0; 
            font-weight: 700; 
            font-size: 16px; 
          }
          .header p { 
            margin: 1px 0; 
            font-size: 11px; 
            font-weight: 400; 
          }
          .item { 
            display: flex; 
            justify-content: space-between; 
            margin: 2px 0; 
            font-weight: 400; 
          }
          .total { 
            border-top: 1px dashed #000; 
            padding-top: 8px; 
            margin-top: 8px; 
          }
          .footer { 
            text-align: center; 
            margin-top: 15px; 
            font-size: 10px; 
            font-weight: 300; 
          }
          .footer p { 
            margin: 2px 0; 
          }
          
          @media print {
            * {
              margin: 0 !important;
              padding: 0 !important;
            }
            body { 
              margin: 0 !important; 
              padding: 0 !important; 
              width: auto !important;
              font-size: 11px !important;
            }
            .receipt { 
              width: 100% !important; 
              max-width: 180px !important; /* Default 58mm */
              margin: 0 !important; 
              padding: 1px !important;
            }
            
            /* Auto-detect 80mm thermal */
            @media print and (min-width: 300px) {
              .receipt { 
                max-width: 260px !important; /* 80mm thermal */
                padding: 2px !important;
              }
            }
            .header {
              padding-bottom: 6px !important;
              margin-bottom: 6px !important;
            }
            .header h2 {
              font-size: 14px !important;
              margin: 0 !important;
            }
            .header p {
              font-size: 10px !important;
              margin: 0 !important;
            }
            .item {
              font-size: 10px !important;
              margin: 1px 0 !important;
            }
            .total {
              padding-top: 4px !important;
              margin-top: 4px !important;
            }
            .footer {
              margin-top: 8px !important;
              font-size: 8px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>${storeSettings?.storeName || 'GITA FASHION'}</h2>
            <p>${storeSettings?.storeAddress || 'Jl. Fashion Street No. 123'}</p>
            <p>Telp: ${storeSettings?.storePhone || '(021) 123-4567'}</p>
            <p>================================</p>
          </div>
          
          <div class="transaction-info">
            <div class="item"><span>No. Transaksi:</span><span>${lastTransaction.code}</span></div>
            <div class="item"><span>Tanggal:</span><span>${new Date().toLocaleString('id-ID')}</span></div>
            <div class="item"><span>Kasir:</span><span>${user?.name || 'Kasir'}</span></div>
            <p>================================</p>
          </div>

          <div class="items">
            ${(lastTransaction.items || []).map((item: any) => {
      const itemDiscount = item.discountType === 'percentage'
        ? (item.price * item.quantity * item.discount) / 100
        : item.discount
      return `
                <div class="item">
                  <span>${item.name}</span>
                </div>
                <div class="item">
                  <span>${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}</span>
                  <span>Rp ${(item.quantity * item.price).toLocaleString('id-ID')}</span>
                </div>
                ${item.discount > 0 ? `<div class="item"><span>Diskon ${item.discountType === 'percentage' ? item.discount + '%' : 'Rp ' + item.discount.toLocaleString('id-ID')}:</span><span>-Rp ${itemDiscount.toLocaleString('id-ID')}</span></div>` : ''}
              `
    }).join('')}
          </div>

          <div class="total">
            ${(() => {
        const items = lastTransaction.items || []
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        const totalDiscount = items.reduce((sum: number, item: any) => {
          const discount = item.discountType === 'percentage'
            ? (item.price * item.quantity * item.discount) / 100
            : item.discount
          return sum + discount
        }, 0)
        const total = subtotal - totalDiscount
        const cash = lastTransaction.cashAmount || 0
        const transfer = lastTransaction.transferAmount || 0
        const kembalian = Math.max(0, (cash + transfer) - total)

        return `
                <div class="item"><span>Subtotal:</span><span>Rp ${subtotal.toLocaleString('id-ID')}</span></div>
                ${totalDiscount > 0 ? `<div class="item"><span>Total Diskon:</span><span>-Rp ${totalDiscount.toLocaleString('id-ID')}</span></div>` : ''}
                <div class="item"><strong><span>TOTAL:</span><span>Rp ${total.toLocaleString('id-ID')}</span></strong></div>
                <p>================================</p>
                ${cash > 0 ? `<div class="item"><span>Tunai:</span><span>Rp ${cash.toLocaleString('id-ID')}</span></div>` : ''}
                ${transfer > 0 ? `<div class="item"><span>Transfer:</span><span>Rp ${transfer.toLocaleString('id-ID')}</span></div>` : ''}
                <div class="item"><span>Kembalian:</span><span>Rp ${kembalian.toLocaleString('id-ID')}</span></div>
              `
      })()}
          </div>

          <div class="footer">
            <p>${storeSettings?.footerText || 'Terima kasih atas kunjungan Anda!'}</p>
            <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
            <p>${new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>
      </body>
      
      <script>
        // Simple print control - content starts from top
        window.addEventListener('afterprint', function() {
          console.log('Print completed - closing window');
          setTimeout(() => window.close(), 500);
        });
        
        // Auto print after short delay
        setTimeout(() => {
          window.print();
        }, 1000);
        
        // Add paper cut spacing at the end
        document.addEventListener('DOMContentLoaded', function() {
          const receipt = document.querySelector('.receipt');
          if (receipt) {
            const spacer = document.createElement('div');
            spacer.style.height = '10mm';
            spacer.style.width = '100%';
            receipt.appendChild(spacer);
          }
        });
      </script>
      </html>
    `

    // Safe approach for setting print content
    printWindow.document.open()
    printWindow.document.write(receiptContent)
    printWindow.document.close()
    
    // Print will be handled by the script in the HTML
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
        <p className="text-gray-600">Sistem kasir Gita Fashion</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Scanner & Popular Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barcode Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Scanner Barcode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Scan atau ketik barcode produk..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && scanBarcode()}
                  className="flex-1"
                />
                <Button onClick={scanBarcode}>
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Popular Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produk Populer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada produk tersedia
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barcode</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            <Badge variant={product.currentStock <= 5 ? "destructive" : "secondary"}>
                              {product.currentStock}
                            </Badge>
                          </TableCell>
                          <TableCell>Rp {product.sellPrice.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => addToCart(product)}
                              disabled={product.currentStock <= 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Shopping Cart */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang ({cart.length})
                </div>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Keranjang kosong
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const itemSubtotal = item.price * item.quantity
                    const itemDiscount = calculateItemDiscount(item)
                    const itemTotal = itemSubtotal - itemDiscount

                    return (
                      <div key={item.barcode} className="p-3 border rounded space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.barcode}</p>
                            <p className="text-sm">Rp {item.price.toLocaleString()} x {item.quantity}</p>
                            {item.discount > 0 && (
                              <p className="text-xs text-red-600">
                                Diskon: {item.discountType === 'percentage' ? `${item.discount}%` : `Rp ${item.discount.toLocaleString()}`}
                                {' '}(-Rp {itemDiscount.toLocaleString()})
                              </p>
                            )}
                            <p className="text-sm font-bold">Total: Rp {itemTotal.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.barcode, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.barcode, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDiscountDialog(item)}
                              title="Diskon"
                            >
                              %
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.barcode)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total & Payment */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Total Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {calculateSubtotal().toLocaleString()}</span>
                  </div>
                  {calculateTotalDiscount() > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Diskon:</span>
                      <span>-Rp {calculateTotalDiscount().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>Rp {calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setShowPaymentDialog(true)}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proses Pembayaran
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Proses Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Bayar:</span>
                <span>Rp {calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="split">Tunai + Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(paymentMethod === 'cash' || paymentMethod === 'split') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cashAmount">Jumlah Tunai</Label>
                    {paymentMethod === 'cash' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAutoAmount('cash')}
                      >
                        Pas
                      </Button>
                    )}
                  </div>
                  <Input
                    id="cashAmount"
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              )}

              {(paymentMethod === 'transfer' || paymentMethod === 'split') && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="transferAmount">Jumlah Transfer</Label>
                      {paymentMethod === 'transfer' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setAutoAmount('transfer')}
                        >
                          Pas
                        </Button>
                      )}
                    </div>
                    <Input
                      id="transferAmount"
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Nama Bank</Label>
                    <Input
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Contoh: BCA, Mandiri, BRI"
                    />
                  </div>
                </>
              )}

              {(cashAmount + transferAmount) > calculateTotal() && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex justify-between">
                    <span>Kembalian:</span>
                    <span className="font-bold">Rp {((cashAmount + transferAmount) - calculateTotal()).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={processPayment}
                disabled={isProcessingPayment || (cashAmount + transferAmount) < calculateTotal()}
                className="flex-1"
              >
                {isProcessingPayment ? 'Memproses...' : 'Bayar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atur Diskon</DialogTitle>
          </DialogHeader>
          {discountItem && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{discountItem.name}</p>
                <p className="text-sm text-gray-600">Harga: Rp {discountItem.price.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Quantity: {discountItem.quantity}</p>
                <p className="text-sm text-gray-600">Subtotal: Rp {(discountItem.price * discountItem.quantity).toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <Label>Jenis Diskon</Label>
                <Select value={discountType} onValueChange={(value: 'percentage' | 'amount') => setDiscountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                    <SelectItem value="amount">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Nilai Diskon {discountType === 'percentage' ? '(%)' : '(Rp)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  max={discountType === 'percentage' ? 100 : discountItem.price * discountItem.quantity}
                />
              </div>

              {discountValue > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm">
                    Diskon: {discountType === 'percentage'
                      ? `${discountValue}% = Rp ${((discountItem.price * discountItem.quantity * discountValue) / 100).toLocaleString()}`
                      : `Rp ${discountValue.toLocaleString()}`
                    }
                  </p>
                  <p className="text-sm font-bold">
                    Total setelah diskon: Rp {(
                      (discountItem.price * discountItem.quantity) -
                      (discountType === 'percentage'
                        ? (discountItem.price * discountItem.quantity * discountValue) / 100
                        : discountValue
                      )
                    ).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDiscountDialog(false)} className="flex-1">
                  Batal
                </Button>
                <Button onClick={applyDiscount} className="flex-1">
                  Terapkan Diskon
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaksi Berhasil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-green-600 text-lg font-bold">✓ Pembayaran Berhasil</div>
              {lastTransaction && (
                <p className="text-sm text-gray-600">Kode Transaksi: {lastTransaction.code}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowReceiptDialog(false)} className="flex-1">
                Tutup
              </Button>
              <Button onClick={printReceipt} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Cetak Struk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}