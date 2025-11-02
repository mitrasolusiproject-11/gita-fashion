import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-4xl'
}

export default function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  const [logoUrl, setLogoUrl] = useState('/logo-gita-fashion.svg')

  useEffect(() => {
    // Fetch current logo URL from API
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/settings/logo')
        if (response.ok) {
          const data = await response.json()
          setLogoUrl(data.logoUrl || '/logo-gita-fashion.svg')
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
        // Keep default logo on error
      }
    }

    fetchLogo()

    // Listen for logo change events
    const handleLogoChange = (event: CustomEvent) => {
      setLogoUrl(event.detail.logoUrl)
      setImageError(false) // Reset error state when logo changes
    }

    window.addEventListener('logoChanged', handleLogoChange as EventListener)

    return () => {
      window.removeEventListener('logoChanged', handleLogoChange as EventListener)
    }
  }, [])

  if (variant === 'icon') {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        {!imageError ? (
          <Image
            src={logoUrl}
            alt="Gita Fashion"
            width={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
            height={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
            className="object-contain"
            priority
            onError={() => {
              console.log('Logo image failed to load, using SVG fallback')
              setImageError(true)
            }}
          />
        ) : (
          <LogoSVG size={size} />
        )}
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={`${className} flex items-center`}>
        <span className={`font-bold text-yellow-400 ${textSizeClasses[size]}`}>
          Gita Fashion
        </span>
      </div>
    )
  }

  // Full logo with icon and text
  return (
    <div className={`${className} flex items-center gap-3`}>
      <div className={sizeClasses[size]}>
        {!imageError ? (
          <Image
            src={logoUrl}
            alt="Gita Fashion"
            width={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
            height={size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96}
            className="object-contain"
            priority
            onError={() => {
              console.log('Logo image failed to load, using SVG fallback')
              setImageError(true)
            }}
          />
        ) : (
          <LogoSVG size={size} />
        )}
      </div>
      <span className={`font-bold text-yellow-400 ${textSizeClasses[size]}`}>
        Gita Fashion
      </span>
    </div>
  )
}

// Alternative SVG-based logo component for better customization
export function LogoSVG({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) {
  const dimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 }
  }

  const { width, height } = dimensions[size]

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circular background */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="#1f2937"
        stroke="#fbbf24"
        strokeWidth="2"
      />
      
      {/* GF Text */}
      <text
        x="25"
        y="45"
        fontSize="24"
        fontWeight="bold"
        fill="#fbbf24"
        fontFamily="Arial, sans-serif"
      >
        G
      </text>
      
      {/* Fashion silhouette */}
      <path
        d="M45 25 L45 35 L50 40 L55 35 L55 25 L50 20 Z M45 40 L45 70 L48 75 L52 75 L55 70 L55 40"
        fill="#fbbf24"
        stroke="#fbbf24"
        strokeWidth="1"
      />
      
      <text
        x="65"
        y="45"
        fontSize="24"
        fontWeight="bold"
        fill="#fbbf24"
        fontFamily="Arial, sans-serif"
      >
        F
      </text>
      
      {/* Decorative elements */}
      <path
        d="M20 60 Q25 55 30 60 Q35 65 40 60"
        stroke="#fbbf24"
        strokeWidth="1"
        fill="none"
      />
      
      <path
        d="M60 60 Q65 55 70 60 Q75 65 80 60"
        stroke="#fbbf24"
        strokeWidth="1"
        fill="none"
      />
      
      {/* Bottom text */}
      <text
        x="50"
        y="85"
        fontSize="8"
        textAnchor="middle"
        fill="#fbbf24"
        fontFamily="Arial, sans-serif"
        fontStyle="italic"
      >
        Gita Fashion
      </text>
    </svg>
  )
}