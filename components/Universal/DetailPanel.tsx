// components/Universal/DetailPanel.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

export type PanelObjectType = 'task' | 'cliente' | 'campagna' | 'progetto' | 'evento' | 'fattura'

export interface PanelObject {
  type: PanelObjectType
  id: string
  data?: any
}

interface Props {
  obj: PanelObject | null
  onClose: () => void
  currentUser: string
  onNavigate?: (obj: PanelObject) => void
}

// ── Atoms ─────────────────────────────────────────────────
const Row: FC<{ label: string; value?: string | number | null; color?: string; onClick?: () => void }> = ({ label, value, color, onClick }) => {
  if (!value && value !== 0) return null
  return (
    <div onClick={onClick} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${S.borderLight}`, cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: color || (onClick ? S.teal : S.textPrimary), textAlign: 'right', maxWidth: '60%', textDecoration: onClick ? 'underline' : 'none' }}>{value}</span>
    </div>
  )
}

const Chip: FC<{ text: string; bg?: string; color?: string }> = ({ text, bg = S.tealLight, color = S.teal }) => (
  <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{text}</span>
)

const Sec: FC<{ label: string; count?: number; onAdd?: () => void }> = ({ label, count, onAdd }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingTop: 12, borderTop: `1px solid ${S.borderLight}` }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}{count !== undefined ? ` (${count})` : ''}</span>
    {onAdd && <button onClick={onAdd} style={{ fontSize: 11, color: S.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DS.fonts.ui, fontWeight: 600 }}>+ Collega</button>}
  </div>
)

// ── Task Panel ────────────────────────────────────────────
const TaskPanel: FC<{ data: any; currentUser: string; onNavigate?: (o: PanelObject) => void }> = ({ data: initial, currentUser, onNavigate }) => {
  const [task, setTask] = useState(initial)
  const [sessions, setSessions] = useState<any[]>([])
  const [linkedProject, setLinkedProject] = useState<any>(null)
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [linkingProject, setLinkingProject] = useState(false)
  const [linkingDep, setLinkingDep] = useState(false)
  const [blockingTask, setBlockingTask] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const [sRes, pRes, tRes] = await Promise.all([
        supabase.from('task_sessioni').select('*').eq('task_id', task.id).order('inizio', { ascending: false }),
        supabase.from('progetti').select('id,nome,colore'),
        supabase.from('tasks').select('id,titolo,testo,stato').neq('id', task.id).limit(50),
      ])
      setSessions(sRes.data || [])
      setAllProjects(pRes.data || [])
      setAllTasks(tRes.data || [])
      if (task.progetto_id) {
        const p = (pRes.data || []).find((x: any) => x.id === task.progetto_id)
        setLinkedProject(p || null)
      }
      if (task.dipende_da) {
        const bt = (tRes.data || []).find((x: any) => x.id === task.dipende_da)
        setBlockingTask(bt || null)
      }
    }
    load()
  }, [task.id])

  const save = async () => {
    const { id, created_at, ...fields } = form
    await supabase.from('tasks').update(fields).eq('id', task.id)
    setTask({ ...task, ...fields }); setEditing(false); setForm({})
  }

  const linkProject = async (pid: string) => {
    await supabase.from('tasks').update({ progetto_id: pid }).eq('id', task.id)
    const p = allProjects.find(x => x.id === pid)
    setLinkedProject(p); setTask({ ...task, progetto_id: pid }); setLinkingProject(false)
  }

  const linkDependency = async (tid: string) => {
    await supabase.from('tasks').update({ dipende_da: tid, bloccata: true }).eq('id', task.id)
    const bt = allTasks.find(x => x.id === tid)
    setBlockingTask(bt); setTask({ ...task, dipende_da: tid, bloccata: true }); setLinkingDep(false)
  }

  const removeDep = async () => {
    await supabase.from('tasks').update({ dipende_da: null, bloccata: false }).eq('id', task.id)
    setBlockingTask(null); setTask({ ...task, dipende_da: null, bloccata: false })
  }

  const totalMin = sessions.reduce((a, s) => a + (s.durata_min || 0), 0)
  const h = Math.floor(totalMin / 60), m = totalMin % 60
  const isOverdue = task.scadenza && task.scadenza < new Date().toISOString().split('T')[0] && task.stato !== 'completato'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
      {/* Title */}
      {editing ? (
        <div style={{ marginBottom: 14 }}>
          <input value={form.titolo ?? task.titolo ?? task.testo ?? ''} onChange={e => setForm({ ...form, titolo: e.target.value })}
            style={{ width: '100%', fontSize: 15, fontWeight: 700, border: `1px solid ${S.teal}`, borderRadius: 7, padding: '6px 10px', fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {[{k:'dettaglio',l:'Dettaglio',t:'textarea'},{k:'scadenza',l:'Scadenza',t:'date'}].map(f => (
              <div key={f.k}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>{f.l}</label>
                {f.t === 'textarea'
                  ? <textarea value={form[f.k] ?? task[f.k] ?? ''} onChange={e => setForm({ ...form, [f.k]: e.target.value })} rows={2} style={{ width: '100%', padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.ui, boxSizing: 'border-box', resize: 'vertical' }} />
                  : <input type={f.t} value={form[f.k] ?? task[f.k] ?? ''} onChange={e => setForm({ ...form, [f.k]: e.target.value })} style={{ width: '100%', padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
                }
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <select value={form.stato ?? task.stato ?? 'aperto'} onChange={e => setForm({ ...form, stato: e.target.value })} style={{ flex: 1, padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.ui }}>
              {['aperto','in_corso','completato'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={form.priorita ?? task.priorita ?? '3'} onChange={e => setForm({ ...form, priorita: e.target.value })} style={{ flex: 1, padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.ui }}>
              {['1','2','3','4','5'].map(p => <option key={p} value={p}>Priorità {p}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => { setEditing(false); setForm({}) }} style={{ flex: 1, padding: '7px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.fonts.ui }}>Annulla</button>
            <button onClick={save} style={{ flex: 1, padding: '7px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui }}>Salva</button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary, lineHeight: 1.3, marginBottom: 8 }}>{task.titolo || task.testo}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip text={task.stato || 'aperto'} bg={task.stato === 'completato' ? S.greenLight : S.blueLight} color={task.stato === 'completato' ? S.green : S.blue} />
            {task.priorita && <Chip text={`P${task.priorita}`} bg={Number(task.priorita) <= 2 ? S.redLight : S.borderLight} color={Number(task.priorita) <= 2 ? S.red : S.textMuted} />}
            {isOverdue && <Chip text="Scaduto" bg={S.redLight} color={S.red} />}
            {task.bloccata && <Chip text="Bloccata" bg={S.amberLight} color={S.amber} />}
          </div>
        </div>
      )}

      {!editing && task.dettaglio && (
        <div style={{ fontSize: 13, color: S.textSecondary, lineHeight: 1.6, marginBottom: 14, padding: '10px 12px', background: S.background, borderRadius: 8 }}>{task.dettaglio}</div>
      )}

      {!editing && <>
        <Row label="Assegnato a" value={task.chi} />
        <Row label="Scadenza" value={task.scadenza} color={isOverdue ? S.red : undefined} />
        <Row label="Stima" value={task.tempo_stimato ? `${task.tempo_stimato} min` : null} />
        <Row label="Tempo tracciato" value={totalMin > 0 ? `${h > 0 ? h + 'h ' : ''}${m}m` : null} color={S.teal} />

        {/* Progetto collegato */}
        <Sec label="Progetto collegato" onAdd={() => setLinkingProject(true)} />
        {linkedProject ? (
          <div onClick={() => onNavigate?.({ type: 'progetto', id: linkedProject.id, data: linkedProject })}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: S.background, borderRadius: 8, marginBottom: 10, cursor: 'pointer', border: `1px solid ${S.border}` }}>
            {linkedProject.colore && <div style={{ width: 8, height: 8, borderRadius: '50%', background: linkedProject.colore, flexShrink: 0 }} />}
            <span style={{ fontSize: 13, fontWeight: 500, color: S.teal }}>{linkedProject.nome}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: S.textMuted }}>→ Apri</span>
          </div>
        ) : <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 10 }}>Nessun progetto collegato</div>}

        {linkingProject && (
          <div style={{ background: S.background, border: `1px solid ${S.teal}40`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 6 }}>Seleziona progetto:</div>
            {allProjects.map(p => (
              <div key={p.id} onClick={() => linkProject(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 3, background: S.surface }}>
                {p.colore && <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.colore }} />}
                <span style={{ fontSize: 13, color: S.textPrimary }}>{p.nome}</span>
              </div>
            ))}
            <button onClick={() => setLinkingProject(false)} style={{ marginTop: 4, fontSize: 11, color: S.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Annulla</button>
          </div>
        )}

        {/* Dipendenza */}
        <Sec label="Dipende da" onAdd={() => setLinkingDep(true)} />
        {blockingTask ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: S.amberLight, borderRadius: 8, marginBottom: 10, border: `1px solid ${S.amber}30` }}>
            <span style={{ fontSize: 12, color: S.amber }}>Bloccata da:</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary, flex: 1 }}>{blockingTask.titolo || blockingTask.testo}</span>
            <button onClick={removeDep} style={{ fontSize: 11, color: S.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        ) : <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 10 }}>Nessuna dipendenza</div>}

        {linkingDep && (
          <div style={{ background: S.background, border: `1px solid ${S.amber}40`, borderRadius: 8, padding: 10, marginBottom: 10, maxHeight: 160, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 6 }}>Task bloccante:</div>
            {allTasks.map(t => (
              <div key={t.id} onClick={() => linkDependency(t.id)} style={{ padding: '5px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: S.surface, fontSize: 12, color: S.textPrimary }}>
                {t.titolo || t.testo}
              </div>
            ))}
            <button onClick={() => setLinkingDep(false)} style={{ marginTop: 4, fontSize: 11, color: S.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Annulla</button>
          </div>
        )}

        {/* Sessioni */}
        {sessions.length > 0 && <>
          <Sec label="Sessioni timer" count={sessions.length} />
          {sessions.slice(0, 4).map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${S.borderLight}` }}>
              <span style={{ fontSize: 11, color: S.textSecondary }}>{new Date(s.inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: S.teal, fontFamily: DS.fonts.mono }}>{s.durata_min || 0}m</span>
            </div>
          ))}
        </>}
      </>}
    </div>
  )
}

// ── Cliente Panel ─────────────────────────────────────────
const ClientePanel: FC<{ data: any; onNavigate?: (o: PanelObject) => void }> = ({ data: c, onNavigate }) => {
  const [attivita, setAttivita] = useState<any[]>([])
  const [fatture, setFatture] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [aRes, fRes] = await Promise.all([
        supabase.from('crm_attivita').select('*').eq('cliente_id', c.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('fatture').select('id,numero,totale,stato,data_emissione').eq('cliente_id', c.id).limit(5),
      ])
      setAttivita(aRes.data || [])
      setFatture(fRes.data || [])
    }
    load()
  }, [c.id])

  const STAGE_CFG: Record<string, string> = { lead: S.textMuted, contatto: S.blue, demo: S.purple, proposta: S.amber, chiuso_vinto: S.green, chiuso_perso: S.red }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary, marginBottom: 4 }}>{c.nome}</div>
      {c.azienda && <div style={{ fontSize: 13, color: S.textSecondary, marginBottom: 10 }}>{c.azienda}</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {c.pipeline_stage && <Chip text={c.pipeline_stage} bg={STAGE_CFG[c.pipeline_stage] + '20'} color={STAGE_CFG[c.pipeline_stage] || S.textMuted} />}
        {c.progetto_interesse && <Chip text={c.progetto_interesse} />}
      </div>
      {c.deal_value > 0 && <div style={{ fontSize: 20, fontWeight: 700, color: S.green, fontFamily: DS.fonts.mono, marginBottom: 14 }}>€{Number(c.deal_value).toLocaleString('it-IT')}/anno</div>}
      <Row label="Email" value={c.email} />
      <Row label="Telefono" value={c.telefono} />
      <Row label="Fonte" value={c.fonte} />
      <Row label="Paese" value={c.paese} />
      <Row label="Follow-up" value={c.follow_up_date} color={c.follow_up_date < new Date().toISOString().split('T')[0] ? S.red : undefined} />
      {c.note_pipeline && <div style={{ fontSize: 12, color: S.textSecondary, padding: '8px 10px', background: S.amberLight, borderRadius: 7, marginTop: 8 }}>{c.note_pipeline}</div>}

      {/* Fatture collegate */}
      {fatture.length > 0 && <>
        <Sec label="Fatture" count={fatture.length} />
        {fatture.map(f => (
          <div key={f.id} onClick={() => onNavigate?.({ type: 'fattura', id: f.id, data: f })} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: S.background, borderRadius: 7, marginBottom: 4, cursor: 'pointer', border: `1px solid ${S.border}` }}>
            <span style={{ fontSize: 12, color: S.teal, fontWeight: 500 }}>{f.numero}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: S.green, fontFamily: DS.fonts.mono }}>€{Number(f.totale).toLocaleString('it-IT')}</span>
          </div>
        ))}
      </>}

      {/* Attività */}
      {attivita.length > 0 && <>
        <Sec label="Attività" count={attivita.length} />
        {attivita.slice(0, 4).map(a => (
          <div key={a.id} style={{ padding: '6px 0', borderBottom: `1px solid ${S.borderLight}` }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: S.textPrimary }}>{a.titolo}</div>
            <div style={{ fontSize: 10, color: S.textMuted, marginTop: 2 }}>{a.tipo} · {a.data_attivita}</div>
          </div>
        ))}
      </>}
    </div>
  )
}

// ── Fattura Panel ─────────────────────────────────────────
const FatturaPanel: FC<{ data: any; onNavigate?: (o: PanelObject) => void }> = ({ data: f, onNavigate }) => {
  const [righe, setRighe] = useState<any[]>([])
  useEffect(() => {
    supabase.from('righe_fattura').select('*').eq('fattura_id', f.id).order('ordine').then(r => setRighe(r.data || []))
  }, [f.id])

  const STATO_COLOR: Record<string, string> = { bozza: S.textMuted, emessa: S.blue, pagata: S.green, scaduta: S.red, annullata: S.textMuted }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary, marginBottom: 4 }}>Fattura {f.numero}</div>
      <Chip text={f.stato} bg={(STATO_COLOR[f.stato] || S.textMuted) + '20'} color={STATO_COLOR[f.stato] || S.textMuted} />
      <div style={{ fontSize: 24, fontWeight: 700, color: S.green, fontFamily: DS.fonts.mono, margin: '14px 0' }}>€{Number(f.totale).toLocaleString('it-IT')}</div>
      <Row label="Cliente" value={f.controparte_nome} onClick={f.cliente_id ? () => onNavigate?.({ type: 'cliente', id: f.cliente_id }) : undefined} />
      <Row label="Data emissione" value={f.data_emissione} />
      <Row label="Scadenza" value={f.data_scadenza} />
      <Row label="Imponibile" value={`€${Number(f.imponibile).toFixed(2)}`} />
      <Row label={`IVA ${f.iva_aliquota}%`} value={`€${Number(f.iva_importo).toFixed(2)}`} />
      <Row label="Regime" value={f.emittente_regime} />
      <Row label="Stato SDI" value={f.sdi_stato} color={f.sdi_stato === 'accettata' ? S.green : S.textMuted} />
      {f.causale && <div style={{ fontSize: 12, color: S.textSecondary, padding: '8px 10px', background: S.background, borderRadius: 7, marginTop: 8 }}>{f.causale}</div>}
      {righe.length > 0 && <>
        <Sec label="Voci" count={righe.length} />
        {righe.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${S.borderLight}` }}>
            <span style={{ fontSize: 12, color: S.textPrimary, flex: 1 }}>{r.descrizione} <span style={{ color: S.textMuted }}>×{r.quantita}</span></span>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.mono }}>€{Number(r.totale).toFixed(2)}</span>
          </div>
        ))}
      </>}
    </div>
  )
}

// ── Generic Panel ─────────────────────────────────────────
const GenericPanel: FC<{ type: PanelObjectType; data: any; onNavigate?: (o: PanelObject) => void }> = ({ type, data, onNavigate }) => {
  const skip = ['id','created_at','updated_at','progetto_id','cliente_id']
  const fields = Object.entries(data).filter(([k, v]) => v !== null && v !== undefined && v !== '' && !skip.includes(k) && typeof v !== 'object')
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary, marginBottom: 16 }}>
        {data.nome || data.titolo || data.ragione_sociale || 'Dettaglio'}
      </div>
      {fields.map(([k, v]) => <Row key={k} label={k.replace(/_/g, ' ')} value={String(v)} />)}
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────
export const DetailPanel: FC<Props> = ({ obj, onClose, currentUser, onNavigate }) => {
  const [data, setData] = useState<any>(obj?.data || null)
  const [loading, setLoading] = useState(!obj?.data)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!obj) return
    if (obj.data) { setData(obj.data); setLoading(false); return }
    setLoading(true)
    const tableMap: Record<PanelObjectType, string> = {
      task: 'tasks', cliente: 'clienti', campagna: 'campagne',
      progetto: 'progetti', evento: 'calendario_eventi', fattura: 'fatture',
    }
    supabase.from(tableMap[obj.type]).select('*').eq('id', obj.id).single()
      .then(({ data: d }) => { setData(d); setLoading(false) })
  }, [obj?.id, obj?.type])

  if (!obj) return null

  const TIPO_LABEL: Record<PanelObjectType, string> = {
    task: 'Task', cliente: 'Contatto', campagna: 'Campagna',
    progetto: 'Progetto', evento: 'Evento', fattura: 'Fattura'
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={onClose} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: S.surface, borderLeft: `1px solid ${S.border}`, boxShadow: DS.shadow.xl, zIndex: 99, display: 'flex', flexDirection: 'column' }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, background: S.background, padding: '2px 8px', borderRadius: 20 }}>{TIPO_LABEL[obj.type]}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(obj.type === 'task' || obj.type === 'cliente') && !editing && (
              <button onClick={() => setEditing(true)} style={{ padding: '4px 10px', border: `1px solid ${S.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 11, color: S.textSecondary, fontFamily: DS.fonts.ui }}>Modifica</button>
            )}
            <button onClick={onClose} style={{ width: 26, height: 26, border: 'none', background: S.background, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke={S.textSecondary} strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading
          ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento...</span></div>
          : !data
          ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 13, color: S.textMuted }}>Non trovato</span></div>
          : <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 16 }}>
              {obj.type === 'task'    && <TaskPanel data={data} currentUser={currentUser} onNavigate={onNavigate} />}
              {obj.type === 'cliente' && <ClientePanel data={data} onNavigate={onNavigate} />}
              {obj.type === 'fattura' && <FatturaPanel data={data} onNavigate={onNavigate} />}
              {!['task','cliente','fattura'].includes(obj.type) && <GenericPanel type={obj.type} data={data} onNavigate={onNavigate} />}
            </div>
        }

        {/* Footer actions */}
        {data && !loading && (
          <div style={{ padding: '10px 20px', borderTop: `1px solid ${S.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => {
              const text = `${TIPO_LABEL[obj.type]}: ${data.nome || data.titolo || data.testo || data.numero || ''}`
              if (navigator.share) navigator.share({ title: text, text })
              else navigator.clipboard.writeText(text).then(() => alert('Copiato!'))
            }} style={{ flex: 1, padding: '7px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 11, color: S.textSecondary, fontFamily: DS.fonts.ui }}>
              Condividi
            </button>
            {(data.telefono || data.controparte_nome) && (
              <button onClick={() => {
                const phone = (data.telefono || '').replace(/\D/g, '')
                const name = data.nome || data.controparte_nome || ''
                if (phone) window.open(`https://wa.me/${phone}?text=Ciao ${name}`, '_blank')
                else alert('Nessun numero disponibile')
              }} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: 7, background: '#25D366', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: DS.fonts.ui }}>
                WhatsApp
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
