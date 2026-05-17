import { convertImageToPng, getBase64 } from '../lib/imageUtils'
import { useState, useRef } from 'react'

export default function BatchImport({ wines, onApply, onCancel }) {
  const [phase, setPhase] = useState('idle')
  const [preview, setPreview] = useState(null)
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState({})
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const handleFile = async e => {
    const file = e.target.files[0]
    if (!file) return
    const { dataUrl, mimeType } = await convertImageToPng(file)
    analyse(dataUrl, mimeType)
  }

  const analyse = async (dataUrl, mimeType) => {
    setPreview(dataUrl)
    setPhase('scanning')
    const b64 = getBase64(dataUrl)

    const prompt = `You are reading a wine purchase receipt, invoice, cellar list, or inventory.
Extract every wine entry visible. For each wine return:
- producer: winery name
- wine_name: wine or cuvée name (without producer)
- vintage: year as number (or null)
- type: "Red", "White", "Rosé", "Sparkling", "Orange", or "Fortified"
- region: broad region if visible (or null)
- quantity: number of bottles (default 1 if not shown)
- price_per_bottle: price per bottle as number (or null). If only total shown, divide by quantity.
- purchase_date: date as YYYY-MM-DD if visible (or null)
- source: where purchased e.g. "Langtons", "Cellar door" (or null)
- auction_lot: lot number if visible (or null)

Return ONLY a JSON array. No explanation, only JSON.`

    try {
      const resp = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          
          max_tokens: 3000,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: b64 } },
            { type: 'text', text: prompt }
          ]}]
        })
      })
      const data = await resp.json()
      console.log('API response:', JSON.stringify(data).slice(0, 500))
      const txt = data.content?.find(c => c.type === 'text')?.text || ''
      if (!txt) throw new Error('No text in response: ' + JSON.stringify(data).slice(0, 200))
      const extracted = JSON.parse(txt.replace(/```json|```/g, '').trim())
      matchToCellar(extracted)
    } catch(e) {
      console.error('Batch import error:', e)
      setPhase('error')
    }
  }

  const matchToCellar = (extracted) => {
    const results = extracted.map(entry => {
      const match = wines.find(w => {
        const producerMatch =
          w.producer.toLowerCase().includes(entry.producer.toLowerCase()) ||
          entry.producer.toLowerCase().includes(w.producer.toLowerCase())
        const vintageMatch = !entry.vintage || !w.vintage ||
          parseInt(w.vintage) === parseInt(entry.vintage)
        const nameMatch = !entry.wine_name || !w.wine_name ||
          w.wine_name.toLowerCase().includes(entry.wine_name.toLowerCase()) ||
          entry.wine_name.toLowerCase().includes(w.wine_name.toLowerCase())
        return producerMatch && vintageMatch && nameMatch
      })
      return {
        extracted: entry,
        match,
        isNew: !match,
        id: Math.random().toString(36).slice(2)
      }
    })
    setResults(results)
    const initialSelected = {}
    results.forEach(r => { initialSelected[r.id] = true })
    setSelected(initialSelected)
    setPhase('review')
  }

  const toggleAll = (val) => {
    const next = {}
    results.forEach(r => { next[r.id] = val })
    setSelected(next)
  }

  const applyImport = () => {
    const toProcess = results.filter(r => selected[r.id])
    onApply(toProcess)
  }

  const matchCount = results.filter(r => !r.isNew && selected[r.id]).length
  const createCount = results.filter(r => r.isNew && selected[r.id]).length
  const totalCount = matchCount + createCount
  const totalBottles = results.filter(r => selected[r.id]).reduce((s, r) => s + (parseInt(r.extracted.quantity) || 1), 0)

  if (phase === 'idle') return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '2rem', marginBottom: '1rem', background: 'var(--cream-dark)' }}>
        <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.25 }}>🧾</div>
        <p style={{ color: 'var(--ink-light)', fontSize: 13, marginBottom: 6 }}>Upload a receipt, invoice, or cellar list</p>
        <p style={{ color: 'var(--ink-light)', fontSize: 12 }}>Claude reads all wines, quantities and prices — matches existing entries and creates new ones with bottle records</p>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={() => cameraRef.current.click()}>📷 Take photo</button>
        <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()}>🖼 Upload file</button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
    </div>
  )

  if (phase === 'scanning') return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, marginBottom: 16, border: '1px solid var(--border)' }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--ink-light)' }}>
        <div className="spinner" />
        <span style={{ fontSize: 13 }}>Reading wines from document…</span>
      </div>
    </div>
  )

  if (phase === 'error') return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      <p style={{ color: '#A32D2D', marginBottom: 16, fontSize: 13 }}>Couldn't read the document — try a clearer image.</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={() => setPhase('idle')}>Try again</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )

  if (phase === 'review') return (
    <div>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 6, marginBottom: 12, border: '1px solid var(--border)' }} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {matchCount > 0 && <span style={{ color: 'var(--green)' }}>✓ {matchCount} will update</span>}
          {createCount > 0 && <span style={{ color: 'var(--amber)' }}>+ {createCount} new wines</span>}
          {totalCount > 0 && <span style={{ color: 'var(--ink-light)' }}>{totalBottles} bottles total</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => toggleAll(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-light)', textDecoration: 'underline' }}>Select all</button>
          <button onClick={() => toggleAll(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-light)', textDecoration: 'underline' }}>None</button>
        </div>
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
        {results.map(r => (
          <div key={r.id} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'start',
            padding: '10px 12px', borderBottom: '1px solid var(--border)',
            background: selected[r.id] ? 'transparent' : 'var(--cream-dark)',
          }}>
            <input type="checkbox" checked={!!selected[r.id]}
              onChange={e => setSelected(prev => ({ ...prev, [r.id]: e.target.checked }))}
              style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--wine)', marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>
                {r.extracted.producer}{r.extracted.wine_name ? ` — ${r.extracted.wine_name}` : ''} {r.extracted.vintage || ''}
              </div>
              <div style={{ fontSize: 11, marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', color: 'var(--ink-light)' }}>
                {r.extracted.quantity > 1 && <span>×{r.extracted.quantity} bottles</span>}
                {r.extracted.purchase_date && <span>{r.extracted.purchase_date}</span>}
                {r.extracted.source && <span>{r.extracted.source}</span>}
                {r.extracted.auction_lot && <span>Lot {r.extracted.auction_lot}</span>}
              </div>
              <div style={{ fontSize: 11, marginTop: 2 }}>
                {r.isNew
                  ? <span style={{ color: 'var(--amber)' }}>+ New wine + bottle record will be created</span>
                  : <span style={{ color: 'var(--green)' }}>✓ Matches {r.match.producer}{r.match.wine_name ? ' — ' + r.match.wine_name : ''} {r.match.vintage || ''}</span>
                }
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, flexShrink: 0 }}>
              {r.extracted.price_per_bottle && (
                <div style={{ fontWeight: 500 }}>${r.extracted.price_per_bottle}</div>
              )}
              {r.extracted.quantity > 1 && r.extracted.price_per_bottle && (
                <div style={{ color: 'var(--ink-light)', fontSize: 11 }}>
                  ${(r.extracted.price_per_bottle * r.extracted.quantity).toFixed(0)} total
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={applyImport} disabled={totalCount === 0}>
          Import {totalBottles} bottle{totalBottles !== 1 ? 's' : ''} across {totalCount} wine{totalCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}
