import React, { useState } from 'react'
import { Modal, FG, TInput, TSelect, TTextarea, Btn } from './ui.jsx'
import { COMPANIES, STATUSES, PRIORITIES } from '../lib/constants.js'

const CO = Object.entries(COMPANIES).map(([k,v]) => ({ value: k, label: v.label }))
const ST = Object.entries(STATUSES).map(([k,v]) => ({ value: k, label: v.label }))
const PR = Object.entries(PRIORITIES).map(([k,v]) => ({ value: k, label: v.label }))
const BLANK = { name:'', company:'marrow', priority:'med', status:'todo', due:'', notes:'', tags:'' }

export function TaskModal({ task, onSave, onDelete, onClose }) {
  const isEdit = !!task?.id
  const [form, setForm] = useState(task ? { ...task, tags: (task.tags||[]).join(', ') } : BLANK)
  const [saving, setSaving] = useState(false)
  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({ ...form, tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [], due: form.due || null })
    setSaving(false)
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Edit Task' : 'New Task'} onClose={onClose}>
      <FG label="Task name">
        <TInput value={form.name} onChange={set('name')} placeholder="What needs to get done?" autoFocus />
      </FG>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <FG label="Company"><TSelect value={form.company} onChange={set('company')} options={CO} /></FG>
        <FG label="Priority"><TSelect value={form.priority} onChange={set('priority')} options={PR} /></FG>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <FG label="Status"><TSelect value={form.status} onChange={set('status')} options={ST} /></FG>
        <FG label="Due date"><TInput type="date" value={form.due||''} onChange={set('due')} /></FG>
      </div>
      <FG label="Notes">
        <TTextarea value={form.notes||''} onChange={set('notes')} placeholder="Context, blockers, decisions..." rows={3} />
      </FG>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:20, gap:10 }}>
        <div>{isEdit && <Btn variant="danger" onClick={() => { onDelete(task.id); onClose() }}>Delete</Btn>}</div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving} style={{ flex:1 }}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add Task'}</Btn>
        </div>
      </div>
    </Modal>
  )
}
