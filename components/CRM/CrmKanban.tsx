// components/CRM/CrmKanban.tsx
'use client'
import { FC } from 'react'
import { DS } from '@/constants/design-system'
import { STAGES } from '@/hooks/useCrmPipeline'
import { usePanel } from '@/context/PanelContext'
import type { Cliente, PipelineStage } from '@/lib/types'

interface Props {
  clienti: Cliente[]
  onSelect: (c: Cliente) => void
  onMoveStage: (id: string, stage: PipelineStage) => void
  onDelete: (id: string) => void
}

const ClienteCard: FC<{ c: Cliente; onSelect: () => void; onDelete: () => void; onMoveStage: (s: PipelineStage) => void }> =
  ({ c, onSelect, onDelete, onMoveStage }) => {
    const stage = STAGES.find(s => s.id === (c.pipeline_stage || 'lead'))!
    const initials = (c.nome || 'N').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    const isOverdue = c.follow_up_date && c.follow_up_date < new Date().toISOString().split('T')[0]

    return (
      <div style={{
        background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
        borderRadius: DS.radius.md, padding: 12, marginBottom: 8,
        cursor: 'pointer', transition: 'box-shadow 0.15s',
      }}
        onClick={onSelect}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = DS.shadow.md)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: stage.bg, color: stage.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: DS.colors.textPrimary }}>{c.nome}</div>
              {c.azienda && <div style={{ fontSize: 11, color: DS.colors.textMuted }}>{c.azienda}</div>}
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete() }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: DS.colors.textMuted, fontSize: 12, padding: '0 2px', flexShrink: 0,
          }}>✕</button>
        </div>

        {c.deal_value ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: DS.colors.green, marginTop: 6 }}>
            €{Number(c.deal_value).toLocaleString('it-IT')}/anno
          </div>
        ) : null}

        {c.progetto_interesse && (
          <div style={{ fontSize: 11, color: DS.colors.textMuted, marginTop: 3 }}>🎯 {c.progetto_interesse}</div>
        )}

        {c.follow_up_date && (
          <div style={{ fontSize: 11, marginTop: 4, color: isOverdue ? DS.colors.red : DS.colors.textMuted }}>
            {isOverdue ? '⚠️' : '📅'} {new Date(c.follow_up_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
          </div>
        )}

        {/* Mini stage mover */}
        <div style={{ display: 'flex', gap: 3, marginTop: 8, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
          {STAGES.filter(s => s.id !== c.pipeline_stage).slice(0, 3).map(s => (
            <button key={s.id} onClick={() => onMoveStage(s.id)} style={{
              fontSize: 9, padding: '2px 6px', borderRadius: 4,
              background: s.bg, color: s.color, border: 'none', cursor: 'pointer', fontWeight: 600,
            }}>→ {s.label}</button>
          ))}
        </div>
      </div>
    )
  }

export const CrmKanban: FC<Props> = ({ clienti, onSelect, onMoveStage, onDelete }) => {
  const { openPanel } = usePanel()
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
      {STAGES.map(stage => {
        const stageClienti = clienti.filter(c => (c.pipeline_stage || 'lead') === stage.id)
        const stageValue = stageClienti.reduce((a, c) => a + (Number(c.deal_value) || 0), 0)
        return (
          <div key={stage.id} style={{ minWidth: 220, maxWidth: 220, flexShrink: 0 }}>
            {/* Column header */}
            <div style={{
              background: stage.bg, borderRadius: DS.radius.md,
              padding: '8px 12px', marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: stage.color }}>{stage.label}</div>
                {stageValue > 0 && <div style={{ fontSize: 10, color: stage.color, opacity: 0.8 }}>€{stageValue.toLocaleString('it-IT')}</div>}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: stage.color,
                background: `${stage.color}20`, borderRadius: 20, padding: '1px 7px',
              }}>{stageClienti.length}</span>
            </div>

            {/* Cards */}
            <div style={{ minHeight: 80 }}>
              {stageClienti.length === 0 ? (
                <div style={{ fontSize: 11, color: DS.colors.textMuted, textAlign: 'center', padding: '20px 0', background: DS.colors.borderLight, borderRadius: DS.radius.sm }}>
                  Vuoto
                </div>
              ) : stageClienti.map(c => (
                <ClienteCard
                  key={c.id} c={c}
                  onSelect={() => { onSelect(c); openPanel({ type: 'cliente', id: c.id, data: c }) }}
                  onDelete={() => onDelete(c.id)}
                  onMoveStage={(s) => onMoveStage(c.id, s)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
