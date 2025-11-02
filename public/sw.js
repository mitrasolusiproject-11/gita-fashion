// Gita Fashion PWA Service Worker
const CACHE_NAME = 'gita-fashion-v1.0.0'
const STATIC_CACHE = 'gita-fashion-static-v1'
const DYNAMIC_CACHE = 'gita-fashion-dynamic-v1'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/dashboard/pos',
  '/dashboard/products',
  '/dashboard/transactions',
  '/dashboard/customers',
  '/dashboard/barcode',
  '/dashboard/settings',
  '/manifest.json',
  '/logo-gita-fashion.svg'
]

// API routes to cache
const API_ROUTES = [
  '/api/auth/session',
  '/api/products',
  '/api/categories',
  '/api/customers',
  '/api/transactions',
  '/api/settings/public'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Gita Fashion Service Worker')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Gita Fashion Service Worker')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Skip non-GET requests for most cases, but allow POST for API
  if (request.method !== 'GET' && !url.pathname.startsWith('/api/')) {
    return
  }

  // Handle authentication redirects - let them pass through
  if (url.pathname === '/login' || url.pathname === '/dashboard') {
    event.respondWith(
      fetch(request, { 
        redirect: 'follow',
        credentials: 'same-origin' 
      })
    )
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request))
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first with proper redirect handling
    const networkResponse = await fetch(request, {
      redirect: 'follow',
      credentials: 'same-origin'
    })
    
    // Cache successful responses for read-only API calls (but not redirects)
    if (networkResponse.ok && !networkResponse.redirected && (request.method === 'GET')) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname)
    
    // Fallback to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // Return offline response for critical API endpoints
    if (url.pathname === '/api/auth/session') {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw error
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to network with proper redirect handling
    const networkResponse = await fetch(request, {
      redirect: 'follow',
      credentials: 'same-origin'
    })
    
    // Cache successful responses (but not redirects)
    if (networkResponse.ok && !networkResponse.redirected) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Both cache and network failed for:', request.url)
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    throw error
  }
}

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncOfflineTransactions())
  }
})

// Sync offline transactions when back online
async function syncOfflineTransactions() {
  try {
    // Get offline transactions from IndexedDB
    const offlineTransactions = await getOfflineTransactions()
    
    for (const transaction of offlineTransactions) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction)
        })
        
        if (response.ok) {
          await removeOfflineTransaction(transaction.id)
          console.log('[SW] Synced offline transaction:', transaction.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync transaction:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Placeholder functions for IndexedDB operations
async function getOfflineTransactions() {
  // TODO: Implement IndexedDB operations
  return []
}

async function removeOfflineTransaction(id) {
  // TODO: Implement IndexedDB operations
  console.log('[SW] Remove offline transaction:', id)
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  const options = {
    body: 'Ada transaksi baru di Gita Fashion',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard/transactions'
    },
    actions: [
      {
        action: 'view',
        title: 'Lihat Transaksi',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Tutup',
        icon: '/icons/dismiss-action.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Gita Fashion', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
})

console.log('[SW] Gita Fashion Service Worker loaded')