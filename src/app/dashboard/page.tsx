'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/session-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalProducts: 0,
    todaySales: 0,
    todayTransactions: 0,
    totalCustomers: 0,
    recentTransactions: [],
    lowStockProducts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      
      if (response.ok) {
        setStats({
          totalProducts: data.totalProducts || 0,
          todaySales: data.todaySales || 0,
          todayTransactions: data.todayTransactions || 0,
          totalCustomers: 0, // Will be updated when customers API is ready
          recentTransactions: data.recentTransactions || [],
          lowStockProducts: data.lowStockProducts || []
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const dashboardStats = [
    {
      title: 'Total Produk',
      value: loading ? '...' : stats.totalProducts.toString(),
      description: 'Produk terdaftar',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Penjualan Hari Ini',
      value: loading ? '...' : `Rp ${stats.todaySales.toLocaleString()}`,
      description: 'Total penjualan',
      icon: ShoppingCart,
      color: 'text-green-600'
    },
    {
      title: 'Transaksi',
      value: loading ? '...' : stats.todayTransactions.toString(),
      description: 'Transaksi hari ini',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Stok Menipis',
      value: loading ? '...' : stats.lowStockProducts.length.toString(),
      description: 'Produk stok rendah',
      icon: Users,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Selamat datang, {user?.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Penjualan Terbaru</CardTitle>
            <CardDescription>
              Transaksi penjualan terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : stats.recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada transaksi
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{transaction.code}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.transactionDate).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        Rp {((transaction.cashAmount || 0) + (transaction.transferAmount || 0)).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.totalItems} item
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stok Menipis</CardTitle>
            <CardDescription>
              Produk dengan stok rendah (≤ 5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : stats.lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Semua produk stok aman
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.map((product: any) => (
                  <div key={product.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.barcode}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${product.currentStock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        Stok: {product.currentStock}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.category?.name || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}