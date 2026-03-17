// components/Team/TeamView.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'
import { useDevice } from '@/hooks/useDevice'

const S = DS.colors

interface Membro {
  id: string
  nome: string
  cognome?: string
  username: string
  ruolo: string
  email?: string
  telefono?: string
  colore: string
  avatar_iniziali?: string
  attivo: boolean
  data_inizio?: string
  note?: string
}

const RUOLI = ['Co-Founder & CTO','Co-Founder & COO','Developer','Designer','Marketing','Sales','Operations','Installatore','Altro']

// ── Member card ───────────────────────────────────────────
const MembroCard: FC<{
  m: Membro
  tasks: any[]
  deleghe: any[]
  sessioni: any[]
  onEdit: () => void
  isCurrentUser: boolean
}> = ({ m, tasks, deleghe, sessioni, onEdit, isCurrentUser }) => {
  const aperte = tasks.filter(t => t.stato !== 'completato' && t.stato !== 'Fatto')
  const completate = tasks.filter(t => t.stato === 'completato' || t.stato === 'Fatto')
  const urgenti = aperte.filter(t => Number(t.priorita) <= 2)
  const oggi = new Date().toISOString().split('T')[0]
  const scadute = aperte.filter(t => t.scadenza && t.scadenza < oggi)
  const delegheRicevute = deleghe.filter(d => d.assegnato_a === m.username && d.stato !== 'completata')
  const minSettimana = sessioni.reduce((a: number, s: any) => a + (s.durata_min || 0), 0)
  const oreSettimana = Math.round(minSettimana / 60 * 10) / 10

  return (
    <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${m.colore}20, ${S.surface})`, padding: '18px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: m.colore, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {m.avatar_iniziali || m.nome[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary }}>{m.nome} {m.cognome || ''}</div>
            {isCurrentUser && <span style={{ fontSize: 10, background: m.colore + '20', color: m.colore, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>Tu</span>}
          </div>
          <div style={{ fontSize: 12, color: m.colore, fontWeight: 600, marginTop: 2 }}>{m.ruolo}</div>
          {m.email && <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{m.email}</div>}
        </div>
        <button onClick={onEdit} style={{ padding: '5px 12px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 11, color: S.textSecondary, fontFamily: DS.fonts.ui }}>Modifica</button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '14px 16px', gap: 10, borderBottom: `1px solid ${S.border}` }}>
        {[
          { v: aperte.length, l: 'Task aperte', c: S.blue },
          { v: completate.length, l: 'Completate', c: S.green },
          { v: urgenti.length, l: 'Urgenti', c: urgenti.length > 0 ? S.red : S.textMuted },
          { v: `${oreSettimana}h`, l: 'Ore sett.', c: S.teal },
        ].map((k, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.c, fontFamily: DS.fonts.mono }}>{k.v}</div>
            <div style={{ fontSize: 9, color: S.textMuted, marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Task attive */}
      <div style={{ padding: '14px 16px' }}>
        {scadute.length > 0 && (
          <div style={{ background: S.redLight, border: `1px solid ${S.red}30`, borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.red }}>{scadute.length} task scadute</div>
            {scadute.slice(0, 2).map(t => <div key={t.id} style={{ fontSize: 11, color: S.red, marginTop: 2 }}>· {t.titolo || t.testo}</div>)}
          </div>
        )}

        <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          Sta lavorando a
        </div>
        {aperte.length === 0 ? (
          <div style={{ fontSize: 12, color: S.textMuted, fontStyle: 'italic' }}>Nessuna task attiva</div>
        ) : aperte.slice(0, 4).map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${S.borderLight}` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: Number(t.priorita) <= 2 ? S.red : S.teal, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, color: S.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titolo || t.testo}</div>
            {t.scadenza && <span style={{ fontSize: 10, color: S.textMuted, flexShrink: 0 }}>{t.scadenza}</span>}
          </div>
        ))}
        {aperte.length > 4 && <div style={{ fontSize: 11, color: S.textMuted, marginTop: 6 }}>+{aperte.length - 4} altre task</div>}

        {delegheRicevute.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Deleghe pendenti ({delegheRicevute.length})</div>
            {delegheRicevute.slice(0, 2).map(d => (
              <div key={d.id} style={{ fontSize: 11, color: S.amber, padding: '3px 0' }}>· {d.titolo}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add/Edit member form ──────────────────────────────────
const MembroForm: FC<{ membro?: Membro; onSave: (m: Partial<Membro>) => void; onClose: () => void }> = ({ membro, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<Membro>>(membro || { colore: '#0A8A7A', attivo: true })
  const set = (k: keyof Membro, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: S.surface, borderRadius: 14, padding: 24, width: '100%', maxWidth: 440, boxShadow: DS.shadow.xl }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: S.textPrimary }}>{membro ? 'Modifica membro' : 'Aggiungi membro'}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          {[{k:'nome',l:'Nome *',ph:'Mario'},{k:'cognome',l:'Cognome',ph:'Rossi'}].map(f => (
            <div key={f.k}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>{f.l}</label>
              <input value={(form[f.k as keyof Membro] as string) || ''} onChange={e => set(f.k as keyof Membro, e.target.value)} placeholder={f.ph}
                style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>

        {[{k:'username',l:'Username (unico)',ph:'mario.rossi'},{k:'email',l:'Email',ph:'mario@...'},{k:'telefono',l:'Telefono',ph:'+39...'}].map(f => (
          <div key={f.k} style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>{f.l}</label>
            <input value={(form[f.k as keyof Membro] as string) || ''} onChange={e => set(f.k as keyof Membro, e.target.value)} placeholder={f.ph}
              style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
          </div>
        ))}

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Ruolo</label>
          <select value={form.ruolo || ''} onChange={e => set('ruolo', e.target.value)}
            style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui }}>
            <option value="">Seleziona ruolo</option>
            {RUOLI.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Colore</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#0A8A7A','#BE185D','#2563EB','#6D28D9','#B45309','#059669','#D97706'].map(c => (
              <div key={c} onClick={() => set('colore', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${form.colore === c ? '#0D1117' : 'transparent'}` }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 14, borderTop: `1px solid ${S.borderLight}` }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
          <button onClick={() => onSave({ ...form, avatar_iniziali: `${(form.nome || '').charAt(0)}${(form.cognome || '').charAt(0)}`.toUpperCase() })}
            disabled={!form.nome || !form.username || !form.ruolo}
            style={{ padding: '8px 20px', background: form.nome && form.username && form.ruolo ? S.teal : S.borderLight, color: form.nome && form.username && form.ruolo ? '#fff' : S.textMuted, border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>
            Salva
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────
export const TeamView: FC<{ currentUser: string }> = ({ currentUser }) => {
  const device = useDevice()
  const [membri, setMembri] = useState<Membro[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [deleghe, setDeleghe] = useState<any[]>([])
  const [sessioni, setSessioni] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMembro, setEditingMembro] = useState<Membro | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    const [mRes, tRes, dRes, sRes] = await Promise.all([
      supabase.from('team_membri').select('*').eq('attivo', true).order('created_at'),
      supabase.from('tasks').select('id,titolo,testo,chi,stato,priorita,scadenza,progetto').neq('stato','completato'),
      supabase.from('personal_tasks').select('*').eq('tipo','delega').neq('stato','completata'),
      supabase.from('task_sessioni').select('*,tasks(chi)').gte('inizio', new Date(Date.now() - 7 * 86400000).toISOString()),
    ])
    setMembri(mRes.data || [])
    setTasks(tRes.data || [])
    setDeleghe(dRes.data || [])
    setSessioni(sRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const saveMembro = async (form: Partial<Membro>) => {
    if (editingMembro?.id) {
      const { id, created_at, ...fields } = form as any
      await supabase.from('team_membri').update(fields).eq('id', editingMembro.id)
    } else {
      await supabase.from('team_membri').insert(form)
    }
    setShowForm(false); setEditingMembro(undefined); load()
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento team...</span></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Team</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{membri.length} membri attivi · chi fa cosa · carichi di lavoro</div>
        </div>
        <button onClick={() => { setEditingMembro(undefined); setShowForm(true) }}
          style={{ padding: '8px 16px', background: S.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          + Membro
        </button>
      </div>

      {/* Riepilogo rapido */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.md, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {membri.map(m => {
          const mTasks = tasks.filter(t => t.chi === m.username || t.chi === 'entrambi')
          const mUrgenti = mTasks.filter(t => Number(t.priorita) <= 2)
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.colore, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{m.avatar_iniziali}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: S.textPrimary }}>{m.nome}</div>
                <div style={{ fontSize: 11, color: S.textMuted }}>{mTasks.length} task{mUrgenti.length > 0 && <span style={{ color: S.red, fontWeight: 600 }}> · {mUrgenti.length} urgenti</span>}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cards membri */}
      <div style={{ display: 'grid', gridTemplateColumns: device.isMobile ? '1fr' : `repeat(${Math.min(membri.length, 2)}, 1fr)`, gap: 16 }}>
        {membri.map(m => (
          <MembroCard
            key={m.id} m={m}
            tasks={tasks.filter(t => t.chi === m.username || t.chi === 'entrambi')}
            deleghe={deleghe}
            sessioni={sessioni.filter((s: any) => s.tasks?.chi === m.username)}
            onEdit={() => { setEditingMembro(m); setShowForm(true) }}
            isCurrentUser={m.username === currentUser}
          />
        ))}
      </div>

      {membri.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 14, cursor: 'pointer' }}
          onClick={() => setShowForm(true)}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: S.textSecondary }}>Nessun membro nel team</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>Aggiungi i membri del tuo team per vedere chi fa cosa</div>
        </div>
      )}

      {showForm && <MembroForm membro={editingMembro} onSave={saveMembro} onClose={() => { setShowForm(false); setEditingMembro(undefined) }} />}
    </div>
  )
}
