import { useState } from 'react'

const TYPES = ['Restaurant', 'Home', 'Event']
const OCCASIONS = ['Casual', 'Special', 'Business', 'Celebration', 'Tasting']
const SOURCES = ['Restaurant list', 'My cellar', 'Guest', 'Purchased']
const WINE_TYPES = ['Red', 'White', 'Rosé', 'Sparkling', 'Orange', 'Fortified']
const COURSES = ['Entrée', 'Main', 'Dessert', 'Cheese', 'Other']

function StarRating({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: size, lineHeight: 1, padding: '1px', color: n <= (hover || value) ? '#B8912A' : 'var(--border-strong)', transition: 'color 0.1s' }}>★</button>
      ))}
    </div>
  )
}

function WineEntry({ wine, index, onChange, onRemove }) {
  const s = (k, v) => onChange(index, { ...wine, [k]: v })
  return (
    <div style={{ background: 'var(--cream-dark)', borderRadius: 8, padding: '12px', marginBottom: 10, position: 'relative' }}>
      <button onClick={() => onRemove(index)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-light)', fontSize: 14 }}>✕</button>
      <div className="form-row" style={{ marginBottom: 8 }}>
        <div className="form-field"><label>Producer</label><input value={wine.producer || ''} onChange={e => s('producer', e.target.value)} placeholder="e.g. Penfolds" /></div>
        <div className="form-field"><label>Wine</label><input value={wine.wine_name || ''} onChange={e => s('wine_name', e.target.value)} placeholder="e.g. Grange" /></div>
      </div>
      <div className="form-row" style={{ marginBottom: 8 }}>
        <div className="form-field"><label>Vintage</label><input type="number" value={wine.vintage || ''} onChange={e => s('vintage', e.target.value)} placeholder="2019" /></div>
        <div className="form-field"><label>Type</label>
          <select value={wine.type || 'Red'} onChange={e => s('type', e.target.value)}>
            {WINE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row" style={{ marginBottom: 8 }}>
        <div className="form-field"><label>Source</label>
          <select value={wine.source || 'Restaurant list'} onChange={e => s('source', e.target.value)}>
            {SOURCES.map(src => <option key={src}>{src}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>{wine.source === 'Guest' ? 'Brought by' : 'Price ($)'}</label>
          {wine.source === 'Guest'
            ? <input value={wine.brought_by || ''} onChange={e => s('brought_by', e.target.value)} placeholder="Who?" />
            : <input type="number" value={wine.price || ''} onChange={e => s('price', e.target.value)} placeholder="0.00" />}
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div className="form-field"><label>Rating</label><StarRating value={wine.rating || 0} onChange={v => s('rating', v)} size={20} /></div>
      </div>
      <div className="form-field" style={{ marginBottom: 8 }}><label>Tasting note</label>
        <textarea value={wine.tasting_note || ''} onChange={e => s('tasting_note', e.target.value)} placeholder="How was it?" rows={2} style={{ fontSize: 12 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => s('drunk_hero', !wine.drunk_hero)}
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${wine.drunk_hero ? 'var(--wine)' : 'var(--border-mid)'}`, background: wine.drunk_hero ? 'var(--wine-pale)' : 'transparent', color: wine.drunk_hero ? 'var(--wine)' : 'var(--ink-light)', cursor: 'pointer' }}>
          🏆 {wine.drunk_hero ? 'Drunk Hero ✓' : 'Drunk Heroes'}
        </button>
        <button type="button" onClick={() => s('reorder', !wine.reorder)}
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${wine.reorder ? 'var(--gold)' : 'var(--border-mid)'}`, background: wine.reorder ? 'var(--gold-light)' : 'transparent', color: wine.reorder ? 'var(--amber)' : 'var(--ink-light)', cursor: 'pointer' }}>
          🔁 {wine.reorder ? 'Want List ✓' : 'Want List'}
        </button>
      </div>
    </div>
  )
}

function FoodEntry({ item, index, onChange, onRemove }) {
  const s = (k, v) => onChange(index, { ...item, [k]: v })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 70px auto', gap: 6, alignItems: 'center', marginBottom: 6 }}>
      <select value={item.course || ''} onChange={e => s('course', e.target.value)}
        style={{ padding: '6px 8px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', fontSize: 12, background: '#fff', color: 'var(--ink)' }}>
        <option value="">Course</option>
        {COURSES.map(c => <option key={c}>{c}</option>)}
      </select>
      <input value={item.dish || ''} onChange={e => s('dish', e.target.value)} placeholder="Dish name"
        style={{ padding: '6px 8px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', fontSize: 12 }} />
      <input type="number" value={item.price || ''} onChange={e => s('price', e.target.value)} placeholder="$"
        style={{ padding: '6px 8px', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius)', fontSize: 12 }} />
      <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-light)', fontSize: 14, padding: 4 }}>✕</button>
    </div>
  )
}

export default function DiningForm({ initial = {}, scannedWines = [], scannedFood = [], existingWines = [], existingFood = [], onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0]
  const [f, setF] = useState({
    type: initial.type || 'Restaurant',
    date: initial.date || today,
    venue: initial.venue || '',
    suburb: initial.suburb || '',
    who_with: initial.who_with || '',
    occasion: initial.occasion || 'Casual',
    rating: initial.rating || 0,
    food_notes: initial.food_notes || '',
    general_notes: initial.general_notes || '',
    food_total: initial.food_total || '',
    wine_total: initial.wine_total || '',
    grand_total: initial.grand_total || '',
  })

  const initWines = existingWines.length
    ? existingWines.map(w => ({ ...w, drunk_hero: w.drunk_hero || false, reorder: w.reorder || false }))
    : scannedWines.map(w => ({ ...w, source: w.source || 'Restaurant list', rating: 0, drunk_hero: false, reorder: false }))

  const initFood = existingFood.length ? existingFood
    : scannedFood.map(fi => ({ course: fi.course || '', dish: fi.dish || '', price: fi.price || '' }))

  const [wines, setWines] = useState(initWines)
  const [food, setFood] = useState(initFood)
  const s = (k, v) => setF(p => ({ ...p, [k]: v }))
  const typeIcon = { Restaurant: '🍽', Home: '🏠', Event: '🍷' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {TYPES.map(t => (
          <button key={t} type="button" onClick={() => s('type', t)} style={{
            padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
            border: `1px solid ${f.type === t ? 'var(--wine)' : 'var(--border-mid)'}`,
            background: f.type === t ? 'var(--wine-pale)' : 'transparent',
            color: f.type === t ? 'var(--wine)' : 'var(--ink-light)',
            fontWeight: f.type === t ? 500 : 400,
          }}>{typeIcon[t]} {t}</button>
        ))}
      </div>

      <div className="form-row">
        <div className="form-field"><label>Date</label><input type="date" value={f.date} onChange={e => s('date', e.target.value)} /></div>
        <div className="form-field"><label>Occasion</label>
          <select value={f.occasion} onChange={e => s('occasion', e.target.value)}>
            {OCCASIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>{f.type === 'Home' ? 'Location' : f.type === 'Event' ? 'Event / venue' : 'Restaurant'}</label>
          <input value={f.venue} onChange={e => s('venue', e.target.value)}
            placeholder={f.type === 'Home' ? 'e.g. Home, Claremont' : f.type === 'Event' ? 'e.g. Penfolds Magill Tasting' : 'e.g. Loulou'} />
        </div>
        {f.type === 'Restaurant' && (
          <div className="form-field"><label>Suburb</label><input value={f.suburb} onChange={e => s('suburb', e.target.value)} placeholder="e.g. Cottesloe" /></div>
        )}
      </div>

      <div className="form-row full">
        <div className="form-field"><label>Who with</label><input value={f.who_with} onChange={e => s('who_with', e.target.value)} placeholder="e.g. Sarah, the Joneses…" /></div>
      </div>

      <div className="form-field"><label>Overall rating</label><StarRating value={f.rating} onChange={v => s('rating', v)} /></div>

      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', paddingBottom: 4, borderBottom: '1px solid var(--border)', marginTop: 4 }}>
        Wines ({wines.length})
      </div>
      {wines.map((w, i) => <WineEntry key={i} wine={w} index={i} onChange={(i, w) => setWines(prev => prev.map((x, idx) => idx === i ? w : x))} onRemove={i => setWines(prev => prev.filter((_, idx) => idx !== i))} />)}
      <button type="button" onClick={() => setWines(prev => [...prev, { producer: '', wine_name: '', vintage: '', type: 'Red', source: 'Restaurant list', rating: 0, drunk_hero: false, reorder: false }])}
        className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>+ Add wine</button>

      {f.type !== 'Event' && (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', paddingBottom: 4, borderBottom: '1px solid var(--border)', marginTop: 4 }}>
            Food ({food.length})
          </div>
          {food.map((item, i) => <FoodEntry key={i} item={item} index={i}
            onChange={(i, item) => setFood(prev => prev.map((x, idx) => idx === i ? item : x))}
            onRemove={i => setFood(prev => prev.filter((_, idx) => idx !== i))} />)}
          <button type="button" onClick={() => setFood(prev => [...prev, { course: '', dish: '', price: '' }])}
            className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>+ Add dish</button>

          <div className="form-row full">
            <div className="form-field"><label>Food notes</label>
              <textarea value={f.food_notes} onChange={e => s('food_notes', e.target.value)} placeholder="Standout dishes, general impressions…" rows={2} />
            </div>
          </div>
          <div className="form-row triple">
            <div className="form-field"><label>Food ($)</label><input type="number" value={f.food_total} onChange={e => s('food_total', e.target.value)} placeholder="0" /></div>
            <div className="form-field"><label>Wine ($)</label><input type="number" value={f.wine_total} onChange={e => s('wine_total', e.target.value)} placeholder="0" /></div>
            <div className="form-field"><label>Total ($)</label><input type="number" value={f.grand_total} onChange={e => s('grand_total', e.target.value)} placeholder="0" /></div>
          </div>
        </>
      )}

      <div className="form-row full">
        <div className="form-field"><label>Notes</label>
          <textarea value={f.general_notes} onChange={e => s('general_notes', e.target.value)} placeholder="Anything else worth remembering…" rows={2} />
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave(f, wines, food)}>Save entry</button>
      </div>
    </div>
  )
}
