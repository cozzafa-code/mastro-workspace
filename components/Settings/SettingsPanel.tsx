// components/Settings/SettingsPanel.tsx
// Pannello impostazioni premium — notifiche push, Google Calendar, preferenze
'use client'
import { FC, useState, useEffect } from 'react'
import { DS } from '@/constants/design-system'
import { usePushNotifications } from '@/hooks/usePushNotifications'

const S = DS.colors

interface Props {
  currentUser: string
  onClose: () => void
}

const Toggle: FC<{ on: boolean; onChange: (v: boolean) => void; label: string; desc?: string; icon?: string; disabled?: boolean }> =
  ({ on, onChange, label, desc, icon, disabled }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${S.borderLight}` }}>
    {icon && <div style={{ width: 36, height: 36, borderRadius: 10, background: on ? S.tealLight : S.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, transition: 'background 0.2s' }}>{icon}</div>}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{desc}</div>}
    </div>
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: on ? S.teal : S.borderLight,
        position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.5 : 1
      }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: on ? 23 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
      }} />
    </button>
  </div>
)

const Section: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ fontSize: 10, fontWeight: 800, color: S.teal, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>{title}</div>
    {children}
  </div>
)

export const SettingsPanel: FC<Props> = ({ currentUser, onClose }) => {
  const push = usePushNotifications(currentUser)
  const [gcalConnected, setGcalConnected] = useState(false)
  const [gcalLoading, setGcalLoading] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Preferenze locali
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`mastro_prefs_${currentUser}`) || '{}')
    } catch { return {} }
  })

  const setPref = (k: string, v: any) => {
    const updated = { ...prefs, [k]: v }
    setPrefs(updated)
    localStorage.setItem(`mastro_prefs_${currentUser}`, JSON.stringify(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Check Google Calendar
  useEffect(() => {
    fetch(`/api/calendar-sync?utente=${currentUser}`)
      .then(r => r.json())
      .then(d => setGcalConnected(d.connected === true))
      .catch(() => {})
  }, [currentUser])

  const connectGcal = () => {
    setGcalLoading(true)
    // Redirect a Google OAuth
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirect_uri: `${window.location.origin}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
      state: currentUser,
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  const activatePush = async () => {
    setPushLoading(true)
    await push.richiediPermesso()
    setPushLoading(false)
  }

  const syncGcal = async () => {
    setGcalLoading(true)
    try {
      const res = await fetch(`/api/calendar-sync?utente=${currentUser}`)
      const data = await res.json()
      if (data.synced > 0) alert(`✅ ${data.synced} eventi sincronizzati da Google Calendar`)
      else alert('Nessun nuovo evento da sincronizzare')
    } catch { alert('Errore sincronizzazione') }
    setGcalLoading(false)
  }

  const accent = currentUser === 'fabio' ? S.teal : '#BE185D'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: S.surface, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: S.border }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 20px' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: S.textPrimary, letterSpacing: '-0.4px' }}>Impostazioni</div>
            <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{currentUser === 'fabio' ? 'Fabio' : 'Lidia'} · workspace personale</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {saved && <span style={{ fontSize: 11, color: S.green, fontWeight: 600 }}>✓ Salvato</span>}
            <button onClick={onClose} style={{ background: S.background, border: `1px solid ${S.border}`, borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: S.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '0 24px 32px' }}>

          {/* Notifiche */}
          <Section title="Notifiche">
            <div style={{ background: push.isGranted ? S.greenLight : S.background, border: `1px solid ${push.isGranted ? S.green + '40' : S.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{push.isGranted ? '🔔' : '🔕'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>
                    {push.isGranted ? 'Notifiche browser attive' : 'Notifiche browser disattivate'}
                  </div>
                  <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>
                    {push.isGranted ? 'Ricevi notifiche per deleghe, scadenze e messaggi' : 'Attiva per non perdere deleghe e scadenze'}
                  </div>
                </div>
                {!push.isGranted && push.isSupported && (
                  <button onClick={activatePush} disabled={pushLoading}
                    style={{ padding: '7px 16px', background: accent, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: DS.fonts.ui, whiteSpace: 'nowrap' }}>
                    {pushLoading ? '...' : 'Attiva'}
                  </button>
                )}
                {!push.isSupported && <span style={{ fontSize: 11, color: S.textMuted }}>Non supportato</span>}
              </div>
            </div>

            <Toggle on={prefs.notifica_deleghe !== false} onChange={v => setPref('notifica_deleghe', v)} icon="📋" label="Nuove deleghe" desc="Notifica quando ricevi una delega" />
            <Toggle on={prefs.notifica_scadenze !== false} onChange={v => setPref('notifica_scadenze', v)} icon="⏰" label="Scadenze imminenti" desc="Avviso 24h prima della scadenza" />
            <Toggle on={prefs.notifica_commenti !== false} onChange={v => setPref('notifica_commenti', v)} icon="💬" label="Commenti task" desc="Notifica quando l'altro commenta" />
            <Toggle on={prefs.notifica_bacheca !== false} onChange={v => setPref('notifica_bacheca', v)} icon="📌" label="Bacheca condivisa" desc="Notifica per nuovi elementi in bacheca" />
          </Section>

          {/* Google Calendar */}
          <Section title="Integrazioni">
            <div style={{ background: S.background, border: `1px solid ${S.border}`, borderRadius: 12, padding: '16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="#4285F4"/>
                    <rect x="3" y="3" width="18" height="6" fill="#1A73E8"/>
                    <path d="M8 13h8M8 16h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <rect x="7" y="1" width="2" height="4" rx="1" fill="#4285F4"/>
                    <rect x="15" y="1" width="2" height="4" rx="1" fill="#4285F4"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>Google Calendar</div>
                  <div style={{ fontSize: 11, color: gcalConnected ? S.green : S.textMuted, marginTop: 2 }}>
                    {gcalConnected ? '✓ Connesso — eventi sincronizzati' : 'Non connesso — collega per sincronizzare eventi'}
                  </div>
                </div>
                {gcalConnected ? (
                  <button onClick={syncGcal} disabled={gcalLoading}
                    style={{ padding: '7px 14px', border: `1px solid ${S.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12, color: S.textSecondary, fontFamily: DS.fonts.ui }}>
                    {gcalLoading ? '...' : '↻ Sincronizza'}
                  </button>
                ) : (
                  <button onClick={connectGcal} disabled={gcalLoading}
                    style={{ padding: '7px 14px', background: '#4285F4', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: DS.fonts.ui }}>
                    {gcalLoading ? '...' : 'Connetti'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: S.background, border: `1px solid ${S.border}`, borderRadius: 12, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>WhatsApp</div>
                  <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>Notifiche via messaggio WhatsApp</div>
                </div>
                <span style={{ fontSize: 11, background: S.tealLight, color: S.teal, padding: '3px 9px', borderRadius: 20, fontWeight: 700 }}>Configurato</span>
              </div>
            </div>
          </Section>

          {/* Preferenze UI */}
          <Section title="Esperienza">
            <Toggle on={prefs.compact_mode === true} onChange={v => setPref('compact_mode', v)} icon="📐" label="Modalità compatta" desc="Riduce gli spazi per vedere più contenuto" />
            <Toggle on={prefs.show_weekends !== false} onChange={v => setPref('show_weekends', v)} icon="📅" label="Mostra weekend nel calendario" desc="Visualizza sabato e domenica" />
            <Toggle on={prefs.auto_archive !== false} onChange={v => setPref('auto_archive', v)} icon="📦" label="Archivia task completate" desc="Nasconde le task completate dopo 7 giorni" />
            <Toggle on={prefs.sound_effects === true} onChange={v => setPref('sound_effects', v)} icon="🔉" label="Suoni UI" desc="Piccoli suoni per completamento task e notifiche" />
          </Section>

          {/* Logout */}
          <button onClick={async () => { const { supabase } = await import('@/lib/supabase'); await supabase.auth.signOut(); onClose() }}
            style={{ width: '100%', padding: '12px', border: `1px solid ${S.red}40`, borderRadius: 10, background: S.redLight, color: S.red, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>
            → Esci dal workspace
          </button>
        </div>
      </div>
    </div>
  )
}
