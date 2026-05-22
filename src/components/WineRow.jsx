import { drinkingStatus, effectiveDrinkingWindow } from '../lib/helpers'

export default function WineRow({ wine, bottles = [], onClick }) {
  const inCellar = bottles.filter(b => b.status === 'In cellar').reduce((s,b) => s + (parseInt(b.quantity) || 1), 0)
  const pending = bottles.filter(b => b.status === 'Pending arrival').reduce((s,b) => s + (parseInt(b.quantity) || 1), 0)
  const consumed = bottles.filter(b => ['Consumed', 'Enjoyed at restaurant'].includes(b.status)).length

  const ds = drinkingStatus(wine)
  const window = effectiveDrinkingWindow(wine)
  const status = ds?.status
  const estimated = ds?.estimated

  const dotColor = status === 'ready'
    ? (estimated ? '#7BAF8A' : 'var(--green)')
    : status === 'early'
    ? (estimated ? '#C8A060' : 'var(--amber)')
    : status === 'past'
    ? '#A32D2D'
    : 'var(--border-strong)'

  const dotTitle = estimated
    ? `Estimated window: ${window?.from || '?'}–${window?.to || '?'}`
    : status === 'ready' ? 'In drinking window'
    : status === 'early' ? 'Too early'
    : status === 'past' ? 'Past peak'
    : 'No window set'

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '8px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-dark)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: dotColor,
        flexShrink: 0, marginTop: 1,
        border: estimated ? '1px dashed rgba(0,0,0,0.2)' : 'none',
        opacity: estimated ? 0.7 : 1,
      }} title={dotTitle} />

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {wine.producer}{wine.wine_name ? ` — ${wine.wine_name}` : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-light)', display: 'flex', gap: 8, marginTop: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {wine.vintage && <span>{wine.vintage}</span>}
          {wine.region && <span>{wine.region}{wine.appellation ? ` · ${wine.appellation}` : ''}</span>}
          {window && (
            <span style={{ opacity: estimated ? 0.6 : 1 }}>
              {estimated ? '~' : ''}{window.from || '?'}–{window.to || '?'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {pending > 0 && (
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--amber-pale)', color: 'var(--amber)' }}>+{pending}</span>
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{inCellar}</div>
          {consumed > 0 && <div style={{ fontSize: 10, color: 'var(--ink-light)' }}>{consumed} drunk</div>}
        </div>
        <div style={{ color: 'var(--ink-light)', fontSize: 12 }}>›</div>
      </div>
    </div>
  )
}
