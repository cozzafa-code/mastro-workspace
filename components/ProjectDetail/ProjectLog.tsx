// components/ProjectDetail/ProjectLog.tsx
'use client'
import { FC } from 'react'
import { DS, LOG_TYPE_CONFIG } from '@/constants/design-system'
import type { ProjectLog } from '@/lib/types'

interface Props {
  logs: ProjectLog[]
  showForm: boolean
  logForm: Partial<ProjectLog>
  onOpenForm: () => void
  onCloseForm: () => void
  onSetForm: (patch: Partial<ProjectLog>) => void
  onSave: () => void
  onDelete: (id: string) => void
}

const LogCard: FC<{ log: ProjectLog; onDelete: (id: string) => void }> = ({ log, onDelete }) => {
  const cfg = LOG_TYPE_CONFIG[log.tipo] || LOG_TYPE_CONFIG.nota
  const date = log.data_evento
    ? new Date(log.data_evento).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
    : log.created_at
    ? new Date(log.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
    : ''

  return (
    <div style={{
      display: 'flex', gap: 12, paddingBottom: 16, marginBottom: 16,
      borderBottom: `1px solid ${DS.colors.borderLight}`,
    }}>
      {/* Timeline dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>
          {cfg.icon}
        </div>
        <div style={{ width: 1, flex: 1, background: DS.colors.borderLight, marginTop: 4, minHeight: 8 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: cfg.color,
                textTransform: 'uppercase', letterSpacing: 0.5,
                fontFamily: DS.fonts.ui,
              }}>
                {cfg.label}
              </span>
              {log.priorita === 'alta' && (
                <span style={{ fontSize: 10, background: DS.colors.redLight, color: DS.colors.red, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                  ALTA
                </span>
              )}
              <span style={{ fontSize: 11, color: DS.colors.textMuted }}>{date}</span>
              <span style={{ fontSize: 11, color: DS.colors.textMuted }}>· {log.autore}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.fonts.ui }}>
              {log.titolo}
            </div>
            {log.contenuto && (
              <div style={{ fontSize: 13, color: DS.colors.textSecondary, marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {log.contenuto}
              </div>
            )}
          </div>
          <button onClick={() => onDelete(log.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: DS.colors.textMuted, fontSize: 13, padding: '2px 4px', flexShrink: 0,
          }}>✕</button>
        </div>
      </div>
    </div>
  )
}

const FI: FC<{ label: string; id: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; options?: string[] }> =
  ({ label, id, value, onChange, placeholder, type = 'text', options }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: DS.colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={{
          width: '100%', padding: '8px 10px', border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: DS.colors.surface,
        }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{
          width: '100%', padding: '8px 10px', border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, resize: 'vertical',
          background: DS.colors.surface, boxSizing: 'border-box',
        }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
          width: '100%', padding: '8px 10px', border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui,
          background: DS.colors.surface, boxSizing: 'border-box',
        }} />
      )}
    </div>
  )

export const ProjectLogPanel: FC<Props> = ({ logs, showForm, logForm, onOpenForm, onCloseForm, onSetForm, onSave, onDelete }) => {
  const grouped = logs.reduce((acc, log) => {
    const month = log.created_at
      ? new Date(log.created_at).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
      : 'Senza data'
    if (!acc[month]) acc[month] = []
    acc[month].push(log)
    return acc
  }, {} as Record<string, ProjectLog[]>)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.fonts.ui }}>
            Log & Storico
          </div>
          <div style={{ fontSize: 12, color: DS.colors.textMuted, marginTop: 1 }}>
            {logs.length} eventi · decisioni, note, milestone, problemi
          </div>
        </div>
        <button onClick={onOpenForm} style={{
          background: DS.colors.teal, color: '#fff', border: 'none',
          borderRadius: DS.radius.sm, padding: '7px 14px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui,
        }}>
          + Aggiungi
        </button>
      </div>

      {/* Form inline */}
      {showForm && (
        <div style={{
          background: DS.colors.surface, border: `1px solid ${DS.colors.teal}`,
          borderRadius: DS.radius.lg, padding: 20, marginBottom: 20,
          boxShadow: DS.shadow.sm,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: DS.colors.textPrimary }}>Nuovo evento</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <FI label="Tipo" id="tipo" value={logForm.tipo || 'nota'} onChange={v => onSetForm({ tipo: v as any })}
              options={['decisione', 'nota', 'milestone', 'problema', 'meeting']} />
            <FI label="Priorità" id="priorita" value={logForm.priorita || 'normale'} onChange={v => onSetForm({ priorita: v as any })}
              options={['alta', 'normale', 'bassa']} />
            <FI label="Data evento" id="data_evento" value={logForm.data_evento || ''} onChange={v => onSetForm({ data_evento: v })} type="date" />
          </div>
          <FI label="Titolo *" id="titolo" value={logForm.titolo || ''} onChange={v => onSetForm({ titolo: v })} placeholder="es. Decisione: usare Stripe per i pagamenti" />
          <FI label="Contenuto / Dettaglio" id="contenuto" value={logForm.contenuto || ''} onChange={v => onSetForm({ contenuto: v })} placeholder="Motivo, contesto, riferimenti..." type="textarea" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onCloseForm} style={{ padding: '7px 14px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 13 }}>
              Annulla
            </button>
            <button onClick={onSave} style={{ padding: '7px 16px', background: DS.colors.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Salva
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: DS.colors.textMuted, fontSize: 13, background: DS.colors.surface, borderRadius: DS.radius.lg, border: `1px solid ${DS.colors.border}` }}>
          Nessun evento registrato.<br />
          <span style={{ fontSize: 12 }}>Aggiungi decisioni, milestone, problemi o meeting.</span>
        </div>
      ) : (
        Object.entries(grouped).map(([month, mlogs]) => (
          <div key={month} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: DS.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${DS.colors.borderLight}` }}>
              {month}
            </div>
            <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: '16px 20px' }}>
              {mlogs.map((log, i) => (
                <div key={log.id} style={{ marginBottom: i < mlogs.length - 1 ? 0 : 0 }}>
                  <LogCard log={log} onDelete={onDelete} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
