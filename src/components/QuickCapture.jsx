import { useState, useRef } from 'react'
import { convertImageToPng, getBase64 } from '../lib/imageUtils'

const WHERE_OPTIONS = ['Restaurant', 'Bar', "Friend's", 'Event', 'Tasting', 'Other']

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 36, lineHeight: 1, padding: '2px',
            color: n <= (hover || value) ? '#B8912A' : 'var(--border-strong)', transition: 'color 0.1s' }}>★</button>
      ))}
    </div>
  )
}

export default function QuickCapture({ onSave, onCancel }) {
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState(null)
  const [f, setF] = useState({
    producer: '', wine_name: '', vintage: '', type: 'Red', region: '',
    rating: 0, note: '', where_type: 'Restaurant', restaurant_name: '',
    shared_with: '', reorder: false, date: new Date().toISOString().split('T')[0],
  })
  const s = (k, v) => setF(p => ({ ...p, [k]: v }))
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setScanning(true)
    try {
      const { dataUrl, mimeType } = await convertImageToPng(file)
      setPreview(dataUrl)
      const b64 = getBase64(dataUrl)
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 200,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: 'Extract wine label info. Return ONLY JSON: {"producer":"","wine_name":"","vintage":"","type":"Red|White|Rosé|Sparkling|Orange|Fortified","region":""}' }
          ]}]
        })
      })
      const data = await resp.json()
      const txt = data.content?.find(c => c.type === 'text')?.text || ''
      const result = JSON.parse(txt.replace(/```json|```/g, '').trim())
      setF(p => ({ ...p, ...result }))
    } catch(err) {
      console.error('Scan error:', err)
    }
    setScanning(false)
  }

  const canSave = f.producer.trim() || f.wine_name.trim()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--ink-light)', textAlign: 'center', marginBottom: -4 }}>
        Capture a wine you've just tried
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => cameraRef.current.click()}
          disabled={scanning}>📷 Scan label</button>
        <button className="btn btn-secondary btn-sm" onClick={() => galleryRef.current.click()}
          disabled={scanning}>🖼 From gallery</button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
          style={{ display: 'none' }} onChange={handleFile} />
        <input ref={galleryRef} type="file" accept="image/*"
          style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {scanning && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: 'var(--ink-light)' }}>
          <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Reading label…
        </div>
      )}

      {preview && !scanning && (
        <img src={preview} alt="" style={{ width: '100%', maxHeight: 100, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)' }} />
      )}

      <div className="form-row">
        <div className="form-field"><label>Producer</label>
          <input value={f.producer} onChange={e => s('producer', e.target.value)} placeholder="e.g. Moss Wood" /></div>
        <div className="form-field"><label>Wine</label>
          <input value={f.wine_name} onChange={e => s('wine_name', e.target.value)} placeholder="e.g. Cabernet Sauvignon" /></div>
      </div>
      <div className="form-row">
        <div className="form-field"><label>Vintage</label>
          <input type="number" value={f.vintage} onChange={e => s('vintage', e.target.value)} placeholder="2019" /></div>
        <div className="form-field"><label>Region</label>
          <input value={f.region} onChange={e => s('region', e.target.value)} placeholder="e.g. Margaret River" /></div>
      </div>
      <div className="form-row">
        <div className="form-field"><label>Where</label>
          <select value={f.where_type} onChange={e => s('where_type', e.target.value)}>
            {WHERE_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="form-field"><label>{f.where_type === 'Restaurant' ? 'Restaurant' : 'Venue'}</label>
          <input value={f.restaurant_name} onChange={e => s('restaurant_name', e.target.value)} placeholder="optional" /></div>
      </div>
      <div className="form-row full">
        <div className="form-field"><label>With</label>
          <input value={f.shared_with} onChange={e => s('shared_with', e.target.value)} placeholder="Who were you with?" /></div>
      </div>
      <div className="form-field"><label>Rating</label>
        <StarRating value={f.rating} onChange={v => s('rating', v)} /></div>
      <div className="form-row full">
        <div className="form-field"><label>Note</label>
          <textarea value={f.note} onChange={e => s('note', e.target.value)} placeholder="Quick impression…" rows={2} /></div>
      </div>

      <div onClick={() => s('reorder', !f.reorder)} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8,
        border: `2px solid ${f.reorder ? 'var(--wine)' : 'var(--border-mid)'}`,
        background: f.reorder ? 'var(--wine-pale)' : '#fff', cursor: 'pointer', transition: 'all 0.15s',
      }}>
        <span style={{ fontSize: 20 }}>🔁</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: f.reorder ? 'var(--wine)' : 'var(--ink)' }}>
            {f.reorder ? 'On the want list!' : 'Get some of this'}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-light)' }}>Add to your Want List</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 18, color: f.reorder ? 'var(--wine)' : 'var(--border-strong)' }}>
          {f.reorder ? '✓' : '+'}</div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave(f)}
          style={{ opacity: canSave ? 1 : 0.4 }}>Save capture</button>
      </div>
    </div>
  )
}
