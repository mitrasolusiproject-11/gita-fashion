'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Store, User, Printer, Database, Shield, Plus, Edit, Trash2, Users } from 'lucide-react'
import LogoUpload from '@/components/settings/logo-upload'
import ChangePasswordDialog from '@/components/settings/change-password-dialog'

interface UserData {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importType, setImportType] = useState('products')
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [currentLogo, setCurrentLogo] = useState('/logo-gita-fashion.svg')
  const [userFormData, setUserFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'CASHIER'
  })
  
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Gita Fashion',
    storeAddress: 'Jl. Fashion Street No. 123, Jakarta',
    storePhone: '021-12345678',
    storeEmail: 'info@gitafashion.com',
    currency: 'IDR',
    taxRate: 10,
    thermalPrinterSize: '58mm'
  })

  const [printerSettings, setPrinterSettings] = useState({
    printerName: 'Thermal Printer 80mm',
    paperSize: '80mm',
    printLogo: true,
    printFooter: true,
    footerText: 'Terima kasih atas kunjungan Anda!'
  })

  useEffect(() => {
    fetchSettings()
    fetchCurrentLogo()
    if (user?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [user])

  const fetchCurrentLogo = async () => {
    try {
      const response = await fetch('/api/settings/logo', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentLogo(data.logoUrl || '/logo-gita-fashion.svg')
      }
    } catch (error) {
      console.error('Error fetching current logo:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setStoreSettings({
          storeName: data.storeName || 'Gita Fashion',
          storeAddress: data.storeAddress || 'Jl. Fashion Street No. 123, Jakarta',
          storePhone: data.storePhone || '021-12345678',
          storeEmail: data.storeEmail || 'info@gitafashion.com',
          currency: data.currency || 'IDR',
          taxRate: parseFloat(data.taxRate) || 10,
          thermalPrinterSize: data.thermalPrinterSize || '58mm'
        })
        setPrinterSettings({
          printerName: data.printerName || 'Thermal Printer 80mm',
          paperSize: data.paperSize || '80mm',
          printLogo: data.printLogo === 'true',
          printFooter: data.printFooter === 'true',
          footerText: data.footerText || 'Terima kasih atas kunjungan Anda!'
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleStoreSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeSettings),
        credentials: 'include'
      })

      if (response.ok) {
        alert('Pengaturan toko berhasil disimpan!')
      } else {
        alert('Gagal menyimpan pengaturan toko')
      }
    } catch (error) {
      console.error('Error saving store settings:', error)
      alert('Terjadi kesalahan saat menyimpan pengaturan toko')
    }
  }

  const handlePrinterSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printerSettings),
        credentials: 'include'
      })

      if (response.ok) {
        alert('Pengaturan printer berhasil disimpan!')
      } else {
        alert('Gagal menyimpan pengaturan printer')
      }
    } catch (error) {
      console.error('Error saving printer settings:', error)
      alert('Terjadi kesalahan saat menyimpan pengaturan printer')
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userFormData),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchUsers()
        setIsAddUserDialogOpen(false)
        setUserFormData({
          email: '',
          name: '',
          password: '',
          role: 'CASHIER'
        })
        alert('User berhasil ditambahkan!')
      } else {
        alert('Gagal menambahkan user')
      }
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Terjadi kesalahan saat menambahkan user')
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userFormData.name,
          email: userFormData.email,
          role: userFormData.role
        }),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchUsers()
        setIsEditUserDialogOpen(false)
        setEditingUser(null)
        alert('User berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Terjadi kesalahan saat memperbarui user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchUsers()
        alert('User berhasil dihapus!')
      } else {
        alert('Gagal menghapus user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Terjadi kesalahan saat menghapus user')
    }
  }

  const openEditDialog = (userData: UserData) => {
    setEditingUser(userData)
    setUserFormData({
      email: userData.email,
      name: userData.name,
      password: '',
      role: userData.role
    })
    setIsEditUserDialogOpen(true)
  }

  const handleBackupDatabase = async () => {
    try {
      const response = await fetch('/api/backup', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `gita-fashion-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('Backup database berhasil diunduh!')
      } else {
        alert('Gagal melakukan backup database')
      }
    } catch (error) {
      console.error('Error backing up database:', error)
      alert('Gagal melakukan backup database')
    }
  }

  const handleExportData = async (type: string = 'transactions') => {
    try {
      const response = await fetch(`/api/export?type=${type}&format=csv`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Set filename based on type
        const typeNames = {
          'transactions': 'transaksi',
          'products': 'produk',
          'sales': 'penjualan',
          'shifts': 'shift',
          'expenses': 'pengeluaran'
        }
        const fileName = `${typeNames[type as keyof typeof typeNames] || 'data'}-${new Date().toISOString().split('T')[0]}.csv`
        a.download = fileName
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert(`Export data ${typeNames[type as keyof typeof typeNames] || 'data'} berhasil diunduh!`)
      } else {
        alert('Gagal melakukan export data')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Gagal melakukan export data')
    }
  }

  const handleImportData = async () => {
    if (!importFile) {
      alert('Pilih file untuk diimport')
      return
    }

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('type', importType)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Import berhasil!\n${result.message}\n\nBerhasil: ${result.successCount}\nError: ${result.errorCount}`)
        if (result.errors && result.errors.length > 0) {
          console.log('Import errors:', result.errors)
        }
        setIsImportDialogOpen(false)
        setImportFile(null)
      } else {
        alert(`Gagal import data: ${result.error}`)
      }
    } catch (error) {
      console.error('Error importing data:', error)
      alert('Terjadi kesalahan saat import data')
    } finally {
      setIsImporting(false)
    }
  }

  const handleRestoreDatabase = async () => {
    if (!restoreFile) {
      alert('Pilih file backup untuk direstore')
      return
    }

    if (!confirm('PERINGATAN: Restore database akan menimpa data yang ada. Apakah Anda yakin?')) {
      return
    }

    setIsRestoring(true)
    try {
      const formData = new FormData()
      formData.append('file', restoreFile)

      const response = await fetch('/api/restore', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Restore berhasil!\n${result.message}\n\nRecord diproses: ${result.restoredCount}\nError: ${result.errorCount}`)
        if (result.errors && result.errors.length > 0) {
          console.log('Restore errors:', result.errors)
        }
        setIsRestoreDialogOpen(false)
        setRestoreFile(null)
        // Refresh page to show updated data
        window.location.reload()
      } else {
        alert(`Gagal restore database: ${result.error}`)
      }
    } catch (error) {
      console.error('Error restoring database:', error)
      alert('Terjadi kesalahan saat restore database')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-gray-600">Konfigurasi aplikasi kasir Gita Fashion</p>
      </div>

      {/* Logo Upload Section - Admin Only */}
      {user?.role === 'ADMIN' && (
        <div className="mb-6">
          <LogoUpload 
            currentLogo={currentLogo}
            onLogoChange={(newLogoUrl) => {
              setCurrentLogo(newLogoUrl)
              // Trigger logo refresh in other components
              window.dispatchEvent(new CustomEvent('logoChanged', { detail: { logoUrl: newLogoUrl } }))
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">




        {/* Store Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Pengaturan Toko
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStoreSettingsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nama Toko</Label>
                <Input
                  id="storeName"
                  value={storeSettings.storeName}
                  onChange={(e) => setStoreSettings({...storeSettings, storeName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeAddress">Alamat Toko</Label>
                <Input
                  id="storeAddress"
                  value={storeSettings.storeAddress}
                  onChange={(e) => setStoreSettings({...storeSettings, storeAddress: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storePhone">Telepon</Label>
                <Input
                  id="storePhone"
                  value={storeSettings.storePhone}
                  onChange={(e) => setStoreSettings({...storeSettings, storePhone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeEmail">Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={storeSettings.storeEmail}
                  onChange={(e) => setStoreSettings({...storeSettings, storeEmail: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Mata Uang</Label>
                  <Select value={storeSettings.currency} onValueChange={(value) => setStoreSettings({...storeSettings, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Pajak (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={storeSettings.taxRate || 0}
                    onChange={(e) => setStoreSettings({...storeSettings, taxRate: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thermalPrinterSize">Ukuran Thermal Printer</Label>
                  <Select value={storeSettings.thermalPrinterSize} onValueChange={(value) => setStoreSettings({...storeSettings, thermalPrinterSize: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm Thermal Printer</SelectItem>
                      <SelectItem value="80mm">80mm Thermal Printer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Simpan Pengaturan Toko
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Printer Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Pengaturan Printer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePrinterSettingsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="printerName">Nama Printer</Label>
                <Input
                  id="printerName"
                  value={printerSettings.printerName}
                  onChange={(e) => setPrinterSettings({...printerSettings, printerName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paperSize">Ukuran Kertas</Label>
                <Select value={printerSettings.paperSize} onValueChange={(value) => setPrinterSettings({...printerSettings, paperSize: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Teks Footer Struk</Label>
                <Input
                  id="footerText"
                  value={printerSettings.footerText}
                  onChange={(e) => setPrinterSettings({...printerSettings, footerText: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <Label>Opsi Cetak</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={printerSettings.printLogo}
                      onChange={(e) => setPrinterSettings({...printerSettings, printLogo: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Cetak Logo Toko</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={printerSettings.printFooter}
                      onChange={(e) => setPrinterSettings({...printerSettings, printFooter: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Cetak Footer</span>
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Simpan Pengaturan Printer
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Pengguna
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <div className="p-2 bg-gray-50 rounded">{user?.name}</div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="p-2 bg-gray-50 rounded">{user?.email}</div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div>
                <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {user?.role}
                </Badge>
              </div>
            </div>
            <ChangePasswordDialog>
              <Button variant="outline" className="w-full">
                Ubah Password
              </Button>
            </ChangePasswordDialog>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-500">Versi Aplikasi</Label>
                <div className="font-medium">v1.0.0</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Database</Label>
                <div className="font-medium">SQLite</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Framework</Label>
                <div className="font-medium">Next.js 16</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">ORM</Label>
                <div className="font-medium">Drizzle</div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleBackupDatabase}>
                  <Database className="h-4 w-4 mr-2" />
                  Backup
                </Button>
                <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Restore Database</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          ⚠️ <strong>PERINGATAN:</strong> Restore akan menimpa semua data yang ada. 
                          Pastikan Anda sudah melakukan backup terlebih dahulu.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="restoreFile">Pilih File Backup (.json)</Label>
                        <Input
                          id="restoreFile"
                          type="file"
                          accept=".json"
                          onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsRestoreDialogOpen(false)}
                          className="flex-1"
                        >
                          Batal
                        </Button>
                        <Button 
                          onClick={handleRestoreDatabase}
                          disabled={!restoreFile || isRestoring}
                          className="flex-1"
                        >
                          {isRestoring ? 'Restoring...' : 'Restore Database'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Data</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Pilih jenis data yang ingin diekspor dalam format CSV:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={() => {
                          handleExportData('transactions')
                          setIsExportDialogOpen(false)
                        }}
                      >
                        📊 Data Transaksi
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={() => {
                          handleExportData('products')
                          setIsExportDialogOpen(false)
                        }}
                      >
                        📦 Data Produk
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={() => {
                          handleExportData('sales')
                          setIsExportDialogOpen(false)
                        }}
                      >
                        🛒 Data Penjualan Detail
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={() => {
                          handleExportData('shifts')
                          setIsExportDialogOpen(false)
                        }}
                      >
                        ⏰ Data Shift Kasir
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start"
                        onClick={() => {
                          handleExportData('expenses')
                          setIsExportDialogOpen(false)
                        }}
                      >
                        💸 Data Pengeluaran
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Import data dari file CSV. Pastikan format file sesuai dengan template.
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="importType">Jenis Data</Label>
                      <Select value={importType} onValueChange={setImportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="products">📦 Data Produk</SelectItem>
                          <SelectItem value="categories">📂 Data Kategori</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="importFile">Pilih File CSV</Label>
                      <Input
                        id="importFile"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="font-medium mb-2">Format CSV yang diperlukan:</p>
                      {importType === 'products' && (
                        <p>Barcode, Nama Produk, Kategori ID, Harga Jual, Stok Awal</p>
                      )}
                      {importType === 'categories' && (
                        <p>ID, Nama Kategori</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsImportDialogOpen(false)}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                      <Button 
                        onClick={handleImportData}
                        disabled={!importFile || isImporting}
                        className="flex-1"
                      >
                        {isImporting ? 'Importing...' : 'Import Data'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management - Only for Admin */}
      {user?.role === 'ADMIN' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manajemen User
              </div>
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah User Baru</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userEmail">Email</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userName">Nama</Label>
                      <Input
                        id="userName"
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userPassword">Password</Label>
                      <Input
                        id="userPassword"
                        type="password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userRole">Role</Label>
                      <Select value={userFormData.role} onValueChange={(value) => setUserFormData({...userFormData, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="CASHIER">Kasir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit">Tambah User</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>{userData.name}</TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>
                      <Badge variant={userData.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {userData.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(userData.createdAt).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(userData)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(userData.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editUserEmail">Email</Label>
              <Input
                id="editUserEmail"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUserName">Nama</Label>
              <Input
                id="editUserName"
                value={userFormData.name}
                onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUserRole">Role</Label>
              <Select value={userFormData.role} onValueChange={(value) => setUserFormData({...userFormData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="CASHIER">Kasir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}