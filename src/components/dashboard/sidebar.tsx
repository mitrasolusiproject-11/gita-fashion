'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import Logo from '@/components/ui/logo'
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Clock,
  TrendingDown,
  QrCode
} from 'lucide-react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { href: '/dashboard/pos', label: 'Point of Sale', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { href: '/dashboard/products', label: 'Produk', icon: Package, roles: ['ADMIN', 'MANAGER'] },
  { href: '/dashboard/barcode', label: 'Cetak Barcode', icon: QrCode, roles: ['ADMIN', 'MANAGER'] },
  { href: '/dashboard/transactions', label: 'Transaksi', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { href: '/dashboard/shift', label: 'Tutup Kasir', icon: Clock, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { href: '/dashboard/expenses', label: 'Pengeluaran', icon: TrendingDown, roles: ['ADMIN', 'MANAGER'] },
  { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings, roles: ['ADMIN'] },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <Logo size="md" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems
              .filter(item => item.roles.includes(user?.role || ''))
              .map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
          </nav>


        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}