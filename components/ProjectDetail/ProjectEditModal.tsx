// components/ProjectDetail/ProjectEditModal.tsx
'use client'
import { FC } from 'react'
import { DS } from '@/constants/design-system'
import type { Progetto } from '@/lib/types'

interface Props {
  projectForm: Partial<Progetto>
  onSetForm: (patch: Partial<Progetto>) => void
  onSave: () => void
  onClose: () => void
}

const FI: FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; options?: string[] }> =
  ({ label, value, onChange, placeholder, type = 'text', options }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: DS.colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{
          width: '100%', padding: '8px 10px', border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: DS.colors.surface,
        }}>
          <option value="">Seleziona...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} style={{
          width: '100%', padding: '8px 10px', border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, resize: 'vertical',
          background: DS.colors.surface, boxSizing: 'border-box',
        }} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
          width: '100%', padding: '8px 10px', border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui,
          background: DS.colors.surface, boxSizing: 'border-box',
        }} />
      )}
    </div>
  )

export const ProjectEditModal: FC<Props> = ({ projectForm, onSetForm, onSave, onClose }) => {
  const f = projectForm
  const s = (key: keyof Progetto) => (v: string) => onSetForm({ [key]: v })
  const n = (key: keyof Progetto) => (v: string) => onSetForm({ [key]: Number(v) || 0 } as any)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: DS.colors.surface, borderRadius: DS.radius.xl,
        padding: 24, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: DS.shadow.lg,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: DS.colors.textPrimary, fontFamily: DS.fonts.ui }}>
          Modifica progetto
        </div>

        <FI label="Nome *" value={f.nome || ''} onChange={s('nome')} placeholder="Nome progetto" />
        <FI label="Descrizione" value={f.descrizione || ''} onChange={s('descrizione')} placeholder="Breve descrizione" type="textarea" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FI label="Stato" value={f.stato || ''} onChange={s('stato')}
            options={['attivo', 'pausa', 'completato', 'pianificato', 'archiviato']} />
          <FI label="Fase" value={f.fase || ''} onChange={s('fase')}
            options={['idea', 'sviluppo', 'beta', 'lancio', 'crescita', 'pausa', 'archiviato']} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <FI label="MRR €/mo" value={String(f.mrr || '')} onChange={n('mrr')} type="number" placeholder="0" />
          <FI label="Target MRR" value={String(f.obiettivo_mrr || '')} onChange={n('obiettivo_mrr')} type="number" placeholder="0" />
          <FI label="Prezzo €/mo" value={String(f.prezzo || '')} onChange={n('prezzo')} type="number" placeholder="0" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FI label="Clienti beta" value={String(f.beta_clienti || '')} onChange={n('beta_clienti')} type="number" placeholder="0" />
          <FI label="Priorità (1=max)" value={String(f.priorita || '')} onChange={n('priorita')} options={['1','2','3','4','5']} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FI label="Data inizio" value={f.data_inizio || ''} onChange={s('data_inizio')} type="date" />
          <FI label="Data lancio" value={f.data_lancio || ''} onChange={s('data_lancio')} type="date" />
        </div>

        <FI label="Responsabile" value={f.responsabile || ''} onChange={s('responsabile')} options={['fabio', 'lidia', 'entrambi']} />
        <FI label="Repo GitHub" value={f.repo || ''} onChange={s('repo')} placeholder="cozzafa-code/nome-repo" />
        <FI label="URL app" value={f.url || ''} onChange={s('url')} placeholder="https://..." />
        <FI label="Stack" value={f.stack || ''} onChange={s('stack')} placeholder="Next.js + Supabase + Vercel" />
        <FI label="Note private" value={f.note_private || ''} onChange={s('note_private')} placeholder="Note solo per voi" type="textarea" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: DS.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Colore</label>
          <input type="color" value={f.colore || '#14B8A6'} onChange={e => onSetForm({ colore: e.target.value })}
            style={{ border: `1px solid ${DS.colors.border}`, borderRadius: 4, width: 36, height: 28, cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: DS.colors.textMuted }}>{f.colore || '#14B8A6'}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 13,
          }}>Annulla</button>
          <button onClick={onSave} style={{
            padding: '8px 18px', background: DS.colors.teal, color: '#fff',
            border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}>Salva modifiche</button>
        </div>
      </div>
    </div>
  )
}
