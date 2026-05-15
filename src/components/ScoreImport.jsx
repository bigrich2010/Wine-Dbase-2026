import { useState, useRef } from 'react'

export default function ScoreImport({ wines, onApply, onCancel }) {
  const [phase, setPhase] = useState('idle')
  const [preview, setPreview] = useState(null)
  const [matches, setMatches] = useState([])
  const [selected, setSelected] = useState({})
  const fileRef = useRef(null)

  const handleFile = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => analyse(ev.target.result)
    reader.readAsDataURL(file)
  }

  const analyse = async (dataUrl) => {
    setPreview(dataUrl)
    setPhase('scanning')
    const b64 = dataUrl.split(',')[1]

    const prompt = `You are reading a wine review page screenshot. Extract every wine entry visible.
For each wine return an object with:
- producer: the winery name
- wine_name: the wine/cuvée name (without producer, e.g. "Vineyard Cabernet Sauvignon" or "Cabernet Sauvignon")
- vintage: the year as a number
- type: "Red", "White", "Rosé", "Sparkling", "Orange", or "Fortified"
- region: broad region (e.g. "Margaret River", "Burgundy")
- score: the critic score as a string (e.g. "95", "95+", "94-96")
- drink_from: start of drinking window as number (or null)
- drink_to: end of drinking window as number (or null)
- price: price if shown as number (or null)

Return ONLY a JSON array. No explanation, only JSON.`

    try {
      const resp = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 3000,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
            { type: 'text', text: prompt }
          ]}]
        })
      })
      const data = await resp.json()
      const txt = data.content?.find(c => c.type === 'text')?.text || ''
      const extracted = JSON.parse(txt.replace(/```json|```/g, '').trim())
      matchToCellar(extracted)
    } catch(e) {
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
    setMatches(results)
    const initialSelected = {}
    results.forEach(r => { initialSelected[r.id] = true })
    setSelected(initialSelected)
    setPhase('review')
  }

  const applyUpdates = () => {
    const toUpdate = matches.filter(m => !m.isNew && selected[m.id])
    const toCreate = matches.filter(m => m.isNew && selected[m.id])
    onApply({ toUpdate, toCreate })
  }

  const updateCount = matches.filter(m => !m.isNew && selected[m.id]).length
  const createCount = matches.filter(m => m.isNew && selected[m.id]).length
  const totalCount = updateCount + createCount

  const toggleAll = (val) => {
    const next = {}
    matches.forEach(m => { next[m.id] = val })
    setSelected(next)
  }

  if (phase === 'idle') return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '2rem', marginBottom: '1rem', background: 'var(--cream-dark)' }}>
        <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.25 }}>📊</div>
        <p style={{ color: 'var(--ink-light)', fontSize: 13, marginBottom: 6 }}>Upload a screenshot of a Winefront or Ray Jordan producer page</p>
        <p style={{ color: 'var(--ink-light)', fontSize: 12 }}>Claude reads all wines — matches existing cellar entries and creates new ones</p>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => fileRef.current.click()}>⬆ Upload screenshot</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
    </div>
  )

  if (phase === 'scanning') return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, marginBottom: 16, border: '1px solid var(--border)' }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--ink-light)' }}>
        <div className="spinner" />
        <span style={{ fontSize: 13 }}>Reading scores from screenshot…</span>
      </div>
    </div>
  )

  if (phase === 'error') return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      <p style={{ color: '#A32D2D', marginBottom: 16, fontSize: 13 }}>Couldn't read the screenshot — try a clearer image.</p>
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
          {updateCount > 0 && <span style={{ color: 'var(--green)' }}>✓ {updateCount} will update</span>}
          {createCount > 0 && <span style={{ color: 'var(--amber)' }}>+ {createCount} will be created</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => toggleAll(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-light)', textDecoration: 'underline' }}>Select all</button>
          <button onClick={() => toggleAll(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-light)', textDecoration: 'underline' }}>None</button>
        </div>
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
        {matches.map(m => (
          <div key={m.id} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
            padding: '9px 12px', borderBottom: '1px solid var(--border)',
            background: selected[m.id] ? 'transparent' : 'var(--cream-dark)',
          }}>
            <input
              type="checkbox"
              checked={!!selected[m.id]}
              onChange={e => setSelected(prev => ({ ...prev, [m.id]: e.target.checked }))}
              style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--wine)' }}
            />
            <div>
              <div style={{ fontSize: 13, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>
                {m.extracted.producer}{m.extracted.wine_name ? ` — ${m.extracted.wine_name}` : ''} {m.extracted.vintage}
              </div>
              <div style={{ fontSize: 11, marginTop: 1 }}>
                {m.isNew
                  ? <span style={{ color: 'var(--amber)' }}>+ New wine entry will be created</span>
                  : <span style={{ color: 'var(--green)' }}>✓ Matches {m.match.producer}{m.match.wine_name ? ' — ' + m.match.wine_name : ''} {m.match.vintage}</span>
                }
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, flexShrink: 0 }}>
              {m.extracted.score && <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{m.extracted.score}</div>}
              {(m.extracted.drink_from || m.extracted.drink_to) && (
                <div style={{ color: 'var(--ink-light)' }}>{m.extracted.drink_from || '?'}–{m.extracted.drink_to || '?'}</div>
              )}
              {m.extracted.price && <div style={{ color: 'var(--ink-light)' }}>${m.extracted.price}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={applyUpdates} disabled={totalCount === 0}>
          {updateCount > 0 && createCount > 0
            ? `Update ${updateCount} + create ${createCount}`
            : updateCount > 0
            ? `Update ${updateCount} wine${updateCount !== 1 ? 's' : ''}`
            : `Create ${createCount} wine${createCount !== 1 ? 's' : ''}`
          }
        </button>
      </div>
    </div>
  )
}
