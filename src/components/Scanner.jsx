import { useState, useRef } from 'react'
import { convertImageToPng, getBase64 } from '../lib/imageUtils'

export default function Scanner({ onScanned, onCancel }) {
  const [phase, setPhase] = useState('idle')
  const [preview, setPreview] = useState(null)
  const [extracted, setExtracted] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }

  const startCamera = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera not supported — please use Upload instead')
      return
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream
        setPhase('camera')
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play()
          }
        }, 100)
      })
      .catch(err => {
        console.error('Camera error:', err)
        alert('Could not access camera: ' + err.message + ' — please use Upload instead')
      })
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
    const prompt = `You are a wine label reader. Extract all information from this wine label.
Return ONLY valid JSON (null for missing fields):
{"producer":"","wine_name":"","vintage":"","type":"Red|White|Rosé|Sparkling|Orange|Fortified","region":"","appellation":"","country":"","grape":"","alcohol":""}
Use broad region (e.g. "Margaret River", "Burgundy") and specific appellation (e.g. "Wilyabrup Valley", "Gevrey-Chambertin").`
    try {
      const resp = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 400,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: prompt }
          ]}]
        })
      })
      const data = await resp.json()
      const txt = data.content?.find(c => c.type === 'text')?.text || ''
      const result = JSON.parse(txt.replace(/```json|```/g, '').trim())
      setExtracted(result)
      setPhase('done')
    } catch(e) { setPhase('error') }
  }

  const handleCancel = () => { stopCamera(); onCancel() }

  if (phase === 'idle') return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '2rem', marginBottom: '1rem', background: 'var(--cream-dark)' }}>
        <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.25 }}>◈</div>
        <p style={{ color: 'var(--ink-light)', fontSize: 13 }}>Photograph the wine label</p>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={startCamera}>📷 Open camera</button>
        <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>⬆ Upload photo</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
    </div>
  )

  if (phase === 'camera') return (
    <div>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 6, marginBottom: 12, background: '#000', maxHeight: 340, objectFit: 'cover' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={capture}>📷 Capture label</button>
        <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  )

  if (phase === 'scanning') return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, marginBottom: 16 }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--ink-light)' }}>
        <div className="spinner" /> <span style={{ fontSize: 13 }}>Reading label…</span>
      </div>
    </div>
  )

  if (phase === 'error') return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      <p style={{ color: '#A32D2D', marginBottom: 16, fontSize: 13 }}>Couldn't read — try again or add manually.</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={() => setPhase('idle')}>Try again</button>
        <button className="btn btn-primary" onClick={() => onScanned({})}>Add manually</button>
      </div>
    </div>
  )

  if (phase === 'done') return (
    <div>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 6, marginBottom: 12, border: '1px solid var(--border)' }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 12, color: 'var(--green)' }}>
        ✓ Label read — confirm details on next screen
      </div>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onScanned(extracted)}>
        Continue →
      </button>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button onClick={() => onScanned({})} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-light)', textDecoration: 'underline' }}>
          Fill in manually instead
        </button>
      </div>
    </div>
  )
}
