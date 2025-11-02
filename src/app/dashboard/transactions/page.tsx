'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Receipt, Eye, Filter, Calendar, Printer } from 'lucide-react'

interface Transaction {
  id: string
  code: string
  transactionDate: string
  totalItems: number
  cashAmount: number
  transferAmount: number
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED'
  userId: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
  items?: TransactionItem[]
  totalAmount?: number
  subtotal?: number
  totalDiscount?: number
  cashierName?: string
}

interface TransactionItem {
  id: string
  transactionCode: string
  productBarcode: string
  quantity: number
  price: number
  discount: number
  product?: {
    id: string
    barcode: string
    name: string
    sellPrice: number
  }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [storeSettings, setStoreSettings] = useState<any>(null)

  useEffect(() => {
    fetchTransactions()
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

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setTransactions(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    }
  }

  const fetchTransactionDetail = async (code: string) => {
    try {
      console.log('Fetching transaction detail for code:', code)
      const response = await fetch(`/api/transactions/${code}`, {
        credentials: 'include'
      })
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Transaction data:', data)
        setSelectedTransaction(data)
        setIsDetailDialogOpen(true)
      } else {
        try {
          const errorData = await response.json()
          console.error('Error response:', errorData)
          alert(`Gagal mengambil detail transaksi: ${errorData?.error || 'Server error'}`)
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          alert(`Gagal mengambil detail transaksi: HTTP ${response.status}`)
        }
      }
    } catch (error) {
      console.error('Error fetching transaction detail:', error)
      alert('Terjadi kesalahan saat mengambil detail transaksi')
    }
  }

  const openReceiptDialog = async (code: string) => {
    try {
      console.log('Fetching transaction for receipt, code:', code)
      const response = await fetch(`/api/transactions/${code}`, {
        credentials: 'include'
      })
      console.log('Receipt response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Receipt transaction data:', data)
        setSelectedTransaction(data)
        setIsReceiptDialogOpen(true)
      } else {
        try {
          const errorData = await response.json()
          console.error('Receipt error response:', errorData)
          alert(`Gagal mengambil data transaksi: ${errorData?.error || 'Server error'}`)
        } catch (parseError) {
          console.error('Failed to parse receipt error response:', parseError)
          alert(`Gagal mengambil data transaksi: HTTP ${response.status}`)
        }
      }
    } catch (error) {
      console.error('Error fetching transaction for receipt:', error)
      alert('Terjadi kesalahan saat mengambil data transaksi')
    }
  }

  const printReceipt = () => {
    if (!selectedTransaction) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Transaksi - ${selectedTransaction.code}</title>
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
            <div class="item"><span>No. Transaksi:</span><span>${selectedTransaction.code}</span></div>
            <div class="item"><span>Tanggal:</span><span>${new Date(selectedTransaction.transactionDate).toLocaleString('id-ID')}</span></div>
            <div class="item"><span>Kasir:</span><span>${selectedTransaction.cashierName || 'Unknown'}</span></div>
            <p>================================</p>
          </div>

          <div class="items">
            ${(selectedTransaction.items || []).map(item => `
              <div class="item">
                <span>${item.product?.name || 'Unknown Product'}</span>
              </div>
              <div class="item">
                <span>${item.quantity} x ${item.price.toLocaleString('id-ID')}</span>
                <span>${(item.quantity * item.price).toLocaleString('id-ID')}</span>
              </div>
              ${item.discount > 0 ? `<div class="item"><span>Diskon:</span><span>-${item.discount.toLocaleString('id-ID')}</span></div>` : ''}
            `).join('')}
          </div>

          <div class="total">
            <div class="item"><span>Subtotal:</span><span>Rp ${(selectedTransaction.subtotal || 0).toLocaleString('id-ID')}</span></div>
            ${(selectedTransaction.totalDiscount || 0) > 0 ? `<div class="item"><span>Total Diskon:</span><span>-Rp ${(selectedTransaction.totalDiscount || 0).toLocaleString('id-ID')}</span></div>` : ''}
            <div class="item"><strong><span>TOTAL:</span><span>Rp ${(selectedTransaction.totalAmount || 0).toLocaleString('id-ID')}</span></strong></div>
            <p>================================</p>
            ${selectedTransaction.cashAmount > 0 ? `<div class="item"><span>Tunai:</span><span>Rp ${selectedTransaction.cashAmount.toLocaleString('id-ID')}</span></div>` : ''}
            ${selectedTransaction.transferAmount > 0 ? `<div class="item"><span>Transfer:</span><span>Rp ${selectedTransaction.transferAmount.toLocaleString('id-ID')}</span></div>` : ''}
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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || transaction.paymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalTransactions = filteredTransactions.length
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.cashAmount + t.transferAmount, 0)
  const paidTransactions = filteredTransactions.filter(t => t.paymentStatus === 'PAID').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
        <p className="text-gray-600">Kelola dan pantau semua transaksi penjualan</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Transaksi hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Penjualan hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Lunas</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidTransactions}</div>
            <p className="text-xs text-muted-foreground">Dari {totalTransactions} transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Cari kode transaksi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="PAID">Lunas</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== 'ALL' ? 'Tidak ada transaksi yang sesuai dengan filter' : 'Belum ada transaksi'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Transaksi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Total Item</TableHead>
                    <TableHead>Total Bayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.code}</TableCell>
                      <TableCell>{new Date(transaction.transactionDate).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{transaction.totalItems} item</TableCell>
                      <TableCell>Rp {(transaction.cashAmount + transaction.transferAmount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.paymentStatus === 'PAID' ? 'default' :
                          transaction.paymentStatus === 'PENDING' ? 'secondary' : 'destructive'
                        }>
                          {transaction.paymentStatus === 'PAID' ? 'Lunas' :
                           transaction.paymentStatus === 'PENDING' ? 'Pending' : 'Dibatalkan'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fetchTransactionDetail(transaction.code)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReceiptDialog(transaction.code)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Kode Transaksi</p>
                  <p className="font-medium">{selectedTransaction.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="font-medium">{new Date(selectedTransaction.transactionDate).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kasir</p>
                  <p className="font-medium">{selectedTransaction.cashierName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={selectedTransaction.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                    {selectedTransaction.paymentStatus === 'PAID' ? 'Lunas' : 'Pending'}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Item Transaksi</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedTransaction.items || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name || 'Unknown Product'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>Rp {item.price.toLocaleString()}</TableCell>
                        <TableCell>Rp {(item.quantity * item.price - (item.discount || 0)).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {(selectedTransaction.subtotal || 0).toLocaleString()}</span>
                </div>
                {(selectedTransaction.totalDiscount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Total Diskon:</span>
                    <span>-Rp {(selectedTransaction.totalDiscount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>Rp {(selectedTransaction.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {selectedTransaction.cashAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tunai:</span>
                      <span>Rp {selectedTransaction.cashAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedTransaction.transferAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Transfer:</span>
                      <span>Rp {selectedTransaction.transferAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cetak Struk</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold">GITA FASHION</h3>
                <p className="text-sm text-gray-600">Jl. Fashion Street No. 123</p>
                <p className="text-sm text-gray-600">Telp: (021) 123-4567</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>No. Transaksi:</span>
                  <span>{selectedTransaction.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(selectedTransaction.transactionDate).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{selectedTransaction.cashierName || 'Unknown'}</span>
                </div>
              </div>

              <div className="border-t border-b py-2">
                {(selectedTransaction.items || []).map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">{item.product?.name || 'Unknown Product'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{item.quantity} x Rp {item.price.toLocaleString()}</span>
                      <span>Rp {(item.quantity * item.price).toLocaleString()}</span>
                    </div>
                    {(item.discount || 0) > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Diskon:</span>
                        <span>-Rp {(item.discount || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {(selectedTransaction.subtotal || 0).toLocaleString()}</span>
                </div>
                {(selectedTransaction.totalDiscount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Total Diskon:</span>
                    <span>-Rp {(selectedTransaction.totalDiscount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>Rp {(selectedTransaction.totalAmount || 0).toLocaleString()}</span>
                </div>
                {selectedTransaction.cashAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tunai:</span>
                    <span>Rp {selectedTransaction.cashAmount.toLocaleString()}</span>
                  </div>
                )}
                {selectedTransaction.transferAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Transfer:</span>
                    <span>Rp {selectedTransaction.transferAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={printReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak Struk
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}