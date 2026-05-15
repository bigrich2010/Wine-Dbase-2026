import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import DiningWineScanner from '../components/DiningWineScanner'
import DiningForm from '../components/DiningForm'

const TYPE_ICON = { Restaurant: '🍽', Home: '🏠', Event: '🍷' }

function Stars({ n }) {
  if (!n) return null
  return <span style={{ color: '#B8912A', fontSize: 13 }}>{'★'.repeat(n)}</span>
}

function DiningCard({ entry, wines, onClick }) {
  const wineCount = wines.length
  return (
    <div className="card" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16 }}>{TYPE_ICON[entry.type]}</span>
            <span style={{ fontSize: 16, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>{entry.venue || 'Unnamed'}</span>
            {entry.suburb && <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{entry.suburb}</span>}
            <Stars n={entry.rating} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-light)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>📅 {new Date(entry.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {entry.who_with && <span>👥 {entry.who_with}</span>}
            {entry.occasion && entry.occasion !== 'Casual' && <span style={{ padding: '1px 7px', borderRadius: 20, background: 'var(--cream-dark)', fontSize: 11 }}>{entry.occasion}</span>}
          </div>
          {wineCount > 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              🍷 {wines.map(w => `${w.producer}${w.wine_name ? ' ' + w.wine_name : ''}${w.vintage ? ' ' + w.vintage : ''}`).join(', ')}
            </div>
          )}
          {entry.general_notes && (
            <div style={{ fontSize: 12, color: 'var(--ink-mid)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
              "{entry.general_notes}"
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 12, color: 'var(--ink-light)' }}>
          {entry.grand_total && <div style={{ fontWeight: 500, color: 'var(--ink)' }}>${entry.grand_total}</div>}
          {wineCount > 0 && <div>{wineCount} wine{wineCount !== 1 ? 's' : ''}</div>}
          <div style={{ marginTop: 4, color: 'var(--ink-light)', fontSize: 14 }}>›</div>
        </div>
      </div>
    </div>
  )
}

export default function Dining({ cellarWines }) {
  const [entries, setEntries] = useState([])
  const [diningWines, setDiningWines] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [scannedWines, setScannedWines] = useState([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selected, setSelected] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: e }, { data: w }] = await Promise.all([
      supabase.from('dining').select('*').order('date', { ascending: false }),
      supabase.from('dining_wines').select('*'),
    ])
    setEntries(e || [])
    setDiningWines(w || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const winesForEntry = (id) => diningWines.filter(w => w.dining_id === id)

  const handleScanned = (wines, preview) => {
    setScannedWines(wines)
    setModal('form')
  }

  const saveEntry = async (form, wines) => {
    setSaving(true)

    const { data: entry } = await supabase.from('dining').insert([{
      type: form.type,
      date: form.date,
      venue: form.venue || null,
      suburb: form.suburb || null,
      who_with: form.who_with || null,
      occasion: form.occasion,
      rating: form.rating || null,
      food_notes: form.food_notes || null,
      general_notes: form.general_notes || null,
      food_total: form.food_total ? parseFloat(form.food_total) : null,
      wine_total: form.wine_total ? parseFloat(form.wine_total) : null,
      grand_total: form.grand_total ? parseFloat(form.grand_total) : null,
    }]).select().single()

    if (entry && wines.length) {
      for (const w of wines) {
        await supabase.from('dining_wines').insert([{
          dining_id: entry.id,
          wine_id: w.wine_id || null,
          producer: w.producer || null,
          wine_name: w.wine_name || null,
          vintage: w.vintage ? parseInt(w.vintage) : null,
          type: w.type || 'Red',
          region: w.region || null,
          source: w.source || 'Restaurant list',
          brought_by: w.brought_by || null,
          price: w.price ? parseFloat(w.price) : null,
          rating: w.rating || null,
          tasting_note: w.tasting_note || null,
          drunk_hero: w.drunk_hero || false,
          reorder: w.reorder || false,
        }])

        // Create Drunk Hero bottle record if flagged
        if (w.drunk_hero && w.producer) {
          let wineId = w.wine_id
          if (!wineId) {
            const { data: newWine } = await supabase.from('wines').insert([{
              producer: w.producer, wine_name: w.wine_name || null,
              vintage: w.vintage ? parseInt(w.vintage) : null,
              type: w.type || 'Red', region: w.region || null,
            }]).select().single()
            wineId = newWine?.id
          }
          if (wineId) {
            await supabase.from('bottles').insert([{
              wine_id: wineId, status: 'Enjoyed at restaurant',
              consumed_date: form.date,
              restaurant_name: form.venue || null,
              shared_with: form.who_with || null,
              rating: w.rating || null,
              tasting_note: w.tasting_note || null,
              drunk_hero: true,
              reorder: w.reorder || false,
              where_type: form.type === 'Home' ? 'Home' : form.type === 'Event' ? 'Event' : 'Restaurant',
            }])
          }
        }
      }
    }

    setSaving(false)
    setModal(null)
    setScannedWines([])
    fetchAll()
  }

  const filtered = entries.filter(e => {
    const txt = `${e.venue} ${e.suburb} ${e.who_with} ${e.general_notes} ${e.food_notes}`.toLowerCase()
    return (!search || txt.includes(search.toLowerCase())) && (!filterType || e.type === filterType)
  })

  const totalSpend = entries.reduce((s, e) => s + (parseFloat(e.grand_total) || 0), 0)

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { l: 'Meals recorded', v: entries.length },
          { l: 'Wines enjoyed', v: diningWines.length },
          { l: 'Total spent', v: totalSpend > 0 ? `$${Math.round(totalSpend).toLocaleString()}` : '—' },
        ].map(s => (
          <div key={s.l} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', marginBottom: 3 }}>{s.l}</div>
            <div style={{ fontSize: 18, fontFamily: 'Cormorant Garamond, serif' }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search restaurant, who with, notes…"
          style={{ flex: 1, minWidth: 140, padding: '8px 12px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', background: '#fff', fontSize: 13 }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', background: '#fff', fontSize: 13, color: 'var(--ink)' }}>
          <option value="">All types</option>
          <option>Restaurant</option><option>Home</option><option>Event</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('scan')}>+ New entry</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink-light)' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>🍽</div>
          <p style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 }}>No dining entries yet</p>
          <p style={{ fontSize: 13 }}>Record your first meal, tasting or dinner at home.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(e => (
            <DiningCard key={e.id} entry={e} wines={winesForEntry(e.id)} onClick={() => setSelected(e)} />
          ))}
        </div>
      )}

      {modal === 'scan' && (
        <Modal title="New dining entry" onClose={() => setModal(null)}>
          <DiningWineScanner
            onScanned={(wines) => { setScannedWines(wines); setModal('form') }}
            onCancel={() => { setScannedWines([]); setModal('form') }}
          />
        </Modal>
      )}

      {modal === 'form' && (
        <Modal title="Dining entry" onClose={() => { setModal(null); setScannedWines([]) }} wide>
          {saving
            ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /><p style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-light)' }}>Saving…</p></div>
            : <DiningForm scannedWines={scannedWines} onSave={saveEntry} onCancel={() => { setModal(null); setScannedWines([]) }} />
          }
        </Modal>
      )}
    </div>
  )
}
