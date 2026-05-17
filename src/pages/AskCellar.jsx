import { useState, useRef, useEffect } from 'react'

const QUICK = [
  "What's ready to drink right now?",
  "Which wines should I drink in the next 2 years?",
  "What's my most valuable wine?",
  "Give me a breakdown by region",
  "What should I open for a special occasion?",
  "Which wines still need more time?",
  "What have I spent on wine total?",
  "What restaurant wines have I enjoyed?",
]

export default function AskCellar({ wines, bottles }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (q) => {
    if (!q.trim() || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    // Compress cellar data - only include non-null fields to save tokens
    const cellarData = wines.map(w => {
      const wBottles = bottles.filter(b => b.wine_id === w.id)
      const obj = {
        p: w.producer,
        w: w.wine_name || undefined,
        v: w.vintage || undefined,
        t: w.type,
        r: w.region || undefined,
        sc: [w.score_winefront, w.score_ray_jordan, w.score_halliday, w.score_wine_advocate].filter(Boolean)[0] || undefined,
        df: w.drink_from || undefined,
        dt: w.drink_to || undefined,
        b: wBottles.map(b => ({
          s: b.status,
          q: b.quantity > 1 ? b.quantity : undefined,
          pp: b.purchase_price || undefined,
          src: b.purchase_source || undefined,
          lot: b.auction_lot || undefined,
          n: b.tasting_note || undefined,
          cd: b.consumed_date || undefined,
          r: b.restaurant_name || undefined,
          rt: b.rating || undefined,
        }))
      }
      // Remove undefined keys
      return JSON.parse(JSON.stringify(obj))
    })

    const sys = `You are a personal wine sommelier and cellar advisor with deep knowledge of fine wine.
User's cellar (compressed: p=producer, w=wine, v=vintage, t=type, r=region, sc=score, df/dt=drink from/to, b=bottles array where s=status, q=qty, pp=price, src=source, lot=auction lot, n=note, cd=consumed date, rt=rating):
${JSON.stringify(cellarData)}
Year: ${new Date().getFullYear()}. Be specific, reference actual wines by name. Keep responses concise but insightful. Format with line breaks.`

    const newHistory = [...history, { role: 'user', content: q }]
    setHistory(newHistory)

    try {
      const resp = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({  max_tokens: 1500, system: sys, messages: newHistory })
      })
      const data = await resp.json()
      const reply = data.content?.find(c => c.type === 'text')?.text || 'Sorry, could not generate a response.'
      setHistory(prev => [...prev, { role: 'assistant', content: reply }])
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch(e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error — please try again.' }])
    }
    setLoading(false)
  }

  if (wines.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink-light)' }}>
      <p style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 }}>Add some wines first</p>
      <p style={{ fontSize: 13 }}>Then ask anything about your collection.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 80 }}>
      <p style={{ fontSize: 13, color: 'var(--ink-light)', marginBottom: '1rem' }}>
        Ask anything about your {wines.length} wines and {bottles.length} bottles…
      </p>

      {messages.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => send(q)} style={{
              padding: '7px 12px', fontSize: 12, background: 'var(--cream-dark)',
              border: '1px solid var(--border-mid)', borderRadius: 20, cursor: 'pointer',
              color: 'var(--ink-mid)', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.target.style.background = 'var(--gold-light)'}
            onMouseLeave={e => e.target.style.background = 'var(--cream-dark)'}
            >{q}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 80 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '90%',
            padding: '0.6rem 0.9rem',
            borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            background: m.role === 'user' ? 'var(--wine)' : '#fff',
            color: m.role === 'user' ? '#fff' : 'var(--ink)',
            border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
            fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line',
            animation: 'fadeUp 0.2s ease',
          }}>{m.text}</div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '0.6rem 0.9rem', borderRadius: '12px 12px 12px 2px', background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
            <span style={{ fontSize: 13, color: 'var(--ink-light)' }}>Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'var(--cream)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, maxWidth: 760, margin: '0 auto' }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Ask about your cellar…"
          style={{ flex: 1, padding: '10px 14px', fontSize: 13, background: '#fff', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', outline: 'none' }}
        />
        <button onClick={() => send(input)} disabled={loading} className="btn btn-primary" style={{ opacity: loading ? 0.5 : 1 }}>→</button>
      </div>
    </div>
  )
}
