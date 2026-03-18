// components/Tasks/TaskTimerView.tsx
'use client'
import { FC, useState } from 'react'
import { DS } from '@/constants/design-system'
import { useTaskTimer } from '@/hooks/useTaskTimer'
import { useDevice } from '@/hooks/useDevice'
import { usePanel } from '@/context/PanelContext'
import type { Task, UserType } from '@/lib/types'

const S = DS.colors

const PriorityDot: FC<{ p?: string }> = ({ p }) => {
  const colors: Record<string, string> = { '1': S.red, '2': S.amber, '3': S.blue, '4': S.textMuted, '5': S.textDisabled, 'alta': S.red, 'media': S.amber, 'bassa': S.textMuted, 'critica': S.red }
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[p || '3'] || S.blue, flexShrink: 0 }} />
}

const StatoBadge: FC<{ stato?: string }> = ({ stato }) => {
  const cfg: Record<string, { bg: string; text: string }> = {
    aperto:     { bg: S.blueLight,  text: S.blue },
    in_corso:   { bg: S.tealLight,  text: S.teal },
    completato: { bg: S.greenLight, text: S.green },
    fatto:      { bg: S.greenLight, text: S.green },
    bloccato:   { bg: '#FEF2F2',    text: S.red },
  }
  const c = cfg[stato?.toLowerCase() || ''] || { bg: S.borderLight, text: S.textMuted }
  return <span style={{ background: c.bg, color: c.text, padding: '2px 8px', borderRadius: DS.radius.full, fontSize: 10, fontWeight: 600 }}>{stato || 'aperto'}</span>
}

const formatMin = (min: number) => {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const FI: FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; options?: string[] }> =
  ({ label, value, onChange, placeholder, type = 'text', options }) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface }}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface, boxSizing: 'border-box' }} />
      )}
    </div>
  )

// Mobile expandable task card
const MobileTaskCard: FC<{
  t: Task
  isActive: boolean
  elapsed: number
  formatElapsed: (s: number) => string
  onStart: () => void
  onStop: () => void
  onComplete: () => void
  onDelete: () => void
  sessioni: number
}> = ({ t, isActive, elapsed, formatElapsed, onStart, onStop, onComplete, onDelete, sessioni }) => {
  const [expanded, setExpanded] = useState(false)
  const isCompleted = t.stato === 'completato' || t.stato === 'fatto' || t.stato === 'Fatto'

  return (
    <div style={{
      background: S.surface,
      border: `1px solid ${isActive ? S.teal : expanded ? S.tealMid : S.border}`,
      borderRadius: 14,
      marginBottom: 10,
      overflow: 'hidden',
      opacity: isCompleted ? 0.6 : 1,
      boxShadow: isActive ? `0 0 0 3px ${S.teal}20` : expanded ? '0 2px 12px rgba(0,0,0,0.07)' : 'none',
      transition: 'all 0.2s',
    }}>
      {/* Main row — always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
      >
        {/* Checkbox */}
        <div
          onClick={e => { e.stopPropagation(); if (!isCompleted) onComplete() }}
          style={{
            width: 22, height: 22, borderRadius: 6,
            border: `2px solid ${isCompleted ? S.green : S.border}`,
            background: isCompleted ? S.green : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
          }}>
          {isCompleted && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: isCompleted ? S.textMuted : S.textPrimary, textDecoration: isCompleted ? 'line-through' : 'none', lineHeight: 1.3 }}>
            {t.titolo || t.testo}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <PriorityDot p={t.priorita} />
            <StatoBadge stato={t.stato} />
            {t.scadenza && <span style={{ fontSize: 11, color: S.textMuted }}>📅 {t.scadenza}</span>}
            {isActive && <span style={{ fontSize: 12, fontWeight: 700, color: S.teal, fontFamily: DS.fonts.mono }}>{formatElapsed(elapsed)}</span>}
          </div>
        </div>

        {/* Chevron */}
        <div style={{ color: S.textMuted, fontSize: 12, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${S.borderLight}`, padding: '14px 16px', background: '#FAFBFC' }}>
          {/* Details */}
          {t.dettaglio && (
            <div style={{ fontSize: 13, color: S.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>{t.dettaglio}</div>
          )}

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {t.chi && (
              <div style={{ background: S.surface, borderRadius: 8, padding: '8px 10px', border: `1px solid ${S.borderLight}` }}>
                <div style={{ fontSize: 10, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Assegnato</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary, marginTop: 2 }}>{t.chi}</div>
              </div>
            )}
            {t.priorita && (
              <div style={{ background: S.surface, borderRadius: 8, padding: '8px 10px', border: `1px solid ${S.borderLight}` }}>
                <div style={{ fontSize: 10, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Priorità</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary, marginTop: 2 }}>{t.priorita}</div>
              </div>
            )}
            {(t.tempo_totale || 0) > 0 && (
              <div style={{ background: S.surface, borderRadius: 8, padding: '8px 10px', border: `1px solid ${S.borderLight}` }}>
                <div style={{ fontSize: 10, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Tempo</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: S.teal, marginTop: 2 }}>{formatMin(t.tempo_totale || 0)}</div>
              </div>
            )}
            {sessioni > 0 && (
              <div style={{ background: S.surface, borderRadius: 8, padding: '8px 10px', border: `1px solid ${S.borderLight}` }}>
                <div style={{ fontSize: 10, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Sessioni</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary, marginTop: 2 }}>{sessioni}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {!isCompleted && (
              isActive ? (
                <button onClick={e => { e.stopPropagation(); onStop() }}
                  style={{ flex: 1, padding: '10px', background: S.red, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
                  ⏹ Stop
                </button>
              ) : (
                <button onClick={e => { e.stopPropagation(); onStart() }}
                  style={{ flex: 1, padding: '10px', background: S.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
                  ▶ Start
                </button>
              )
            )}
            {!isCompleted && (
              <button onClick={e => { e.stopPropagation(); onComplete() }}
                style={{ flex: 1, padding: '10px', background: S.greenLight, color: S.green, border: `1px solid ${S.green}30`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
                ✓ Fatto
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); onDelete() }}
              style={{ padding: '10px 14px', background: '#FEF2F2', color: S.red, border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>
              🗑
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Desktop task card
const TaskCard: FC<{ t: Task; isActive: boolean; elapsed: number; formatElapsed: (s: number) => string; onStart: () => void; onStop: () => void; onComplete: () => void; onDelete: () => void; sessioni: number; compact?: boolean; onDetail?: () => void }> =
  ({ t, isActive, elapsed, formatElapsed, onStart, onStop, onComplete, onDelete, sessioni, compact, onDetail }) => {
    const isCompleted = t.stato === 'completato' || t.stato === 'Fatto'
    return (
      <div onClick={onDetail} style={{ background: S.surface, border: `1px solid ${isActive ? S.teal : S.border}`, borderRadius: DS.radius.md, padding: compact ? '10px 12px' : '14px 16px', marginBottom: 8, opacity: isCompleted ? 0.55 : 1, boxShadow: isActive ? `0 0 0 3px ${S.teal}20` : 'none', transition: 'border-color 0.15s, box-shadow 0.15s', cursor: onDetail ? 'pointer' : 'default' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ paddingTop: 3, flexShrink: 0 }}><PriorityDot p={t.priorita} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: compact ? 12 : 13, fontWeight: 500, color: isCompleted ? S.textMuted : S.textPrimary, textDecoration: isCompleted ? 'line-through' : 'none' }}>{t.titolo || t.testo}</div>
            {!compact && t.dettaglio && <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{t.dettaglio}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 5, alignItems: 'center', flexWrap: 'wrap' }}>
              <StatoBadge stato={t.stato} />
              {t.chi && <span style={{ fontSize: 10, color: S.textMuted }}>{t.chi}</span>}
              {t.scadenza && <span style={{ fontSize: 10, color: S.textMuted }}>· {t.scadenza}</span>}
              {(t.tempo_totale || 0) > 0 && <span style={{ fontSize: 10, color: S.teal, fontFamily: DS.fonts.mono }}>⏱ {formatMin(t.tempo_totale || 0)}</span>}
              {sessioni > 0 && <span style={{ fontSize: 10, color: S.textMuted }}>{sessioni} sess.</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {isActive && <div style={{ fontSize: 14, fontWeight: 700, color: S.teal, fontFamily: DS.fonts.mono, minWidth: 52 }}>{formatElapsed(elapsed)}</div>}
            {!isCompleted && (isActive ? <button onClick={onStop} style={{ padding: '5px 10px', background: S.red, color: '#fff', border: 'none', borderRadius: DS.radius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>Stop</button> : <button onClick={onStart} style={{ padding: '5px 10px', background: S.tealLight, color: S.teal, border: `1px solid ${S.tealMid}`, borderRadius: DS.radius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>Start</button>)}
            {!isCompleted && <button onClick={onComplete} style={{ padding: '5px 8px', background: S.greenLight, color: S.green, border: 'none', borderRadius: DS.radius.sm, fontSize: 11, cursor: 'pointer' }} title="Completa">✓</button>}
            <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 12, padding: '2px 4px' }}>✕</button>
          </div>
        </div>
      </div>
    )
  }

export const TaskTimerView: FC<{ currentUser: UserType }> = ({ currentUser }) => {
  const tk = useTaskTimer(currentUser)
  const device = useDevice()
  const { openPanel } = usePanel()
  const [kanbanView, setKanbanView] = useState(!device.isMobile)

  const aperti = tk.filteredTasks.filter(t => !t.stato || t.stato === 'aperto' || t.stato === 'Aperto')
  const inCorso = tk.filteredTasks.filter(t => t.stato === 'in_corso' || t.stato === 'In corso')
  const completati = tk.filteredTasks.filter(t => t.stato === 'completato' || t.stato === 'Fatto')

  const f = tk.form as Partial<Task>

  if (tk.loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento...</span></div>

  // MOBILE LAYOUT
  if (device.isMobile) return (
    <div style={{ paddingBottom: 100 }}>
      {/* Timer attivo sticky */}
      {tk.activeTaskId && (
        <div style={{ background: S.teal, borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>IN SESSIONE</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{tk.tasks.find(t => t.id === tk.activeTaskId)?.titolo}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: DS.fonts.mono }}>{tk.formatElapsed(tk.elapsed)}</div>
            <button onClick={() => tk.stopTimer()} style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', marginTop: 4 }}>Stop</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Aperti', value: String(aperti.length + inCorso.length), color: S.blue },
          { label: 'In corso', value: String(inCorso.length), color: S.teal },
          { label: 'Fatti', value: String(completati.length), color: S.green },
        ].map(k => (
          <div key={k.label} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: DS.fonts.mono }}>{k.value}</div>
            <div style={{ fontSize: 10, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary }}>Task ({tk.filteredTasks.length})</div>
        <button onClick={() => tk.openForm()} style={{ width: 36, height: 36, borderRadius: '50%', background: S.teal, color: '#fff', border: 'none', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>

      {/* Task list espandibili */}
      {tk.filteredTasks.map(t => (
        <MobileTaskCard
          key={t.id} t={t}
          isActive={tk.activeTaskId === t.id}
          elapsed={tk.elapsed}
          formatElapsed={tk.formatElapsed}
          onStart={() => tk.startTimer(t.id)}
          onStop={() => tk.stopTimer()}
          onComplete={() => tk.updateStato(t.id, 'completato')}
          onDelete={() => tk.deleteTask(t.id)}
          sessioni={tk.sessioniByTask(t.id).length}
        />
      ))}

      {/* Form modal */}
      {tk.showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200, backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) tk.closeForm() }}>
          <div style={{ background: S.surface, borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxHeight: '85vh', overflowY: 'auto', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            <div style={{ width: 36, height: 4, background: S.border, borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: S.textPrimary }}>{f.id ? 'Modifica task' : 'Nuovo task'}</div>
            <FI label="Titolo *" value={f.titolo || ''} onChange={v => tk.setForm({ titolo: v })} placeholder="Cosa fare" />
            <FI label="Dettaglio" value={f.dettaglio || ''} onChange={v => tk.setForm({ dettaglio: v })} placeholder="Dettaglio opzionale" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Chi" value={f.chi || ''} onChange={v => tk.setForm({ chi: v })} options={['fabio', 'lidia', 'entrambi']} />
              <FI label="Priorità" value={f.priorita || '3'} onChange={v => tk.setForm({ priorita: v })} options={['1 – Urgente', '2 – Alta', '3 – Media', '4 – Bassa']} />
            </div>
            <FI label="Scadenza" value={f.scadenza || ''} onChange={v => tk.setForm({ scadenza: v })} type="date" />
            <FI label="Stato" value={f.stato || 'aperto'} onChange={v => tk.setForm({ stato: v })} options={['aperto', 'in_corso', 'completato']} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={tk.closeForm} style={{ flex: 1, padding: '12px', border: `1px solid ${S.border}`, borderRadius: 12, background: 'none', cursor: 'pointer', fontSize: 14, fontFamily: DS.fonts.ui }}>Annulla</button>
              <button onClick={tk.saveTask} style={{ flex: 1, padding: '12px', background: S.teal, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: DS.fonts.ui }}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // DESKTOP LAYOUT
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Task</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{tk.tasks.length} task · timer sessioni</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setKanbanView(!kanbanView)} style={{ padding: '6px 12px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, background: 'none', fontSize: 12, cursor: 'pointer', color: S.textSecondary, fontFamily: DS.fonts.ui }}>{kanbanView ? 'Lista' : 'Kanban'}</button>
          <button onClick={() => tk.openForm()} style={{ padding: '7px 14px', background: S.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: DS.fonts.ui }}>+ Task</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Oggi', value: formatMin(tk.tempoOggi), color: S.teal },
          { label: 'Settimana', value: formatMin(tk.tempoSettimana), color: S.blue },
          { label: 'Aperti', value: String(aperti.length), color: S.amber },
          { label: 'In corso', value: String(inCorso.length), color: S.teal },
          { label: 'Completati', value: String(completati.length), color: S.green },
        ].map(k => (
          <div key={k.label} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.md, padding: '10px 14px', minWidth: 90 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color, fontFamily: DS.fonts.mono }}>{k.value}</div>
            <div style={{ fontSize: 10, color: S.textMuted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {tk.activeTaskId && (
        <div style={{ background: S.tealLight, border: `1px solid ${S.tealMid}`, borderRadius: DS.radius.md, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: S.teal, fontWeight: 500 }}>Sessione attiva: <strong>{tk.tasks.find(t => t.id === tk.activeTaskId)?.titolo}</strong></div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: S.teal, fontFamily: DS.fonts.mono }}>{tk.formatElapsed(tk.elapsed)}</span>
            <button onClick={() => tk.stopTimer()} style={{ padding: '5px 12px', background: S.red, color: '#fff', border: 'none', borderRadius: DS.radius.sm, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>Stop</button>
          </div>
        </div>
      )}

      {kanbanView ? (
        <div style={{ display: 'grid', gridTemplateColumns: device.isTablet ? '1fr 1fr' : '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'Aperti', tasks: aperti, color: S.blue },
            { label: 'In corso', tasks: inCorso, color: S.teal },
            { label: 'Completati', tasks: completati, color: S.green },
          ].map(col => (
            <div key={col.label} style={{ background: S.background, borderRadius: DS.radius.lg, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>{col.label} · {col.tasks.length}</div>
              {col.tasks.length === 0 ? <div style={{ fontSize: 12, color: S.textMuted, textAlign: 'center', padding: '20px 0' }}>Vuoto</div> : col.tasks.map(t => (
                <TaskCard key={t.id} t={t} isActive={tk.activeTaskId === t.id} elapsed={tk.elapsed} formatElapsed={tk.formatElapsed} onStart={() => tk.startTimer(t.id)} onStop={() => tk.stopTimer()} onComplete={() => tk.updateStato(t.id, 'completato')} onDelete={() => tk.deleteTask(t.id)} sessioni={tk.sessioniByTask(t.id).length} onDetail={() => openPanel({ type: 'task', id: t.id, data: t })} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {tk.filteredTasks.map(t => (
            <TaskCard key={t.id} t={t} isActive={tk.activeTaskId === t.id} elapsed={tk.elapsed} formatElapsed={tk.formatElapsed} onStart={() => tk.startTimer(t.id)} onStop={() => tk.stopTimer()} onComplete={() => tk.updateStato(t.id, 'completato')} onDelete={() => tk.deleteTask(t.id)} sessioni={tk.sessioniByTask(t.id).length} onDetail={() => openPanel({ type: 'task', id: t.id, data: t })} />
          ))}
        </div>
      )}

      {tk.showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) tk.closeForm() }}>
          <div style={{ background: S.surface, borderRadius: DS.radius.xl, padding: 24, width: '100%', maxWidth: 440, boxShadow: DS.shadow.xl }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: S.textPrimary }}>{f.id ? 'Modifica task' : 'Nuovo task'}</div>
            <FI label="Titolo *" value={f.titolo || ''} onChange={v => tk.setForm({ titolo: v })} placeholder="Cosa fare" />
            <FI label="Dettaglio" value={f.dettaglio || ''} onChange={v => tk.setForm({ dettaglio: v })} placeholder="Dettaglio opzionale" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Chi" value={f.chi || ''} onChange={v => tk.setForm({ chi: v })} options={['fabio', 'lidia', 'entrambi']} />
              <FI label="Priorità" value={f.priorita || '3'} onChange={v => tk.setForm({ priorita: v })} options={['1 – Urgente', '2 – Alta', '3 – Media', '4 – Bassa', '5 – Opzionale']} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Scadenza" value={f.scadenza || ''} onChange={v => tk.setForm({ scadenza: v })} type="date" />
              <FI label="Stima (min)" value={String(f.tempo_stimato || '')} onChange={v => tk.setForm({ tempo_stimato: Number(v) })} type="number" placeholder="es. 90" />
            </div>
            <FI label="Stato" value={f.stato || 'aperto'} onChange={v => tk.setForm({ stato: v })} options={['aperto', 'in_corso', 'completato']} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8, paddingTop: 14, borderTop: `1px solid ${S.borderLight}` }}>
              <button onClick={tk.closeForm} style={{ padding: '8px 14px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
              <button onClick={tk.saveTask} style={{ padding: '8px 18px', background: S.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: DS.fonts.ui }}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
