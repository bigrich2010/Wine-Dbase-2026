import { useState } from 'react'
import { WINE_TYPES, REGIONS } from '../lib/helpers'

export default function WineForm({ initial = {}, onSave, onCancel, previewImg }) {
  const [f, setF] = useState({
    producer: initial.producer || '',
    wine_name: initial.wine_name || '',
    vintage: initial.vintage || '',
    type: initial.type || 'Red',
    region: initial.region || '',
    appellation: initial.appellation || '',
    country: initial.country || '',
    grape: initial.grape || '',
    alcohol: initial.alcohol || '',
    drink_from: initial.drink_from || '',
    drink_to: initial.drink_to || '',
    score_winefront: initial.score_winefront || '',
    score_ray_jordan: initial.score_ray_jordan || '',
    score_halliday: initial.score_halliday || '',
    score_wine_advocate: initial.score_wine_advocate || '',
    score_other: initial.score_other || '',
    url_winefront: initial.url_winefront || '',
    url_ray_jordan: initial.url_ray_jordan || '',
    url_other: initial.url_other || '',
    critic_notes: initial.critic_notes || '',
  })

  const s = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {previewImg && (
        <img src={previewImg} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)', background: '#fff' }} />
      )}

      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>Wine details</div>

      <div className="form-row">
        <div className="form-field"><label>Producer *</label><input value={f.producer} onChange={e => s('producer', e.target.value)} placeholder="e.g. Moss Wood" /></div>
        <div className="form-field"><label>Wine / cuvée</label><input value={f.wine_name} onChange={e => s('wine_name', e.target.value)} placeholder="e.g. Cabernet Sauvignon" /></div>
      </div>
      <div className="form-row">
        <div className="form-field"><label>Vintage</label><input type="number" value={f.vintage} onChange={e => s('vintage', e.target.value)} placeholder="2020" min="1900" max="2030" /></div>
        <div className="form-field"><label>Type</label>
          <select value={f.type} onChange={e => s('type', e.target.value)}>
            {WINE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-field"><label>Region</label>
          <input value={f.region} onChange={e => s('region', e.target.value)} placeholder="e.g. Margaret River" list="regions-list" />
          <datalist id="regions-list">{REGIONS.map(r => <option key={r} value={r} />)}</datalist>
        </div>
        <div className="form-field"><label>Appellation / vineyard</label><input value={f.appellation} onChange={e => s('appellation', e.target.value)} placeholder="e.g. Wilyabrup Valley" /></div>
      </div>
      <div className="form-row">
        <div className="form-field"><label>Grape variety</label><input value={f.grape} onChange={e => s('grape', e.target.value)} placeholder="e.g. Cabernet Sauvignon" /></div>
        <div className="form-field"><label>Alcohol %</label><input value={f.alcohol} onChange={e => s('alcohol', e.target.value)} placeholder="e.g. 13.5%" /></div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', paddingBottom: 4, borderBottom: '1px solid var(--border)', marginTop: 4 }}>Drinking window</div>
      <div className="form-row">
        <div className="form-field"><label>Drink from</label><input type="number" value={f.drink_from} onChange={e => s('drink_from', e.target.value)} placeholder="2025" /></div>
        <div className="form-field"><label>Drink to</label><input type="number" value={f.drink_to} onChange={e => s('drink_to', e.target.value)} placeholder="2035" /></div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', paddingBottom: 4, borderBottom: '1px solid var(--border)', marginTop: 4 }}>Scores</div>
      <div className="form-row">
        <div className="form-field"><label>Winefront</label><input value={f.score_winefront} onChange={e => s('score_winefront', e.target.value)} placeholder="95+" /></div>
        <div className="form-field"><label>Ray Jordan</label><input value={f.score_ray_jordan} onChange={e => s('score_ray_jordan', e.target.value)} placeholder="96" /></div>
      </div>
      <div className="form-row triple">
        <div className="form-field"><label>Halliday</label><input value={f.score_halliday} onChange={e => s('score_halliday', e.target.value)} placeholder="95" /></div>
        <div className="form-field"><label>Wine Advocate</label><input value={f.score_wine_advocate} onChange={e => s('score_wine_advocate', e.target.value)} placeholder="97" /></div>
        <div className="form-field"><label>Other</label><input value={f.score_other} onChange={e => s('score_other', e.target.value)} placeholder="96" /></div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', paddingBottom: 4, borderBottom: '1px solid var(--border)', marginTop: 4 }}>Review links</div>
      <div className="form-row">
        <div className="form-field"><label>Winefront URL</label><input value={f.url_winefront} onChange={e => s('url_winefront', e.target.value)} placeholder="https://winefront.com.au/…" /></div>
        <div className="form-field"><label>Ray Jordan URL</label><input value={f.url_ray_jordan} onChange={e => s('url_ray_jordan', e.target.value)} placeholder="https://rayjordan.com.au/…" /></div>
      </div>
      <div className="form-row full">
        <div className="form-field"><label>Other review URL</label><input value={f.url_other} onChange={e => s('url_other', e.target.value)} placeholder="https://…" /></div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', paddingBottom: 4, borderBottom: '1px solid var(--border)', marginTop: 4 }}>Notes</div>
      <div className="form-row full">
        <div className="form-field"><label>Critic notes</label><textarea value={f.critic_notes} onChange={e => s('critic_notes', e.target.value)} placeholder="Published reviews and tasting notes…" /></div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { if (!f.producer.trim()) { alert('Producer required'); return } onSave(f) }}>Save wine</button>
      </div>
    </div>
  )
}
