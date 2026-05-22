import { useState } from 'react'
import { getVintageChart } from '../lib/vintageCharts'
import { supabase } from '../lib/supabase'
import { drinkingStatus, effectiveDrinkingWindow, formatPrice, BOTTLE_STATUSES } from '../lib/helpers'
import Modal, { ConfirmDialog } from '../components/Modal'
import WineForm from '../components/WineForm'
import BottleForm from '../components/BottleForm'
import DrinkBottleForm from '../components/DrinkBottleForm'

export default function WineDetail({ wine, bottles, onBack, onRefresh }) {
  const [modal, setModal] = useState(null)
  const [editBottle, setEditBottle] = useState(null)
  const [saving, setSaving] = useState(false)
  const [drinkBottle, setDrinkBottle] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const dsResult = drinkingStatus(wine)
  const ds = dsResult?.status
  const dsEstimated = dsResult?.estimated
  const effectiveWindow = effectiveDrinkingWindow(wine)
  const year = new Date().getFullYear()

  const grouped = BOTTLE_STATUSES.reduce((acc, s) => {
    const list = bottles.filter(b => b.status === s)
    if (list.length) acc[s] = list
    return acc
  }, {})

  const saveWine = async (form) => {
    setSaving(true)
    try { await supabase.from('wines').update({
      producer: form.producer, wine_name: form.wine_name,
      vintage: form.vintage ? parseInt(form.vintage) : null,
      type: form.type, region: form.region, appellation: form.appellation,
      country: form.country, grape: form.grape, alcohol: form.alcohol,
      drink_from: form.drink_from ? parseInt(form.drink_from) : null,
      drink_to: form.drink_to ? parseInt(form.drink_to) : null,
      score_winefront: form.score_winefront || null,
      score_ray_jordan: form.score_ray_jordan || null,
      score_halliday: form.score_halliday || null,
      score_wine_advocate: form.score_wine_advocate || null,
      score_other: form.score_other || null,
      url_winefront: form.url_winefront || null,
      url_ray_jordan: form.url_ray_jordan || null,
      url_other: form.url_other || null,
      critic_notes: form.critic_notes || null,
    }).eq('id', wine.id)
    setModal(null)
    onRefresh()
    } catch(e) { console.error('saveWine:', e) } finally { setSaving(false) }
  }

  const saveBottle = async (form) => {
    setSaving(true)
    try {
    const payload = {
      wine_id: wine.id,
      status: form.status,
      quantity: parseInt(form.quantity) || 1,
      purchase_date: form.purchase_date || null,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      purchase_source: form.purchase_source || null,
      auction_lot: form.auction_lot || null,
      consumed_date: form.consumed_date || null,
      restaurant_name: form.restaurant_name || null,
      tasting_note: form.tasting_note || null,
      rating: form.rating || null,
      shared_with: form.shared_with || null,
      decanted: form.decanted || false,
      decanted_mins: form.decanted_mins ? parseInt(form.decanted_mins) : null,
      reorder: form.reorder || false,
      drunk_hero: form.drunk_hero || false,
      where_type: form.where_type || null,
    }
    if (editBottle) {
      await supabase.from('bottles').update(payload).eq('id', editBottle.id)
    } else {
      await supabase.from('bottles').insert([payload])
    }
    setModal(null)
    setEditBottle(null)
    onRefresh()
    } catch(e) { console.error('saveBottle:', e) } finally { setSaving(false) }
  }

  const quickRemoveBottle = async () => {
    setSaving(true)
    try {
      await supabase.from('bottles').update({
        status: 'Consumed',
        consumed_date: new Date().toISOString().split('T')[0],
      }).eq('id', drinkBottle.id)
      setModal(null)
      setDrinkBottle(null)
      onRefresh()
    } catch(e) { console.error('quickRemove:', e) } finally { setSaving(false) }
  }

  const consumeBottle = async (form) => {
    setSaving(true)
    try {
      await supabase.from('bottles').update({
        status: form.where_type === 'Restaurant' ? 'Enjoyed at restaurant' : 'Consumed',
        consumed_date: form.consumed_date || null,
        restaurant_name: form.restaurant_name || null,
        shared_with: form.shared_with || null,
        rating: form.rating || null,
        tasting_note: form.tasting_note || null,
        decanted: form.decanted || false,
        decanted_mins: form.decanted_mins ? parseInt(form.decanted_mins) : null,
        where_type: form.where_type || null,
        reorder: form.reorder || false,
        drunk_hero: true,
      }).eq('id', drinkBottle.id)
      setModal(null)
      setDrinkBottle(null)
      onRefresh()
    } catch(e) {
      console.error('consumeBottle:', e)
    } finally {
      setSaving(false)
    }
  }

  const deleteBottle = (id) => {
    setConfirmAction({
      message: 'Delete this bottle record? This cannot be undone.',
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await supabase.from('bottles').delete().eq('id', id)
          onRefresh()
        } catch(e) { console.error('deleteBottle:', e) }
      }
    })
  }

  const deleteWine = () => {
    setConfirmAction({
      message: `Delete ${wine.producer}${wine.wine_name ? ' — ' + wine.wine_name : ''}${wine.vintage ? ' ' + wine.vintage : ''} and ALL bottle records? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmAction(null)
        try {
          await supabase.from('wines').delete().eq('id', wine.id)
          onBack()
        } catch(e) { console.error('deleteWine:', e) }
      }
    })
  }

  const scores = [
    wine.score_winefront && { label: 'Winefront', val: wine.score_winefront, url: wine.url_winefront },
    wine.score_ray_jordan && { label: 'Ray Jordan', val: wine.score_ray_jordan, url: wine.url_ray_jordan },
    wine.score_halliday && { label: 'Halliday', val: wine.score_halliday },
    wine.score_wine_advocate && { label: 'Wine Advocate', val: wine.score_wine_advocate },
    wine.score_other && { label: 'Score', val: wine.score_other, url: wine.url_other },
  ].filter(Boolean)

  const totalSpend = bottles.reduce((s, b) => s + (parseFloat(b.purchase_price) || 0), 0)

  const searchUrl = (site) => {
    const q = encodeURIComponent(`${wine.producer} ${wine.wine_name || ''} ${wine.vintage || ''}`.trim())
    if (site === 'winefront') return `https://winefront.com.au/?s=${q}`
    if (site === 'rayjordan') return `https://rayjordan.com.au/?s=${q}`
    return null
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-light)', fontSize: 20, padding: '0 4px', lineHeight: 1 }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 26, lineHeight: 1.2 }}>{wine.producer}{wine.wine_name ? ` — ${wine.wine_name}` : ''}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4, alignItems: 'center' }}>
            {wine.vintage && <span style={{ fontSize: 13, color: 'var(--ink-mid)' }}>{wine.vintage}</span>}
            <span className={`badge badge-${wine.type}`}>{wine.type}</span>
            {wine.region && <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{wine.region}{wine.appellation ? ` · ${wine.appellation}` : ''}</span>}
            {wine.grape && <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{wine.grape}</span>}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setModal('editWine')}>Edit</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px,1fr))', gap: 8, marginBottom: 20 }}>
        {[
          { l: 'In cellar', v: bottles.filter(b => b.status === 'In cellar').length },
          { l: 'Consumed', v: bottles.filter(b => ['Consumed','Enjoyed at restaurant'].includes(b.status)).length },
          { l: 'Pending', v: bottles.filter(b => b.status === 'Pending arrival').length },
          { l: 'Total spend', v: totalSpend > 0 ? formatPrice(totalSpend) : '—' },
        ].map(s => (
          <div key={s.l} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', marginBottom: 3 }}>{s.l}</div>
            <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif' }}>{s.v}</div>
          </div>
        ))}
      </div>

      {(effectiveWindow || scores.length > 0) && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
          {effectiveWindow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: scores.length ? 14 : 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {dsEstimated ? 'Est. drink' : 'Drink'}
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, opacity: dsEstimated ? 0.7 : 1 }}>
                {dsEstimated ? '~' : ''}{effectiveWindow.from || '?'} — {effectiveWindow.to || '?'}
              </span>
              {dsEstimated && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--cream-dark)', color: 'var(--ink-light)' }}>Estimated</span>}
              {ds === 'ready' && !dsEstimated && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--green-pale)', color: 'var(--green)' }}>In window</span>}
              {ds === 'ready' && dsEstimated && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--green-pale)', color: 'var(--green)', opacity: 0.7 }}>Approx. ready</span>}
              {ds === 'early' && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--amber-pale)', color: 'var(--amber)' }}>Too early · {effectiveWindow.from - year}yr to go</span>}
              {ds === 'past' && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#FCE8E8', color: '#8B1A1A' }}>Past peak</span>}
            </div>
          )}
          {scores.length > 0 && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {scores.map(sc => (
                <div key={sc.label}>
                  <div style={{ fontSize: 10, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{sc.label}</div>
                  <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>{sc.val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <a href={wine.url_winefront || searchUrl('winefront')} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 12, fontWeight: 500, background: '#fff', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', color: 'var(--ink-mid)', textDecoration: 'none', cursor: 'pointer' }}>
          🍷 Winefront {wine.url_winefront ? '↗' : '⟳'}
        </a>
        <a href={wine.url_ray_jordan || searchUrl('rayjordan')} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 12, fontWeight: 500, background: '#fff', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', color: 'var(--ink-mid)', textDecoration: 'none', cursor: 'pointer' }}>
          🍷 Ray Jordan {wine.url_ray_jordan ? '↗' : '⟳'}
        </a>
        {wine.url_other && (
          <a href={wine.url_other} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 12, fontWeight: 500, background: '#fff', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', color: 'var(--ink-mid)', textDecoration: 'none' }}>
            Review ↗
          </a>
        )}
      </div>

      {wine.critic_notes && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16, fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.6, fontStyle: 'italic' }}>
          {wine.critic_notes}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ fontSize: 18 }}>Bottles</h3>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditBottle(null); setModal('addBottle') }}>+ Add bottle</button>
      </div>

      {bottles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-light)', border: '1px dashed var(--border-mid)', borderRadius: 8, fontSize: 13 }}>
          No bottles yet — add one above
        </div>
      ) : (
        Object.entries(grouped).map(([status, bots]) => (
          <div key={status} style={{ marginBottom: 16 }}>
            <div className="section-header">{status} ({bots.length})</div>
            {bots.map(b => (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 13, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {b.purchase_date && <span style={{ color: 'var(--ink-mid)' }}>{new Date(b.purchase_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    {b.purchase_source && <span style={{ color: 'var(--ink-light)' }}>{b.purchase_source}</span>}
                    {b.purchase_price && <span style={{ color: 'var(--ink-mid)', fontWeight: 500 }}>{formatPrice(b.purchase_price)}</span>}
                    {b.auction_lot && <span style={{ fontSize: 11, color: 'var(--ink-light)' }}>Lot {b.auction_lot}</span>}
                    {b.quantity > 1 && <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 20, background: 'var(--cream-dark)', color: 'var(--ink-light)' }}>×{b.quantity}</span>}
                  </div>
                  {b.restaurant_name && <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 2 }}>@ {b.restaurant_name}{b.consumed_date ? ` · ${new Date(b.consumed_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</div>}
                  {b.tasting_note && <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 6, fontStyle: 'italic', lineHeight: 1.55, padding: '6px 10px', background: 'var(--cream-dark)', borderRadius: 6 }}>{b.tasting_note}</div>}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {b.status === 'In cellar' && (
                    <button onClick={() => { setDrinkBottle(b); setModal('drinkBottle') }} style={{ background: 'var(--wine)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 4, fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>Drink</button>
                  )}
                  <button onClick={() => { setEditBottle(b); setModal('addBottle') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-light)', fontSize: 14, padding: '4px 6px', borderRadius: 4 }} onMouseEnter={e => e.target.style.background='var(--cream-dark)'} onMouseLeave={e => e.target.style.background='none'}>✎</button>
                  <button onClick={() => deleteBottle(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D', fontSize: 13, padding: '4px 6px', borderRadius: 4 }} onMouseEnter={e => e.target.style.background='#FCE8E8'} onMouseLeave={e => e.target.style.background='none'}>✕</button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {(() => {
        const vc = getVintageChart(wine.region, wine.type)
        const vEntry = vc && wine.vintage && vc.vintages[wine.vintage]
        if (!vc || !vEntry) return null
        return (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', marginBottom: 8 }}>
              {vc.description} · {wine.vintage} vintage
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ fontSize: 28, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>{vEntry.score}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.5 }}>{vEntry.summary}</div>
            </div>
          </div>
        )
      })()}

      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <button onClick={deleteWine} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-light)', textDecoration: 'underline' }}>Delete this wine</button>
      </div>

      {modal === 'editWine' && (
        <Modal title="Edit wine" onClose={() => setModal(null)} wide>
          {saving ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : <WineForm initial={wine} onSave={saveWine} onCancel={() => setModal(null)} />}
        </Modal>
      )}

      {modal === 'addBottle' && (
        <Modal title={editBottle ? 'Edit bottle' : 'Add bottle'} onClose={() => { setModal(null); setEditBottle(null) }}>
          {saving ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : <BottleForm initial={editBottle || {}} onSave={saveBottle} onCancel={() => { setModal(null); setEditBottle(null) }} />}
        </Modal>
      )}
      {confirmAction && (
        <Modal title="Confirm" onClose={() => setConfirmAction(null)}>
          <ConfirmDialog
            message={confirmAction.message}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
          />
        </Modal>
      )}

      {modal === 'drinkBottle' && drinkBottle && (
        <Modal title="Drink a bottle" onClose={() => { setModal(null); setDrinkBottle(null) }}>
          {saving
            ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            : <DrinkBottleForm wine={wine} bottle={drinkBottle} onQuickRemove={quickRemoveBottle} onSave={consumeBottle} onCancel={() => { setModal(null); setDrinkBottle(null) }} />
          }
        </Modal>
      )}
    </div>
  )
}
