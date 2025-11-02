'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Package, Barcode } from 'lucide-react'
import BarcodeGenerator from '@/components/barcode/barcode-generator'

interface Product {
  id: string
  barcode: string
  name: string
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [stockAmount, setStockAmount] = useState(0)
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    initialStock: 0,
    sellPrice: 0
  })

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    sellPrice: 0
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // Ensure data is an array
        if (Array.isArray(data)) {
          setProducts(data)
        } else {
          console.error('API returned non-array data:', data)
          setProducts([])
        }
      } else {
        console.error('Failed to fetch products:', response.status)
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const generateBarcode = () => {
    const timestamp = Date.now().toString()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const barcode = `${timestamp.slice(-6)}${random}`
    setFormData(prev => ({ ...prev, barcode }))
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchProducts()
        setIsAddDialogOpen(false)
        setFormData({
          barcode: '',
          name: '',
          category: '',
          initialStock: 0,
          sellPrice: 0
        })
        alert('Produk berhasil ditambahkan!')
      } else {
        alert('Gagal menambahkan produk')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Terjadi kesalahan saat menambahkan produk')
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingProduct) return

    try {
      const response = await fetch(`/api/products/${editingProduct.barcode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchProducts()
        setIsEditDialogOpen(false)
        setEditingProduct(null)
        alert('Produk berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui produk')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Terjadi kesalahan saat memperbarui produk')
    }
  }

  const handleDeleteProduct = async (barcode: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return

    try {
      const response = await fetch(`/api/products/${barcode}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchProducts()
        alert('Produk berhasil dihapus!')
      } else {
        alert('Gagal menghapus produk')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Terjadi kesalahan saat menghapus produk')
    }
  }

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stockProduct) return

    try {
      const response = await fetch(`/api/products/${stockProduct.barcode}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'updateStock',
          amount: stockAmount 
        }),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchProducts()
        setIsStockDialogOpen(false)
        setStockProduct(null)
        setStockAmount(0)
        alert('Stok berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui stok')
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('Terjadi kesalahan saat memperbarui stok')
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setEditFormData({
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      sellPrice: product.sellPrice
    })
    setIsEditDialogOpen(true)
  }

  const openStockDialog = (product: Product) => {
    setStockProduct(product)
    setStockAmount(0)
    setIsStockDialogOpen(true)
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName }),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchCategories()
        setIsAddCategoryDialogOpen(false)
        setNewCategoryName('')
        alert('Kategori berhasil ditambahkan!')
      } else {
        alert('Gagal menambahkan kategori')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Terjadi kesalahan saat menambahkan kategori')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
        <p className="text-gray-600">Kelola inventaris produk Gita Fashion</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Cari produk, barcode, atau kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        
        <div className="flex gap-2">
          <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Kategori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kategori Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Nama Kategori</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Masukkan nama kategori"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Tambah Kategori</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Produk Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <Label htmlFor="barcode">Barcode</Label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="Barcode produk"
                      required
                    />
                    <Button type="button" onClick={generateBarcode} variant="outline">
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nama produk"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="initialStock">Stok Awal</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    value={formData.initialStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, initialStock: parseInt(e.target.value) || 0 }))}
                    placeholder="Jumlah stok awal"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sellPrice">Harga Jual</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, sellPrice: parseInt(e.target.value) || 0 }))}
                    placeholder="Harga jual"
                    min="0"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Tambah Produk</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Daftar Produk ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Tidak ada produk yang sesuai dengan pencarian' : 'Belum ada produk'}
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
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono">{product.barcode}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <Badge variant={product.currentStock <= 5 ? "destructive" : "secondary"}>
                          {product.currentStock}
                        </Badge>
                      </TableCell>
                      <TableCell>Rp {product.sellPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={product.currentStock > 0 ? "default" : "destructive"}>
                          {product.currentStock > 0 ? 'Tersedia' : 'Habis'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStockDialog(product)}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Barcode className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.barcode)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProduct} className="space-y-4">
            <div>
              <Label htmlFor="editBarcode">Barcode</Label>
              <Input
                id="editBarcode"
                value={editFormData.barcode}
                onChange={(e) => setEditFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="Barcode produk"
                required
              />
            </div>

            <div>
              <Label htmlFor="editName">Nama Produk</Label>
              <Input
                id="editName"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nama produk"
                required
              />
            </div>

            <div>
              <Label htmlFor="editCategory">Kategori</Label>
              <Select value={editFormData.category} onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editSellPrice">Harga Jual</Label>
              <Input
                id="editSellPrice"
                type="number"
                value={editFormData.sellPrice}
                onChange={(e) => setEditFormData(prev => ({ ...prev, sellPrice: parseInt(e.target.value) || 0 }))}
                placeholder="Harga jual"
                min="0"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Update Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stok Produk</DialogTitle>
          </DialogHeader>
          {stockProduct && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Produk: {stockProduct.name}</p>
                <p className="text-sm text-gray-600">Stok Saat Ini: {stockProduct.currentStock}</p>
              </div>
              <form onSubmit={handleStockUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="stockAmount">Jumlah Penambahan Stok</Label>
                  <Input
                    id="stockAmount"
                    type="number"
                    value={stockAmount}
                    onChange={(e) => setStockAmount(parseInt(e.target.value) || 0)}
                    placeholder="Masukkan jumlah stok yang ditambahkan"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsStockDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Update Stok</Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Display Dialog */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Barcode Produk</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600">Barcode: {selectedProduct.barcode}</p>
              </div>
              <BarcodeGenerator 
                value={selectedProduct.barcode} 
                productName={selectedProduct.name}
                price={selectedProduct.sellPrice}
                showProductInfo={true}
              />
              <div className="flex justify-end">
                <Button onClick={() => setSelectedProduct(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}