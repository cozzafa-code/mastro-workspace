// components/Onboarding/OnboardingFlow.tsx
'use client'
import { FC, useState } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

interface Props {
  currentUser: string
  onComplete: () => void
}

const STEPS = [
  {
    id: 'benvenuto',
    icon: '👋',
    title: 'Benvenuto in MASTRO OS',
    subtitle: 'Il tuo workspace intelligente per team ambiziosi',
    desc: 'In 2 minuti configuri tutto. Partiamo.',
  },
  {
    id: 'profilo',
    icon: '👤',
    title: 'Il tuo profilo',
    subtitle: 'Come vuoi essere chiamato?',
    desc: 'Il tuo nome apparirà nelle task, deleghe e notifiche.',
  },
  {
    id: 'primo_progetto',
    icon: '🚀',
    title: 'Il tuo primo progetto',
    subtitle: 'Su cosa stai lavorando?',
    desc: 'Aggiungi il progetto principale su cui stai lavorando adesso.',
  },
  {
    id: 'prima_task',
    icon: '✓',
    title: 'La tua prima task',
    subtitle: 'Cosa devi fare oggi?',
    desc: 'Aggiungi una cosa da fare. Anche una sola è un ottimo inizio.',
  },
  {
    id: 'invita',
    icon: '👥',
    title: 'Invita il team',
    subtitle: 'Lavori con qualcuno?',
    desc: 'Puoi invitare collaboratori ora o farlo dopo dal modulo Team.',
  },
]

export const OnboardingFlow: FC<Props> = ({ currentUser, onComplete }) => {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step data
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [progetto, setProgetto] = useState({ nome: '', descrizione: '', prezzo: '' })
  const [task, setTask] = useState({ titolo: '', scadenza: '' })
  const [emailInvito, setEmailInvito] = useState('')
  const [invitato, setInvitato] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const accent = currentUser === 'fabio' ? S.teal : '#BE185D'

  const goNext = async () => {
    setSaving(true)

    if (step === 1 && nome.trim()) {
      // Salva profilo — aggiorna workspace_members se esiste, altrimenti salva in local
      await supabase.from('workspace_members').update({ nome, cognome }).eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
    }

    if (step === 2 && progetto.nome.trim()) {
      await supabase.from('progetti').insert({
        nome: progetto.nome,
        descrizione: progetto.descrizione || null,
        prezzo: Number(progetto.prezzo) || 0,
        stato: 'attivo',
        chi: currentUser,
        mrr: 0,
        beta_clienti: 0,
      })
    }

    if (step === 3 && task.titolo.trim()) {
      await supabase.from('tasks').insert({
        titolo: task.titolo,
        chi: currentUser,
        stato: 'aperto',
        priorita: '3',
        scadenza: task.scadenza || null,
      })
    }

    setSaving(false)

    if (isLast) {
      // Salva flag onboarding completato
      localStorage.setItem(`mastro_onboarding_${currentUser}`, 'done')
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  const skip = () => {
    if (isLast) {
      localStorage.setItem(`mastro_onboarding_${currentUser}`, 'done')
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,31,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: S.surface, borderRadius: 20, padding: 40, width: '100%', maxWidth: 500, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? accent : S.borderLight, transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 16 }}>{current.icon}</div>

        {/* Text */}
        <div style={{ fontSize: 22, fontWeight: 800, color: S.textPrimary, marginBottom: 6, letterSpacing: '-0.5px' }}>{current.title}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: accent, marginBottom: 8 }}>{current.subtitle}</div>
        <div style={{ fontSize: 13, color: S.textSecondary, marginBottom: 28, lineHeight: 1.6 }}>{current.desc}</div>

        {/* Step content */}
        {step === 0 && (
          <div style={{ background: S.background, borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: S.textSecondary, lineHeight: 1.8 }}>
              ✅ Dashboard intelligente con le tue priorità<br/>
              ✅ Task, deleghe e bacheca condivisa<br/>
              ✅ Preventivi con firma digitale<br/>
              ✅ Calendario e Gantt integrati<br/>
              ✅ AI assistant che conosce il tuo lavoro
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {[{ label: 'Nome *', val: nome, set: setNome, ph: 'Mario' }, { label: 'Cognome', val: cognome, set: setCognome, ph: 'Rossi' }].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} autoFocus={f.label === 'Nome *'}
                  style={{ width: '100%', padding: '9px 11px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 14, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ marginBottom: 24 }}>
            {[
              { label: 'Nome progetto *', val: progetto.nome, key: 'nome', ph: 'es. MASTRO OS, App XYZ...' },
              { label: 'Descrizione', val: progetto.descrizione, key: 'descrizione', ph: 'Breve descrizione (opzionale)' },
              { label: 'Prezzo mensile (€)', val: progetto.prezzo, key: 'prezzo', ph: 'es. 99' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{f.label}</label>
                <input value={f.val} onChange={e => setProgetto(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} autoFocus={f.key === 'nome'}
                  style={{ width: '100%', padding: '9px 11px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ marginBottom: 24 }}>
            {[
              { label: 'Cosa devi fare? *', val: task.titolo, key: 'titolo', ph: 'es. Chiamare il cliente Rossi', type: 'text' },
              { label: 'Scadenza', val: task.scadenza, key: 'scadenza', ph: '', type: 'date' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} value={f.val} onChange={e => setTask(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} autoFocus={f.key === 'titolo'}
                  style={{ width: '100%', padding: '9px 11px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div style={{ marginBottom: 24 }}>
            {!invitato ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={emailInvito} onChange={e => setEmailInvito(e.target.value)} type="email" placeholder="email@collaboratore.it"
                  style={{ flex: 1, padding: '9px 11px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui }} />
                <button onClick={async () => {
                  if (!emailInvito.trim()) return
                  // Salva invito
                  await supabase.from('workspace_inviti').insert({ email: emailInvito.trim(), ruolo: 'member', workspace_id: 'cozzafa' })
                  setInvitato(true)
                }} style={{ padding: '9px 16px', background: accent, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui, whiteSpace: 'nowrap' }}>
                  Invita
                </button>
              </div>
            ) : (
              <div style={{ background: S.greenLight, borderRadius: 10, padding: '14px 16px', fontSize: 13, color: S.green, fontWeight: 600 }}>
                ✓ Invito inviato a {emailInvito}
              </div>
            )}
            <div style={{ fontSize: 12, color: S.textMuted, marginTop: 10 }}>Puoi invitare altri collaboratori in qualsiasi momento dal modulo Team.</div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 16px', border: `1px solid ${S.border}`, borderRadius: 10, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui, color: S.textSecondary }}>
              ← Indietro
            </button>
          )}
          <button onClick={skip} style={{ padding: '10px 16px', border: `1px solid ${S.border}`, borderRadius: 10, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui, color: S.textMuted }}>
            {isLast ? 'Salta' : 'Salta →'}
          </button>
          <button onClick={goNext} disabled={saving}
            style={{ flex: 1, padding: '12px', background: saving ? S.borderLight : accent, color: saving ? S.textMuted : '#fff', border: 'none', borderRadius: 10, cursor: saving ? 'default' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: DS.fonts.ui }}>
            {saving ? 'Salvataggio...' : isLast ? '🚀 Entra nel workspace' : 'Continua →'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: S.textMuted }}>
          Step {step + 1} di {STEPS.length}
        </div>
      </div>
    </div>
  )
}
