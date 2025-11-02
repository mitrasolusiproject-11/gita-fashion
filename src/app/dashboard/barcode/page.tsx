'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer, CheckSquare, Square, RefreshCw } from 'lucide-react'
import { formatPrice, formatPriceCompact } from '@/lib/format'

interface Product {
  id: string
  barcode: string
  name: string
  categoryId: string | null
  category: string
  initialStock: number
  currentStock: number
  sellPrice: number
  createdAt: string
}

interface Category {
  id: string
  name: string
}

export default function BarcodePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [printQuantities, setPrintQuantities] = useState<Record<string, number>>({})
  const [printerSize, setPrinterSize] = useState<'58mm' | '80mm'>('58mm')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔄 Fetching products and categories...')
      await Promise.all([fetchProducts(), fetchCategories()])
      console.log('✅ Data fetched successfully')
    } catch (err) {
      console.error('❌ Error fetching data:', err)
      setError('Gagal memuat data. Silakan refresh halaman.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      console.log('📦 Fetching products from API...')
      const response = await fetch('/api/products', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('📦 Products API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📦 Products data received:', data?.length || 0, 'items')
        console.log('📦 Sample product:', data?.[0])
        setProducts(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error('📦 Products API error:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('📦 Error fetching products:', error)
      setProducts([])
      throw error
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('📂 Fetching categories from API...')
      const response = await fetch('/api/categories', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('📂 Categories API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📂 Categories data received:', data?.length || 0, 'items')
        setCategories(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error('📂 Categories API error:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('📂 Error fetching categories:', error)
      setCategories([])
      throw error
    }
  }

  const getCategoryName = (product: Product) => {
    return product.category || 'Uncategorized'
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || product.categoryId === categoryFilter
    return matchesSearch && matchesCategory
  })

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
      const newQuantities = { ...printQuantities }
      delete newQuantities[productId]
      setPrintQuantities(newQuantities)
    } else {
      newSelected.add(productId)
      setPrintQuantities(prev => ({ ...prev, [productId]: 1 }))
    }
    setSelectedProducts(newSelected)
  }

  const toggleAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
      setPrintQuantities({})
    } else {
      const newSelected = new Set(filteredProducts.map(p => p.id))
      const newQuantities: Record<string, number> = {}
      filteredProducts.forEach(p => {
        newQuantities[p.id] = 1
      })
      setSelectedProducts(newSelected)
      setPrintQuantities(newQuantities)
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = new Set(selectedProducts)
      newSelected.delete(productId)
      setSelectedProducts(newSelected)
      const newQuantities = { ...printQuantities }
      delete newQuantities[productId]
      setPrintQuantities(newQuantities)
    } else {
      setPrintQuantities(prev => ({ ...prev, [productId]: quantity }))
    }
  }

  const printSelectedBarcodes = async () => {
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id))

    if (selectedProductsList.length === 0) {
      alert('Pilih produk yang akan dicetak barcode-nya')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    try {
      const { generatePrintHTML } = await import('@/lib/barcode-print-template')

      const barcodeData: Array<{ barcode: string, productName?: string, price?: number }> = []

      selectedProductsList.forEach(product => {
        const quantity = printQuantities[product.id] || 1
        for (let i = 0; i < quantity; i++) {
          barcodeData.push({
            barcode: product.barcode,
            productName: product.name,
            price: product.sellPrice
          })
        }
      })

      const printContent = generatePrintHTML(barcodeData, printerSize, formatPriceCompact)

      // Safe approach for setting print content
      printWindow.document.open()
      printWindow.document.write(printContent)
      printWindow.document.close()

      // Auto print when ready
      setTimeout(() => {
        printWindow.print()
      }, 100)
    } catch (error) {
      console.error('Error generating print content:', error)
      alert('Gagal mencetak barcode. Silakan coba lagi.')
    }
  }

  const totalLabels = Object.values(printQuantities).reduce((sum, qty) => sum + qty, 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data produk...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4 text-4xl">⚠️</div>
            <p className="text-red-600 mb-4 font-medium">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cetak Barcode</h1>
        <p className="text-gray-600">Pilih produk dan cetak barcode dalam jumlah banyak</p>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <strong>Status:</strong>
          <span className="text-green-600">
            {products.length} produk dimuat, {categories.length} kategori dimuat
          </span>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Cari produk atau barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kategori</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={printerSize} onValueChange={(value: '58mm' | '80mm') => setPrinterSize(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="58mm">58mm Thermal</SelectItem>
            <SelectItem value="80mm">80mm Thermal</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            onClick={printSelectedBarcodes}
            disabled={selectedProducts.size === 0}
            className="whitespace-nowrap"
          >
            <Printer className="h-4 w-4 mr-2" />
            Cetak {printerSize} ({totalLabels} label)
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daftar Produk ({filteredProducts.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllProducts}
              disabled={filteredProducts.length === 0}
            >
              {selectedProducts.size === filteredProducts.length ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Batal Pilih Semua
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Pilih Semua
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || categoryFilter !== 'ALL' ?
                'Tidak ada produk yang sesuai dengan filter' :
                'Belum ada produk. Silakan tambah produk terlebih dahulu.'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pilih</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead className="w-24">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(product)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(product.sellPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={product.currentStock <= 5 ? "destructive" : "secondary"}>
                          {product.currentStock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {selectedProducts.has(product.id) && (
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={printQuantities[product.id] || 1}
                            onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p><strong>Products Count:</strong> {products.length}</p>
          <p><strong>Filtered Products:</strong> {filteredProducts.length}</p>
        </div>
      )}
    </div>
  )
}