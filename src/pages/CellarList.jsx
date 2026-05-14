import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { groupByVariety } from '../lib/helpers'
import WineRow from '../components/WineRow'
import WineDetail from './WineDetail'
import Modal from '../components/Modal'
import Scanner from '../components/Scanner'
import WineForm from '../components/WineForm'
import BottleForm from '../components/BottleForm'
import ScoreImport from '../components/ScoreImport'
import AskCellar from './AskCellar'

export default function CellarList() {
  const [wines, setWines] = useState([])
  const [bottles, setBottles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('cellar')
  const [modal, setModal] = useState(null)
  const [scannedData, setScannedData] = useState(null)
  const [pendingWineId, setPendingWineId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterReady, setFilterReady] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: w }, { data: b }] = await Promise.all([
      supabase.from('wines').select('*').order('producer'),
      supabase.from('bottles').select('*').order('created_at'),
    ])
    setWines(w || [])
    setBottles(b || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const bottlesForWine = (wineId) => bottles.filter(b => b.wine_id === wineId)

  const filteredWines = wines.filter(w => {
    const txt = `${w.producer} ${w.wine_name} ${w.region} ${w.appellation} ${w.grape}`.toLowerCase()
    const matchSearch = !search || txt.includes(search.toLowerCase())
    const matchType = !filterType || w.type === filterType
    const matchReady = !filterReady || (() => {
      const year = new Date().getFullYear()
      return w.drink_from && w.drink_to && year >= w.drink_from && year <= w.drink_to
    })()
    const hasBottles = bottlesForWine(w.id).some(b => b.status === 'In cellar' || b.status === 'Pending arrival')
    return matchSearch && matchType && matchReady && hasBottles
  })

  const grouped = groupByVariety(filteredWines)

  const totalInCellar = bottles.filter(b => b.status === 'In cellar').length
  const totalPending = bottles.filter(b => b.status === 'Pending arrival').length
  const totalConsumed = bottles.filter(b => ['Consumed', 'Enjoyed at restaurant'].includes(b.status)).length
  const year = new Date().getFullYear()
  const readyNow = wines.filter(w =>
    w.drink_from && w.drink_to && year >= w.drink_from && year <= w.drink_to &&
    bottlesForWine(w.id).some(b => b.status === 'In cellar')
  ).length

  const handleScanned = (data) => {
    setScannedData(data || {})
    setModal('addWine')
  }

  const saveNewWine = async (form) => {
    setSaving(true)
    const { data: newWine } = await supabase.from('wines').insert([{
      producer: form.producer, wine_name: form.wine_name || null,
      vintage: form.vintage ? parseInt(form.vintage) : null,
      type: form.type, region: form.region || null, appellation: form.appellation || null,
      country: form.country || null, grape: form.grape || null, alcohol: form.alcohol || null,
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
    }]).select().single()
    setSaving(false)
    if (newWine) {
      setPendingWineId(newWine.id)
      setModal('addBottle')
    } else {
      setModal(null)
    }
    setScannedData(null)
  }

  const saveNewBottle = async (form) => {
    setSaving(true)
    await supabase.from('bottles').insert([{
      wine_id: pendingWineId,
      status: form.status,
      quantity: parseInt(form.quantity) || 1,
      purchase_date: form.purchase_date || null,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      purchase_source: form.purchase_source || null,
      auction_lot: form.auction_lot || null,
      consumed_date: form.consumed_date || null,
      restaurant_name: form.restaurant_name || null,
      tasting_note: form.tasting_note || null,
    }])
    setSaving(false)
    setPendingWineId(null)
    setModal(null)
    fetchAll()
  }

  const applyScoreImport = async ({ toUpdate, toCreate }) => {
    setSaving(true)
    for (const u of toUpdate) {
      const patch = {}
      if (u.extracted.score) patch.score_winefront = u.extracted.score
      if (u.extracted.drink_from) patch.drink_from = u.extracted.drink_from
      if (u.extracted.drink_to) patch.drink_to = u.extracted.drink_to
      if (Object.keys(patch).length) {
        await supabase.from('wines').update(patch).eq('id', u.match.id)
      }
    }
    for (const c of toCreate) {
      const e = c.extracted
      await supabase.from('wines').insert([{
        producer: e.producer,
        wine_name: e.wine_name || null,
        vintage: e.vintage ? parseInt(e.vintage) : null,
        type: e.type || 'Red',
        region: e.region || null,
        score_winefront: e.score || null,
        drink_from: e.drink_from ? parseInt(e.drink_from) : null,
        drink_to: e.drink_to ? parseInt(e.drink_to) : null,
      }])
    }
    setSaving(false)
    setModal(null)
    fetchAll()
  }

  if (selected) {
    const wine = wines.find(w => w.id === selected)
    if (!wine) { setSelected(null); return null }
    return <WineDetail wine={wine} bottles={bottlesForWine(wine.id)} onBack={() => setSelected(null)} onRefresh={fetchAll} />
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <header style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 }}>
          <h1 style={{ fontSize: 28 }}>Wine Cellar</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal('import')} title="Import scores from screenshot">📊 Import scores</button>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('scan')}>📷 Scan</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setScannedData({}); setModal('addWine') }}>+ Add</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { l: 'In cellar', v: totalInCellar },
            { l: 'Pending', v: totalPending },
            { l: 'Consumed', v: totalConsumed },
            { l: 'Ready now', v: readyNow },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center', padding: '8px 4px' }}>
              <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>{s.v}</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-light)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
          {['cellar', 'ask'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 16px', fontSize: 13, fontWeight: tab === t ? 500 : 400,
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? 'var(--ink)' : 'var(--ink-light)',
              borderBottom: `2px solid ${tab === t ? 'var(--wine)' : 'transparent'}`,
              marginBottom: -1, transition: 'color 0.15s',
            }}>{t === 'cellar' ? 'Cellar' : 'Ask my cellar'}</button>
          ))}
        </div>
      </header>

      {tab === 'cellar' && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search producer, wine, region…"
              style={{ flex: 1, minWidth: 140, padding: '8px 12px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', background: '#fff', fontSize: 13 }}
            />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', background: '#fff', fontSize: 13, color: 'var(--ink)' }}>
              <option value="">All types</option>
              {['Red','White','Rosé','Sparkling','Orange','Fortified'].map(t => <option key={t}>{t}</option>)}
            </select>
            <button
              onClick={() => setFilterReady(!filterReady)}
              style={{ padding: '8px 12px', fontSize: 12, fontWeight: 500, background: filterReady ? 'var(--green-pale)' : 'transparent', color: filterReady ? 'var(--green)' : 'var(--ink-light)', border: `1px solid ${filterReady ? 'var(--green)' : 'var(--border-mid)'}`, borderRadius: 'var(--radius)', cursor: 'pointer' }}
            >Ready now</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-light)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : grouped.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink-light)' }}>
              <p style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 }}>{wines.length ? 'No wines match your filters' : 'Your cellar is empty'}</p>
              <p style={{ fontSize: 13 }}>{wines.length ? '' : 'Scan a label or tap + Add to get started'}</p>
            </div>
          ) : (
            grouped.map(({ type, wines: wList }) => (
              <div key={type} style={{ marginBottom: 20 }}>
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{type}</span>
                  <span style={{ fontWeight: 400 }}>{wList.length}</span>
                </div>
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {wList.map(w => (
                    <WineRow key={w.id} wine={w} bottles={bottlesForWine(w.id)} onClick={() => setSelected(w.id)} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'ask' && <div style={{ padding: '12px 16px 0' }}><AskCellar wines={wines} bottles={bottles} /></div>}

      {modal === 'scan' && (
        <Modal title="Scan wine label" onClose={() => setModal(null)}>
          <Scanner onScanned={handleScanned} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {modal === 'import' && (
        <Modal title="Import scores from screenshot" onClose={() => setModal(null)} wide>
          {saving
            ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /><p style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-light)' }}>Updating wines…</p></div>
            : <ScoreImport wines={wines} onApply={applyScoreImport} onCancel={() => setModal(null)} />
          }
        </Modal>
      )}

      {modal === 'addWine' && (
        <Modal title="Add wine" onClose={() => { setModal(null); setScannedData(null) }} wide>
          {saving ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            : <WineForm initial={scannedData || {}} onSave={saveNewWine} onCancel={() => { setModal(null); setScannedData(null) }} />}
        </Modal>
      )}

      {modal === 'addBottle' && (
        <Modal title="Add bottle details" onClose={() => { setModal(null); setPendingWineId(null); fetchAll() }}>
          {saving ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            : <BottleForm initial={{ status: 'In cellar', quantity: 1 }} onSave={saveNewBottle} onCancel={() => { setModal(null); setPendingWineId(null); fetchAll() }} />}
        </Modal>
      )}
    </div>
  )
}
