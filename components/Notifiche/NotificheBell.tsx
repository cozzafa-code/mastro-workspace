// components/Notifiche/NotificheBell.tsx
'use client'
import { FC, useState, useEffect } from 'react'
import { DS } from '@/constants/design-system'
import { useNotifiche } from '@/hooks/useNotifiche'

const S = DS.colors

const TIPO_CFG = {
  reminder:  { bg: S.tealLight,   text: S.teal,    icon: '⏰' },
  scadenza:  { bg: S.redLight,    text: S.red,      icon: '📅' },
  followup:  { bg: S.amberLight,  text: S.amber,    icon: '👤' },
  sistema:   { bg: S.blueLight,   text: S.blue,     icon: 'ℹ' },
}

export const NotificheBell: FC<{ utente: string }> = ({ utente }) => {
  const nf = useNotifiche(utente)
  const [open, setOpen] = useState(false)

  // Controlla scadenze all'avvio
  useEffect(() => {
    if (nf.permesso === 'default') return
    nf.checkScadenze()
  }, [nf.permesso])

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button onClick={() => setOpen(!open)} style={{
        width: 34, height: 34, borderRadius: 8,
        border: `1px solid ${open ? S.teal : S.border}`,
        background: open ? S.tealLight : S.surface,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2a4 4 0 014 4v3l1.5 2H2.5L4 9V6a4 4 0 014-4z" stroke={open ? S.teal : S.textSecondary} strokeWidth="1.5"/>
          <path d="M6.5 13a1.5 1.5 0 003 0" stroke={open ? S.teal : S.textSecondary} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {nf.nonLette > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 16, height: 16, borderRadius: '50%',
            background: S.red, color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>{nf.nonLette > 9 ? '9+' : nf.nonLette}</div>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 42, width: 340,
            background: S.surface, border: `1px solid ${S.border}`,
            borderRadius: DS.radius.lg, boxShadow: DS.shadow.xl, zIndex: 50,
            maxHeight: 480, display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${S.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>
                Notifiche {nf.nonLette > 0 && <span style={{ fontSize: 11, background: S.red, color: '#fff', padding: '1px 6px', borderRadius: 20, marginLeft: 6 }}>{nf.nonLette}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {nf.permesso !== 'granted' && (
                  <button onClick={nf.richiediPermesso} style={{ fontSize: 11, color: S.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DS.fonts.ui }}>
                    Abilita notifiche
                  </button>
                )}
                {nf.nonLette > 0 && (
                  <button onClick={nf.segnaLutteLette} style={{ fontSize: 11, color: S.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DS.fonts.ui }}>
                    Segna tutte lette
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {nf.notifiche.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: S.textMuted }}>
                  Nessuna notifica
                </div>
              ) : nf.notifiche.map(n => {
                const cfg = TIPO_CFG[n.tipo] || TIPO_CFG.sistema
                return (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: `1px solid ${S.borderLight}`,
                    background: n.letta ? 'transparent' : S.tealLight + '40',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <div style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: n.letta ? 400 : 600, color: S.textPrimary }}>{n.titolo}</div>
                      {n.messaggio && <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{n.messaggio}</div>}
                      <div style={{ fontSize: 10, color: S.textMuted, marginTop: 4 }}>
                        {n.created_at ? new Date(n.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {!n.letta && (
                        <button onClick={() => nf.segnaLetta(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.teal, fontSize: 12 }} title="Segna letta">✓</button>
                      )}
                      <button onClick={() => nf.eliminaNotifica(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
