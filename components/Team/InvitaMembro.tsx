// components/Team/InvitaMembro.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

interface Props {
  workspaceId: string
  currentUserId: string
  onClose: () => void
}

const RUOLI = [
  { id: 'admin',  label: 'Admin',   desc: 'Gestisce tutto tranne billing' },
  { id: 'member', label: 'Membro',  desc: 'Accesso completo ai moduli' },
  { id: 'viewer', label: 'Viewer',  desc: 'Solo lettura' },
]

export const InvitaMembro: FC<Props> = ({ workspaceId, currentUserId, onClose }) => {
  const [email, setEmail] = useState('')
  const [ruolo, setRuolo] = useState('member')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [inviti, setInviti] = useState<any[]>([])

  const loadInviti = useCallback(async () => {
    const { data } = await supabase.from('workspace_inviti').select('*').eq('workspace_id', workspaceId).eq('accettato', false).order('created_at', { ascending: false })
    setInviti(data || [])
  }, [workspaceId])

  useEffect(() => { loadInviti() }, [loadInviti])

  const invite = async () => {
    if (!email.trim()) return
    setLoading(true); setError('')
    
    // Check già invitato
    const { data: existing } = await supabase.from('workspace_inviti').select('id').eq('workspace_id', workspaceId).eq('email', email).eq('accettato', false).single()
    if (existing) { setError('Invito già inviato a questa email'); setLoading(false); return }

    const { error } = await supabase.from('workspace_inviti').insert({
      workspace_id: workspaceId,
      email: email.trim().toLowerCase(),
      ruolo,
      invitato_da: currentUserId,
    })

    if (error) { setError(error.message); setLoading(false); return }
    
    setSent(true); setEmail(''); loadInviti()
    setTimeout(() => setSent(false), 3000)
    setLoading(false)
  }

  const revoca = async (id: string) => {
    await supabase.from('workspace_inviti').delete().eq('id', id)
    loadInviti()
  }

  const linkInvito = (token: string) => `${window.location.origin}/invito/${token}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: S.surface, borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: DS.shadow.xl }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary }}>Invita un membro</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 20 }}>✕</button>
        </div>

        {/* Email input */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Email *</label>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') invite() }}
            type="email" placeholder="mario@esempio.it" autoFocus
            style={{ width: '100%', padding: '9px 11px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
        </div>

        {/* Ruolo */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Ruolo</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {RUOLI.map(r => (
              <div key={r.id} onClick={() => setRuolo(r.id)}
                style={{ flex: 1, padding: '10px 12px', border: `1px solid ${ruolo === r.id ? S.teal : S.border}`, borderRadius: 9, background: ruolo === r.id ? S.tealLight : S.background, cursor: 'pointer' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ruolo === r.id ? S.teal : S.textPrimary }}>{r.label}</div>
                <div style={{ fontSize: 10, color: S.textMuted, marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {error && <div style={{ background: S.redLight, border: `1px solid ${S.red}30`, borderRadius: 7, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: S.red }}>{error}</div>}
        {sent && <div style={{ background: S.greenLight, border: `1px solid ${S.green}30`, borderRadius: 7, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: S.green }}>✓ Invito creato — copia il link e invialo</div>}

        <button onClick={invite} disabled={loading || !email.trim()}
          style={{ width: '100%', padding: '10px', background: email.trim() ? S.teal : S.borderLight, color: email.trim() ? '#fff' : S.textMuted, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: email.trim() ? 'pointer' : 'default', fontFamily: DS.fonts.ui, marginBottom: 20 }}>
          {loading ? 'Creazione invito...' : 'Crea invito'}
        </button>

        {/* Inviti pendenti */}
        {inviti.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Inviti in attesa ({inviti.length})</div>
            {inviti.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: S.background, borderRadius: 8, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary }}>{inv.email}</div>
                  <div style={{ fontSize: 10, color: S.textMuted }}>{inv.ruolo} · scade {new Date(inv.scadenza).toLocaleDateString('it-IT')}</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(linkInvito(inv.token)) }}
                  style={{ padding: '4px 10px', border: `1px solid ${S.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 11, color: S.teal, fontFamily: DS.fonts.ui }}>
                  Copia link
                </button>
                <button onClick={() => revoca(inv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 13 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
