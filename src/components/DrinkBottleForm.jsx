import { useState } from 'react'

const WHERE_OPTIONS = ['Home', 'Restaurant', "Friend's", 'Event', 'Other']

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 32, lineHeight: 1, padding: '2px',
            color: n <= (hover || value) ? '#B8912A' : 'var(--border-strong)',
            transition: 'color 0.1s',
          }}
        >★</button>
      ))}
    </div>
  )
}

export default function DrinkBottleForm({ wine, bottle, onQuickRemove, onSave, onCancel }) {
  const [phase, setPhase] = useState('choose') // choose | form
  const today = new Date().toISOString().split('T')[0]
  const [f, setF] = useState({
    consumed_date: today,
    where_type: 'Home',
    restaurant_name: '',
    shared_with: '',
    rating: 0,
    tasting_note: '',
    decanted: false,
    decanted_mins: '',
    reorder: false,
  })

  const s = (k, v) => setF(p => ({ ...p, [k]: v }))
  const isRestaurant = f.where_type === 'Restaurant'

  if (phase === 'choose') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--cream-dark)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>
          {wine.producer}{wine.wine_name ? ` — ${wine.wine_name}` : ''}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 3 }}>
          {wine.vintage}{wine.region ? ` · ${wine.region}` : ''}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="btn btn-secondary"
          style={{ justifyContent: 'center', padding: '14px', fontSize: 14 }}
          onClick={onQuickRemove}
        >
          Quick remove — out of cellar
        </button>
        <button
          className="btn btn-primary"
          style={{ justifyContent: 'center', padding: '14px', fontSize: 14 }}
          onClick={() => setPhase('form')}
        >
          🏆 Add to Drunk Heroes
        </button>
      </div>

      <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={onCancel}>Cancel</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--cream-dark)', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontSize: 16, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>
          {wine.producer}{wine.wine_name ? ` — ${wine.wine_name}` : ''}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 2 }}>
          {wine.vintage}{wine.region ? ` · ${wine.region}` : ''}
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>Date drunk</label>
          <input type="date" value={f.consumed_date} onChange={e => s('consumed_date', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Where</label>
          <select value={f.where_type} onChange={e => s('where_type', e.target.value)}>
            {WHERE_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {isRestaurant && (
        <div className="form-row full">
          <div className="form-field">
            <label>Restaurant name</label>
            <input value={f.restaurant_name} onChange={e => s('restaurant_name', e.target.value)} placeholder="e.g. Loulou, Wills Wine Bar…" />
          </div>
        </div>
      )}

      <div className="form-row full">
        <div className="form-field">
          <label>Shared with</label>
          <input value={f.shared_with} onChange={e => s('shared_with', e.target.value)} placeholder="e.g. Sarah, family…" />
        </div>
      </div>

      <div className="form-field">
        <label>Your rating</label>
        <StarRating value={f.rating} onChange={v => s('rating', v)} />
      </div>

      <div className="form-row full">
        <div className="form-field">
          <label>Tasting note</label>
          <textarea
            value={f.tasting_note}
            onChange={e => s('tasting_note', e.target.value)}
            placeholder="How did it drink?"
            rows={3}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="decanted" checked={f.decanted} onChange={e => s('decanted', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--wine)', cursor: 'pointer' }} />
          <label htmlFor="decanted" style={{ fontSize: 13, cursor: 'pointer' }}>Decanted</label>
          {f.decanted && (
            <input type="number" value={f.decanted_mins} onChange={e => s('decanted_mins', e.target.value)}
              placeholder="mins" min="0" style={{ width: 70, padding: '4px 8px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', fontSize: 13 }} />
          )}
        </div>
      </div>

      <div
        onClick={() => s('reorder', !f.reorder)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
          borderRadius: 8, border: `2px solid ${f.reorder ? 'var(--wine)' : 'var(--border-mid)'}`,
          background: f.reorder ? 'var(--wine-pale)' : '#fff',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <span style={{ fontSize: 22 }}>🔁</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: f.reorder ? 'var(--wine)' : 'var(--ink)' }}>
            {f.reorder ? 'On the want list!' : 'Get more of this'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-light)' }}>Flag for reorder — adds to your Want List</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 18, color: f.reorder ? 'var(--wine)' : 'var(--border-strong)' }}>
          {f.reorder ? '✓' : '+'}
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={() => setPhase('choose')}>Back</button>
        <button className="btn btn-primary" onClick={() => onSave(f)}>
          Save to Drunk Heroes {f.rating > 0 ? '— ' + '★'.repeat(f.rating) : ''}
        </button>
      </div>
    </div>
  )
}
