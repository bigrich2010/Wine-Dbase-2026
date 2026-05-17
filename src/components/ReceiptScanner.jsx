import { useState, useRef } from 'react'
import { convertImageToPng, getBase64 } from '../lib/imageUtils'

export default function ReceiptScanner({ onScanned, onSkip }) {
  const [phase, setPhase] = useState('idle')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }

  const startCamera = async () => {
    setPhase('camera')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not available')
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: 'environment' } }
      })
      streamRef.current = stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 150)
    } catch(e) {
      console.error('Camera error:', e)
      setPhase('idle')
      alert('Camera not available — please use the Upload button instead')
    }
  }

  const capture = () => {
    const v = videoRef.current; if (!v) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    stopCamera()
    analyse(c.toDataURL('image/png'), 'image/png')
  }

  const handleFile = async e => {
    const file = e.target.files[0]; if (!file) return
    const { dataUrl, mimeType } = await convertImageToPng(file)
    analyse(dataUrl, mimeType)
  }

  const analyse = async (dataUrl, mimeType = 'image/png') => {
    setPreview(dataUrl)
    setPhase('scanning')
    const b64 = getBase64(dataUrl)
    const prompt = `You are reading a restaurant receipt, bill, or menu. Extract everything visible.
Return ONLY valid JSON:
{
  "venue": "restaurant name or null",
  "suburb": "suburb/area or null",
  "date": "YYYY-MM-DD format if visible or null",
  "food_items": [{"course": "Entrée|Main|Dessert|Cheese|Other or null", "dish": "dish name", "price": 45.00}],
  "wines": [{"producer": "winery name", "wine_name": "wine name", "vintage": 2019, "type": "Red|White|Rosé|Sparkling|Orange|Fortified", "price": 120.00}],
  "food_total": 120.00,
  "wine_total": 80.00,
  "service_charge": 10.00,
  "grand_total": 210.00
}
Use null for missing fields. Empty arrays if none found.`
    try {
      const resp = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_tokens: 2000,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: prompt }
          ]}]
        })
      })
      const data = await resp.json()
      const txt = data.content?.find(c => c.type === 'text')?.text || ''
      const result = JSON.parse(txt.replace(/```json|```/g, '').trim())
      onScanned(result)
    } catch(e) { setPhase('error') }
  }

  if (phase === 'camera') return (
    <div>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 6, marginBottom: 8, background: '#000', maxHeight: 280, objectFit: 'cover' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={capture}>📷 Capture</button>
        <button className="btn btn-secondary" onClick={() => { stopCamera(); setPhase('idle') }}>Cancel</button>
      </div>
    </div>
  )

  if (phase === 'scanning') return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 6, marginBottom: 12 }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ink-light)', fontSize: 13 }}>
        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} /> Reading receipt…
      </div>
    </div>
  )

  if (phase === 'error') return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <p style={{ color: '#A32D2D', fontSize: 13, marginBottom: 12 }}>Couldn't read — try again or fill in manually</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setPhase('idle')}>Try again</button>
        <button className="btn btn-ghost btn-sm" onClick={onSkip}>Fill manually</button>
      </div>
    </div>
  )

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '1.5rem', marginBottom: '1rem', background: 'var(--cream-dark)' }}>
        <div style={{ fontSize: 32, marginBottom: 6, opacity: 0.25 }}>🧾</div>
        <p style={{ color: 'var(--ink-light)', fontSize: 13, marginBottom: 4 }}>Photo of the receipt or bill</p>
        <p style={{ color: 'var(--ink-light)', fontSize: 11 }}>Reads restaurant, date, food, wines and totals automatically</p>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
        <button className="btn btn-primary btn-sm" onClick={startCamera}>📷 Camera</button>
        <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()}>⬆ Upload</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onSkip}>Skip — fill in manually</button>
    </div>
  )
}
