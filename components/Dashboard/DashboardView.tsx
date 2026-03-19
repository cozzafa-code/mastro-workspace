'use client'
import { FC, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDevice } from '@/hooks/useDevice'
import type { UserType } from '@/lib/types'

const T = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  teal: '#0A8A7A',
  tealLight: '#E6F4F2',
  rose: '#BE185D',
  roseLight: '#FDF0F6',
  red: '#DC4444',
  redLight: '#FEF2F2',
  green: '#1A9E73',
  greenLight: '#E8F8F2',
  amber: '#D08008',
  amberLight: '#FEF8E8',
  border: '#E8EDF2',
  text: '#0D1117',
  textSub: '#4B5563',
  textMuted: '#9CA3AF',
  mono: 'JetBrains Mono, monospace',
  ui: 'Inter, sans-serif',
}

interface Props {
  currentUser: UserType
  onNavigate: (tab: string) => void
}

function giornoSettimana() {
  return new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}

function scadenzaLabel(dateStr: string): { label: string; urgent: boolean } {
  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: 'Scaduto', urgent: true }
  if (diff === 0) return { label: 'Oggi', urgent: true }
  if (diff === 1) return { label: 'Domani', urgent: true }
  if (diff <= 3) return { label: `${diff} giorni`, urgent: true }
  return { label: dateStr, urgent: false }
}

export const DashboardView: FC<Props> = ({ currentUser, onNavigate }) => {
  const device = useDevice()
  const isFabio = currentUser === 'fabio'
  const accent = isFabio ? T.teal : T.rose
  const accentLight = isFabio ? T.tealLight : T.roseLight
  const altroUser = isFabio ? 'lidia' : 'fabio'

  const [myTasks, setMyTasks] = useState<any[]>([])
  const [altroTasks, setAltroTasks] = useState<any[]>([])
  const [spese, setSpese] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [mine, altro, sp] = await Promise.all([
        supabase.from('personal_tasks')
          .select('*')
          .eq('creato_da', currentUser)
          .neq('stato', 'fatto')
          .order('scadenza', { ascending: true })
          .limit(20),
        supabase.from('personal_tasks')
          .select('titolo, stato, scadenza')
          .eq('creato_da', altroUser)
          .neq('stato', 'fatto')
          .order('scadenza', { ascending: true })
          .limit(3),
        supabase.from('spese_correnti')
          .select('importo, frequenza')
          .eq('attiva', true),
      ])
      setMyTasks(mine.data || [])
      setAltroTasks(altro.data || [])
      setSpese(sp.data || [])
      setLoading(false)
    }
    load()
  }, [currentUser])

  const burnRate = spese
    .filter(s => s.frequenza === 'mensile')
    .reduce((a, s) => a + (Number(s.importo) || 0), 0)

  // Le 3 priorità: prima le scadute/urgenti, poi le altre
  const priorita = [...myTasks]
    .sort((a, b) => {
      if (!a.scadenza) return 1
      if (!b.scadenza) return -1
      return a.scadenza.localeCompare(b.scadenza)
    })
    .slice(0, 3)

  const altreTask = myTasks.slice(3)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ fontSize: 13, color: T.textMuted, fontFamily: T.ui }}>Caricamento...</div>
    </div>
  )

  return (
    <div style={{ fontFamily: T.ui, paddingBottom: 100 }}>

      {/* Saluto */}
      <div style={{ background: accent, borderRadius: 20, padding: '20px 20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>{giornoSettimana()}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Buongiorno, {isFabio ? 'Fabio' : 'Lidia'} 👋
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
          {myTasks.length > 0
            ? `Hai ${myTasks.length} task aperti`
            : 'Tutto in ordine oggi!'}
        </div>
      </div>

      {/* Le tue 3 priorità */}
      {priorita.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Le tue priorità oggi
          </div>
          {priorita.map((t, i) => {
            const sc = t.scadenza ? scadenzaLabel(t.scadenza) : null
            return (
              <div
                key={t.id}
                onClick={() => onNavigate('personale')}
                style={{
                  background: T.surface,
                  border: `1px solid ${sc?.urgent ? T.red + '40' : T.border}`,
                  borderLeft: `4px solid ${sc?.urgent ? T.red : accent}`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: accentLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: accent, flexShrink: 0,
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{t.titolo}</div>
                  {sc && (
                    <div style={{ fontSize: 11, color: sc.urgent ? T.red : T.textMuted, marginTop: 3, fontWeight: sc.urgent ? 600 : 400 }}>
                      {sc.urgent ? '⚠️ ' : '📅 '}{sc.label}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 18, color: T.textMuted }}>›</div>
              </div>
            )
          })}
          {altreTask.length > 0 && (
            <div
              onClick={() => onNavigate('personale')}
              style={{ fontSize: 13, color: accent, textAlign: 'center', padding: '8px', cursor: 'pointer', fontWeight: 600 }}>
              + {altreTask.length} altri task →
            </div>
          )}
        </div>
      )}

      {myTasks.length === 0 && (
        <div style={{ background: T.greenLight, border: `1px solid ${T.green}30`, borderRadius: 14, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>🎉</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.green }}>Tutto in ordine!</div>
          <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Nessuna priorità urgente per oggi</div>
        </div>
      )}

      {/* Cosa fa l'altro */}
      {altroTasks.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            {isFabio ? 'Lidia sta lavorando a' : 'Fabio sta lavorando a'}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
            {altroTasks.map((t, i) => (
              <div key={t.id} style={{
                padding: '12px 16px',
                borderBottom: i < altroTasks.length - 1 ? `1px solid ${T.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isFabio ? T.rose : T.teal, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{t.titolo}</div>
                {t.scadenza && (
                  <div style={{ fontSize: 11, color: T.textMuted }}>{t.scadenza}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Numeri chiave */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Situazione finanziaria
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div
            onClick={() => onNavigate('spese')}
            style={{ background: burnRate > 0 ? T.redLight : T.surface, border: `1px solid ${burnRate > 0 ? T.red + '30' : T.border}`, borderRadius: 14, padding: '16px', cursor: 'pointer' }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>Burn rate</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.red, fontFamily: T.mono }}>€{burnRate}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>al mese</div>
          </div>
          <div
            onClick={() => onNavigate('mrr')}
            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px', cursor: 'pointer' }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>Target lancio</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: accent, fontFamily: T.mono }}>Giu '26</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>30 clienti</div>
          </div>
        </div>
      </div>

      {/* Azioni rapide */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Azioni rapide
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: '+ Task', icon: '✓', tab: 'personale', color: accent },
            { label: 'Calendario', icon: '📅', tab: 'calendario', color: T.textSub },
            { label: 'CRM', icon: '👥', tab: 'clienti', color: T.textSub },
            { label: 'Finanze', icon: '€', tab: 'spese', color: T.textSub },
          ].map(a => (
            <button
              key={a.tab}
              onClick={() => onNavigate(a.tab)}
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: T.ui,
              }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: a.color }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
