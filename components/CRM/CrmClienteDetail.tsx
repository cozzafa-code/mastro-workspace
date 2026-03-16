// components/CRM/CrmClienteDetail.tsx
'use client'
import { FC } from 'react'
import { DS } from '@/constants/design-system'
import { STAGES } from '@/hooks/useCrmPipeline'
import type { Cliente, CrmAttivita } from '@/lib/types'

const ATTIVITA_ICONS: Record<string, string> = {
  chiamata: '📞', email: '📧', demo: '🖥️', whatsapp: '💬', meeting: '🤝', nota: '📝'
}
const ESITO_COLORS: Record<string, string> = {
  positivo: DS.colors.green, neutro: DS.colors.textSecondary, negativo: DS.colors.red
}

interface Props {
  cliente: Cliente
  attivita: CrmAttivita[]
  showAttivitaForm: boolean
  attivitaForm: Partial<CrmAttivita>
  onClose: () => void
  onEdit: () => void
  onOpenAttivita: () => void
  onCloseAttivita: () => void
  onSetAttivita: (patch: Partial<CrmAttivita>) => void
  onSaveAttivita: () => void
  onMoveStage: (id: string, stage: any) => void
}

const FI: FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; options?: string[] }> =
  ({ label, value, onChange, placeholder, type = 'text', options }) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: DS.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: DS.colors.surface }}>
          <option value="">Seleziona...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, resize: 'vertical', background: DS.colors.surface, boxSizing: 'border-box' }} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: DS.colors.surface, boxSizing: 'border-box' }} />
      )}
    </div>
  )

export const CrmClienteDetail: FC<Props> = ({
  cliente, attivita, showAttivitaForm, attivitaForm,
  onClose, onEdit, onOpenAttivita, onCloseAttivita, onSetAttivita, onSaveAttivita, onMoveStage
}) => {
  const stage = STAGES.find(s => s.id === (cliente.pipeline_stage || 'lead'))!
  const initials = (cliente.nome || 'N').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 420, height: '100vh', background: DS.colors.surface, overflowY: 'auto', boxShadow: DS.shadow.lg, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${DS.colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.colors.textMuted, fontSize: 18 }}>✕</button>
            <button onClick={onEdit} style={{ background: DS.colors.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Modifica</button>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: stage.bg, color: stage.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: DS.colors.textPrimary }}>{cliente.nome}</div>
              {cliente.azienda && <div style={{ fontSize: 12, color: DS.colors.textSecondary }}>{cliente.azienda}</div>}
              {cliente.ruolo && <div style={{ fontSize: 12, color: DS.colors.textMuted }}>{cliente.ruolo}</div>}
            </div>
          </div>

          {/* Stage selector */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {STAGES.map(s => (
              <button key={s.id} onClick={() => onMoveStage(cliente.id, s.id)} style={{
                padding: '4px 10px', borderRadius: 20, border: `2px solid ${s.id === cliente.pipeline_stage ? s.color : 'transparent'}`,
                background: s.id === cliente.pipeline_stage ? s.bg : DS.colors.borderLight,
                color: s.id === cliente.pipeline_stage ? s.color : DS.colors.textMuted,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${DS.colors.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {cliente.deal_value ? <div style={{ background: DS.colors.greenLight, borderRadius: DS.radius.sm, padding: '8px 12px' }}><div style={{ fontSize: 16, fontWeight: 700, color: DS.colors.green }}>€{Number(cliente.deal_value).toLocaleString('it-IT')}</div><div style={{ fontSize: 10, color: DS.colors.green, opacity: 0.8 }}>DEAL VALUE/ANNO</div></div> : null}
            {cliente.progetto_interesse && <div style={{ background: DS.colors.tealLight, borderRadius: DS.radius.sm, padding: '8px 12px' }}><div style={{ fontSize: 12, fontWeight: 600, color: DS.colors.tealDark }}>{cliente.progetto_interesse}</div><div style={{ fontSize: 10, color: DS.colors.tealDark, opacity: 0.8 }}>INTERESSE</div></div>}
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {cliente.email && <div style={{ fontSize: 12, color: DS.colors.textSecondary }}>📧 {cliente.email}</div>}
            {cliente.telefono && <div style={{ fontSize: 12, color: DS.colors.textSecondary }}>📞 {cliente.telefono}</div>}
            {cliente.fonte && <div style={{ fontSize: 12, color: DS.colors.textSecondary }}>🔗 Fonte: {cliente.fonte}</div>}
            {cliente.paese && <div style={{ fontSize: 12, color: DS.colors.textSecondary }}>🌍 {cliente.paese}</div>}
            {cliente.follow_up_date && <div style={{ fontSize: 12, color: DS.colors.red }}>⏰ Follow-up: {new Date(cliente.follow_up_date).toLocaleDateString('it-IT')}</div>}
          </div>
          {cliente.note_pipeline && <div style={{ marginTop: 10, padding: 10, background: DS.colors.amberLight, borderRadius: DS.radius.sm, fontSize: 12, color: DS.colors.textPrimary }}>{cliente.note_pipeline}</div>}
        </div>

        {/* Attività */}
        <div style={{ padding: '16px 20px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DS.colors.textPrimary }}>Attività ({attivita.length})</div>
            <button onClick={onOpenAttivita} style={{ background: DS.colors.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ Aggiungi</button>
          </div>

          {showAttivitaForm && (
            <div style={{ background: DS.colors.background, border: `1px solid ${DS.colors.teal}`, borderRadius: DS.radius.md, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <FI label="Tipo" value={attivitaForm.tipo || ''} onChange={v => onSetAttivita({ tipo: v as any })} options={['chiamata', 'email', 'demo', 'whatsapp', 'meeting', 'nota']} />
                <FI label="Data" value={attivitaForm.data_attivita || ''} onChange={v => onSetAttivita({ data_attivita: v })} type="date" />
              </div>
              <FI label="Titolo *" value={attivitaForm.titolo || ''} onChange={v => onSetAttivita({ titolo: v })} placeholder="es. Demo call effettuata" />
              <FI label="Contenuto" value={attivitaForm.contenuto || ''} onChange={v => onSetAttivita({ contenuto: v })} placeholder="Note..." type="textarea" />
              <FI label="Esito" value={attivitaForm.esito || ''} onChange={v => onSetAttivita({ esito: v as any })} options={['positivo', 'neutro', 'negativo']} />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                <button onClick={onCloseAttivita} style={{ padding: '5px 10px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 12 }}>Annulla</button>
                <button onClick={onSaveAttivita} style={{ padding: '5px 12px', background: DS.colors.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Salva</button>
              </div>
            </div>
          )}

          {attivita.length === 0 ? (
            <div style={{ fontSize: 12, color: DS.colors.textMuted, textAlign: 'center', padding: '24px 0' }}>Nessuna attività registrata</div>
          ) : attivita.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${DS.colors.borderLight}` }}>
              <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{ATTIVITA_ICONS[a.tipo] || '📝'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: DS.colors.textPrimary }}>{a.titolo}</div>
                {a.contenuto && <div style={{ fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 }}>{a.contenuto}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: DS.colors.textMuted }}>{a.data_attivita ? new Date(a.data_attivita).toLocaleDateString('it-IT') : ''}</span>
                  <span style={{ fontSize: 11, color: DS.colors.textMuted }}>· {a.autore}</span>
                  {a.esito && <span style={{ fontSize: 11, fontWeight: 600, color: ESITO_COLORS[a.esito] }}>● {a.esito}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
