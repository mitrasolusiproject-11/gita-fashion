'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// Alert component not available, using custom styling
import { Eye, EyeOff, Lock } from 'lucide-react'

interface ChangePasswordDialogProps {
  children: React.ReactNode
}

export default function ChangePasswordDialog({ children }: ChangePasswordDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    console.log('🔐 Change password form submitted')

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Semua field harus diisi')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Konfirmasi password tidak sesuai')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('Password baru harus berbeda dengan password lama')
      return
    }

    setIsLoading(true)
    console.log('🔐 Sending change password request...')

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      console.log('🔐 Change password response status:', response.status)

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Gagal mengubah password'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        
        if (response.status === 401) {
          errorMessage = 'Sesi Anda telah berakhir. Silakan login ulang.'
        }
        
        setError(errorMessage)
        console.error('🔐 Change password failed:', errorMessage)
        return
      }

      const data = await response.json()
      console.log('🔐 Change password success:', data)

      setSuccess('Password berhasil diubah!')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setIsOpen(false)
        setSuccess('')
      }, 2000)

    } catch (error) {
      console.error('🔐 Error changing password:', error)
      setError('Terjadi kesalahan saat mengubah password. Periksa koneksi internet Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setError('')
    setSuccess('')
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('🔐 Dialog state changed:', open)
      setIsOpen(open)
    }}>
      <DialogTrigger asChild onClick={() => console.log('🔐 Change password button clicked')}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Ubah Password
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-800 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 rounded-md border border-green-200 bg-green-50 text-green-800 text-sm">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Lama</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Masukkan password lama"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isLoading}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Masukkan password baru (minimal 6 karakter)"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Mengubah...' : 'Ubah Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}