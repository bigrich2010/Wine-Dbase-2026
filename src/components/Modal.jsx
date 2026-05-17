import { useEffect } from 'react'

export function ConfirmDialog({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <p style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={onConfirm}
          style={{ background: danger ? '#A32D2D' : 'var(--wine)' }}>
          Confirm
        </button>
      </div>
    </div>
  )
}

export default function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal-box${wide ? ' wide' : ''}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
