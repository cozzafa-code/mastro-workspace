// components/Dashboard/DashboardView.tsx
'use client'
import { FC, useState, useEffect } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'
import { useDevice } from '@/hooks/useDevice'
import { usePanel } from '@/context/PanelContext'

const S = DS.colors

// ── Mini components ───────────────────────────────────────
const KpiCard: FC<{ value: string; label: string; sub?: string; color?: string; bg?: string; onClick?: () => void; alert?: boolean; trend?: string }> =
  ({ value, label, sub, color, bg, onClick, alert, trend }) => (
  <div onClick={onClick} style={{ background: bg || S.surface, border: `1px solid ${alert ? S.red + '50' : S.border}`, borderRadius: DS.radius.md, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', flex: 1, minWidth: 120 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || S.textPrimary, fontFamily: DS.fonts.mono, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      {trend && <span style={{ fontSize: 11, color: trend.startsWith('+') ? S.green : S.red, fontWeight: 600 }}>{trend}</span>}
    </div>
    <div style={{ fontSize: 11, fontWeight: 600, color: S.textPrimary, marginTop: 6 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: S.textMuted, marginTop: 2 }}>{sub}</div>}
  </div>
)

const SectionHeader: FC<{ title: string; count?: number; action?: { label: string; onClick: () => void }; color?: string }> =
  ({ title, count, action, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: color || S.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{title}</span>
      {count !== undefined && <span style={{ fontSize: 10, background: S.borderLight, color: S.textMuted, padding: '0 5px', borderRadius: 20, fontWeight: 600 }}>{count}</span>}
    </div>
    {action && <button onClick={action.onClick} style={{ fontSize: 11, color: S.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DS.fonts.ui, fontWeight: 600 }}>{action.label} →</button>}
  </div>
)

const TaskRow: FC<{ t: any; user?: string; onOpen: () => void }> = ({ t, user, onOpen }) => {
  const oggi = new Date().toISOString().split('T')[0]
  const scaduta = t.scadenza && t.scadenza < oggi
  const isLidia = t.chi === 'lidia'
  return (
    <div onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: S.surface, border: `1px solid ${scaduta ? S.red + '40' : S.border}`, borderRadius: 8, marginBottom: 6, cursor: 'pointer', borderLeft: `3px solid ${isLidia ? '#BE185D' : S.teal}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: S.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titolo || t.testo}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          {t.chi && <span style={{ fontSize: 10, color: isLidia ? '#BE185D' : S.teal, fontWeight: 600 }}>{t.chi}</span>}
          {t.scadenza && <span style={{ fontSize: 10, color: scaduta ? S.red : S.textMuted }}>📅 {t.scadenza}</span>}
          {t.progetto && <span style={{ fontSize: 10, color: S.textMuted }}>{t.progetto}</span>}
        </div>
      </div>
      {Number(t.priorita) <= 2 && <span style={{ fontSize: 9, background: S.redLight, color: S.red, padding: '1px 5px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>URG</span>}
    </div>
  )
}

// ── Mini Gantt ────────────────────────────────────────────
const MiniGantt: FC<{ progetti: any[] }> = ({ progetti }) => {
  const today = new Date()
  const start = new Date(today); start.setDate(1); start.setMonth(start.getMonth() - 1)
  const end = new Date(today); end.setMonth(end.getMonth() + 3)
  const total = (end.getTime() - start.getTime()) / 86400000
  const todayPct = (today.getTime() - start.getTime()) / 86400000 / total * 100

  return (
    <div style={{ position: 'relative' }}>
      {/* Today line */}
      <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, borderLeft: `2px solid ${S.red}`, zIndex: 2, opacity: 0.5 }} />
      {progetti.slice(0, 5).map((p: any) => {
        const ini = p.data_inizio ? new Date(p.data_inizio) : new Date(p.created_at || today)
        const fine = p.data_lancio ? new Date(p.data_lancio) : new Date(ini.getTime() + 90 * 86400000)
        const left = Math.max(0, (ini.getTime() - start.getTime()) / 86400000 / total * 100)
        const width = Math.max(2, Math.min(100 - left, (fine.getTime() - ini.getTime()) / 86400000 / total * 100))
        return (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 100, fontSize: 10, color: S.textSecondary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.nome}</div>
            <div style={{ flex: 1, position: 'relative', height: 14, background: S.background, borderRadius: 4 }}>
              <div style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, height: '100%', background: p.colore || S.teal, borderRadius: 4, opacity: p.stato === 'attivo' ? 1 : 0.4 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Weather / Meteo finanziario ───────────────────────────
const MeteoFinanziario: FC<{ ricavi: number; costi: number; runway: number; ivaDebito: number }> = ({ ricavi, costi, runway, ivaDebito }) => {
  const utile = ricavi - costi
  const meteo = runway < 3 ? { icon: '⛈', label: 'Critico', color: S.red, bg: S.redLight } :
                runway < 6 ? { icon: '🌤', label: 'Attenzione', color: S.amber, bg: S.amberLight } :
                utile > 0  ? { icon: '☀️', label: 'Positivo', color: S.green, bg: S.greenLight } :
                             { icon: '🌥', label: 'Neutro', color: S.textSecondary, bg: S.borderLight }
  return (
    <div style={{ background: meteo.bg, border: `1px solid ${meteo.color}30`, borderRadius: DS.radius.md, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 32, flexShrink: 0 }}>{meteo.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: meteo.color }}>{meteo.label} — {new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: S.textSecondary }}>Ricavi: <strong style={{ color: S.green }}>€{ricavi.toLocaleString('it-IT')}</strong></span>
          <span style={{ fontSize: 11, color: S.textSecondary }}>Costi: <strong style={{ color: S.red }}>€{costi.toLocaleString('it-IT')}</strong></span>
          <span style={{ fontSize: 11, color: S.textSecondary }}>Utile: <strong style={{ color: utile >= 0 ? S.green : S.red }}>€{utile.toLocaleString('it-IT')}</strong></span>
          <span style={{ fontSize: 11, color: S.textSecondary }}>Runway: <strong style={{ color: meteo.color }}>{runway} mesi</strong></span>
          {ivaDebito > 0 && <span style={{ fontSize: 11, color: S.textSecondary }}>IVA da versare: <strong style={{ color: S.purple }}>€{ivaDebito.toLocaleString('it-IT')}</strong></span>}
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────
export const DashboardView: FC<{ data: any; user: string; onNavigate: (tab: string, extra?: any) => void }> = ({ data, user, onNavigate }) => {
  const device = useDevice()
  const { openPanel } = usePanel()
  const [fatture, setFatture] = useState<any[]>([])
  const [scadenzario, setScadenzario] = useState<any[]>([])
  const [personalTasks, setPersonalTasks] = useState<any[]>([])
  const [fattureMese, setFattureMese] = useState({ ricavi: 0, costi: 0, ivaDebito: 0 })
  const today = new Date().toISOString().split('T')[0]
  const mese = today.substring(0, 7)

  useEffect(() => {
    async function loadExtra() {
      const [fRes, sRes, ptRes] = await Promise.all([
        supabase.from('fatture').select('id,numero,tipo,totale,stato,data_emissione,controparte_nome,data_scadenza').order('created_at', { ascending: false }).limit(20),
        supabase.from('scadenzario').select('*').eq('stato', 'aperto').order('data_scadenza').limit(10),
        supabase.from('personal_tasks').select('*').or(`assegnato_a.eq.${user},creato_da.eq.${user}`).neq('stato', 'completato').order('created_at', { ascending: false }).limit(20),
      ])
      setFatture(fRes.data || [])
      setScadenzario(sRes.data || [])
      setPersonalTasks(ptRes.data || [])
      const f = fRes.data || []
      const ricavi = f.filter((x: any) => x.tipo === 'attiva' && (x.data_emissione || '').startsWith(mese)).reduce((a: number, x: any) => a + Number(x.totale || 0), 0)
      const costi = f.filter((x: any) => x.tipo === 'passiva' && (x.data_emissione || '').startsWith(mese)).reduce((a: number, x: any) => a + Number(x.totale || 0), 0)
      const ivaDebito = f.filter((x: any) => x.tipo === 'attiva' && (x.data_emissione || '').startsWith(mese)).reduce((a: number, x: any) => a + Number(x.iva_importo || 0), 0)
      setFattureMese({ ricavi, costi, ivaDebito })
    }
    loadExtra()
  }, [user, mese])

  // ── Derived data ──────────────────────────────────────
  const tasks = data.tasks || []
  const progetti = data.progetti || []
  const clienti = data.clienti || []
  const spese = data.spese_correnti || []

  const taskAperti = tasks.filter((t: any) => t.stato !== 'completato' && t.stato !== 'Fatto')
  const taskOggi = taskAperti.filter((t: any) => t.scadenza === today)
  const taskScadute = taskAperti.filter((t: any) => t.scadenza && t.scadenza < today)
  const taskUrgenti = taskAperti.filter((t: any) => Number(t.priorita) <= 2 || t.priorita === 'Alta')
  const taskSettimana = taskAperti.filter((t: any) => {
    if (!t.scadenza) return false
    const d = new Date(t.scadenza)
    const now = new Date()
    const diff = (d.getTime() - now.getTime()) / 86400000
    return diff >= 0 && diff <= 7
  })

  const totMRR = progetti.reduce((a: number, p: any) => a + (Number(p.mrr) || 0), 0)
  const totClienti = progetti.reduce((a: number, p: any) => a + (Number(p.beta_clienti) || 0), 0)
  const targetOdense = 34 * 248
  const runwayMesi = (() => {
    const cashRes = spese.find((s: any) => s.nome?.toLowerCase().includes('cassa') || s.categoria?.toLowerCase().includes('cassa'))
    const cassa = cashRes ? Number(cashRes.importo) : 0
    const burnMensile = spese.filter((s: any) => s.tipo !== 'entrata' && s.frequenza === 'mensile').reduce((a: number, s: any) => a + Number(s.importo || 0), 0)
    return burnMensile > 0 ? Math.round(cassa / burnMensile) : 99
  })()
  const burnRate = spese.filter((s: any) => s.tipo !== 'entrata').reduce((a: number, s: any) => a + Number(s.importo || 0), 0)

  const daIncassare = fatture.filter((f: any) => f.tipo === 'attiva' && !['pagata','annullata'].includes(f.stato)).reduce((a: number, f: any) => a + Number(f.totale || 0), 0)
  const daPagare = fatture.filter((f: any) => f.tipo === 'passiva' && !['pagata','annullata'].includes(f.stato)).reduce((a: number, f: any) => a + Number(f.totale || 0), 0)
  const scaduteNonPagate = scadenzario.filter((s: any) => s.data_scadenza < today)

  const followUpScaduti = clienti.filter((c: any) => c.follow_up_date && c.follow_up_date < today)
  const delegateAme = personalTasks.filter((t: any) => t.assegnato_a === user && t.creato_da !== user)

  const isMob = device.isMobile
  const col2 = { display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1fr 1fr', gap: 16 } as any
  const col3 = { display: 'grid', gridTemplateColumns: isMob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 } as any

  // ── Briefing data ──────────────────────────────────────
  const NOME = (u: string) => u === 'fabio' ? 'Fabio' : 'Lidia'
  const ACCENT = (u: string) => u === 'fabio' ? '#0A8A7A' : '#BE185D'
  const altro = user === 'fabio' ? 'lidia' : 'fabio'

  // Top 5 cose da fare oggi per l'utente attivo — priorità + scadenza oggi + deleghe urgenti
  const daFareOggi = [
    ...taskOggi.filter((t: any) => t.chi === user || t.chi === 'entrambi'),
    ...taskUrgenti.filter((t: any) => (t.chi === user || t.chi === 'entrambi') && !taskOggi.find((x: any) => x.id === t.id)),
    ...taskScadute.filter((t: any) => (t.chi === user || t.chi === 'entrambi') && !taskOggi.find((x: any) => x.id === t.id) && !taskUrgenti.find((x: any) => x.id === t.id)),
    ...delegateAme.filter((t: any) => t.stato !== 'completato'),
  ].slice(0, 5)

  // Cosa sta facendo l'altro
  const taskAltro = taskAperti.filter((t: any) => t.chi === altro).slice(0, 3)
  const delegateAltro = personalTasks.filter((t: any) => t.assegnato_a === altro && t.creato_da === user && t.stato !== 'completato').slice(0, 2)

  // Ora del giorno
  const ora = new Date().getHours()
  const saluto = ora < 12 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'
  const giornoSettimana = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── CENTRO COMANDI ── */}
      <div style={{ background: '#0B1F2A', borderRadius: 16, overflow: 'hidden' }}>
        {/* Header saluto */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: isMob ? 16 : 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>
                {saluto}, {NOME(user)} 👋
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'capitalize' }}>{giornoSettimana}</div>
            </div>
            {/* Alert badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {taskScadute.length > 0 && (
                <div onClick={() => onNavigate('task')} style={{ background: '#DC4444', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  ⚠️ {taskScadute.length} scadute
                </div>
              )}
              {scaduteNonPagate.length > 0 && (
                <div onClick={() => onNavigate('contabilita')} style={{ background: '#B45309', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  💳 {scaduteNonPagate.length} pagamenti
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cosa fare ADESSO */}
        <div style={{ padding: '14px 22px' }}>
          {daFareOggi.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(15,123,90,0.2)', borderRadius: 10, border: '1px solid rgba(15,123,90,0.3)' }}>
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6EE7B7' }}>Tutto in ordine!</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Nessuna priorità urgente per oggi</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                🎯 Fai questo adesso
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {daFareOggi.slice(0, 3).map((t: any, i: number) => {
                  const scaduta = t.scadenza && t.scadenza < today
                  const isDelega = t.creato_da && t.creato_da !== user
                  return (
                    <div key={t.id || i} onClick={() => openPanel({ type: 'task', id: t.id, data: t })}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: i === 0 ? `${ACCENT(user)}22` : 'rgba(255,255,255,0.04)', borderRadius: 9, cursor: 'pointer', border: `1px solid ${i === 0 ? ACCENT(user) + '40' : 'transparent'}`, transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = i === 0 ? `${ACCENT(user)}22` : 'rgba(255,255,255,0.04)'}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? ACCENT(user) : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titolo || t.testo}</div>
                        <div style={{ fontSize: 10, marginTop: 1, color: scaduta ? '#FCA5A5' : isDelega ? '#C4B5FD' : 'rgba(255,255,255,0.35)' }}>
                          {scaduta ? '⚠️ Scaduta' : isDelega ? `📋 da ${NOME(t.creato_da)}` : t.scadenza ? `📅 ${t.scadenza}` : ''}
                        </div>
                      </div>
                      {Number(t.priorita) <= 2 && <span style={{ fontSize: 8, background: '#DC4444', color: '#fff', padding: '2px 6px', borderRadius: 20, fontWeight: 800, flexShrink: 0, letterSpacing: 0.5 }}>URG</span>}
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>→</span>
                    </div>
                  )
                })}
              </div>
              {daFareOggi.length > 3 && (
                <div onClick={() => onNavigate('task')} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, cursor: 'pointer', textAlign: 'center', padding: '6px' }}>
                  +{daFareOggi.length - 3} altre → Tutti i task
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cosa sta facendo l'altro + azioni rapide */}
        <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Cosa fa l'altro */}
          <div style={{ padding: '14px 22px', borderRight: isMob ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT(altro), textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              • {NOME(altro)} sta lavorando a
            </div>
            {taskAltro.length === 0 && delegateAltro.length === 0 ? (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Nessuna task attiva</div>
            ) : [...taskAltro, ...delegateAltro].slice(0, 3).map((t: any, i: number) => (
              <div key={t.id || i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT(altro), flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titolo || t.testo}</span>
              </div>
            ))}
          </div>

          {/* Azioni rapide */}
          <div style={{ padding: '14px 22px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Azioni rapide
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { icon: '✓', label: '+ Task', color: '#2563EB', action: () => onNavigate('task') },
                { icon: '→', label: 'Delega', color: ACCENT(altro), action: () => onNavigate('deleghe') },
                { icon: '💡', label: '+ Idea', color: '#7C3AED', action: () => onNavigate('lab_idee') },
                { icon: '📋', label: 'Preventivo', color: '#B45309', action: () => onNavigate('preventivi') },
              ].map(a => (
                <button key={a.label} onClick={a.action}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', fontFamily: DS.fonts.ui, color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}
                  onMouseEnter={e => { e.currentTarget.style.background = a.color + '30'; e.currentTarget.style.borderColor = a.color + '60' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 13 }}>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── METEO FINANZIARIO ── */}
      <MeteoFinanziario ricavi={fattureMese.ricavi} costi={fattureMese.costi} runway={runwayMesi} ivaDebito={fattureMese.ivaDebito} />

      {/* ── KPI PRINCIPALI ── */}
      <div>
        <SectionHeader title="KPI Business" />
        <div style={col3}>
          <KpiCard value={`€${totMRR.toLocaleString('it-IT')}`} label="MRR Totale" sub={`${Math.round(totMRR / targetOdense * 100)}% target Odense`} color={S.green} onClick={() => onNavigate('mrr')} />
          <KpiCard value={String(totClienti)} label="Clienti totali" sub={`${targetOdense / 248 - totClienti > 0 ? targetOdense / 248 - totClienti + ' al target' : 'target raggiunto'}`} color={S.blue} onClick={() => onNavigate('mrr')} />
          <KpiCard value={`-€${burnRate.toLocaleString('it-IT')}`} label="Burn rate/mese" sub="spese correnti" color={S.red} onClick={() => onNavigate('spese')} />
          <KpiCard value={runwayMesi > 99 ? '∞' : `${runwayMesi}m`} label="Runway" sub="mesi di cassa" color={runwayMesi < 3 ? S.red : runwayMesi < 6 ? S.amber : S.green} alert={runwayMesi < 3} />
        </div>
      </div>

      {/* ── ALERT ROW ── */}
      {(taskScadute.length > 0 || scaduteNonPagate.length > 0 || followUpScaduti.length > 0) && (
        <div style={{ background: S.redLight, border: `1px solid ${S.red}30`, borderRadius: DS.radius.md, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.red, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>⚠ Alert</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {taskScadute.length > 0 && <span onClick={() => onNavigate('task')} style={{ fontSize: 12, color: S.red, cursor: 'pointer', fontWeight: 600 }}>{taskScadute.length} task scadute</span>}
            {scaduteNonPagate.length > 0 && <span onClick={() => onNavigate('contabilita')} style={{ fontSize: 12, color: S.red, cursor: 'pointer', fontWeight: 600 }}>{scaduteNonPagate.length} scadenze non pagate</span>}
            {followUpScaduti.length > 0 && <span onClick={() => onNavigate('clienti')} style={{ fontSize: 12, color: S.amber, cursor: 'pointer', fontWeight: 600 }}>{followUpScaduti.length} follow-up CRM scaduti</span>}
          </div>
        </div>
      )}

      {/* ── TASK OGGI + SETTIMANA ── */}
      <div style={col2}>
        <div>
          <SectionHeader title={`Oggi · ${new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' })}`} count={taskOggi.length} action={{ label: 'Vedi tutte', onClick: () => onNavigate('task') }} color={S.teal} />
          {taskOggi.length === 0
            ? <div style={{ fontSize: 12, color: S.textMuted, padding: '14px', background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, textAlign: 'center' }}>Nessuna scadenza oggi ✓</div>
            : taskOggi.map((t: any) => <TaskRow key={t.id} t={t} onOpen={() => openPanel({ type: 'task', id: t.id, data: t })} />)
          }
          {taskUrgenti.length > 0 && <>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.red, textTransform: 'uppercase', letterSpacing: 0.5, margin: '12px 0 8px' }}>Urgenti</div>
            {taskUrgenti.slice(0, 3).map((t: any) => <TaskRow key={t.id} t={t} onOpen={() => openPanel({ type: 'task', id: t.id, data: t })} />)}
          </>}
        </div>
        <div>
          <SectionHeader title="Questa settimana" count={taskSettimana.length} action={{ label: 'Calendario', onClick: () => onNavigate('calendario') }} />
          {taskSettimana.length === 0
            ? <div style={{ fontSize: 12, color: S.textMuted, padding: '14px', background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, textAlign: 'center' }}>Nessuna scadenza questa settimana</div>
            : taskSettimana.slice(0, 5).map((t: any) => <TaskRow key={t.id} t={t} onOpen={() => openPanel({ type: 'task', id: t.id, data: t })} />)
          }
        </div>
      </div>

      {/* ── FINANZE ── */}
      <div>
        <SectionHeader title="Finanze" action={{ label: 'Contabilità', onClick: () => onNavigate('contabilita') }} />
        <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
          <KpiCard value={`€${daIncassare.toLocaleString('it-IT')}`} label="Da incassare" sub="fatture attive aperte" color={S.blue} onClick={() => onNavigate('contabilita')} />
          <KpiCard value={`€${daPagare.toLocaleString('it-IT')}`} label="Da pagare" sub="fatture passive aperte" color={S.amber} onClick={() => onNavigate('contabilita')} />
          <KpiCard value={`€${fattureMese.ricavi.toLocaleString('it-IT')}`} label="Ricavi mese" sub="fatture attive" color={S.green} />
          <KpiCard value={`€${fattureMese.ivaDebito.toLocaleString('it-IT')}`} label="IVA da versare" sub="mese corrente" color={S.purple} alert={fattureMese.ivaDebito > 0} />
        </div>
        {scaduteNonPagate.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {scaduteNonPagate.slice(0, 4).map((s: any) => (
              <div key={s.id} style={{ background: S.redLight, border: `1px solid ${S.red}30`, borderRadius: 8, padding: '8px 12px', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: S.red }}>{s.descrizione}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: S.red, fontFamily: DS.fonts.mono }}>€{Number(s.importo).toLocaleString('it-IT')}</div>
                <div style={{ fontSize: 10, color: S.red, opacity: 0.7 }}>{s.data_scadenza}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CRM + DELEGATE ── */}
      <div style={col2}>
        {/* CRM follow-up */}
        <div>
          <SectionHeader title="CRM — Follow-up" count={followUpScaduti.length} action={{ label: 'Pipeline', onClick: () => onNavigate('clienti') }} color={followUpScaduti.length > 0 ? S.amber : undefined} />
          {followUpScaduti.length === 0 ? (
            <div style={{ fontSize: 12, color: S.textMuted, padding: '12px', background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, textAlign: 'center' }}>Nessun follow-up in ritardo ✓</div>
          ) : followUpScaduti.slice(0, 4).map((c: any) => (
            <div key={c.id} onClick={() => openPanel({ type: 'cliente', id: c.id, data: c })} style={{ background: S.surface, border: `1px solid ${S.amberLight}`, borderRadius: 8, padding: '8px 12px', marginBottom: 6, cursor: 'pointer', borderLeft: `3px solid ${S.amber}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary }}>{c.nome}</span>
                {c.deal_value > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: S.green, fontFamily: DS.fonts.mono }}>€{Number(c.deal_value).toLocaleString('it-IT')}</span>}
              </div>
              <div style={{ fontSize: 11, color: S.amber, marginTop: 2 }}>follow-up: {c.follow_up_date} · {c.pipeline_stage}</div>
            </div>
          ))}
          {/* Pipeline stages */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {['lead','contatto','demo','proposta'].map(stage => {
              const n = clienti.filter((c: any) => c.pipeline_stage === stage).length
              if (n === 0) return null
              return <div key={stage} style={{ padding: '4px 10px', background: S.background, border: `1px solid ${S.border}`, borderRadius: 20, fontSize: 11, color: S.textSecondary }}>{stage}: <strong>{n}</strong></div>
            })}
          </div>
        </div>

        {/* Delegate */}
        <div>
          <SectionHeader title="Delegate a me" count={delegateAme.length} action={{ label: 'La mia area', onClick: () => onNavigate('personale') }} color={delegateAme.length > 0 ? '#BE185D' : undefined} />
          {delegateAme.length === 0 ? (
            <div style={{ fontSize: 12, color: S.textMuted, padding: '12px', background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, textAlign: 'center' }}>Nessuna delega pendente ✓</div>
          ) : delegateAme.slice(0, 4).map((t: any) => {
            const scaduta = t.scadenza && t.scadenza < today
            return (
              <div key={t.id} style={{ background: S.surface, border: `1px solid #BE185D30`, borderRadius: 8, padding: '8px 12px', marginBottom: 6, borderLeft: `3px solid #BE185D` }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary }}>{t.titolo}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: '#BE185D', fontWeight: 600 }}>da {t.creato_da === 'fabio' ? 'Fabio' : 'Lidia'}</span>
                  {t.scadenza && <span style={{ fontSize: 10, color: scaduta ? S.red : S.textMuted }}>📅 {t.scadenza}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── GANTT SNAPSHOT ── */}
      <div>
        <SectionHeader title="Progetti — Timeline" action={{ label: 'Gantt completo', onClick: () => onNavigate('gantt') }} />
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.md, padding: '14px 16px' }}>
          {progetti.filter((p: any) => p.stato === 'attivo').length === 0
            ? <div style={{ fontSize: 12, color: S.textMuted, textAlign: 'center', padding: '12px 0' }}>Nessun progetto attivo</div>
            : <MiniGantt progetti={progetti.filter((p: any) => p.stato === 'attivo')} />
          }
        </div>
      </div>

      {/* ── PROGETTI GRID ── */}
      <div>
        <SectionHeader title="Progetti attivi" action={{ label: 'Tutti', onClick: () => onNavigate('progetti') }} />
        <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
          {progetti.filter((p: any) => p.stato === 'attivo').slice(0, 6).map((p: any) => (
            <div key={p.id} onClick={() => onNavigate('progetti', p)} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.md, padding: '12px 14px', cursor: 'pointer', borderTop: `3px solid ${p.colore || S.teal}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary, marginBottom: 6 }}>{p.nome}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: S.green, fontFamily: DS.fonts.mono }}>€{p.mrr || 0}/mo</span>
                <span style={{ fontSize: 11, color: S.textMuted }}>{p.beta_clienti || 0} clienti</span>
                {p.prezzo > 0 && <span style={{ fontSize: 11, color: S.textMuted }}>€{p.prezzo}/mo</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ULTIME IDEE ── */}
      {(data.lab_idee || []).length > 0 && (
        <div>
          <SectionHeader title="Lab Idee — ultime" action={{ label: 'Tutte le idee', onClick: () => onNavigate('lab_idee') }} />
          <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
            {(data.lab_idee || []).filter((i: any) => i.stato !== 'archiviato').slice(0, 6).map((idea: any) => {
              const COLORI_IDEA = ['#FEF3C7','#DBEAFE','#D1FAE5','#EDE9FE','#FFE4E6']
              const bg = idea.colore || COLORI_IDEA[Math.abs(idea.id?.charCodeAt(0) || 0) % COLORI_IDEA.length]
              const testo = idea.contenuto_ricco || idea.descrizione || idea.dettaglio || ''
              return (
                <div key={idea.id} onClick={() => onNavigate('lab_idee')}
                  style={{ background: bg, border: `1px solid rgba(0,0,0,0.06)`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'transform 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  {idea.categoria && <div style={{ fontSize: 10, background: 'rgba(109,40,217,0.15)', color: '#6D28D9', padding: '1px 7px', borderRadius: 20, fontWeight: 600, display: 'inline-block', marginBottom: 6 }}>{idea.categoria}</div>}
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: testo ? 5 : 0, lineHeight: 1.3 }}>{idea.titolo || 'Senza titolo'}</div>
                  {testo && <div style={{ fontSize: 11, color: S.textSecondary, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{testo}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    {idea.stato && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.5)', color: S.textMuted, padding: '1px 6px', borderRadius: 20 }}>{idea.stato}</span>}
                    <span style={{ fontSize: 10, color: S.textMuted, marginLeft: 'auto' }}>{idea.created_at ? new Date(idea.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : ''}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
