'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react'
import Image from 'next/image'

interface LogoUploadProps {
  currentLogo?: string
  onLogoChange?: (logoUrl: string) => void
}

export default function LogoUpload({ currentLogo, onLogoChange }: LogoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan')
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setUploadSuccess(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', selectedFile)

      const response = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        setUploadSuccess(true)
        onLogoChange?.(result.logoUrl)
        
        // Clear selection after successful upload
        setTimeout(() => {
          setSelectedFile(null)
          setPreviewUrl(null)
          setUploadSuccess(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }, 2000)
        
        alert('Logo berhasil diupload!')
      } else {
        const error = await response.json()
        alert(`Gagal upload logo: ${error.message}`)
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Terjadi kesalahan saat upload logo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleResetToDefault = async () => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan logo ke default?')) return

    try {
      const response = await fetch('/api/settings/logo', {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        onLogoChange?.('/logo-gita-fashion.svg')
        alert('Logo berhasil direset ke default!')
      } else {
        alert('Gagal reset logo')
      }
    } catch (error) {
      console.error('Error resetting logo:', error)
      alert('Terjadi kesalahan saat reset logo')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo Toko
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Logo Preview */}
        <div className="space-y-2">
          <Label>Logo Saat Ini</Label>
          <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            {currentLogo ? (
              <div className="text-center">
                <Image
                  src={currentLogo}
                  alt="Logo Toko"
                  width={120}
                  height={120}
                  className="mx-auto object-contain"
                  onError={() => {
                    // Fallback to default logo if current logo fails to load
                    onLogoChange?.('/logo-gita-fashion.svg')
                  }}
                />
                <p className="text-sm text-gray-500 mt-2">Logo Aktif</p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                <p>Tidak ada logo</p>
              </div>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="logoFile">Upload Logo Baru</Label>
          <Input
            ref={fileInputRef}
            id="logoFile"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
          <p className="text-xs text-gray-500">
            Format: JPG, PNG, SVG. Maksimal 2MB. Rekomendasi: 200x200px atau rasio 1:1
          </p>
        </div>

        {/* Preview Selected File */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview Logo Baru</Label>
            <div className="relative">
              <div className="flex items-center justify-center p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                <div className="text-center">
                  <Image
                    src={previewUrl}
                    alt="Preview Logo"
                    width={120}
                    height={120}
                    className="mx-auto object-contain"
                  />
                  <p className="text-sm text-blue-600 mt-2">
                    {selectedFile?.name} ({Math.round((selectedFile?.size || 0) / 1024)}KB)
                  </p>
                </div>
              </div>
              
              {/* Remove Selection Button */}
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={handleRemoveSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || uploadSuccess}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : uploadSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Berhasil!
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleResetToDefault}
            disabled={isUploading}
          >
            Reset Default
          </Button>
        </div>

        {/* Upload Guidelines */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-medium mb-2">📋 Panduan Upload Logo:</p>
          <ul className="space-y-1 text-blue-700">
            <li>• Gunakan format PNG atau SVG untuk hasil terbaik</li>
            <li>• Rasio 1:1 (persegi) direkomendasikan</li>
            <li>• Logo akan muncul di login page, sidebar, dan struk</li>
            <li>• Pastikan logo terlihat jelas pada background terang dan gelap</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}