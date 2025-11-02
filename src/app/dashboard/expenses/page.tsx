'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { TrendingDown, Plus, Calendar, DollarSign, Receipt, Trash2 } from 'lucide-react'

interface Expense {
  id: string
  shiftId?: string
  userId: string
  category: string
  description: string
  amount: number
  receipt?: string
  createdAt: string
  updatedAt: string
  user?: {
    name: string
  }
}

const expenseCategories = [
  'Operasional',
  'Pembelian Barang',
  'Transportasi',
  'Makan & Minum',
  'Listrik & Air',
  'Internet & Telepon',
  'Perawatan',
  'Lain-lain'
]

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  
  // Form state
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [receipt, setReceipt] = useState('')

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setExpenses(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setExpenses([])
    }
  }

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !description || amount <= 0) {
      alert('Mohon lengkapi semua field yang diperlukan')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          description,
          amount,
          receipt: receipt || null
        }),
        credentials: 'include'
      })

      if (response.ok) {
        alert('Pengeluaran berhasil ditambahkan!')
        setIsAddDialogOpen(false)
        resetForm()
        fetchExpenses()
      } else {
        const errorData = await response.json()
        alert(`Gagal menambahkan pengeluaran: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Terjadi kesalahan saat menambahkan pengeluaran')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('Pengeluaran berhasil dihapus!')
        fetchExpenses()
      } else {
        const errorData = await response.json()
        alert(`Gagal menghapus pengeluaran: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Terjadi kesalahan saat menghapus pengeluaran')
    }
  }

  const resetForm = () => {
    setCategory('')
    setDescription('')
    setAmount(0)
    setReceipt('')
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const todayExpenses = filteredExpenses.filter(expense => {
    const today = new Date().toDateString()
    const expenseDate = new Date(expense.createdAt).toDateString()
    return today === expenseDate
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengeluaran</h1>
        <p className="text-gray-600">Kelola dan pantau pengeluaran toko</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Semua pengeluaran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {todayExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{todayExpenses.length} transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori Terbanyak</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const categoryCount = filteredExpenses.reduce((acc, expense) => {
                  acc[expense.category] = (acc[expense.category] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                const topCategory = Object.entries(categoryCount).sort(([,a], [,b]) => b - a)[0]
                return topCategory ? topCategory[0] : 'Belum ada'
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Kategori paling sering</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Cari pengeluaran..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kategori</SelectItem>
            {expenseCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengeluaran Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={addExpense} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi pengeluaran..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah (Rp)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt">Nomor Nota/Kwitansi (Opsional)</Label>
                <Input
                  id="receipt"
                  value={receipt}
                  onChange={(e) => setReceipt(e.target.value)}
                  placeholder="Nomor nota atau kwitansi"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || categoryFilter !== 'ALL' ? 'Tidak ada pengeluaran yang sesuai dengan filter' : 'Belum ada pengeluaran'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Petugas</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {expense.description}
                      </TableCell>
                      <TableCell className="font-medium">
                        Rp {expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {expense.receipt ? (
                          <Badge variant="secondary" className="text-xs">
                            <Receipt className="h-3 w-3 mr-1" />
                            {expense.receipt}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{expense.user?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {(user?.role === 'ADMIN' || expense.userId === user?.id) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  )
}