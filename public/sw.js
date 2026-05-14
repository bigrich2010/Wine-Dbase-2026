const CACHE = 'wine-cellar-v1'
const OFFLINE_URL = '/'

const PRECACHE = [
  '/',
  '/index.html',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) return
  if (e.request.url.includes('supabase')) return
  if (e.request.url.includes('anthropic')) return
  if (e.request.url.includes('fonts.googleapis')) return

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const clone = resp.clone()
        caches.open(CACHE).then(cache => cache.put(e.request, clone))
        return resp
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match(OFFLINE_URL)))
  )
})
