import { drinkingStatus, totalInCellar } from '../lib/helpers'

export default function WineRow({ wine, bottles, onClick }) {
  const inCellar = totalInCellar(bottles)
  const pending = bottles.filter(b => b.status === 'Pending arrival').length
  const consumed = bottles.filter(b => b.status === 'Consumed').length
  const ds = drinkingStatus(wine)
  const year = new Date().getFullYear()

  const dotColor = ds === 'ready' ? 'var(--green)' : ds === 'early' ? 'var(--amber)' : ds === 'past' ? '#A32D2D' : 'var(--border-strong)'

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
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 1 }} title={ds === 'ready' ? 'In drinking window' : ds === 'early' ? 'Too early' : ds === 'past' ? 'Past peak' : 'No window set'} />

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {wine.producer}{wine.wine_name ? ` — ${wine.wine_name}` : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-light)', display: 'flex', gap: 8, marginTop: 1, flexWrap: 'wrap' }}>
          {wine.vintage && <span>{wine.vintage}</span>}
          {wine.region && <span>{wine.region}{wine.appellation ? ` · ${wine.appellation}` : ''}</span>}
          {wine.drink_from && wine.drink_to && <span>{wine.drink_from}–{wine.drink_to}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {pending > 0 && (
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--amber-pale)', color: 'var(--amber)' }}>+{pending} arriving</span>
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
