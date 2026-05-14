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

export function drinkingStatus(wine) {
  const year = new Date().getFullYear()
  if (!wine.drink_from && !wine.drink_to) return null
  if (wine.drink_to && year > wine.drink_to) return 'past'
  if (wine.drink_from && year < wine.drink_from) return 'early'
  return 'ready'
}

export function formatPrice(p) {
  if (!p) return null
  return '$' + parseFloat(p).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
