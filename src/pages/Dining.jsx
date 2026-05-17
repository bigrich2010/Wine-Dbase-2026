import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useDebounce } from '../lib/helpers'
import { getOrCreateWine } from '../lib/wineUtils'
import Modal, { ConfirmDialog } from '../components/Modal'
import DiningWineScanner from '../components/DiningWineScanner'
import ReceiptScanner from '../components/ReceiptScanner'
import DiningForm from '../components/DiningForm'

const TYPE_ICON = { Restaurant: '🍽', Home: '🏠', Event: '🍷' }

function Stars({ n, size = 13 }) {
  if (!n) return null
  return <span style={{ color: '#B8912A', fontSize: size }}>{'★'.repeat(n)}</span>
}

function DiningDetail({ entry, wines, foodItems, onClose, onEdit, onDelete }) {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>
            {TYPE_ICON[entry.type]} {entry.venue || 'Unnamed'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>{new Date(entry.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {entry.suburb && <span>{entry.suburb}</span>}
          </div>
        </div>
        <Stars n={entry.rating} size={22} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, fontSize: 12, color: 'var(--ink-light)' }}>
        {entry.who_with && <span>👥 {entry.who_with}</span>}
        {entry.occasion && entry.occasion !== 'Casual' && <span style={{ padding: '2px 8px', borderRadius: 20, background: 'var(--cream-dark)', fontSize: 11 }}>{entry.occasion}</span>}
      </div>

      {wines.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', marginBottom: 8 }}>Wines</div>
          {wines.map(w => (
            <div key={w.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>
                  {w.producer}{w.wine_name ? ` — ${w.wine_name}` : ''} {w.vintage || ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-light)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {w.source && <span>{w.source}</span>}
                  {w.brought_by && <span>by {w.brought_by}</span>}
                  {w.price && <span>${w.price}</span>}
                  {w.drunk_hero && <span style={{ color: 'var(--wine)' }}>🏆 Hero</span>}
                  {w.reorder && <span style={{ color: 'var(--amber)' }}>🔁 Want</span>}
                </div>
                {w.tasting_note && <div style={{ fontSize: 12, color: 'var(--ink-mid)', fontStyle: 'italic', marginTop: 4 }}>"{w.tasting_note}"</div>}
              </div>
              <Stars n={w.rating} />
            </div>
          ))}
        </div>
      )}

      {foodItems.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', marginBottom: 8 }}>Food</div>
          {foodItems.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <div>
                {f.course && <span style={{ fontSize: 10, color: 'var(--ink-light)', marginRight: 6, textTransform: 'uppercase' }}>{f.course}</span>}
                {f.dish}
              </div>
              {f.price && <span style={{ color: 'var(--ink-light)', flexShrink: 0 }}>${f.price}</span>}
            </div>
          ))}
        </div>
      )}

      {entry.food_notes && (
        <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--ink-mid)', fontStyle: 'italic', lineHeight: 1.6 }}>
          {entry.food_notes}
        </div>
      )}

      {(entry.food_total || entry.wine_total || entry.grand_total) && (
        <div style={{ background: 'var(--cream-dark)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            {entry.food_total && <span>Food <span style={{ fontWeight: 500 }}>${entry.food_total}</span></span>}
            {entry.wine_total && <span>Wine <span style={{ fontWeight: 500 }}>${entry.wine_total}</span></span>}
            {entry.grand_total && <span>Total <span style={{ fontWeight: 600, fontSize: 15 }}>${entry.grand_total}</span></span>}
          </div>
        </div>
      )}

      {entry.general_notes && (
        <div style={{ fontSize: 13, color: 'var(--ink-mid)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16 }}>
          "{entry.general_notes}"
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-secondary btn-sm" onClick={onDelete} style={{ color: '#A32D2D', borderColor: '#F09595' }}>Delete</button>
        <button className="btn btn-primary btn-sm" onClick={onEdit}>Edit entry</button>
      </div>
      {confirmAction && (
        <Modal title="Confirm" onClose={() => setConfirmAction(null)}>
          <ConfirmDialog
            message={confirmAction.message}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
          />
        </Modal>
      )}
    </div>
  )
}

function DiningCard({ entry, wines, onClick }) {
  const wineCount = wines.length
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        background: '#fff',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-dark)'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
    >
      <span style={{ fontSize: 15 }}>{TYPE_ICON[entry.type]}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.venue || 'Unnamed'}{entry.suburb ? `, ${entry.suburb}` : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-light)', display: 'flex', gap: 8, marginTop: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <span>{new Date(entry.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {entry.who_with && <span>{entry.who_with}</span>}
          {wineCount > 0 && <span>🍷 {wineCount}</span>}
          {entry.occasion && entry.occasion !== 'Casual' && <span style={{ padding: '1px 6px', borderRadius: 20, background: 'var(--cream-dark)', fontSize: 10 }}>{entry.occasion}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Stars n={entry.rating} />
        {entry.grand_total && <span style={{ fontSize: 12, fontWeight: 500 }}>${entry.grand_total}</span>}
        <span style={{ color: 'var(--ink-light)', fontSize: 12 }}>›</span>
      </div>
    </div>
  )
}

export default function Dining({ cellarWines }) {
  const [entries, setEntries] = useState([])
  const [diningWines, setDiningWines] = useState([])
  const [foodItems, setFoodItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [scannedWines, setScannedWines] = useState([])
  const [scannedReceipt, setScannedReceipt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [filterType, setFilterType] = useState('')
  const [selected, setSelected] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [editEntry, setEditEntry] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: e }, { data: w }, { data: f }] = await Promise.all([
        supabase.from('dining').select('*').order('date', { ascending: false }),
        supabase.from('dining_wines').select('*'),
        supabase.from('dining_food').select('*'),
      ])
      setEntries(e || [])
      setDiningWines(w || [])
      setFoodItems(f || [])
    } catch(e) {
      console.error('Dining fetchAll error:', e)
      setEntries([])
      setDiningWines([])
      setFoodItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const winesForEntry = (id) => diningWines.filter(w => w.dining_id === id)
  const foodForEntry = (id) => foodItems.filter(f => f.dining_id === id)

  const saveEntry = async (form, wines, food) => {
    setSaving(true)

    let entryId = editEntry?.id

    if (editEntry) {
      await supabase.from('dining').update({
        type: form.type, date: form.date, venue: form.venue || null,
        suburb: form.suburb || null, who_with: form.who_with || null,
        occasion: form.occasion, rating: form.rating || null,
        food_notes: form.food_notes || null, general_notes: form.general_notes || null,
        food_total: form.food_total ? parseFloat(form.food_total) : null,
        wine_total: form.wine_total ? parseFloat(form.wine_total) : null,
        grand_total: form.grand_total ? parseFloat(form.grand_total) : null,
      }).eq('id', entryId)
      await supabase.from('dining_wines').delete().eq('dining_id', entryId)
      await supabase.from('dining_food').delete().eq('dining_id', entryId)
    } else {
      const { data: entry } = await supabase.from('dining').insert([{
        type: form.type, date: form.date, venue: form.venue || null,
        suburb: form.suburb || null, who_with: form.who_with || null,
        occasion: form.occasion, rating: form.rating || null,
        food_notes: form.food_notes || null, general_notes: form.general_notes || null,
        food_total: form.food_total ? parseFloat(form.food_total) : null,
        wine_total: form.wine_total ? parseFloat(form.wine_total) : null,
        grand_total: form.grand_total ? parseFloat(form.grand_total) : null,
      }]).select().single()
      entryId = entry?.id
    }

    if (entryId) {
      for (const w of wines) {
        await supabase.from('dining_wines').insert([{
          dining_id: entryId, wine_id: w.wine_id || null,
          producer: w.producer || null, wine_name: w.wine_name || null,
          vintage: w.vintage ? parseInt(w.vintage) : null,
          type: w.type || 'Red', region: w.region || null,
          source: w.source || 'Restaurant list', brought_by: w.brought_by || null,
          price: w.price ? parseFloat(w.price) : null,
          rating: w.rating || null, tasting_note: w.tasting_note || null,
          drunk_hero: w.drunk_hero || false, reorder: w.reorder || false,
        }])
        if (w.drunk_hero && w.producer) {
          let wineId = w.wine_id
          if (!wineId) {
            wineId = await getOrCreateWine({
              producer: w.producer, wine_name: w.wine_name,
              vintage: w.vintage, type: w.type || 'Red', region: w.region,
            })
          }
          if (wineId) {
            await supabase.from('bottles').insert([{
              wine_id: wineId, status: 'Enjoyed at restaurant',
              consumed_date: form.date, restaurant_name: form.venue || null,
              shared_with: form.who_with || null, rating: w.rating || null,
              tasting_note: w.tasting_note || null, drunk_hero: true,
              reorder: w.reorder || false,
              where_type: form.type === 'Home' ? 'Home' : form.type === 'Event' ? 'Event' : 'Restaurant',
            }])
          }
        }
      }

      const foodRows = (food || []).filter(f => f.dish).map(f => ({
        dining_id: entryId, course: f.course || null,
        dish: f.dish, price: f.price ? parseFloat(f.price) : null,
      }))
      if (foodRows.length) await supabase.from('dining_food').insert(foodRows)
    }

    setSaving(false)
    setModal(null)
    setEditEntry(null)
    setScannedWines([])
    setScannedReceipt(null)
    setSelected(null)
    fetchAll()
  }

  const deleteEntry = (id) => {
    setConfirmAction({
      message: 'Delete this dining entry and all its wines and food items?',
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await supabase.from('dining').delete().eq('id', id)
          setSelected(null)
          fetchAll()
        } catch(e) { console.error('deleteEntry:', e) }
      }
    })
  }

  const filtered = entries.filter(e => {
    const txt = `${e.venue} ${e.suburb} ${e.who_with} ${e.general_notes} ${e.food_notes}`.toLowerCase()
    return (!debouncedSearch || txt.includes(debouncedSearch.toLowerCase())) && (!filterType || e.type === filterType)
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
        <button className="btn btn-primary btn-sm" onClick={() => setModal('choose')}>+ New entry</button>
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
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {filtered.map(e => (
            <DiningCard key={e.id} entry={e} wines={winesForEntry(e.id)}
              onClick={() => setSelected(e)} />
          ))}
        </div>
      )}

      {modal === 'choose' && (
        <Modal title="New dining entry" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--ink-light)', textAlign: 'center', marginBottom: 4 }}>How would you like to start?</p>
            <button className="btn btn-primary" style={{ justifyContent: 'center', padding: 14, fontSize: 14 }}
              onClick={() => setModal('scanReceipt')}>
              🧾 Scan receipt — fills restaurant, date, food & wines
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'center', padding: 14, fontSize: 14 }}
              onClick={() => setModal('scanWines')}>
              📸 Photo of wine bottles — fills wine list
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'center' }}
              onClick={() => setModal('form')}>
              Fill in manually
            </button>
          </div>
        </Modal>
      )}

      {modal === 'scanWines' && (
        <Modal title="Photo of wines" onClose={() => setModal('form')}>
          <DiningWineScanner
            onScanned={(wines) => { setScannedWines(wines); setModal('form') }}
            onCancel={() => { setScannedWines([]); setModal('form') }}
          />
        </Modal>
      )}

      {modal === 'scanReceipt' && (
        <Modal title="Scan receipt" onClose={() => setModal('form')}>
          <ReceiptScanner
            onScanned={(data) => {
              setScannedReceipt(data)
              if (data.wines && data.wines.length) setScannedWines(data.wines)
              setModal('form')
            }}
            onSkip={() => setModal('form')}
          />
        </Modal>
      )}

      {modal === 'form' && (
        <Modal title={editEntry ? 'Edit dining entry' : 'New dining entry'} onClose={() => { setModal(null); setEditEntry(null); setScannedWines([]); setScannedReceipt(null) }} wide>
          {saving
            ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /><p style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-light)' }}>Saving…</p></div>
            : <DiningForm
                initial={editEntry || (scannedReceipt ? { venue: scannedReceipt.venue, suburb: scannedReceipt.suburb, food_total: scannedReceipt.food_total, wine_total: scannedReceipt.wine_total, grand_total: scannedReceipt.grand_total } : {})}
                scannedWines={scannedWines}
                scannedFood={scannedReceipt?.food_items || []}
                existingWines={editEntry ? winesForEntry(editEntry.id) : []}
                existingFood={editEntry ? foodForEntry(editEntry.id) : []}
                onSave={saveEntry}
                onCancel={() => { setModal(null); setEditEntry(null); setScannedWines([]); setScannedReceipt(null) }}
              />
          }
        </Modal>
      )}

      {selected && (
        <Modal title="Dining entry" onClose={() => setSelected(null)} wide>
          <DiningDetail
            entry={selected}
            wines={winesForEntry(selected.id)}
            foodItems={foodForEntry(selected.id)}
            onClose={() => setSelected(null)}
            onEdit={() => { setEditEntry(selected); setModal('form'); setSelected(null) }}
            onDelete={() => deleteEntry(selected.id)}
          />
        </Modal>
      )}
    </div>
  )
}
