// components/Universal/DetailPanel.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

// ── Types ────────────────────────────────────────────────
export type PanelObjectType = 'task' | 'cliente' | 'campagna' | 'progetto' | 'evento'

export interface PanelObject {
  type: PanelObjectType
  id: string
  data?: any // raw object già caricato
}

interface Props {
  obj: PanelObject | null
  onClose: () => void
  currentUser: string
  onNavigate?: (obj: PanelObject) => void
}

// ── Shared UI atoms ───────────────────────────────────────
const Row: FC<{ label: string; value?: string | number | null; color?: string }> = ({ label, value, color }) => {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${S.borderLight}` }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: color || S.textPrimary, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )
}

const Badge: FC<{ text: string; bg?: string; color?: string }> = ({ text, bg = S.tealLight, color = S.teal }) => (
  <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{text}</span>
)

const SectionTitle: FC<{ label: string; action?: { label: string; onClick: () => void } }> = ({ label, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingTop: 14, borderTop: `1px solid ${S.borderLight}` }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    {action && <button onClick={action.onClick} style={{ fontSize: 11, color: S.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DS.fonts.ui, fontWeight: 600 }}>{action.label}</button>}
  </div>
)

// ── Task panel ────────────────────────────────────────────
const TaskPanel: FC<{ data: any; onClose: () => void; currentUser: string }> = ({ data: initial, onClose, currentUser }) => {
  const [task, setTask] = useState(initial)
  const [sessions, setSessions] = useState<any[]>([])
  const [linkedProject, setLinkedProject] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    async function load() {
      // Sessioni timer
      const { data: s } = await supabase.from('task_sessioni').select('*').eq('task_id', task.id).order('inizio', { ascending: false })
      setSessions(s || [])
      // Progetto collegato
      if (task.progetto_id) {
        const { data: p } = await supabase.from('progetti').select('id,nome,colore').eq('id', task.progetto_id).single()
        setLinkedProject(p)
      }
    }
    load()
  }, [task.id, task.progetto_id])

  const save = async () => {
    const { id, created_at, ...fields } = form
    await supabase.from('tasks').update(fields).eq('id', task.id)
    setTask({ ...task, ...fields })
    setEditing(false)
  }

  const totalMin = sessions.reduce((a, s) => a + (s.durata_min || 0), 0)
  const h = Math.floor(totalMin / 60), m = totalMin % 60
  const isOverdue = task.scadenza && task.scadenza < new Date().toISOString().split('T')[0] && task.stato !== 'completato'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
      {/* Title + status */}
      <div style={{ marginBottom: 16 }}>
        {editing ? (
          <input value={form.titolo || task.titolo || task.testo || ''} onChange={e => setForm({ ...form, titolo: e.target.value })}
            style={{ width: '100%', fontSize: 16, fontWeight: 700, border: `1px solid ${S.teal}`, borderRadius: 7, padding: '6px 10px', fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
        ) : (
          <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary, lineHeight: 1.3 }}>{task.titolo || task.testo}</div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <Badge text={task.stato || 'aperto'} bg={task.stato === 'completato' ? S.greenLight : S.blueLight} color={task.stato === 'completato' ? S.green : S.blue} />
          {task.priorita && <Badge text={`P${task.priorita}`} bg={Number(task.priorita) <= 2 ? S.redLight : S.borderLight} color={Number(task.priorita) <= 2 ? S.red : S.textMuted} />}
          {isOverdue && <Badge text="Scaduto" bg={S.redLight} color={S.red} />}
        </div>
      </div>

      {editing ? (
        <div>
          {[{ label: 'Dettaglio', key: 'dettaglio', type: 'textarea' }, { label: 'Scadenza', key: 'scadenza', type: 'date' }].map(f => (
            <div key={f.key} style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</label>
              {f.type === 'textarea'
                ? <textarea value={form[f.key] || task[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} rows={2} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box', resize: 'vertical' }} />
                : <input type={f.type} value={form[f.key] !== undefined ? form[f.key] : (task[f.key] || '')} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
              }
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={form.stato || task.stato || 'aperto'} onChange={e => setForm({ ...form, stato: e.target.value })} style={{ flex: 1, padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui }}>
              {['aperto', 'in_corso', 'completato'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={form.priorita || task.priorita || '3'} onChange={e => setForm({ ...form, priorita: e.target.value })} style={{ flex: 1, padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui }}>
              {['1','2','3','4','5'].map(p => <option key={p} value={p}>P{p}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => { setEditing(false); setForm({}) }} style={{ flex: 1, padding: '8px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
            <button onClick={save} style={{ flex: 1, padding: '8px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>Salva</button>
          </div>
        </div>
      ) : (
        <>
          {task.dettaglio && <div style={{ fontSize: 13, color: S.textSecondary, lineHeight: 1.6, marginBottom: 14, padding: '10px 12px', background: S.background, borderRadius: 8 }}>{task.dettaglio}</div>}
          <Row label="Assegnato a" value={task.chi} />
          <Row label="Scadenza" value={task.scadenza} color={isOverdue ? S.red : undefined} />
          <Row label="Stima" value={task.tempo_stimato ? `${task.tempo_stimato} min` : null} />
          <Row label="Tempo tracciato" value={totalMin > 0 ? `${h > 0 ? h + 'h ' : ''}${m}m` : null} color={S.teal} />
          {linkedProject && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: S.background, borderRadius: 8, marginBottom: 8 }}>
              {linkedProject.colore && <div style={{ width: 8, height: 8, borderRadius: '50%', background: linkedProject.colore }} />}
              <span style={{ fontSize: 12, color: S.textSecondary }}>Progetto: <strong>{linkedProject.nome}</strong></span>
            </div>
          )}

          {/* Sessioni */}
          {sessions.length > 0 && (
            <>
              <SectionTitle label={`Sessioni timer (${sessions.length})`} />
              {sessions.slice(0, 5).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${S.borderLight}` }}>
                  <span style={{ fontSize: 11, color: S.textSecondary }}>{new Date(s.inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: S.teal, fontFamily: DS.fonts.mono }}>{s.durata_min || 0}m</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Generic panel (campagna, evento) ─────────────────────
const GenericPanel: FC<{ type: PanelObjectType; data: any }> = ({ type, data }) => {
  const fields = Object.entries(data).filter(([k, v]) =>
    v !== null && v !== undefined && v !== '' &&
    !['id', 'created_at', 'updated_at', 'progetto_id', 'cliente_id', 'campagna_id'].includes(k) &&
    typeof v !== 'object'
  )
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary, marginBottom: 16 }}>
        {data.nome || data.titolo || data.ragione_sociale || 'Dettaglio'}
      </div>
      {fields.map(([k, v]) => (
        <Row key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
      ))}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────
export const DetailPanel: FC<Props> = ({ obj, onClose, currentUser, onNavigate }) => {
  const [data, setData] = useState<any>(obj?.data || null)
  const [loading, setLoading] = useState(!obj?.data)

  useEffect(() => {
    if (!obj) return
    if (obj.data) { setData(obj.data); return }
    setLoading(true)
    const tableMap: Record<PanelObjectType, string> = {
      task: 'tasks', cliente: 'clienti', campagna: 'campagne',
      progetto: 'progetti', evento: 'calendario_eventi',
    }
    supabase.from(tableMap[obj.type]).select('*').eq('id', obj.id).single()
      .then(({ data: d }) => { setData(d); setLoading(false) })
  }, [obj?.id, obj?.type])

  if (!obj) return null

  const TIPO_LABEL: Record<PanelObjectType, string> = {
    task: 'Task', cliente: 'Contatto', campagna: 'Campagna', progetto: 'Progetto', evento: 'Evento'
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={onClose} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 400,
        background: S.surface, borderLeft: `1px solid ${S.border}`,
        boxShadow: DS.shadow.xl, zIndex: 99,
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.15s ease',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, background: S.background, padding: '2px 8px', borderRadius: 20 }}>
              {TIPO_LABEL[obj.type]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {obj.type === 'task' && data && !loading && (
              <button onClick={() => {}} style={{ padding: '5px 10px', border: `1px solid ${S.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 11, color: S.textSecondary, fontFamily: DS.fonts.ui }}>
                Modifica
              </button>
            )}
            <button onClick={onClose} style={{ width: 28, height: 28, border: 'none', background: S.background, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke={S.textSecondary} strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: S.textMuted }}>Caricamento...</span>
          </div>
        ) : !data ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: S.textMuted }}>Oggetto non trovato</span>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 16 }}>
            {obj.type === 'task'
              ? <TaskPanel data={data} onClose={onClose} currentUser={currentUser} />
              : <GenericPanel type={obj.type} data={data} />
            }
          </div>
        )}

        {/* Footer actions */}
        {data && !loading && (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${S.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => {
              const text = `${TIPO_LABEL[obj.type]}: ${data.nome || data.titolo || data.testo || ''}`
              if (navigator.share) navigator.share({ title: text, text })
              else navigator.clipboard.writeText(text).then(() => alert('Copiato!'))
            }} style={{ flex: 1, padding: '8px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: S.textSecondary, fontFamily: DS.fonts.ui }}>
              Condividi
            </button>
            <button onClick={() => {
              const phone = data.telefono?.replace(/\D/g, '')
              if (phone) window.open(`https://wa.me/${phone}?text=Ciao ${data.nome}`, '_blank')
              else alert('Nessun numero di telefono')
            }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 7, background: '#25D366', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui }}>
              WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  )
}
