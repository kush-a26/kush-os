import React, { useState, useEffect } from 'react'
import { useStore } from './lib/hooks.js'
import { ToastContainer } from './components/ui.jsx'
import Today from './views/Today.jsx'
import Tasks from './views/Tasks.jsx'
import More from './views/More.jsx'
import { format } from 'date-fns'

const TABS = [
  { key: 'today', label: 'Today',  icon: '◎' },
  { key: 'tasks', label: 'Tasks',  icon: '≡' },
  { key: 'more',  label: 'More',   icon: '…' },
]

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id) }, [])
  return now
}

export default function App() {
  const [tab, setTab] = useState('today')
  const now = useClock()
  const store = useStore()

  const {
    tasks, log, ctx, goals, gym, calendar, loaded,
    addTask, updateTask, deleteTask, completeTask, uncompleteTask,
    updateLogEntry, updateCtx, setGoal, toggleGym, hasGym, gymCount,
  } = store

  const todayStr = format(now, 'yyyy-MM-dd')
  const overdueCount = tasks.filter(t => t.due && t.due < todayStr && t.status !== 'done').length
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0b12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 28, height: 28, border: '3px solid #1e1e2e', borderTopColor: '#62C8DF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, color: '#4a4a6a', fontWeight: 700 }}>Loading your OS…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const todayProps = { tasks, goals, setGoal, hasGym, toggleGym, gymCount, calendar, addTask, updateTask, deleteTask, completeTask }
  const tasksProps = { tasks, addTask, updateTask, deleteTask, completeTask }
  const moreProps  = { tasks, log, ctx, addTask, updateTask, deleteTask, completeTask, uncompleteTask, updateLogEntry, updateCtx }

  return (
    <div style={{ minHeight: '100vh', maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', background: '#0b0b12', position: 'relative' }}>

      {/* HEADER */}
      <header style={{ padding: '14px 16px 10px', borderBottom: '1.5px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#0d0d16', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#f0eee8', letterSpacing: '-0.3px' }}>KUSH</span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 400, fontSize: 18, color: '#2e2e4e' }}>OS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {overdueCount > 0 && (
            <div onClick={() => setTab('tasks')} style={{ fontSize: 12, color: '#EF9A9A', background: 'rgba(239,154,154,0.12)', padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontWeight: 700, border: '1.5px solid rgba(239,154,154,0.25)' }}>
              ⚠ {overdueCount}
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#f0eee8', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]}</div>
            <div style={{ fontSize: 11, color: '#5a5a7a', fontWeight: 600 }}>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main style={{ flex: 1, overflow: 'auto', paddingBottom: 72 }}>
        {tab === 'today' && <Today {...todayProps} />}
        {tab === 'tasks' && <Tasks {...tasksProps} />}
        {tab === 'more'  && <More  {...moreProps}  />}
      </main>

      {/* BOTTOM NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 640, height: 64, background: '#0d0d16', borderTop: '1.5px solid #1e1e2e', display: 'flex', alignItems: 'stretch', zIndex: 200 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, border: 'none', background: 'transparent', cursor: 'pointer', position: 'relative', transition: 'background 0.15s' }}
          >
            {/* Active indicator */}
            {tab === t.key && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2.5, background: '#62C8DF', borderRadius: '0 0 3px 3px' }} />}

            <span style={{ fontSize: 20, lineHeight: 1, filter: tab === t.key ? 'none' : 'grayscale(1) opacity(0.5)' }}>
              {t.key === 'today' ? '◎' : t.key === 'tasks' ? '≡' : '···'}
            </span>

            <span style={{ fontSize: 10, color: tab === t.key ? '#f0eee8' : '#4a4a6a', fontFamily: 'Syne, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t.label}
            </span>

            {/* Badge */}
            {t.key === 'tasks' && tasks.length > 0 && (
              <div style={{ position: 'absolute', top: 8, right: 'calc(50% - 18px)', minWidth: 16, height: 16, borderRadius: 8, background: overdueCount > 0 ? '#EF9A9A' : '#3a3a5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: overdueCount > 0 ? '#0b0b0c' : '#9090a0', fontWeight: 800, padding: '0 4px' }}>
                {tasks.length > 99 ? '99+' : tasks.length}
              </div>
            )}
          </button>
        ))}
      </nav>

      <ToastContainer />

      <style>{`
        * { box-sizing: border-box; }
        body { overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
        input, select, textarea { -webkit-appearance: none; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
