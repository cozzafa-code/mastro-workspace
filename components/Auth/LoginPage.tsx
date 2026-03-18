// components/Auth/LoginPage.tsx
'use client'
import { FC, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

const S = {
  teal: '#0A8A7A', tealLight: '#EDF7F6',
  bg: '#F7F8FA', surface: '#FFFFFF',
  border: '#E5E7EB', textPrimary: '#0D1117',
  textSecondary: '#4B5563', textMuted: '#9CA3AF',
  red: '#DC4444', redLight: '#FEE2E2',
  green: '#0F7B5A', greenLight: '#D1FAE5',
}

const Input: FC<{ label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }> =
  ({ label, type = 'text', value, onChange, placeholder, autoFocus }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'system-ui, sans-serif', outline: 'none', boxSizing: 'border-box', background: S.surface }} />
    </div>
  )

export const LoginPage: FC = () => {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!email || !password) { setError('Email e password obbligatorie'); return }
    setLoading(true); setError(''); setSuccess('')

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error === 'Invalid login credentials' ? 'Email o password errati' : error)
    } else {
      if (!nome) { setError('Nome obbligatorio'); setLoading(false); return }
      const { error } = await signUp(email, password, nome, cognome)
      if (error) setError(error)
      else setSuccess('Account creato! Controlla la tua email per confermare.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: S.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17L10 3l7 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: S.textPrimary, letterSpacing: '-0.5px' }}>MASTRO OS</div>
          <div style={{ fontSize: 11, color: S.textMuted, marginTop: -2 }}>Workspace intelligente</div>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: S.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: `1px solid ${S.border}` }}>

        {/* Tab switch */}
        <div style={{ display: 'flex', background: S.bg, borderRadius: 10, padding: 3, marginBottom: 24 }}>
          {[['login','Accedi'],['register','Registrati']].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m as any); setError(''); setSuccess('') }}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: mode === m ? S.surface : 'none', color: mode === m ? S.textPrimary : S.textMuted, fontSize: 13, fontWeight: mode === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {l}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Nome *" value={nome} onChange={setNome} placeholder="Mario" autoFocus />
            <Input label="Cognome" value={cognome} onChange={setCognome} placeholder="Rossi" />
          </div>
        )}

        <Input label="Email *" type="email" value={email} onChange={setEmail} placeholder="mario@esempio.it" autoFocus={mode === 'login'} />
        <Input label="Password *" type="password" value={password} onChange={setPassword} placeholder="Minimo 8 caratteri" />

        {error && (
          <div style={{ background: S.redLight, border: `1px solid ${S.red}30`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: S.red }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: S.greenLight, border: `1px solid ${S.green}30`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: S.green }}>
            {success}
          </div>
        )}

        <button onClick={handle} disabled={loading}
          style={{ width: '100%', padding: '12px', background: loading ? S.textMuted : S.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
          {loading ? 'Attendere...' : mode === 'login' ? 'Accedi al workspace' : 'Crea workspace'}
        </button>

        {mode === 'register' && (
          <div style={{ fontSize: 11, color: S.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            Creando un account accetti i termini di servizio.<br/>
            14 giorni di prova gratuita, nessuna carta richiesta.
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: S.textMuted, marginTop: 24, textAlign: 'center' }}>
        © 2026 MASTRO OS · Workspace intelligente per team ambiziosi
      </div>
    </div>
  )
}
