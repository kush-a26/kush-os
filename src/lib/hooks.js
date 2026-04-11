import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase.js'
import { format, startOfWeek, endOfWeek } from 'date-fns'

const fmt = (d) => format(d, 'yyyy-MM-dd')
const todayStr = () => fmt(new Date())
const weekStartStr = () => fmt(startOfWeek(new Date(), { weekStartsOn: 1 }))
const weekEndStr = () => fmt(endOfWeek(new Date(), { weekStartsOn: 1 }))

// ─── GLOBAL STORE — single source of truth ───────────────────────────
// All data lives here. Realtime updates flow into this store.
// Components subscribe by calling the hook — no prop drilling needed.

let _listeners = []
let _store = { tasks: [], log: [], ctx: {}, goals: {}, gym: [], calendar: [], loaded: false }

function notify() { _listeners.forEach(fn => fn({ ..._store })) }

function setStore(patch) {
  _store = { ..._store, ...patch }
  notify()
}

// Single realtime channel for ALL tables
let _channel = null
let _fetchAll = null

async function loadAll() {
  const today = todayStr()
  const wStart = weekStartStr()
  const wEnd = weekEndStr()

  const [tasksRes, logRes, ctxRes, goalsRes, gymRes] = await Promise.all([
    supabase.from('tasks').select('*').neq('status', 'done').order('due', { ascending: true, nullsFirst: false }),
    supabase.from('done_log').select('*').order('completed_at', { ascending: false }),
    supabase.from('context').select('*'),
    supabase.from('daily_goals').select('*').eq('date', today),
    supabase.from('gym_sessions').select('*').gte('date', wStart).lte('date', wEnd),
  ])

  const ctxMap = {}
  ;(ctxRes.data || []).forEach(r => { ctxMap[r.key] = r.value })

  const goalsMap = {}
  ;(goalsRes.data || []).forEach(r => { goalsMap[r.goal_key] = r.value })

  // Calendar from context cache
  let calendar = []
  if (ctxMap.calendar_events_cache) {
    try { calendar = JSON.parse(ctxMap.calendar_events_cache) } catch {}
  }

  setStore({
    tasks: tasksRes.data || [],
    log: logRes.data || [],
    ctx: ctxMap,
    goals: goalsMap,
    gym: gymRes.data || [],
    calendar,
    loaded: true,
  })
}

function initRealtime() {
  if (_channel) return
  _fetchAll = loadAll

  _channel = supabase.channel('kush-os-global')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'done_log' }, loadAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'context' }, loadAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_goals' }, loadAll)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gym_sessions' }, loadAll)
    .subscribe()

  loadAll()
}

export function useStore() {
  const [state, setState] = useState(_store)

  useEffect(() => {
    _listeners.push(setState)
    initRealtime()
    if (!_store.loaded) loadAll()
    else setState({ ..._store })
    return () => { _listeners = _listeners.filter(fn => fn !== setState) }
  }, [])

  // ── TASK ACTIONS ────────────────────────────────────────────────────
  const addTask = useCallback(async (task) => {
    await supabase.from('tasks').insert([{
      name: task.name, company: task.company || 'personal',
      priority: task.priority || 'med', status: task.status || 'todo',
      due: task.due || null, notes: task.notes || '', tags: task.tags || [],
    }])
    // loadAll is triggered by realtime
  }, [])

  const updateTask = useCallback(async (id, patch) => {
    await supabase.from('tasks').update(patch).eq('id', id)
  }, [])

  const deleteTask = useCallback(async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
  }, [])

  const completeTask = useCallback(async (task) => {
    const completedAt = new Date().toISOString()
    await supabase.from('tasks').update({ status: 'done', completed_at: completedAt }).eq('id', task.id)
    await supabase.from('done_log').insert([{
      task_id: task.id, task_name: task.name, company: task.company,
      completed_at: completedAt, notes: task.notes || '', hours: null,
    }])
  }, [])

  const uncompleteTask = useCallback(async (id) => {
    await supabase.from('tasks').update({ status: 'todo', completed_at: null }).eq('id', id)
    await supabase.from('done_log').delete().eq('task_id', id)
  }, [])

  const updateLogEntry = useCallback(async (id, patch) => {
    await supabase.from('done_log').update(patch).eq('id', id)
  }, [])

  // ── CONTEXT ACTIONS ─────────────────────────────────────────────────
  const updateCtx = useCallback(async (key, value) => {
    await supabase.from('context').upsert({ key, value, updated_at: new Date().toISOString() })
  }, [])

  // ── GOALS ACTIONS ───────────────────────────────────────────────────
  const setGoal = useCallback(async (goalKey, value) => {
    // Optimistic update
    setStore({ goals: { ..._store.goals, [goalKey]: value } })
    await supabase.from('daily_goals').upsert(
      { date: todayStr(), goal_key: goalKey, value, updated_at: new Date().toISOString() },
      { onConflict: 'date,goal_key' }
    )
  }, [])

  // ── GYM ACTIONS ─────────────────────────────────────────────────────
  const toggleGym = useCallback(async (dateStr) => {
    const existing = _store.gym.find(s => s.date === dateStr)
    if (existing) {
      // Optimistic
      setStore({ gym: _store.gym.filter(s => s.date !== dateStr) })
      await supabase.from('gym_sessions').delete().eq('id', existing.id)
    } else {
      const newSession = { date: dateStr, week_key: weekStartStr(), id: 'temp-' + Date.now() }
      setStore({ gym: [..._store.gym, newSession] })
      await supabase.from('gym_sessions').insert([{ date: dateStr, week_key: weekStartStr() }])
    }
  }, [])

  const hasGym = useCallback((dateStr) => _store.gym.some(s => s.date === dateStr), [state.gym])

  return {
    ...state,
    addTask, updateTask, deleteTask, completeTask, uncompleteTask,
    updateLogEntry, updateCtx, setGoal, toggleGym, hasGym,
    gymCount: state.gym.length,
    refresh: loadAll,
  }
}
