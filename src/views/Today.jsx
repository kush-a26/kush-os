import React, { useState, useEffect } from 'react'
import { format, differenceInCalendarDays } from 'date-fns'
import { COMPANIES, getDayContext } from '../lib/constants.js'
import { SwipeableTask, Checkbox, DeadlineBadge, CompanyTag, toast } from '../components/ui.jsx'
import { TaskModal } from '../components/TaskModal.jsx'

function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id) }, [])
  return now
}

const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Health pills — single row, always visible
function HealthPills({ goals, setGoal, gymCount, toggleGym }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayGym = gymCount > 0 // simplified — just show if any gym today
  
  const pills = [
    { key: 'sleep',     icon: '😴', label: 'Sleep',   done: !!goals.sleep },
    { key: 'food',      icon: '🥩', label: 'Protein', done: !!goals.food },
    { key: 'hydrated',  icon: '💧', label: 'Water',   done: !!goals.hydrated },
    { key: 'gym_done',  icon: '🏋️', label: 'Gym',     done: !!goals.gym_done },
  ]

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {pills.map(p => (
        <button key={p.key}
          onClick={() => {
            setGoal(p.key, !p.done)
            if (p.key === 'gym_done' && !p.done) toggleGym(today)
          }}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 24,
            background: p.done ? 'rgba(129,199,132,0.18)' : '#111118',
            border: `1.5px solid ${p.done ? '#81C784' : '#2e2e3e'}`,
            cursor: 'pointer', transition: 'all 0.18s',
          }}
        >
          <span style={{ fontSize: 15 }}>{p.icon}</span>
          <span style={{ fontSize: 12, color: p.done ? '#81C784' : '#7070a0', fontFamily: 'DM Mono, monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.label}</span>
          {p.done && <span style={{ fontSize: 11, color: '#81C784' }}>✓</span>}
        </button>
      ))}
    </div>
  )
}

// NOW block — context-aware, not time-prescriptive
function NowBlock({ tasks, ctx, dow }) {
  const dayCtx = getDayContext(dow)
  const co = COMPANIES[dayCtx.primary] || COMPANIES.personal
  
  // Surface top task for today's primary company
  const contextTasks = tasks.filter(t => t.company === dayCtx.primary && t.status !== 'done')
  const topTask = contextTasks.sort((a, b) => {
    if (!a.due && !b.due) return 0
    if (!a.due) return 1
    if (!b.due) return -1
    return a.due < b.due ? -1 : 1
  })[0]

  return (
    <div style={{ background: '#111118', border: `1.5px solid ${co.color}33`, borderRadius: 14, padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {/* Background accent */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: co.dim, filter: 'blur(20px)', pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: '#7070a0', fontFamily: 'Syne, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Context</div>
          <div style={{ fontSize: 15, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#f0eee8' }}>{dayCtx.label}</div>
          {dayCtx.commute && (
            <div style={{ fontSize: 11, color: '#7070a0', marginTop: 3 }}>🚌 {dayCtx.commuteNote}</div>
          )}
        </div>
        <span style={{ fontSize: 11, color: co.color, background: co.dim, padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: `1px solid ${co.color}33`, whiteSpace: 'nowrap' }}>{co.label}</span>
      </div>

      {topTask ? (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '10px 12px', marginTop: 6 }}>
          <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Top task</div>
          <div style={{ fontSize: 13, color: '#f0eee8', fontWeight: 600, lineHeight: 1.3 }}>{topTask.name}</div>
          {topTask.due && <DeadlineBadge due={topTask.due} />}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#4a4a6a', marginTop: 6 }}>No open tasks for today's context</div>
      )}
    </div>
  )
}

// End of day nudge
function EodNudge({ tasks }) {
  const now = new Date()
  const hour = now.getHours()
  if (hour < 18) return null
  
  const todayStr = format(now, 'yyyy-MM-dd')
  const openToday = tasks.filter(t => t.due === todayStr && t.status !== 'done')
  if (!openToday.length) return null

  return (
    <div style={{ background: 'rgba(255,183,77,0.1)', border: '1.5px solid rgba(255,183,77,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }}>🌙</span>
      <div>
        <div style={{ fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#FFB74D' }}>End of day check-in</div>
        <div style={{ fontSize: 12, color: '#9090a0', marginTop: 2 }}>{openToday.length} task{openToday.length > 1 ? 's' : ''} still open for today</div>
      </div>
    </div>
  )
}

// Gym weekly strip — compact
function GymWeek({ hasGym, toggleGym, count }) {
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    d.setDate(mon.getDate() + i)
    return { label: ['M','T','W','T','F','S','S'][i], date: format(d, 'yyyy-MM-dd'), isToday: d.toDateString() === now.toDateString() }
  })

  return (
    <div style={{ background: '#111118', border: '1.5px solid rgba(255,183,77,0.25)', borderRadius: 12, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 800, color: '#FFB74D' }}>
          🏋️ Gym — {count}/4 this week
        </div>
        <div style={{ fontSize: 11, color: count >= 4 ? '#81C784' : '#7070a0', fontWeight: 600 }}>
          {count >= 4 ? '🔥 Crushed it' : count >= 3 ? '💪 Almost' : 'Keep going'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {days.map((d, i) => {
          const done = hasGym(d.date)
          return (
            <button key={i} onClick={() => toggleGym(d.date)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 4px', borderRadius: 8, border: `2px solid ${done ? '#FFB74D' : d.isToday ? '#3a3a5e' : '#1e1e2e'}`, background: done ? 'rgba(255,183,77,0.2)' : d.isToday ? 'rgba(255,255,255,0.03)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.34,1.4,0.64,1)' }}>
              <span style={{ fontSize: 12 }}>{done ? '✓' : '·'}</span>
              <span style={{ fontSize: 9, color: done ? '#FFB74D' : d.isToday ? '#f0eee8' : '#3a3a5e', fontFamily: 'Syne, sans-serif', fontWeight: 800, textTransform: 'uppercase' }}>{d.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Today({ tasks, goals, setGoal, hasGym, toggleGym, gymCount, calendar, addTask, updateTask, deleteTask, completeTask }) {
  const now = useNow()
  const dow = now.getDay()
  const todayStr = format(now, 'yyyy-MM-dd')
  const [modal, setModal] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const overdue = tasks.filter(t => t.due && t.due < todayStr && t.status !== 'done')
  const dueToday = tasks.filter(t => t.due === todayStr && t.status !== 'done')
  const dueSoon = tasks.filter(t => {
    if (!t.due || t.status === 'done') return false
    const diff = differenceInCalendarDays(new Date(t.due), now)
    return diff > 0 && diff <= 3
  })

  const urgentTasks = [...overdue, ...dueToday, ...dueSoon.filter(t => !dueToday.find(d => d.id === t.id))]
  const calToday = (calendar || []).filter(e => e.date === todayStr || (e.start && e.start.startsWith(todayStr)))

  const handleComplete = async (task) => {
    await completeTask(task)
    toast(`✓ Done!`, 'success')
  }

  return (
    <div style={{ padding: '14px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 600, margin: '0 auto' }}>

      {/* DATE + TIME */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 28, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#f0eee8', lineHeight: 1 }}>{DAYS_FULL[dow]}</div>
          <div style={{ fontSize: 14, color: '#7070a0', marginTop: 4, fontWeight: 600 }}>{now.getDate()} {MONTHS[now.getMonth()]} · {format(now, 'HH:mm')}</div>
        </div>
        {overdue.length > 0 && (
          <div style={{ background: 'rgba(239,154,154,0.15)', border: '1.5px solid rgba(239,154,154,0.3)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#EF9A9A', fontWeight: 700 }}>
            ⚠ {overdue.length} overdue
          </div>
        )}
      </div>

      {/* EOD NUDGE */}
      <EodNudge tasks={tasks} />

      {/* HEALTH PILLS */}
      <HealthPills goals={goals} setGoal={setGoal} gymCount={gymCount} toggleGym={toggleGym} />

      {/* NOW BLOCK */}
      <NowBlock tasks={tasks} dow={dow} />

      {/* CALENDAR TODAY */}
      {calToday.length > 0 && (
        <div style={{ background: '#111118', border: '1.5px solid #2e2e3e', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#62C8DF', marginBottom: 10 }}>📅 Today</div>
          {calToday.map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < calToday.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
              <div style={{ fontSize: 12, color: '#62C8DF', fontWeight: 700, width: 46, flexShrink: 0 }}>{ev.time || ev.start?.slice(11,16) || '—'}</div>
              <div style={{ fontSize: 13, color: '#f0eee8', fontWeight: 500 }}>{ev.title || ev.summary}</div>
            </div>
          ))}
        </div>
      )}

      {/* URGENT TASKS */}
      {urgentTasks.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: overdue.length ? '#EF9A9A' : '#f0eee8', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{overdue.length ? '⚠ Urgent' : 'Up next'}</span>
            <span style={{ fontSize: 11, color: '#4a4a6a', fontWeight: 600 }}>{urgentTasks.length} tasks</span>
          </div>
          {(showAll ? urgentTasks : urgentTasks.slice(0, 4)).map(task => (
            <SwipeableTask key={task.id} task={task}
              onComplete={() => handleComplete(task)}
              onPress={() => setModal(task)}
            />
          ))}
          {urgentTasks.length > 4 && (
            <button onClick={() => setShowAll(s => !s)} style={{ width: '100%', padding: '10px', background: 'none', border: '1.5px dashed #2e2e3e', borderRadius: 10, color: '#7070a0', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>
              {showAll ? '↑ Show less' : `↓ Show ${urgentTasks.length - 4} more`}
            </button>
          )}
        </div>
      )}

      {urgentTasks.length === 0 && (
        <div style={{ background: 'rgba(129,199,132,0.08)', border: '1.5px solid rgba(129,199,132,0.2)', borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 14, color: '#81C784', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>All clear</div>
          <div style={{ fontSize: 12, color: '#7070a0', marginTop: 4 }}>Nothing urgent today</div>
        </div>
      )}

      {/* GYM WEEK */}
      <GymWeek hasGym={hasGym} toggleGym={toggleGym} count={gymCount} />

      {modal && (
        <TaskModal task={modal === 'add' ? null : modal} onSave={modal === 'add' ? addTask : (data) => updateTask(data.id, data)} onDelete={deleteTask} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
