import { useState, useMemo } from 'react'
import { useDebounce } from '../lib/helpers'

function Stars({ n }) {
  if (!n) return <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>Unrated</span>
  return (
    <span style={{ color: '#B8912A', fontSize: 16, letterSpacing: 1 }}>
      {'★'.repeat(n)}{'☆'.repeat(5-n)}
    </span>
  )
}

export default function DrunkHeroes({ wines, bottles }) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [filterRating, setFilterRating] = useState(0)
  const [sortBy, setSortBy] = useState('date')

  const consumed = useMemo(() => {
    return bottles
      .filter(b => b.drunk_hero === true)
      .map(b => ({
        bottle: b,
        wine: wines.find(w => w.id === b.wine_id),
      }))
      .filter(x => x.wine)
  }, [bottles, wines])

  const filtered = consumed.filter(({ bottle: b, wine: w }) => {
    const txt = `${w.producer} ${w.wine_name} ${w.region} ${b.restaurant_name} ${b.shared_with} ${b.tasting_note}`.toLowerCase()
    const matchSearch = !debouncedSearch || txt.includes(debouncedSearch.toLowerCase())
    const matchRating = !filterRating || b.rating === filterRating
    return matchSearch && matchRating
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.bottle.consumed_date || b.bottle.created_at) - new Date(a.bottle.consumed_date || a.bottle.created_at)
    if (sortBy === 'rating') return (b.bottle.rating || 0) - (a.bottle.rating || 0)
    if (sortBy === 'producer') return (a.wine.producer || '').localeCompare(b.wine.producer || '')
    return 0
  })

  const avgRating = consumed.filter(x => x.bottle.rating).length
    ? (consumed.filter(x => x.bottle.rating).reduce((s, x) => s + x.bottle.rating, 0) / consumed.filter(x => x.bottle.rating).length).toFixed(1)
    : null

  const fiveStars = consumed.filter(x => x.bottle.rating === 5).length

  if (consumed.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink-light)' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>🪦</div>
      <p style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 }}>No fallen heroes yet</p>
      <p style={{ fontSize: 13 }}>When you drink a bottle, mark it as consumed from the wine detail page.</p>
    </div>
  )

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { l: 'Bottles drunk', v: consumed.length },
          { l: 'Avg rating', v: avgRating ? `${avgRating} ★` : '—' },
          { l: '5 star bottles', v: fiveStars },
        ].map(s => (
          <div key={s.l} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', marginBottom: 3 }}>{s.l}</div>
            <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif' }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search wine, restaurant, notes…"
          style={{ flex: 1, minWidth: 140, padding: '8px 12px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', background: '#fff', fontSize: 13 }}
        />
        <select value={filterRating} onChange={e => setFilterRating(parseInt(e.target.value))}
          style={{ padding: '8px 10px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', background: '#fff', fontSize: 13, color: 'var(--ink)' }}>
          <option value={0}>All ratings</option>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', background: '#fff', fontSize: 13, color: 'var(--ink)' }}>
          <option value="date">Most recent</option>
          <option value="rating">Highest rated</option>
          <option value="producer">Producer</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(({ bottle: b, wine: w }) => (
          <div key={b.id} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, lineHeight: 1.3 }}>
                  {w.producer}{w.wine_name ? ` — ${w.wine_name}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {w.vintage && <span>{w.vintage}</span>}
                  {w.region && <span>{w.region}</span>}
                  <span className={`badge badge-${w.type}`}>{w.type}</span>
                </div>
              </div>
              <Stars n={b.rating} />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-light)', marginBottom: b.tasting_note ? 8 : 0 }}>
              {b.consumed_date && (
                <span>📅 {new Date(b.consumed_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              )}
              {b.where_type && b.where_type !== 'Home' && <span>📍 {b.where_type}</span>}
              {b.restaurant_name && <span>🍽 {b.restaurant_name}</span>}
              {b.shared_with && <span>👥 {b.shared_with}</span>}
              {b.decanted && <span>🫗 Decanted{b.decanted_mins ? ` ${b.decanted_mins}min` : ''}</span>}
              {b.purchase_price && <span>💰 ${b.purchase_price}</span>}
            </div>

            {b.tasting_note && (
              <div style={{ fontSize: 13, color: 'var(--ink-mid)', fontStyle: 'italic', lineHeight: 1.6, padding: '8px 12px', background: 'var(--cream-dark)', borderRadius: 6 }}>
                "{b.tasting_note}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
