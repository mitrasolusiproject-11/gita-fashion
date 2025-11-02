'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock, DollarSign, TrendingUp, TrendingDown, Calculator, Printer } from 'lucide-react'

interface Shift {
  id: string
  userId: string
  startTime: string
  endTime?: string
  startingCash: number
  endingCash?: number
  totalSales: number
  totalTransactions: number
  totalExpenses: number
  status: 'OPEN' | 'CLOSED'
  notes?: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface ShiftSummary {
  totalSales: number
  totalTransactions: number
  totalExpenses: number
  netCash: number
  actualCash: number
  difference: number
}

export default function ShiftPage() {
  const { user } = useAuth()
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isStartShiftDialogOpen, setIsStartShiftDialogOpen] = useState(false)
  const [isCloseShiftDialogOpen, setIsCloseShiftDialogOpen] = useState(false)
  const [startingCash, setStartingCash] = useState(0)
  const [endingCash, setEndingCash] = useState(0)
  const [notes, setNotes] = useState('')
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null)

  useEffect(() => {
    fetchShifts()
    checkCurrentShift()
  }, [])

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/shifts', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setShifts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
    }
  }

  const checkCurrentShift = async () => {
    try {
      const response = await fetch('/api/shifts?status=OPEN', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const openShifts = Array.isArray(data) ? data : []
        const userOpenShift = openShifts.find(shift => shift.userId === user?.id)
        setCurrentShift(userOpenShift || null)
      }
    } catch (error) {
      console.error('Error checking current shift:', error)
    }
  }

  const startShift = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          startingCash
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const newShift = await response.json()
        setCurrentShift(newShift)
        setIsStartShiftDialogOpen(false)
        setStartingCash(0)
        alert('Shift berhasil dimulai!')
        fetchShifts()
      } else {
        const errorData = await response.json()
        alert(`Gagal memulai shift: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error starting shift:', error)
      alert('Terjadi kesalahan saat memulai shift')
    }
  }

  const closeShift = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'close',
          endingCash,
          notes
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        setShiftSummary(result.summary)
        setCurrentShift(null)
        setIsCloseShiftDialogOpen(false)
        setEndingCash(0)
        setNotes('')
        alert('Shift berhasil ditutup!')
        fetchShifts()
      } else {
        const errorData = await response.json()
        alert(`Gagal menutup shift: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error closing shift:', error)
      alert('Terjadi kesalahan saat menutup shift')
    }
  }

  const printShiftReport = () => {
    if (!shiftSummary) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Tutup Kasir</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 1px solid #000; padding-top: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>LAPORAN TUTUP KASIR</h2>
          <p>Gita Fashion</p>
          <p>${new Date().toLocaleString('id-ID')}</p>
        </div>
        
        <div class="section">
          <h3>Kasir: ${user?.name}</h3>
          <div class="item"><span>Waktu Tutup:</span><span>${new Date().toLocaleString('id-ID')}</span></div>
        </div>

        <div class="section">
          <h3>Ringkasan Penjualan</h3>
          <div class="item"><span>Total Transaksi:</span><span>${shiftSummary.totalTransactions}</span></div>
          <div class="item"><span>Total Penjualan:</span><span>Rp ${shiftSummary.totalSales.toLocaleString('id-ID')}</span></div>
          <div class="item"><span>Total Pengeluaran:</span><span>Rp ${shiftSummary.totalExpenses.toLocaleString('id-ID')}</span></div>
        </div>

        <div class="section">
          <h3>Kas</h3>
          <div class="item"><span>Kas Awal:</span><span>Rp ${(currentShift?.startingCash || 0).toLocaleString('id-ID')}</span></div>
          <div class="item"><span>Kas Seharusnya:</span><span>Rp ${shiftSummary.netCash.toLocaleString('id-ID')}</span></div>
          <div class="item"><span>Kas Aktual:</span><span>Rp ${shiftSummary.actualCash.toLocaleString('id-ID')}</span></div>
          <div class="item total"><span>Selisih:</span><span>Rp ${shiftSummary.difference.toLocaleString('id-ID')}</span></div>
        </div>
      </body>
      </html>
    `

    // Safe approach for setting print content
    printWindow.document.open()
    printWindow.document.write(reportContent)
    printWindow.document.close()
    
    // Auto print when ready
    setTimeout(() => {
      printWindow.print()
    }, 100)
    
    // Close the print window after a short delay
    setTimeout(() => {
      printWindow.close()
    }, 1000)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tutup Kasir</h1>
        <p className="text-gray-600">Kelola shift kasir dan hitung kas</p>
      </div>

      {/* Current Shift Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Shift Saat Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentShift ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="default">SHIFT AKTIF</Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    Petugas: {user?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Dimulai: {new Date(currentShift.startTime).toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Kas Awal: Rp {currentShift.startingCash.toLocaleString()}
                  </p>
                </div>
                <Button onClick={() => setIsCloseShiftDialogOpen(true)}>
                  Tutup Shift
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Tidak ada shift aktif</p>
              <Dialog open={isStartShiftDialogOpen} onOpenChange={setIsStartShiftDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Mulai Shift</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mulai Shift Kasir</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={startShift} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="startingCash">Kas Awal (Rp)</Label>
                      <Input
                        id="startingCash"
                        type="number"
                        value={startingCash}
                        onChange={(e) => setStartingCash(parseFloat(e.target.value) || 0)}
                        placeholder="Masukkan jumlah kas awal"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsStartShiftDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit">Mulai Shift</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shift History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Shift</CardTitle>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada riwayat shift
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Petugas</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Kas Awal</TableHead>
                  <TableHead>Kas Akhir</TableHead>
                  <TableHead>Penjualan</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(shift.startTime).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(shift.startTime).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {shift.endTime && ` - ${new Date(shift.endTime).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{shift.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{shift.user?.role}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {shift.endTime 
                        ? `${Math.round((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60))} jam`
                        : 'Aktif'
                      }
                    </TableCell>
                    <TableCell>Rp {shift.startingCash.toLocaleString()}</TableCell>
                    <TableCell>
                      {shift.endingCash ? `Rp ${shift.endingCash.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>Rp {shift.totalSales.toLocaleString()}</TableCell>
                    <TableCell>
                      {shift.notes ? (
                        <div className="max-w-xs">
                          <p className="text-sm truncate" title={shift.notes}>
                            {shift.notes}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={shift.status === 'OPEN' ? 'default' : 'secondary'}>
                        {shift.status === 'OPEN' ? 'Aktif' : 'Tutup'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Close Shift Dialog */}
      <Dialog open={isCloseShiftDialogOpen} onOpenChange={setIsCloseShiftDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tutup Shift Kasir</DialogTitle>
          </DialogHeader>
          <form onSubmit={closeShift} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endingCash">Kas Akhir (Rp)</Label>
              <Input
                id="endingCash"
                type="number"
                value={endingCash}
                onChange={(e) => setEndingCash(parseFloat(e.target.value) || 0)}
                placeholder="Hitung kas fisik saat ini"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk shift ini"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCloseShiftDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Tutup Shift</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shift Summary Dialog */}
      {shiftSummary && (
        <Dialog open={!!shiftSummary} onOpenChange={() => setShiftSummary(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ringkasan Shift</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Total Penjualan</p>
                  <p className="font-bold">Rp {shiftSummary.totalSales.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <Calculator className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">Transaksi</p>
                  <p className="font-bold">{shiftSummary.totalTransactions}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Kas Seharusnya:</span>
                  <span>Rp {shiftSummary.netCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kas Aktual:</span>
                  <span>Rp {shiftSummary.actualCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Selisih:</span>
                  <span className={shiftSummary.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Rp {shiftSummary.difference.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShiftSummary(null)} className="flex-1">
                  Tutup
                </Button>
                <Button onClick={printShiftReport} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak Laporan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}