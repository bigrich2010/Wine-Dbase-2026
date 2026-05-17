import { useState, useEffect } from 'react'

export const WINE_TYPES = ['Red', 'White', 'Rosé', 'Sparkling', 'Orange', 'Fortified']

export const BOTTLE_STATUSES = [
  'In cellar',
  'Consumed',
  'Pending arrival',
  'Enjoyed at restaurant',
  'Gifted',
  'Sold',
  'Broken',
]

export const REGIONS = [
  'Burgundy', 'Bordeaux', 'Northern Rhône', 'Southern Rhône', 'Champagne',
  'Alsace', 'Loire', 'Other France',
  'Margaret River', 'Barossa Valley', 'Clare Valley', 'Eden Valley',
  'Yarra Valley', 'Mornington Peninsula', 'Tasmania', 'Other Australia',
  'Barolo', 'Barbaresco', 'Tuscany', 'Other Italy',
  'Rioja', 'Priorat', 'Other Spain',
  'Napa Valley', 'Sonoma', 'Other USA',
  'New Zealand', 'Other',
]

export function groupByVariety(wines) {
  const groups = {}
  wines.forEach(w => {
    const key = w.type || 'Other'
    if (!groups[key]) groups[key] = []
    groups[key].push(w)
  })
  const order = ['Red', 'White', 'Sparkling', 'Rosé', 'Orange', 'Fortified', 'Other']
  return order.filter(k => groups[k]).map(k => ({ type: k, wines: groups[k] }))
}

export function bottleCount(bottles, status = 'In cellar') {
  return bottles.filter(b => b.status === status).length
}

export function totalInCellar(bottles) {
  return bottles.filter(b => b.status === 'In cellar').length
}

export function defaultDrinkingWindow(wine) {
  if (!wine.vintage) return null
  const v = parseInt(wine.vintage)
  const r = (wine.region || '').toLowerCase()
  const t = wine.type || 'Red'

  if (t === 'Rosé') return { from: v, to: v + 3, estimated: true }
  if (t === 'Sparkling') return { from: v + 2, to: v + 8, estimated: true }
  if (t === 'Orange') return { from: v + 1, to: v + 5, estimated: true }
  if (t === 'Fortified') return { from: v + 5, to: v + 30, estimated: true }

  if (t === 'White') {
    if (r.includes('burgundy') || r.includes('chardonnay') || r.includes('meursault') || r.includes('puligny') || r.includes('chablis')) return { from: v + 3, to: v + 10, estimated: true }
    return { from: v + 1, to: v + 5, estimated: true }
  }

  // Reds
  if (r.includes('burgundy') || r.includes('côte') || r.includes('cote') || r.includes('gevrey') || r.includes('vosne') || r.includes('chambolle') || r.includes('rhône') || r.includes('rhone') || r.includes('barolo') || r.includes('barbaresco')) return { from: v + 8, to: v + 20, estimated: true }
  if (r.includes('bordeaux') || r.includes('pauillac') || r.includes('margaux') || r.includes('saint-julien') || r.includes('pomerol') || r.includes('médoc')) return { from: v + 8, to: v + 25, estimated: true }
  if (r.includes('margaret river')) return { from: v + 6, to: v + 18, estimated: true }
  if (r.includes('barossa')) return { from: v + 4, to: v + 15, estimated: true }
  return { from: v + 3, to: v + 10, estimated: true }
}

export function effectiveDrinkingWindow(wine) {
  if (wine.drink_from || wine.drink_to) {
    return { from: wine.drink_from, to: wine.drink_to, estimated: false }
  }
  return defaultDrinkingWindow(wine)
}

export function drinkingStatus(wine) {
  const year = new Date().getFullYear()
  const window = effectiveDrinkingWindow(wine)
  if (!window) return null
  if (window.to && year > window.to) return { status: 'past', estimated: window.estimated }
  if (window.from && year < window.from) return { status: 'early', estimated: window.estimated }
  return { status: 'ready', estimated: window.estimated }
}

export function formatPrice(p) {
  if (!p) return null
  return '$' + parseFloat(p).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
