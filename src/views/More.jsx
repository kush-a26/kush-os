import React, { useState } from 'react'
import { COMPANIES, STATUSES, PRIORITIES } from '../lib/constants.js'
import { CompanyTag, DeadlineBadge, StatusBadge, InlineEdit, Btn, FG, TInput, TSelect, TTextarea, toast } from '../components/ui.jsx'
import { TaskModal } from '../components/TaskModal.jsx'
import { format, startOfWeek, addDays, addWeeks, formatDistanceToNow, differenceInCalendarDays } from 'date-fns'

// ── WEEK VIEW ────────────────────────────────────────────────────────
function WeekView({ tasks, addTask, updateTask, deleteTask, completeTask }) {
  const [offset, setOffset] = useState(0)
  const [modal, setModal] = useState(null)
  const now = new Date()
  const base = offset === 0 ? now : addWeeks(now, offset)
  const wStart = startOfWeek(base, { weekStartsOn: 1 })
  const todayStr = format(now, 'yyyy-MM-dd')

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(wStart, i)
    return { d, str: format(d, 'yyyy-MM-dd'), isToday: format(d,'yyyy-MM-dd') === todayStr, label: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i] }
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setOffset(o => o-1)} style={{ padding: '8px 14px', background: '#111118', border: '1.5px solid #2e2e3e', borderRadius: 9, color: '#f0eee8', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>←</button>
        <span style={{ flex: 1, textAlign: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: '#f0eee8' }}>
          {format(wStart,'MMM d')} – {format(addDays(wStart,6),'MMM d')}
        </span>
        <button onClick={() => setOffset(o => o+1)} style={{ padding: '8px 14px', background: '#111118', border: '1.5px solid #2e2e3e', borderRadius: 9, color: '#f0eee8', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>→</button>
        {offset !== 0 && <button onClick={() => setOffset(0)} style={{ padding: '6px 12px', background: 'none', border: '1.5px solid #2e2e3e', borderRadius: 9, color: '#7070a0', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Today</button>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {days.map(({ d, str, isToday, label }) => {
          const dayTasks = tasks.filter(t => t.due === str && t.status !== 'done')
          const wfo = { 1:['marrow'], 2:['marrow'], 3:['yaas'], 4:['marrow'], 5:['marrow'], 6:['yaas'], 0:['dognosis'] }[d.getDay()] || []
          return (
            <div key={str} style={{ background: isToday ? '#141420' : '#111118', border: `1.5px solid ${isToday ? '#3a3a5e' : '#1e1e2e'}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: dayTasks.length || wfo.length ? '1px solid #1e1e2e' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: isToday ? '#f0eee8' : '#7070a0', width: 36 }}>{label}</div>
                  <div style={{ fontSize: 20, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: isToday ? '#f0eee8' : '#2e2e3e' }}>{d.getDate()}</div>
                  {wfo.map(co => <span key={co} style={{ fontSize: 10, color: COMPANIES[co]?.color, background: COMPANIES[co]?.dim, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>{COMPANIES[co]?.label}</span>)}
                </div>
                {dayTasks.length > 0 && <span style={{ fontSize: 11, color: '#7070a0', background: '#1a1a24', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{dayTasks.length}</span>}
              </div>
              {dayTasks.length > 0 && (
                <div style={{ padding: '8px 14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayTasks.map(t => (
                    <div key={t.id} onClick={() => setModal(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', cursor: 'pointer', borderBottom: '1px solid #1a1a2a' }}>
                      <CompanyTag company={t.company} small />
                      <span style={{ fontSize: 13, color: '#f0eee8', flex: 1, fontWeight: 500 }}>{t.name}</span>
                      <DeadlineBadge due={t.due} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {modal && <TaskModal task={modal} onSave={(data) => updateTask(data.id, data)} onDelete={deleteTask} onClose={() => setModal(null)} />}
    </div>
  )
}

// ── DONE LOG ─────────────────────────────────────────────────────────
function LogView({ log, uncompleteTask, updateLogEntry }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? log : log.filter(e => e.company === filter)

  const grouped = {}
  filtered.forEach(e => {
    const day = e.completed_at ? format(new Date(e.completed_at), 'yyyy-MM-dd') : 'unknown'
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(e)
  })

  const hoursByCompany = {}
  log.forEach(e => {
    if (!hoursByCompany[e.company]) hoursByCompany[e.company] = 0
    hoursByCompany[e.company] += parseFloat(e.hours || 0)
  })

  return (
    <div>
      {/* Hours summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {Object.entries(hoursByCompany).filter(([,h]) => h > 0).map(([co, hrs]) => (
          <div key={co} style={{ background: '#111118', border: `1.5px solid ${COMPANIES[co]?.color||'#2e2e3e'}33`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: COMPANIES[co]?.color || '#7070a0', fontFamily: 'Syne, sans-serif', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{COMPANIES[co]?.label || co}</div>
            <div style={{ fontSize: 20, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#f0eee8' }}>{hrs.toFixed(1)}h</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {[{key:'all',label:'All'}, ...Object.entries(COMPANIES).map(([k,v])=>({key:k,label:v.label}))].map(opt => (
          <button key={opt.key} onClick={() => setFilter(opt.key)}
            style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${filter===opt.key?'#f0eee8':'#2e2e3e'}`, background: filter===opt.key?'#f0eee8':'transparent', color: filter===opt.key?'#0b0b0c':'#7070a0', fontSize: 11, cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>
            {opt.label}
          </button>
        ))}
      </div>

      {Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).map(day => (
        <div key={day} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#7070a0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {day === format(new Date(),'yyyy-MM-dd') ? 'Today' : day === format(new Date(Date.now()-86400000),'yyyy-MM-dd') ? 'Yesterday' : format(new Date(day),'EEE, MMM d')}
            </span>
            <div style={{ flex: 1, borderTop: '1px solid #1e1e2e' }} />
            <span style={{ fontSize: 11, color: '#3a3a5e', fontWeight: 600 }}>{grouped[day].length} done</span>
          </div>
          {grouped[day].map(entry => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#111118', border: '1.5px solid #1e1e2e', borderRadius: 10, marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#5a5a7a', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{entry.task_name}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <CompanyTag company={entry.company} small />
                  <span style={{ fontSize: 10, color: '#3a3a5e' }}>{formatDistanceToNow(new Date(entry.completed_at), { addSuffix: true })}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#161620', border: '1.5px solid #2e2e3e', borderRadius: 7, padding: '4px 10px', flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 700 }}>HRS</span>
                <InlineEdit value={entry.hours ? String(entry.hours) : ''} onSave={v => updateLogEntry(entry.id, { hours: parseFloat(v)||null })} placeholder="—" style={{ fontSize: 13, color: '#f0eee8', fontWeight: 700, width: 36 }} />
              </div>
              <button onClick={() => uncompleteTask(entry.task_id).then(()=>toast('↩ Restored','info'))} style={{ background: 'none', border: '1.5px solid #2e2e3e', borderRadius: 7, padding: '5px 10px', fontSize: 12, color: '#4a4a6a', cursor: 'pointer', flexShrink: 0, fontFamily: 'DM Mono, monospace' }}>↩</button>
            </div>
          ))}
        </div>
      ))}
      {filtered.length === 0 && <div style={{ textAlign:'center', padding:'40px 0', color:'#3a3a5e', fontSize:13 }}>Nothing completed yet</div>}
    </div>
  )
}

// ── CONTEXT VIEW ─────────────────────────────────────────────────────
function ContextView({ ctx, updateCtx }) {
  const Row = ({ label, k, color }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 0', borderBottom:'1px solid #1a1a2a', gap:12 }}>
      <span style={{ fontSize:12, color:'#5a5a7a', flexShrink:0, width:130, fontWeight:600 }}>{label}</span>
      <div style={{ flex:1, fontSize:13, color:color||'#f0eee8' }}>
        <InlineEdit value={ctx[k]||''} onSave={v=>updateCtx(k,v)} placeholder="Tap to edit…" style={{ fontSize:13, color:color||'#f0eee8' }} />
      </div>
    </div>
  )

  const Section = ({ title, color, children }) => (
    <div style={{ background:'#111118', border:'1.5px solid #1e1e2e', borderRadius:12, overflow:'hidden', marginBottom:10 }}>
      <div style={{ padding:'12px 16px', background:'#0f0f16', borderBottom:'1px solid #1e1e2e', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:8,height:8,borderRadius:'50%',background:color }} />
        <span style={{ fontFamily:'Syne, sans-serif', fontSize:14, fontWeight:800, color }}>{title}</span>
        <span style={{ fontSize:10, color:'#3a3a5e', marginLeft:'auto' }}>tap to edit</span>
      </div>
      <div style={{ padding:'4px 16px 12px' }}>{children}</div>
    </div>
  )

  return (
    <div>
      <Section title="Marrow" color={COMPANIES.marrow.color}>
        <Row label="Role" k="marrow_role" /><Row label="WFO days" k="marrow_wfo" /><Row label="End date" k="marrow_end_date" color="#EF9A9A" /><Row label="Notes" k="marrow_notes" />
      </Section>
      <Section title="Yaas Studios" color={COMPANIES.yaas.color}>
        <Row label="Role" k="yaas_role" /><Row label="WFO days" k="yaas_wfo" /><Row label="Start date" k="yaas_start_date" color="#81C784" /><Row label="Notes" k="yaas_notes" />
      </Section>
      <Section title="Dognosis" color={COMPANIES.dognosis.color}>
        <Row label="Role" k="dognosis_role" /><Row label="Via friend" k="dognosis_friend" color="#B39DDB" /><Row label="Notes" k="dognosis_notes" />
      </Section>
      <Section title="College" color={COMPANIES.college.color}>
        <Row label="Ends" k="college_end_date" color="#EF9A9A" /><Row label="Assignment 1" k="college_a1" /><Row label="Assignment 2" k="college_a2" /><Row label="Notes" k="college_notes" />
      </Section>
      <Section title="Life" color="#F48FB1">
        <Row label="Wake" k="wake_time" /><Row label="Sleep" k="sleep_time" /><Row label="Gym/week" k="gym_days" /><Row label="Protected" k="protected_nights" color="#81C784" />
      </Section>
    </div>
  )
}

// ── TERMINAL ─────────────────────────────────────────────────────────
function TerminalView({ tasks, updateCtx }) {
  const [messages, setMessages] = useState([{ role:'system', type:'info', ts:Date.now(), content:'Command terminal.\n\nExamples:\n• add marrow task: review pacing analytics, high, due friday\n• done: pacing analytics\n• update: DP3 due april 28\n• set: yaas notes to client is D2C skincare\n• show tasks' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const parseDate = (str) => {
    if (!str) return null
    const s = str.toLowerCase()
    const now = new Date()
    if (s.includes('today')) return format(now,'yyyy-MM-dd')
    if (s.includes('tomorrow')) return format(addDays(now,1),'yyyy-MM-dd')
    const dayMap = {monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:0}
    for (const [name, dow] of Object.entries(dayMap)) {
      if (s.includes(name)) { const d=new Date(now); d.setDate(now.getDate()+((dow+7-now.getDay())%7||7)); return format(d,'yyyy-MM-dd') }
    }
    const m = s.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})/i)
    if (m) { const months={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11}; const d=new Date(now.getFullYear(),months[m[1].toLowerCase().slice(0,3)],parseInt(m[2])); return format(d,'yyyy-MM-dd') }
    return null
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(m => [...m, { role:'user', ts:Date.now(), content:text }])
    setLoading(true)
    const c = text.toLowerCase()

    try {
      if (c.startsWith('show task') || c === 'tasks') {
        const detail = tasks.slice(0,15).map(t=>`· ${t.name} [${t.company}]${t.due?' '+t.due:''}`).join('\n')
        setMessages(m => [...m, { role:'system', type:'info', ts:Date.now(), content:`${tasks.length} open tasks:\n\n${detail}` }])
      } else if (c.startsWith('done:') || c.startsWith('mark ')) {
        const q = c.replace(/^(done:|mark\s+)/,'').replace(/\s+as\s+done/,'').trim()
        const task = tasks.find(t => t.name.toLowerCase().includes(q) || q.split(' ').some(w=>w.length>3&&t.name.toLowerCase().includes(w)))
        if (task) {
          const { supabase } = await import('../lib/supabase.js')
          const now = new Date().toISOString()
          await supabase.from('tasks').update({status:'done',completed_at:now}).eq('id',task.id)
          await supabase.from('done_log').insert([{task_id:task.id,task_name:task.name,company:task.company,completed_at:now,notes:task.notes||''}])
          setMessages(m => [...m, { role:'system', type:'success', ts:Date.now(), content:`✓ "${task.name}" marked done` }])
        } else setMessages(m => [...m, { role:'system', type:'error', ts:Date.now(), content:`Couldn't find task matching "${q}"` }])
      } else if (c.startsWith('add ')) {
        const rest = c.replace(/^add\s+(task:?\s*)?/,'')
        const company = Object.keys(COMPANIES).find(k=>rest.includes(k))||'personal'
        const priority = rest.includes('high')?'high':rest.includes('low')?'low':'med'
        const due = parseDate(rest)
        const name = rest.replace(new RegExp(`(${Object.keys(COMPANIES).join('|')})`,'gi'),'').replace(/(high|med|low|urgent|task:?)/gi,'').replace(/due\s+\w+/gi,'').replace(/,/g,' ').replace(/\s+/g,' ').trim()
        if (name.length > 2) {
          const { supabase } = await import('../lib/supabase.js')
          await supabase.from('tasks').insert([{name,company,priority,status:'todo',due,notes:'',tags:[]}])
          setMessages(m => [...m, { role:'system', type:'success', ts:Date.now(), content:`✓ Added "${name}" [${company}] ${priority}${due?' due '+due:''}` }])
        } else setMessages(m => [...m, { role:'system', type:'error', ts:Date.now(), content:'Could not parse task name' }])
      } else if (c.startsWith('update:') || c.startsWith('change ')) {
        const rest = c.replace(/^(update:|change\s+)/,'')
        const dueM = rest.match(/(.+?)\s+due\s+(.+)/)
        if (dueM) {
          const task = tasks.find(t=>t.name.toLowerCase().includes(dueM[1].trim()))
          const due = parseDate(dueM[2])
          if (task && due) {
            const { supabase } = await import('../lib/supabase.js')
            await supabase.from('tasks').update({due}).eq('id',task.id)
            setMessages(m => [...m, { role:'system', type:'success', ts:Date.now(), content:`✓ "${task.name}" due → ${due}` }])
          } else setMessages(m => [...m, { role:'system', type:'error', ts:Date.now(), content:`Couldn't match task or parse date` }])
        }
      } else if (c.startsWith('set:') || c.startsWith('set ')) {
        const rest = c.replace(/^(set:|set\s+)/,'')
        const m = rest.match(/^(.+?)\s+(?:to:|to\s+|=\s*)(.+)$/i)
        if (m) {
          const keyMap = {'marrow notes':'marrow_notes','yaas notes':'yaas_notes','dognosis notes':'dognosis_notes','college notes':'college_notes','yaas role':'yaas_role','marrow role':'marrow_role'}
          const key = keyMap[m[1].trim().toLowerCase()] || m[1].trim().toLowerCase().replace(/\s+/g,'_')
          await updateCtx(key, m[2].trim())
          setMessages(m2 => [...m2, { role:'system', type:'success', ts:Date.now(), content:`✓ Set ${m[1].trim()} → ${m[2].trim()}` }])
        }
      } else {
        setMessages(m => [...m, { role:'system', type:'error', ts:Date.now(), content:`Unknown command. Try:\n• add [company] task: [name] due [date]\n• done: [task name]\n• update: [task] due [date]\n• set: [field] to [value]\n• show tasks` }])
      }
    } catch(err) { setMessages(m => [...m, { role:'system', type:'error', ts:Date.now(), content:`Error: ${err.message}` }]) }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'60vh', minHeight:400 }}>
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, paddingBottom:10 }}>
        {messages.map((msg,i)=>(
          <div key={i} style={{ display:'flex', flexDirection:msg.role==='user'?'row-reverse':'row', gap:8 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:msg.role==='user'?'#62C8DF':'#1a1a24',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:msg.role==='user'?'#0b0b0c':'#7070a0',fontFamily:'Syne,sans-serif',fontWeight:800 }}>{msg.role==='user'?'K':'>'}</div>
            <div style={{ maxWidth:'85%', padding:'10px 14px', borderRadius:msg.role==='user'?'12px 3px 12px 12px':'3px 12px 12px 12px', background:msg.role==='user'?'#1a2a30':'#111118', border:`1.5px solid ${msg.role==='user'?'rgba(98,200,223,0.2)':msg.type==='success'?'rgba(129,199,132,0.2)':msg.type==='error'?'rgba(239,154,154,0.2)':'#1e1e2e'}`, fontSize:13, lineHeight:1.7, color:msg.type==='success'?'#81C784':msg.type==='error'?'#EF9A9A':'#f0eee8', whiteSpace:'pre-wrap', fontWeight:msg.role==='user'?400:500 }}>{msg.content}</div>
          </div>
        ))}
        {loading && <div style={{ fontSize:13,color:'#4a4a6a',padding:'0 36px' }}>Thinking…</div>}
      </div>
      <div style={{ display:'flex', gap:8, paddingTop:10, borderTop:'1.5px solid #1e1e2e' }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type a command…"
          style={{ flex:1, background:'#111118', border:'1.5px solid #2e2e3e', borderRadius:10, padding:'12px 14px', color:'#f0eee8', fontFamily:'DM Mono, monospace', fontSize:13, outline:'none' }} />
        <button onClick={send} disabled={!input.trim()||loading} style={{ padding:'12px 18px', borderRadius:10, border:'none', background:!input.trim()||loading?'#1a1a24':'#f0eee8', color:!input.trim()||loading?'#3a3a5e':'#0b0b0c', fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:13, cursor:'pointer' }}>→</button>
      </div>
    </div>
  )
}

// ── MORE TAB CONTAINER ────────────────────────────────────────────────
export default function More({ tasks, log, ctx, addTask, updateTask, deleteTask, completeTask, uncompleteTask, updateLogEntry, updateCtx }) {
  const [section, setSection] = useState('week')

  const SECTIONS = [
    { key: 'week',     label: 'Week' },
    { key: 'log',      label: 'Done Log' },
    { key: 'context',  label: 'Context' },
    { key: 'terminal', label: 'Terminal' },
  ]

  return (
    <div style={{ padding: '14px 16px 80px', maxWidth: 600, margin: '0 auto' }}>
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${section === s.key ? '#f0eee8' : '#2e2e3e'}`, background: section === s.key ? '#f0eee8' : '#111118', color: section === s.key ? '#0b0b0c' : '#7070a0', fontSize: 13, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 800, transition: 'all 0.12s', whiteSpace: 'nowrap' }}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'week'     && <WeekView tasks={tasks} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} completeTask={completeTask} />}
      {section === 'log'      && <LogView log={log} uncompleteTask={uncompleteTask} updateLogEntry={updateLogEntry} />}
      {section === 'context'  && <ContextView ctx={ctx} updateCtx={updateCtx} />}
      {section === 'terminal' && <TerminalView tasks={tasks} updateCtx={updateCtx} />}
    </div>
  )
}
