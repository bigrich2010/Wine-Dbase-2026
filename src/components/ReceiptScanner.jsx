import { useState, useRef } from 'react'
import { convertImageToPng, getBase64 } from '../lib/imageUtils'

export default function ReceiptScanner({ onScanned, onSkip }) {
  const [phase, setPhase] = useState('idle')
  const [preview, setPreview] = useState(null)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setPhase('processing')
    try {
      const { dataUrl, mimeType } = await convertImageToPng(file)
      setPreview(dataUrl)
      const b64 = getBase64(dataUrl)
      const prompt = `You are reading a restaurant receipt or bill. Extract everything visible.
Return ONLY valid JSON:
{
  "venue": "restaurant name or null",
  "suburb": "suburb/area or null",
  "date": "YYYY-MM-DD if visible or null",
  "food_items": [{"course": "Entrée|Main|Dessert|Cheese|Other or null", "dish": "dish name", "price": 45.00}],
  "wines": [{"producer": "winery", "wine_name": "wine name", "vintage": 2019, "type": "Red|White|Rosé|Sparkling|Orange|Fortified", "price": 120.00}],
  "food_total": 120.00,
  "wine_total": 80.00,
  "service_charge": 10.00,
  "grand_total": 210.00
}
Use null for missing. Empty arrays if none found.`
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 2000,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: prompt }
          ]}]
        })
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error.message)
      const txt = data.content?.find(c => c.type === 'text')?.text || ''
      const result = JSON.parse(txt.replace(/```json|```/g, '').trim())
      onScanned(result)
    } catch(err) {
      console.error('Receipt scan error:', err)
      setPhase('error')
    }
  }

  if (phase === 'idle') return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '1.5rem', marginBottom: '1rem', background: 'var(--cream-dark)' }}>
        <div style={{ fontSize: 32, marginBottom: 6, opacity: 0.25 }}>🧾</div>
        <p style={{ color: 'var(--ink-light)', fontSize: 13, marginBottom: 4 }}>Photo of the receipt or bill</p>
        <p style={{ color: 'var(--ink-light)', fontSize: 11 }}>Reads restaurant, date, food, wines and totals</p>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
        <button className="btn btn-primary btn-sm" onClick={() => cameraRef.current.click()}>📷 Take photo</button>
        <button className="btn btn-secondary btn-sm" onClick={() => galleryRef.current.click()}>🖼 From gallery</button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={handleFile} />
      <button className="btn btn-ghost btn-sm" onClick={onSkip}>Skip — fill in manually</button>
    </div>
  )

  if (phase === 'processing') return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 6, marginBottom: 12 }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ink-light)', fontSize: 13 }}>
        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} /> Reading receipt…
      </div>
    </div>
  )

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <p style={{ color: '#A32D2D', fontSize: 13, marginBottom: 12 }}>Couldn't read — try again or fill in manually</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => { setPhase('idle'); setPreview(null) }}>Try again</button>
        <button className="btn btn-ghost btn-sm" onClick={onSkip}>Fill manually</button>
      </div>
    </div>
  )
}
