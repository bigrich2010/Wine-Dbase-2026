import { useState } from 'react'

function Stars({ n }) {
  if (!n) return null
  return <span style={{ color: '#B8912A', fontSize: 14, letterSpacing: 1 }}>{'★'.repeat(n)}</span>
}

export default function WantList({ wines, bottles }) {
  const [search, setSearch] = useState('')

  const wanted = bottles
    .filter(b => b.reorder === true)
    .map(b => ({ bottle: b, wine: wines.find(w => w.id === b.wine_id) }))
    .filter(x => x.wine)
    .sort((a, b) => (b.bottle.rating || 0) - (a.bottle.rating || 0))

  const filtered = wanted.filter(({ bottle: b, wine: w }) => {
    const txt = `${w.producer} ${w.wine_name} ${w.region} ${b.purchase_source}`.toLowerCase()
    return !search || txt.includes(search.toLowerCase())
  })

  if (wanted.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink-light)' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>🔁</div>
      <p style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 }}>Want list is empty</p>
      <p style={{ fontSize: 13 }}>When you drink something exceptional, flag it for reorder in the Drunk Heroes form.</p>
    </div>
  )

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--ink-light)' }}>
        {wanted.length} wine{wanted.length !== 1 ? 's' : ''} flagged for reorder
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search…"
        style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', background: '#fff', fontSize: 13, marginBottom: 14 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(({ bottle: b, wine: w }) => (
          <div key={b.id} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, lineHeight: 1.3 }}>
                  {w.producer}{w.wine_name ? ` — ${w.wine_name}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {w.vintage && <span>{w.vintage}</span>}
                  {w.region && <span>{w.region}</span>}
                  <Stars n={b.rating} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {b.purchase_source && <span>Last from: {b.purchase_source}</span>}
                  {b.purchase_price && <span>Paid: ${b.purchase_price}</span>}
                  {b.consumed_date && <span>Drunk: {new Date(b.consumed_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</span>}
                </div>
                {b.tasting_note && (
                  <div style={{ fontSize: 12, color: 'var(--ink-mid)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
                    "{b.tasting_note}"
                  </div>
                )}
              </div>
              <div style={{ fontSize: 20, flexShrink: 0 }}>🔁</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
