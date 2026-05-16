import React, { useMemo } from 'react'
import { formatPrice, effectiveDrinkingWindow } from '../lib/helpers'
import { VINTAGE_CHARTS, REGION_MAP } from '../lib/vintageCharts'

export default function Analytics({ wines, bottles }) {
  const year = new Date().getFullYear()

  const stats = useMemo(() => {
    const inCellar = bottles.filter(b => b.status === 'In cellar')
    const consumed = bottles.filter(b => ['Consumed', 'Enjoyed at restaurant'].includes(b.status))
    const pending = bottles.filter(b => b.status === 'Pending arrival')

    const totalValue = inCellar.reduce((s, b) => s + (parseFloat(b.purchase_price) || 0), 0)
    const totalSpend = bottles.reduce((s, b) => s + (parseFloat(b.purchase_price) || 0), 0)

    const byRegion = {}
    const byVariety = {}
    wines.forEach(w => {
      const wBottles = inCellar.filter(b => b.wine_id === w.id)
      if (!wBottles.length) return
      const count = wBottles.reduce((s, b) => s + (parseInt(b.quantity) || 1), 0)
      if (w.region) {
        byRegion[w.region] = (byRegion[w.region] || 0) + count
      }
      if (w.type) {
        byVariety[w.type] = (byVariety[w.type] || 0) + count
      }
    })

    const drinkingCurve = {
      now: 0, twoYears: 0, fiveYears: 0, holding: 0, noWindow: 0
    }
    wines.forEach(w => {
      const wBottles = inCellar.filter(b => b.wine_id === w.id)
      const count = wBottles.reduce((s, b) => s + (parseInt(b.quantity) || 1), 0)
      if (!count) return
      const window = effectiveDrinkingWindow(w)
      if (!window) { drinkingCurve.noWindow += count; return }
      if (window.to && year > window.to) { drinkingCurve.now += count; return }
      if (window.from && year >= window.from) { drinkingCurve.now += count; return }
      if (window.from <= year + 2) { drinkingCurve.twoYears += count; return }
      if (window.from <= year + 5) { drinkingCurve.fiveYears += count; return }
      drinkingCurve.holding += count
    })

    const allScored = wines
      .filter(w => w.score_winefront || w.score_ray_jordan || w.score_halliday || w.score_wine_advocate)
      .map(w => {
        const scores = [w.score_winefront, w.score_ray_jordan, w.score_halliday, w.score_wine_advocate]
          .filter(Boolean).map(s => parseFloat(s)).filter(n => !isNaN(n))
        const best = scores.length ? Math.max(...scores) : null
        const inCellarCount = inCellar.filter(b => b.wine_id === w.id).reduce((s, b) => s + (parseInt(b.quantity) || 1), 0)
        return { wine: w, score: best, inCellar: inCellarCount }
      })
      .filter(x => x.score)
      .sort((a, b) => b.score - a.score)

    const topByScore = wines
      .filter(w => {
        const hasScore = w.score_winefront || w.score_ray_jordan || w.score_halliday || w.score_wine_advocate
        const hasBottles = inCellar.some(b => b.wine_id === w.id)
        return hasScore && hasBottles
      })
      .map(w => {
        const scores = [w.score_winefront, w.score_ray_jordan, w.score_halliday, w.score_wine_advocate]
          .filter(Boolean)
          .map(s => parseFloat(s))
          .filter(n => !isNaN(n))
        const best = scores.length ? Math.max(...scores) : null
        return { wine: w, score: best }
      })
      .filter(x => x.score)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    const spendByYear = {}
    bottles.forEach(b => {
      if (!b.purchase_date || !b.purchase_price) return
      const y = new Date(b.purchase_date).getFullYear()
      spendByYear[y] = (spendByYear[y] || 0) + parseFloat(b.purchase_price)
    })

    const mostConsumed = {}
    consumed.forEach(b => {
      const wine = wines.find(w => w.id === b.wine_id)
      if (!wine) return
      // Group by producer + wine_name to avoid duplicates from multiple bottle records
      const key = `${wine.producer}||${wine.wine_name || ''}||${wine.vintage || ''}`
      if (!mostConsumed[key]) mostConsumed[key] = { wine, count: 0 }
      mostConsumed[key].count += 1
    })
    const topConsumed = Object.values(mostConsumed)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .filter(x => x.wine)

    return {
      inCellarCount: inCellar.reduce((s, b) => s + (parseInt(b.quantity) || 1), 0),
      consumedCount: consumed.length,
      pendingCount: pending.length,
      totalValue, totalSpend,
      byRegion, byVariety,
      drinkingCurve, topByScore,
      spendByYear, topConsumed, allScored,
    }
  }, [wines, bottles])

  const regionEntries = Object.entries(stats.byRegion).sort((a, b) => b[1] - a[1])
  const varietyEntries = Object.entries(stats.byVariety).sort((a, b) => b[1] - a[1])
  const maxRegion = regionEntries[0]?.[1] || 1
  const maxVariety = varietyEntries[0]?.[1] || 1
  const spendYears = Object.keys(stats.spendByYear).sort()
  const maxSpend = Math.max(...Object.values(stats.spendByYear), 1)

  const curveItems = [
    { label: 'Ready now', count: stats.drinkingCurve.now, color: '#2E6B3E' },
    { label: 'Within 2 years', count: stats.drinkingCurve.twoYears, color: '#B8600A' },
    { label: '3–5 years', count: stats.drinkingCurve.fiveYears, color: '#185FA5' },
    { label: 'Long hold', count: stats.drinkingCurve.holding, color: '#6B1E2E' },
    { label: 'No window set', count: stats.drinkingCurve.noWindow, color: '#8C7B74' },
  ]
  const curveTotal = curveItems.reduce((s, i) => s + i.count, 0) || 1

  if (wines.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink-light)' }}>
      <p style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 }}>No data yet</p>
      <p style={{ fontSize: 13 }}>Add wines and bottles to see your analytics.</p>
    </div>
  )

  return (
    <div style={{ paddingBottom: 60 }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: 8, marginBottom: 24 }}>
        {[
          { l: 'In cellar', v: stats.inCellarCount },
          { l: 'Cellar value', v: formatPrice(stats.totalValue) || '—' },
          { l: 'Total spend', v: formatPrice(stats.totalSpend) || '—' },
          { l: 'Consumed', v: stats.consumedCount },
          { l: 'Pending', v: stats.pendingCount },
        ].map(s => (
          <div key={s.l} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', marginBottom: 3 }}>{s.l}</div>
            <div style={{ fontSize: 18, fontFamily: 'Cormorant Garamond, serif' }}>{s.v}</div>
          </div>
        ))}
      </div>

      <Section title="Drinking curve">
        <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 10, gap: 1 }}>
          {curveItems.map(i => i.count > 0 && (
            <div key={i.label} style={{ width: `${(i.count / curveTotal) * 100}%`, background: i.color, minWidth: 2 }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {curveItems.map(i => (
            <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: i.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--ink-light)' }}>{i.label}</span>
              <span style={{ fontWeight: 500 }}>{i.count}</span>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Section title="By region">
          {regionEntries.slice(0, 8).map(([r, c]) => (
            <BarRow key={r} label={r} count={c} max={maxRegion} />
          ))}
          {regionEntries.length === 0 && <Empty />}
        </Section>
        <Section title="By variety">
          {varietyEntries.map(([v, c]) => (
            <BarRow key={v} label={v} count={c} max={maxVariety} />
          ))}
          {varietyEntries.length === 0 && <Empty />}
        </Section>
      </div>

      {stats.allScored.length > 0 && (
        <ScoredWines items={stats.allScored} />
      )}

      {stats.topByScore.length > 0 && (
        <Section title="Highest rated wines in cellar">
          {stats.topByScore.map(function(item) {
            var w = item.wine; var score = item.score
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {w.producer}{w.wine_name ? ' — ' + w.wine_name : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-light)' }}>{w.vintage}{w.region ? ' · ' + w.region : ''}</div>
                </div>
                <div style={{ fontSize: 18, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, flexShrink: 0, marginLeft: 12 }}>{score}</div>
              </div>
            )
          })}
        </Section>
      )}

      {spendYears.length > 0 && (
        <Section title="Spend by year">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {spendYears.map(y => (
              <div key={y} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ fontSize: 9, color: 'var(--ink-light)' }}>{formatPrice(stats.spendByYear[y])}</div>
                <div style={{ width: '100%', background: 'var(--wine)', borderRadius: '3px 3px 0 0', height: `${(stats.spendByYear[y] / maxSpend) * 56}px`, minHeight: 2 }} />
                <div style={{ fontSize: 9, color: 'var(--ink-light)' }}>{y}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {stats.topConsumed.length > 0 && (
        <Section title="Most consumed">
          {stats.topConsumed.map(function(x) {
            var w = x.wine
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500 }}>
                  {w.producer}{w.wine_name ? ' — ' + w.wine_name : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', flexShrink: 0, marginLeft: 12 }}>{x.count} bottle{x.count !== 1 ? 's' : ''}</div>
              </div>
            )
          })}
        </Section>
      )}

      <Section title="Vintage charts">
        <p style={{ fontSize: 12, color: 'var(--ink-light)', marginBottom: 12 }}>Reference scores for key regions. These also appear contextually on each wine detail page.</p>
        {Object.entries(VINTAGE_CHARTS).map(([region, chart]) => (
          <div key={region} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{region}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-light)', marginBottom: 8 }}>{chart.description}</div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {Object.entries(chart.vintages).sort((a,b) => b[0]-a[0]).slice(0, 12).map(([yr, v]) => (
                <div key={yr} title={`${yr}: ${v.summary}`} style={{
                  padding: '3px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                  background: v.score >= 97 ? '#F5E8EA' : v.score >= 94 ? '#EAF3DE' : v.score >= 91 ? '#FBF5E6' : 'var(--cream-dark)',
                  color: v.score >= 97 ? '#6B1E2E' : v.score >= 94 ? '#2E6B3E' : v.score >= 91 ? '#7A5C1A' : 'var(--ink-light)',
                  cursor: 'default',
                }}>
                  {yr} · {v.score}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, marginTop: 8 }}>
          {[['97+', '#F5E8EA', '#6B1E2E', 'Exceptional'], ['94–96', '#EAF3DE', '#2E6B3E', 'Excellent'], ['91–93', '#FBF5E6', '#7A5C1A', 'Very good'], ['<91', 'var(--cream-dark)', 'var(--ink-light)', 'Good']].map(([label, bg, color, title]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: '1px solid rgba(0,0,0,0.08)' }} />
              <span style={{ color: 'var(--ink-light)' }}>{label} {title}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function ScoredWines({ items }) {
  const [showAll, setShowAll] = React.useState(false)
  const visible = showAll ? items : items.slice(0, 20)
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', marginBottom: 10 }}>
        Scored wines ({items.length})
      </div>
      {visible.map(function(item) {
        var w = item.wine; var score = item.score; var inCellar = item.inCellar
        var source = w.score_winefront ? 'WF' : w.score_ray_jordan ? 'RJ' : w.score_halliday ? 'H' : w.score_wine_advocate ? 'WA' : ''
        return (
          <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--wine)', flexShrink: 0, width: 34 }}>{score}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-light)', flexShrink: 0, width: 16 }}>{source}</div>
            <div style={{ fontSize: 12, fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {w.vintage ? w.vintage + ' ' : ''}{w.producer}{w.wine_name ? ' — ' + w.wine_name : ''}
            </div>
            <div style={{ flexShrink: 0 }}>
              {inCellar > 0
                ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--green-pale)', color: 'var(--green)' }}>{inCellar}✓</span>
                : <span style={{ fontSize: 10, color: 'var(--border-strong)' }}>—</span>
              }
            </div>
          </div>
        )
      })}
      {items.length > 20 && (
        <button onClick={function() { setShowAll(!showAll) }}
          style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-light)', textDecoration: 'underline', padding: 0 }}>
          {showAll ? 'Show less' : 'Show all ' + items.length + ' wines'}
        </button>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-light)', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function BarRow({ label, count, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-mid)', width: 90, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: 'var(--cream-dark)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: 'var(--wine)', borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</div>
    </div>
  )
}

function Empty() {
  return <div style={{ fontSize: 12, color: 'var(--ink-light)', textAlign: 'center', padding: '1rem 0' }}>No data yet</div>
}
