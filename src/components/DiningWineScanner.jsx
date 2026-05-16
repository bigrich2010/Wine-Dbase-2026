import { useState, useRef } from 'react'
import { convertImageToPng, getBase64 } from '../lib/imageUtils'

export default function DiningWineScanner({ onScanned, onCancel }) {
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 100)
    } catch(e) { setPhase('error') }
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
    const prompt = `You are reading a photo of wine bottles or a wine list. Extract every wine visible.
For each wine return:
- producer: winery name
- wine_name: wine name without producer
- vintage: year as number or null
- type: "Red", "White", "Rosé", "Sparkling", "Orange", or "Fortified"
- region: broad region if visible or null
Return ONLY a JSON array. No explanation.`
    try {
      const resp = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 1500,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: prompt }
          ]}]
        })
      })
      const data = await resp.json()
      const txt = data.content?.find(c => c.type === 'text')?.text || ''
      const wines = JSON.parse(txt.replace(/```json|```/g, '').trim())
      onScanned(wines)
    } catch(e) { setPhase('error') }
  }

  if (phase === 'idle') return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '1.5rem', marginBottom: '1rem', background: 'var(--cream-dark)' }}>
        <div style={{ fontSize: 32, marginBottom: 6, opacity: 0.25 }}>📸</div>
        <p style={{ color: 'var(--ink-light)', fontSize: 13 }}>Photo of bottles, wine list, or labels</p>
        <p style={{ color: 'var(--ink-light)', fontSize: 11, marginTop: 4 }}>Multiple bottles in one shot works great</p>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={startCamera}>📷 Camera</button>
        <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()}>⬆ Upload</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onCancel}>Skip — add wines manually</button>
    </div>
  )

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
        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} /> Reading wines…
      </div>
    </div>
  )

  if (phase === 'error') return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <p style={{ color: '#A32D2D', fontSize: 13, marginBottom: 12 }}>Couldn't read — try again or add manually</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setPhase('idle')}>Try again</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Add manually</button>
      </div>
    </div>
  )
}
