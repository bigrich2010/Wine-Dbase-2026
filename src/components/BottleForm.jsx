import { useState } from 'react'
import { BOTTLE_STATUSES } from '../lib/helpers'

export default function BottleForm({ initial = {}, onSave, onCancel }) {
  const [f, setF] = useState({
    status: initial.status || 'In cellar',
    quantity: initial.quantity || 1,
    purchase_date: initial.purchase_date || '',
    purchase_price: initial.purchase_price || '',
    purchase_source: initial.purchase_source || '',
    auction_lot: initial.auction_lot || '',
    consumed_date: initial.consumed_date || '',
    restaurant_name: initial.restaurant_name || '',
    tasting_note: initial.tasting_note || '',
  })

  const s = (k, v) => setF(p => ({ ...p, [k]: v }))
  const isConsumed = ['Consumed', 'Enjoyed at restaurant'].includes(f.status)
  const isRestaurant = f.status === 'Enjoyed at restaurant'
  const isPending = f.status === 'Pending arrival'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="form-row">
        <div className="form-field"><label>Status</label>
          <select value={f.status} onChange={e => s('status', e.target.value)}>
            {BOTTLE_STATUSES.map(st => <option key={st}>{st}</option>)}
          </select>
        </div>
        <div className="form-field"><label>Quantity</label>
          <input type="number" min="1" max="100" value={f.quantity} onChange={e => s('quantity', e.target.value)} />
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>Purchase</div>
      <div className="form-row">
        <div className="form-field"><label>Date</label><input type="date" value={f.purchase_date} onChange={e => s('purchase_date', e.target.value)} /></div>
        <div className="form-field"><label>Price per bottle ($)</label><input type="number" value={f.purchase_price} onChange={e => s('purchase_price', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-field"><label>Source</label><input value={f.purchase_source} onChange={e => s('purchase_source', e.target.value)} placeholder="Langtons, cellar door, retail…" /></div>
        <div className="form-field"><label>Auction lot #</label><input value={f.auction_lot} onChange={e => s('auction_lot', e.target.value)} placeholder="Optional" /></div>
      </div>

      {isConsumed && (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
            {isRestaurant ? 'Restaurant' : 'Consumption'}
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>{isRestaurant ? 'Date visited' : 'Date consumed'}</label>
              <input type="date" value={f.consumed_date} onChange={e => s('consumed_date', e.target.value)} />
            </div>
            {isRestaurant && (
              <div className="form-field"><label>Restaurant name</label><input value={f.restaurant_name} onChange={e => s('restaurant_name', e.target.value)} placeholder="e.g. Loulou" /></div>
            )}
          </div>
          <div className="form-row full">
            <div className="form-field"><label>My tasting note</label>
              <textarea value={f.tasting_note} onChange={e => s('tasting_note', e.target.value)} placeholder="Your personal tasting note…" rows={4} />
            </div>
          </div>
        </>
      )}

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave(f)}>Save</button>
      </div>
    </div>
  )
}
