// components/ProjectDetail/ProjectHeader.tsx
'use client'
import { FC } from 'react'
import { DS, STATE_COLORS } from '@/constants/design-system'
import type { Progetto } from '@/lib/types'

interface Props {
  progetto: Progetto
  logsCount: number
  tasksCount: number
  campagneCount: number
  onBack: () => void
  onEdit: () => void
}

const Badge: FC<{ text: string }> = ({ text }) => {
  const key = text?.toLowerCase() || ''
  const cfg = STATE_COLORS[key] || { bg: DS.colors.borderLight, text: DS.colors.textSecondary }
  return (
    <span style={{
      background: cfg.bg, color: cfg.text,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      fontFamily: DS.fonts.ui,
    }}>
      {text}
    </span>
  )
}

const KPI: FC<{ value: string; label: string; color?: string }> = ({ value, label, color }) => (
  <div style={{
    background: DS.colors.background,
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius.md,
    padding: '12px 16px',
    textAlign: 'center',
    minWidth: 100,
  }}>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || DS.colors.textPrimary, fontFamily: DS.fonts.mono }}>
      {value}
    </div>
    <div style={{ fontSize: 11, color: DS.colors.textMuted, marginTop: 3, fontFamily: DS.fonts.ui, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </div>
  </div>
)

export const ProjectHeader: FC<Props> = ({ progetto, logsCount, tasksCount, campagneCount, onBack, onEdit }) => {
  const mrrPct = progetto.obiettivo_mrr && progetto.obiettivo_mrr > 0
    ? Math.round(((progetto.mrr || 0) / progetto.obiettivo_mrr) * 100)
    : null

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Back */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: DS.colors.textMuted, fontSize: 13, fontFamily: DS.fonts.ui,
        padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4,
      }}>
        ← Tutti i progetti
      </button>

      {/* Main card */}
      <div style={{
        background: DS.colors.surface,
        border: `1px solid ${DS.colors.border}`,
        borderRadius: DS.radius.xl,
        padding: '20px 24px',
        boxShadow: DS.shadow.sm,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {progetto.colore && (
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: progetto.colore, flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.fonts.ui }}>
                {progetto.nome}
              </div>
              {progetto.descrizione && (
                <div style={{ fontSize: 13, color: DS.colors.textSecondary, marginTop: 2 }}>{progetto.descrizione}</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge text={progetto.stato} />
                {progetto.fase && progetto.fase !== progetto.stato && <Badge text={progetto.fase} />}
                {progetto.responsabile && (
                  <span style={{ fontSize: 12, color: DS.colors.textMuted }}>👤 {progetto.responsabile}</span>
                )}
                {progetto.data_lancio && (
                  <span style={{ fontSize: 12, color: DS.colors.textMuted }}>🚀 Lancio: {progetto.data_lancio}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onEdit} style={{
            background: DS.colors.teal, color: '#fff', border: 'none',
            borderRadius: DS.radius.sm, padding: '7px 14px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui,
            flexShrink: 0,
          }}>
            Modifica
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <KPI value={`€${progetto.mrr || 0}/mo`} label="MRR" color={DS.colors.green} />
          {progetto.obiettivo_mrr ? (
            <KPI value={`€${progetto.obiettivo_mrr}/mo`} label="Target MRR" color={DS.colors.textSecondary} />
          ) : null}
          {mrrPct !== null && (
            <KPI value={`${mrrPct}%`} label="vs Target" color={mrrPct >= 100 ? DS.colors.green : DS.colors.amber} />
          )}
          <KPI value={String(progetto.beta_clienti || 0)} label="Clienti" color={DS.colors.blue} />
          <KPI value={`€${progetto.prezzo || 0}/mo`} label="Prezzo" color={DS.colors.purple} />
          <KPI value={String(logsCount)} label="Log" />
          <KPI value={String(tasksCount)} label="Task" />
          <KPI value={String(campagneCount)} label="Campagne" />
        </div>

        {/* Links */}
        {(progetto.repo || progetto.url || progetto.stack) && (
          <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${DS.colors.borderLight}` }}>
            {progetto.repo && <a href={`https://github.com/${progetto.repo}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: DS.colors.textMuted, textDecoration: 'none' }}>📦 {progetto.repo}</a>}
            {progetto.url && <a href={progetto.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: DS.colors.blue, textDecoration: 'none' }}>🔗 {progetto.url}</a>}
            {progetto.stack && <span style={{ fontSize: 12, color: DS.colors.textMuted }}>⚙️ {progetto.stack}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
