import React, { useState, useRef, useEffect } from 'react'
import { COMPANIES, STATUSES, PRIORITIES } from '../lib/constants.js'
import { differenceInCalendarDays } from 'date-fns'

// ─── CHECKBOX — fills on tick, burst animation ───────────────────────
export function Checkbox({ checked, onChange, size = 22 }) {
  const [burst, setBurst] = useState(false)

  const handle = (e) => {
    e.stopPropagation()
    if (!checked) {
      setBurst(true)
      setTimeout(() => setBurst(false), 700)
    }
    onChange()
  }

  return (
    <div onClick={handle} style={{ position: 'relative', width: size, height: size, flexShrink: 0, cursor: 'pointer' }}>
      {/* The box */}
      <div style={{
        width: size, height: size, borderRadius: 5,
        border: checked ? 'none' : '2.5px solid #3a3a5e',
        background: checked
          ? 'linear-gradient(135deg, #62C8DF, #4aa8c0)'
          : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: burst ? 'scale(1.25)' : checked ? 'scale(1.05)' : 'scale(1)',
        boxShadow: checked ? '0 0 12px rgba(98,200,223,0.4)' : 'none',
      }}>
        {checked && (
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L6 10.5L11.5 4" stroke="#0b0b12" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="20"
              style={{ strokeDashoffset: 0, transition: 'stroke-dashoffset 0.3s ease 0.05s' }}
            />
          </svg>
        )}
      </div>
      {/* Burst particles */}
      {burst && (
        <div style={{ position: 'absolute', inset: -12, pointerEvents: 'none', zIndex: 10 }}>
          {['#62C8DF','#FFB74D','#81C784','#F48FB1','#B39DDB','#E8B86D','#EF9A9A','#FFD54F'].map((color, i) => {
            const angle = (i * 45) * Math.PI / 180
            const dist = 18
            const tx = Math.cos(angle) * dist
            const ty = Math.sin(angle) * dist
            return (
              <div key={i} style={{
                position: 'absolute', width: 5, height: 5, borderRadius: '50%',
                background: color, top: '50%', left: '50%',
                transform: `translate(-50%, -50%)`,
                animation: `burst_${i} 0.6s ease-out forwards`,
              }} />
            )
          })}
          <style>{`
            ${['#62C8DF','#FFB74D','#81C784','#F48FB1','#B39DDB','#E8B86D','#EF9A9A','#FFD54F'].map((_, i) => {
              const angle = (i * 45) * Math.PI / 180
              const tx = Math.cos(angle) * 18
              const ty = Math.sin(angle) * 18
              return `@keyframes burst_${i} { 0%{transform:translate(-50%,-50%) scale(1.2);opacity:1} 100%{transform:translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px)) scale(0);opacity:0} }`
            }).join('')}
          `}</style>
        </div>
      )}
    </div>
  )
}

// ─── SWIPEABLE TASK ROW ───────────────────────────────────────────────
export function SwipeableTask({ task, onComplete, onPress, showCompany = true }) {
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX = useRef(0)
  const threshold = 80

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; setSwiping(false) }
  const onTouchMove = (e) => {
    const dx = e.touches[0].clientX - startX.current
    if (dx > 10) setSwiping(true)
    if (dx > 0) setOffset(Math.min(dx, 120))
  }
  const onTouchEnd = () => {
    if (offset > threshold) { onComplete(); setOffset(0) }
    else setOffset(0)
    setSwiping(false)
  }

  const now = new Date(); now.setHours(0,0,0,0)
  const diff = task.due ? differenceInCalendarDays(new Date(task.due), now) : null
  const urgency = diff === null ? 'none' : diff < 0 ? 'overdue' : diff === 0 ? 'today' : diff <= 2 ? 'soon' : 'ok'
  const urgencyColors = { overdue: '#EF9A9A', today: '#EF9A9A', soon: '#FFD54F', ok: '#62C8DF', none: '#3a3a5e' }
  const co = COMPANIES[task.company] || COMPANIES.personal

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 10, marginBottom: 6 }}>
      {/* Swipe reveal bg */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(129,199,132,0.3), rgba(129,199,132,0.1))', display: 'flex', alignItems: 'center', paddingLeft: 20, borderRadius: 10 }}>
        <span style={{ fontSize: 20 }}>✓</span>
      </div>
      {/* Task card */}
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={swiping ? undefined : onPress}
        style={{
          position: 'relative', background: '#111118', border: `1.5px solid #1e1e2e`,
          borderLeft: `4px solid ${urgencyColors[urgency]}`,
          borderRadius: 10, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
          transform: `translateX(${offset}px)`,
          transition: offset === 0 ? 'transform 0.3s cubic-bezier(0.34,1.2,0.64,1)' : 'none',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <Checkbox checked={false} onChange={(e) => { if(e) e.stopPropagation(); onComplete() }} size={20} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.name}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
            {showCompany && (
              <span style={{ fontSize: 10, color: co.color, background: co.dim, padding: '1px 7px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', border: `1px solid ${co.color}33` }}>
                {co.label}
              </span>
            )}
            <DeadlineBadge due={task.due} />
            {task.status === 'inprogress' && <span style={{ fontSize: 10, color: '#62C8DF', fontWeight: 600 }}>● In progress</span>}
            {task.status === 'blocked' && <span style={{ fontSize: 10, color: '#EF9A9A', fontWeight: 600 }}>⊘ Blocked</span>}
          </div>
        </div>
        <div style={{ color: '#2e2e4e', fontSize: 16, flexShrink: 0 }}>›</div>
      </div>
    </div>
  )
}

// ─── DEADLINE BADGE ───────────────────────────────────────────────────
export function DeadlineBadge({ due }) {
  if (!due) return null
  const now = new Date(); now.setHours(0,0,0,0)
  const diff = differenceInCalendarDays(new Date(due), now)
  let color = '#7070a0', bg = 'transparent', text = '', weight = 400
  if (diff < 0)       { color = '#EF9A9A'; bg = 'rgba(239,154,154,0.15)'; text = `${Math.abs(diff)}d overdue`; weight = 700 }
  else if (diff === 0){ color = '#EF9A9A'; bg = 'rgba(239,154,154,0.12)'; text = 'Due today'; weight = 700 }
  else if (diff === 1){ color = '#FFD54F'; bg = 'rgba(255,213,79,0.12)';  text = 'Tomorrow'; weight = 600 }
  else if (diff <= 3) { color = '#FFD54F'; bg = 'rgba(255,213,79,0.1)';   text = `${diff}d left`; weight = 600 }
  else if (diff <= 7) { color = '#62C8DF'; text = `${diff}d` }
  else { color = '#4a4a6a'; text = due.slice(5) } // mm-dd
  if (!text) return null
  return (
    <span style={{ fontSize: 11, color, background: bg, padding: bg !== 'transparent' ? '2px 7px' : '0', borderRadius: 4, fontWeight: weight, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  )
}

// ─── COMPANY TAG ──────────────────────────────────────────────────────
export function CompanyTag({ company, small }) {
  const co = COMPANIES[company] || COMPANIES.personal
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: small ? '2px 7px' : '3px 10px', borderRadius: 5, background: co.dim, color: co.color, fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', border: `1px solid ${co.color}33` }}>
      {co.label}
    </span>
  )
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────
export function StatusBadge({ status, onClick }) {
  const s = STATUSES[status] || STATUSES.todo
  return (
    <span onClick={onClick} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 5, background: s.bg, color: s.fg, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap', fontWeight: 600, userSelect: 'none' }}>
      {s.label}
    </span>
  )
}

// ─── PRIORITY DOT ─────────────────────────────────────────────────────
export function PriorityDot({ priority, onClick }) {
  const p = PRIORITIES[priority] || PRIORITIES.med
  return (
    <span onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9090a0', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: onClick ? 'pointer' : 'default', fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
      {p.label}
    </span>
  )
}

// ─── MODAL ────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#13131a', border: '1.5px solid #2e2e3e', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2e2e3e', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#f0eee8' }}>{title}</h2>
          <button onClick={onClose} style={{ background: '#1a1a24', border: 'none', color: '#7070a0', cursor: 'pointer', fontSize: 18, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── FORM ELEMENTS ────────────────────────────────────────────────────
const IS = { width: '100%', background: '#1a1a24', border: '1.5px solid #2e2e3e', borderRadius: 10, padding: '13px 14px', color: '#f0eee8', fontFamily: 'DM Mono, monospace', fontSize: 15, outline: 'none', WebkitAppearance: 'none' }
export function FG({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#7070a0', marginBottom: 6, fontWeight: 700 }}>{label}</label>{children}</div>
}
export function TInput({ value, onChange, placeholder, type = 'text', autoFocus }) {
  return <input autoFocus={autoFocus} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={IS} />
}
export function TSelect({ value, onChange, options }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ ...IS, cursor: 'pointer' }}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
}
export function TTextarea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...IS, resize: 'vertical', lineHeight: 1.6 }} />
}
export function Btn({ onClick, children, variant = 'primary', disabled, style: extra }) {
  const vs = {
    primary: { background: '#f0eee8', color: '#0b0b0c', border: 'none' },
    ghost:   { background: '#1a1a24', color: '#9090a0', border: '1.5px solid #2e2e3e' },
    danger:  { background: 'rgba(239,154,154,0.12)', color: '#EF9A9A', border: '1.5px solid rgba(239,154,154,0.3)' },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ borderRadius: 10, padding: '12px 20px', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s', ...vs[variant], ...extra }}
    >{children}</button>
  )
}

// ─── TOAST ────────────────────────────────────────────────────────────
let _toast = null
export const setToastFn = fn => { _toast = fn }
export const toast = (msg, type = 'info') => _toast?.(msg, type)

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    setToastFn((msg, type) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
    })
  }, [])
  const colors = { success: '#81C784', error: '#EF9A9A', info: '#f0eee8' }
  const borders = { success: 'rgba(129,199,132,0.3)', error: 'rgba(239,154,154,0.3)', info: '#2e2e3e' }
  return (
    <div style={{ position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: '#1a1a24', border: `1.5px solid ${borders[t.type]||borders.info}`, borderRadius: 12, padding: '13px 18px', fontSize: 14, color: colors[t.type]||colors.info, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontWeight: 600, animation: 'slideUp 0.2s ease' }}>
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

// ─── SPINNER ──────────────────────────────────────────────────────────
export function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div style={{ width: 24, height: 24, border: '2.5px solid #2e2e3e', borderTopColor: '#62C8DF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
}

// ─── INLINE EDIT ──────────────────────────────────────────────────────
export function InlineEdit({ value, onSave, multiline, style: extra, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef()
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])
  useEffect(() => { setDraft(value) }, [value])
  const commit = () => { setEditing(false); if (draft !== value) onSave(draft) }
  const base = { background: 'transparent', border: 'none', outline: 'none', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', width: '100%', padding: 0, resize: 'none', lineHeight: 'inherit', ...extra }
  if (!editing) return <span onClick={() => setEditing(true)} style={{ cursor: 'text', ...extra }}>{value || <span style={{ color: '#3a3a4e' }}>{placeholder || 'Tap to edit…'}</span>}</span>
  if (multiline) return <textarea ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} rows={3} style={{ ...base, display: 'block' }} />
  return <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit() }} style={base} />
}
