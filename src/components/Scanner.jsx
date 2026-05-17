import { useState, useRef } from 'react'
import { convertImageToPng, getBase64 } from '../lib/imageUtils'

export default function Scanner({ onScanned, onCancel }) {
  const [phase, setPhase] = useState('idle') // idle | processing | done | error
  const [preview, setPreview] = useState(null)
  const [extracted, setExtracted] = useState(null)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = '' // reset so same file can be selected again
    setPhase('processing')
    try {
      const { dataUrl, mimeType } = await convertImageToPng(file)
      setPreview(dataUrl)
      await analyse(dataUrl, mimeType)
    } catch(err) {
      console.error('Image error:', err)
      setPhase('error')
    }
  }

  const analyse = async (dataUrl, mimeType) => {
    try {
      const b64 = getBase64(dataUrl)
      const prompt = `You are a wine label reader. Extract all information from this wine label.
Return ONLY valid JSON (null for missing fields):
{"producer":"","wine_name":"","vintage":"","type":"Red|White|Rosé|Sparkling|Orange|Fortified","region":"","appellation":"","country":"","grape":"","alcohol":""}`
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 400,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: prompt }
          ]}]
        })
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error.message || 'API error')
      const txt = data.content?.find(c => c.type === 'text')?.text || ''
      const result = JSON.parse(txt.replace(/```json|```/g, '').trim())
      setExtracted(result)
      setPhase('done')
    } catch(err) {
      console.error('Scanner analyse error:', err)
      setPhase('error')
    }
  }

  if (phase === 'idle') return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 8, padding: '2rem', marginBottom: '1rem', background: 'var(--cream-dark)' }}>
        <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.25 }}>◈</div>
        <p style={{ color: 'var(--ink-light)', fontSize: 13 }}>Photograph or upload a wine label</p>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => cameraRef.current.click()}>
          📷 Take photo
        </button>
        <button className="btn btn-secondary" onClick={() => galleryRef.current.click()}>
          🖼 From gallery
        </button>
      </div>
      {/* Camera input - opens native camera */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={handleFile} />
      {/* Gallery input - opens photo picker */}
      <input ref={galleryRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={handleFile} />
      <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
    </div>
  )

  if (phase === 'processing') return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6, marginBottom: 16 }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--ink-light)' }}>
        <div className="spinner" /> <span style={{ fontSize: 13 }}>Reading label…</span>
      </div>
    </div>
  )

  if (phase === 'error') return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 6, marginBottom: 12 }} />}
      <p style={{ color: '#A32D2D', marginBottom: 16, fontSize: 13 }}>Couldn't read the label — try a clearer photo or add manually.</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={() => { setPhase('idle'); setPreview(null) }}>Try again</button>
        <button className="btn btn-primary" onClick={() => onScanned({})}>Add manually</button>
      </div>
    </div>
  )

  if (phase === 'done') return (
    <div>
      {preview && <img src={preview} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 6, marginBottom: 12, border: '1px solid var(--border)' }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 12, color: 'var(--green)' }}>
        ✓ Label read successfully — confirm details on next screen
      </div>
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => onScanned(extracted)}>
        Continue →
      </button>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button onClick={() => onScanned({})}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-light)', textDecoration: 'underline' }}>
          Fill in manually instead
        </button>
      </div>
    </div>
  )
}
