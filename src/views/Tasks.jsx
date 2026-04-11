import React, { useState, useMemo } from 'react'
import { COMPANIES, PRIORITIES } from '../lib/constants.js'
import { SwipeableTask, CompanyTag, DeadlineBadge, StatusBadge, Checkbox, InlineEdit, toast } from '../components/ui.jsx'
import { TaskModal } from '../components/TaskModal.jsx'
import { differenceInCalendarDays } from 'date-fns'

export default function Tasks({ tasks, addTask, updateTask, deleteTask, completeTask }) {
  const [modal, setModal] = useState(null)
  const [expanded, setExpanded] = useState({}) // which companies are expanded
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | overdue | today | week

  const now = new Date(); now.setHours(0,0,0,0)

  const filtered = useMemo(() => {
    let list = tasks
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.name?.toLowerCase().includes(q) || (t.tags||[]).some(tag => tag.toLowerCase().includes(q)))
    }
    if (filter === 'overdue') list = list.filter(t => t.due && new Date(t.due) < now)
    else if (filter === 'today') list = list.filter(t => t.due && differenceInCalendarDays(new Date(t.due), now) === 0)
    else if (filter === 'week') list = list.filter(t => { if (!t.due) return false; const d = differenceInCalendarDays(new Date(t.due), now); return d >= 0 && d <= 7 })
    return list
  }, [tasks, search, filter])

  // Group by company, sort by deadline within each
  const groups = useMemo(() => {
    return Object.entries(COMPANIES).map(([key, co]) => {
      const coTasks = filtered.filter(t => t.company === key).sort((a, b) => {
        if (!a.due && !b.due) return 0
        if (!a.due) return 1
        if (!b.due) return -1
        return a.due < b.due ? -1 : 1
      })
      const overdueCount = coTasks.filter(t => t.due && new Date(t.due) < now).length
      const highCount = coTasks.filter(t => t.priority === 'high').length
      return { key, co, tasks: coTasks, overdueCount, highCount }
    }).filter(g => g.tasks.length > 0)
  }, [filtered])

  const toggleExpand = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }))

  const FILTER_OPTS = [
    { key: 'all',     label: 'All' },
    { key: 'overdue', label: '⚠ Overdue' },
    { key: 'today',   label: 'Today' },
    { key: 'week',    label: 'This week' },
  ]

  return (
    <div style={{ padding: '14px 16px 80px', maxWidth: 600, margin: '0 auto' }}>

      {/* SEARCH */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
        style={{ width: '100%', background: '#111118', border: '1.5px solid #2e2e3e', borderRadius: 12, padding: '12px 16px', color: '#f0eee8', fontFamily: 'DM Mono, monospace', fontSize: 14, outline: 'none', marginBottom: 12 }} />

      {/* FILTER CHIPS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {FILTER_OPTS.map(opt => (
          <button key={opt.key} onClick={() => setFilter(opt.key)}
            style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${filter === opt.key ? '#f0eee8' : '#2e2e3e'}`, background: filter === opt.key ? '#f0eee8' : 'transparent', color: filter === opt.key ? '#0b0b0c' : '#7070a0', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontWeight: 600, transition: 'all 0.12s' }}>
            {opt.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 12, color: '#4a4a6a', fontWeight: 600, padding: '6px 0', whiteSpace: 'nowrap' }}>{filtered.length} tasks</span>
      </div>

      {/* COMPANY GROUPS */}
      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#4a4a6a' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 14, fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Nothing here</div>
        </div>
      )}

      {groups.map(({ key, co, tasks: coTasks, overdueCount, highCount }) => {
        const isOpen = expanded[key]
        return (
          <div key={key} style={{ marginBottom: 10 }}>
            {/* Company header — always visible */}
            <div onClick={() => toggleExpand(key)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: '#111118', border: `1.5px solid #1e1e2e`, borderRadius: isOpen ? '12px 12px 0 0' : 12, cursor: 'pointer', transition: 'background 0.1s', userSelect: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#161620'}
              onMouseLeave={e => e.currentTarget.style.background = '#111118'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: co.color, boxShadow: `0 0 8px ${co.color}66` }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: co.color }}>{co.label}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {overdueCount > 0 && <span style={{ fontSize: 10, color: '#EF9A9A', background: 'rgba(239,154,154,0.15)', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>{overdueCount} overdue</span>}
                  {highCount > 0 && overdueCount === 0 && <span style={{ fontSize: 10, color: '#FFD54F', background: 'rgba(255,213,79,0.12)', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>{highCount} high</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#7070a0', fontWeight: 600 }}>{coTasks.length}</span>
                <span style={{ fontSize: 14, color: '#4a4a6a', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
              </div>
            </div>

            {/* Tasks list */}
            {isOpen && (
              <div style={{ background: '#0d0d14', border: '1.5px solid #1e1e2e', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '10px 10px 12px' }}>
                {coTasks.map(task => (
                  <SwipeableTask key={task.id} task={task}
                    onComplete={() => completeTask(task).then(() => toast('✓ Done!', 'success'))}
                    onPress={() => setModal(task)}
                    showCompany={false}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* FAB — floating add button */}
      <button onClick={() => setModal('add')}
        style={{ position: 'fixed', bottom: 80, right: 20, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #62C8DF, #4aa8c0)', border: 'none', color: '#0b0b0c', fontSize: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(98,200,223,0.4)', transition: 'transform 0.15s', zIndex: 100 }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >+</button>

      {modal && (
        <TaskModal task={modal === 'add' ? null : modal} onSave={modal === 'add' ? addTask : (data) => updateTask(data.id, data)} onDelete={deleteTask} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
