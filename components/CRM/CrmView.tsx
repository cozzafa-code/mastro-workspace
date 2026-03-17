// components/CRM/CrmView.tsx
'use client'
import { FC } from 'react'
import { DS } from '@/constants/design-system'
import { useCrmPipeline, STAGES, FONTI, PROGETTI_INTERESSE } from '@/hooks/useCrmPipeline'
import { CrmKanban } from './CrmKanban'
import { CrmClienteDetail } from './CrmClienteDetail'
import { usePanel } from '@/context/PanelContext'
import type { UserType, Cliente } from '@/lib/types'

interface Props { currentUser: UserType }

const FI: FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; options?: string[] }> =
  ({ label, value, onChange, placeholder, type = 'text', options }) => (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: DS.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: DS.colors.surface }}>
          <option value="">Seleziona...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: DS.colors.surface, boxSizing: 'border-box' }} />
      )}
    </div>
  )

export const CrmView: FC<Props> = ({ currentUser }) => {
  const crm = useCrmPipeline(currentUser)
  const { openPanel } = usePanel()

  if (crm.loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ fontSize: 13, color: DS.colors.textMuted }}>Caricamento CRM...</div>
    </div>
  )

  const f = crm.form as Partial<Cliente>

  return (
    <div>
      {/* Header + KPI */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.fonts.ui }}>CRM Pipeline</div>
          <div style={{ fontSize: 12, color: DS.colors.textMuted, marginTop: 2 }}>{crm.clienti.length} contatti totali</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => crm.setView('kanban')} style={{ padding: '6px 12px', borderRadius: DS.radius.sm, border: `1px solid ${DS.colors.border}`, background: crm.view === 'kanban' ? DS.colors.teal : 'none', color: crm.view === 'kanban' ? '#fff' : DS.colors.textSecondary, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Kanban</button>
          <button onClick={() => crm.setView('lista')} style={{ padding: '6px 12px', borderRadius: DS.radius.sm, border: `1px solid ${DS.colors.border}`, background: crm.view === 'lista' ? DS.colors.teal : 'none', color: crm.view === 'lista' ? '#fff' : DS.colors.textSecondary, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Lista</button>
          <button onClick={() => crm.openForm()} style={{ padding: '6px 14px', background: DS.colors.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Contatto</button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Pipeline totale', value: `€${crm.totalPipelineValue.toLocaleString('it-IT')}`, color: DS.colors.blue },
          { label: 'Vinto', value: `€${crm.wonValue.toLocaleString('it-IT')}`, color: DS.colors.green },
          { label: 'Follow-up scaduti', value: String(crm.followUpToday.length), color: crm.followUpToday.length > 0 ? DS.colors.red : DS.colors.textSecondary },
          { label: 'In trattativa', value: String(crm.clienti.filter(c => ['demo', 'proposta'].includes(c.pipeline_stage || '')).length), color: DS.colors.amber },
        ].map(s => (
          <div key={s.label} style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, padding: '10px 16px', minWidth: 120 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: DS.fonts.mono }}>{s.value}</div>
            <div style={{ fontSize: 11, color: DS.colors.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban o Lista */}
      {crm.view === 'kanban' ? (
        <CrmKanban
          clienti={crm.clienti}
          onSelect={crm.selectCliente}
          onMoveStage={crm.moveStage}
          onDelete={crm.deleteCliente}
        />
      ) : (
        <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: DS.colors.background }}>
                {['Nome', 'Azienda', 'Stage', 'Deal Value', 'Interesse', 'Follow-up', 'Fonte'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${DS.colors.border}`, fontSize: 11, fontWeight: 700, color: DS.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crm.clienti.map(c => {
                const stage = STAGES.find(s => s.id === (c.pipeline_stage || 'lead'))!
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${DS.colors.borderLight}`, cursor: 'pointer' }}
                    onClick={() => { crm.selectCliente(c); openPanel({ type: 'cliente', id: c.id, data: c }) }}
                    onMouseEnter={e => (e.currentTarget.style.background = DS.colors.background)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: DS.colors.textPrimary }}>{c.nome}</td>
                    <td style={{ padding: '10px 14px', color: DS.colors.textSecondary }}>{c.azienda || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: stage.bg, color: stage.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{stage.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: DS.colors.green, fontWeight: 600 }}>{c.deal_value ? `€${Number(c.deal_value).toLocaleString('it-IT')}` : '—'}</td>
                    <td style={{ padding: '10px 14px', color: DS.colors.textSecondary }}>{c.progetto_interesse || '—'}</td>
                    <td style={{ padding: '10px 14px', color: c.follow_up_date && c.follow_up_date < new Date().toISOString().split('T')[0] ? DS.colors.red : DS.colors.textSecondary }}>
                      {c.follow_up_date ? new Date(c.follow_up_date).toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: DS.colors.textMuted }}>{c.fonte || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {crm.clienti.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: DS.colors.textMuted, fontSize: 13 }}>Nessun contatto ancora</div>
          )}
        </div>
      )}

      {/* Form modal */}
      {crm.showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) crm.closeForm() }}>
          <div style={{ background: DS.colors.surface, borderRadius: DS.radius.xl, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: DS.shadow.lg }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: DS.colors.textPrimary }}>{f.id ? 'Modifica contatto' : 'Nuovo contatto'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Nome *" value={f.nome || ''} onChange={v => crm.setForm({ nome: v })} placeholder="Nome cognome" />
              <FI label="Azienda" value={f.azienda || ''} onChange={v => crm.setForm({ azienda: v })} placeholder="Nome azienda" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Email" value={f.email || ''} onChange={v => crm.setForm({ email: v })} placeholder="email@..." type="email" />
              <FI label="Telefono" value={f.telefono || ''} onChange={v => crm.setForm({ telefono: v })} placeholder="+39..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Stage" value={f.pipeline_stage || 'lead'} onChange={v => crm.setForm({ pipeline_stage: v as any })} options={STAGES.map(s => s.id)} />
              <FI label="Deal value €/anno" value={String(f.deal_value || '')} onChange={v => crm.setForm({ deal_value: Number(v) })} type="number" placeholder="0" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Prodotto interesse" value={f.progetto_interesse || ''} onChange={v => crm.setForm({ progetto_interesse: v })} options={PROGETTI_INTERESSE} />
              <FI label="Fonte" value={f.fonte || ''} onChange={v => crm.setForm({ fonte: v })} options={FONTI} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Follow-up date" value={f.follow_up_date || ''} onChange={v => crm.setForm({ follow_up_date: v })} type="date" />
              <FI label="Paese" value={f.paese || 'IT'} onChange={v => crm.setForm({ paese: v })} options={['IT', 'PL', 'FR', 'DE', 'ES', 'PT', 'DK']} />
            </div>
            <FI label="Note pipeline" value={f.note_pipeline || ''} onChange={v => crm.setForm({ note_pipeline: v })} placeholder="Note commerciali..." />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={crm.closeForm} style={{ padding: '8px 14px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 13 }}>Annulla</button>
              <button onClick={crm.saveCliente} style={{ padding: '8px 18px', background: DS.colors.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {crm.selectedCliente && (
        <CrmClienteDetail
          cliente={crm.selectedCliente}
          attivita={crm.attivitaByCliente(crm.selectedCliente.id)}
          showAttivitaForm={crm.showAttivitaForm}
          attivitaForm={crm.attivitaForm}
          onClose={() => crm.selectCliente(null)}
          onEdit={() => { crm.openForm(crm.selectedCliente!); crm.selectCliente(null) }}
          onOpenAttivita={crm.openAttivitaForm}
          onCloseAttivita={crm.closeAttivitaForm}
          onSetAttivita={crm.setAttivitaForm}
          onSaveAttivita={crm.saveAttivita}
          onMoveStage={crm.moveStage}
        />
      )}
    </div>
  )
}
