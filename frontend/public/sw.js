// public/sw.js
const CACHE_NAME = 'finance-tracker-v2'
const urlsToCache = [
  '/',
  '/dashboard',
  '/login',
  '/register',
  '/offline',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        
        return response
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/offline')
        }
        return new Response('Offline', { status: 503 })
      })
    })
  )
})
