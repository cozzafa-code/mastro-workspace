'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DS } from '@/constants/design-system'
import { ProjectDetailView } from '@/components/ProjectDetail/ProjectDetailView'
import { CrmView } from '@/components/CRM/CrmView'
import { MrrTrackerView } from '@/components/MRR/MrrTrackerView'
import { CampagneProView } from '@/components/Campagne/CampagneProView'
import { TaskTimerView } from '@/components/Tasks/TaskTimerView'
import { FinanceRunwayView } from '@/components/Finance/FinanceRunwayView'
import { CalendarioView } from '@/components/Calendario/CalendarioView'
import { GanttView } from '@/components/Gantt/GanttView'
import { NotificheBell } from '@/components/Notifiche/NotificheBell'
import { DetailPanel } from '@/components/Universal/DetailPanel'
import { ContabilitaView } from '@/components/Contabilita/ContabilitaView'
import { ImportExportPanel } from '@/components/ImportExport/ImportExportPanel'
import { TemplatePicker } from '@/components/Progetti/ProgettoTemplates'
import { PersonaleView } from '@/components/Personale/PersonaleView'
import { DashboardView } from '@/components/Dashboard/DashboardView'
import { DelegheView } from '@/components/Deleghe/DelegheView'
import { LabIdeeView } from '@/components/LabIdee/LabIdeeView'
import { TeamView } from '@/components/Team/TeamView'
import { PreventiviView } from '@/components/Preventivi/PreventiviView'
import { BachecaCondivisa } from '@/components/Condivisa/BachecaCondivisa'
import { OnboardingFlow } from '@/components/Onboarding/OnboardingFlow'
import { GlobalSearch } from '@/components/Search/GlobalSearch'
import { SettingsPanel } from '@/components/Settings/SettingsPanel'
import { WorkspacePanel } from '@/components/WorkspaceIntelligence/WorkspacePanel'
import { usePanel } from '@/context/PanelContext'
import type { PanelObject, PanelObjectType } from '@/components/Universal/DetailPanel'
import { useDevice } from '@/hooks/useDevice'
import type { UserType } from '@/lib/types'

type User = UserType
type Tab = 'dashboard' | 'progetti' | 'task' | 'campagne' | 'clienti' | 'mrr' | 'calendario' | 'gantt' | 'contabilita' | 'deleghe' | 'team' | 'preventivi' | 'condivisa' | 'lab_idee' | 'spese' | 'personale'

import { LoginPage } from '@/components/Auth/LoginPage'

export default function Home() {
  const S = DS.colors
  const [user, setUser] = useState<User>('fabio')
  const [tab, setTab] = useState<Tab>('dashboard')
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const device = useDevice()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { panelObj, openPanel, closePanel, navigatePanel } = usePanel()
  const [showImportExport, setShowImportExport] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  // Auth — controlla sessione Supabase
  const [authChecked, setAuthChecked] = useState(false)
  const [authUser, setAuthUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      setAuthChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const tables = ['progetti', 'tasks', 'campagne', 'clienti', 'lab_idee', 'spese_correnti', 'personale', 'mrr_snapshots']

  useEffect(() => { if (authUser) loadAll() }, [authUser])

  async function loadAll() {
    setLoading(true)
    const results = await Promise.all(
      tables.map(t => supabase.from(t).select('*').order('created_at', { ascending: false }).limit(200))
    )
    const newData: any = {}
    tables.forEach((t, i) => { newData[t] = results[i].data || [] })
    setData(newData)
    setLoading(false)
  }

  async function addItem(table: string, item: any) {
    await supabase.from(table).insert(item)
    loadAll(); setShowForm(null); setForm({})
  }

  async function deleteItem(table: string, id: string) {
    await supabase.from(table).delete().eq('id', id); loadAll()
  }

  const today = new Date().toLocaleDateString('it-IT')
  const taskAperti = (data.tasks || []).filter((t: any) => t.stato !== 'completato' && t.stato !== 'Fatto').length
  const progAttivi = (data.progetti || []).filter((p: any) => p.stato === 'attivo').length
  const totMRR = (data.progetti || []).reduce((a: number, p: any) => a + (Number(p.mrr) || 0), 0)
  const totSpese = (data.spese_correnti || []).filter((s: any) => s.tipo !== 'entrata').reduce((a: number, s: any) => a + (Number(s.importo) || 0), 0)

  const Badge = ({ text, color }: { text: string, color: string }) => {
    const c: any = {
      teal:   { bg: S.tealLight,   text: S.teal },
      blue:   { bg: S.blueLight,   text: S.blue },
      red:    { bg: S.redLight,    text: S.red },
      amber:  { bg: '#FEF3C7',     text: '#B45309' },
      gray:   { bg: S.borderLight, text: S.textMuted },
      green:  { bg: S.greenLight,  text: S.green },
      purple: { bg: '#EDE9FE',     text: '#6D28D9' },
    }
    const cfg = c[color] || c.gray
    return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap', background: cfg.bg, color: cfg.text }}>{text}</span>
  }

  const Card = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <div onClick={onClick} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 14, marginBottom: 10, cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = S.teal }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = S.border }}>
      {children}
    </div>
  )

  const StatCard = ({ num, label, sub, color }: any) => (
    <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.md, padding: '14px 16px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || S.textPrimary, fontFamily: DS.fonts.mono }}>{num}</div>
      <div style={{ fontSize: 11, color: S.textPrimary, marginTop: 4, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: S.textMuted, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${S.borderLight}` }}>{sub}</div>}
    </div>
  )

  const SH = ({ title, onAdd }: { title: string, onAdd?: () => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>{title}</div>
      {onAdd && <button onClick={onAdd} style={{ padding: '5px 12px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>+ Aggiungi</button>}
    </div>
  )

  const Sep = ({ label }: { label: string }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 20, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${S.borderLight}` }}>{label}</div>
  )

  const sc = (s: string) => { if (!s) return 'gray'; const sl = s.toLowerCase(); if (['attivo','completato','fatto'].includes(sl)) return 'green'; if (['in corso','aperto','in_corso'].includes(sl)) return 'blue'; if (['pausa','bloccato'].includes(sl)) return 'amber'; if (['urgente','alta'].includes(sl)) return 'red'; return 'gray' }
  const pc = (p: any) => { const n = Number(p); if (n === 1) return 'red'; if (n === 2) return 'amber'; return 'blue' }

  function renderDashboard() {
    const urgenti = (data.tasks || []).filter((t: any) => (Number(t.priorita) <= 2 || t.priorita === 'Alta') && t.stato !== 'completato' && t.stato !== 'Fatto').slice(0, 4)
    const isMob = device.isMobile
    return (
      <div>
        {/* AI bar */}
        <div style={{ background: '#0B1F2A', borderRadius: 12, padding: isMob ? '10px 12px' : '12px 16px', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
          <input style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 0 }}
            placeholder="Chiedi alla AI... es: Cosa devo fare oggi?" id="ai-q" />
          <button onClick={() => {
            const q = (document.getElementById('ai-q') as HTMLInputElement)?.value
            if (!q) return
            const ctx = `MASTRO OS — ${today} — ${user}\nProgetti: ${(data.progetti || []).map((p: any) => p.nome + ' MRR:€' + (p.mrr || 0)).join(' | ')}\nTask aperti: ${(data.tasks || []).filter((t: any) => t.stato !== 'completato').slice(0, 6).map((t: any) => t.titolo || t.testo).join(' | ')}\nMRR: €${totMRR}/mo\nDomanda: ${q}`
            navigator.clipboard.writeText(ctx).then(() => alert('✓ Copiato!')).catch(() => prompt('Copia:', ctx))
          }} style={{ padding: '8px 14px', background: '#0A8A7A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
            {isMob ? 'Copia' : 'Copia per Claude ↗'}
          </button>
        </div>

        {/* KPI stats — 2x2 on mobile, 4 cols on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { num: String(taskAperti), label: 'Task aperti', sub: `${urgenti.length} urgenti`, color: '#0D1117' },
            { num: String(progAttivi), label: 'Progetti attivi', sub: `su ${(data.progetti || []).length} totali`, color: '#0D1117' },
            { num: `€${totMRR}`, label: 'MRR totale', sub: 'da tutti i progetti', color: '#0F7B5A' },
            { num: `-€${totSpese}`, label: 'Spese/mese', sub: 'correnti', color: '#C93535' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: isMob ? 20 : 24, fontWeight: 700, color: k.color, fontFamily: '"DM Mono", monospace' }}>{k.num}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0D1117', marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 8, paddingTop: 6, borderTop: '1px solid #F3F4F6' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Task urgenti + Progetti — stack on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1fr 1fr', gap: isMob ? 12 : 20 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #F3F4F6' }}>Task urgenti</div>
            {urgenti.length === 0
              ? <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '16px 0', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10 }}>Nessun task urgente</div>
              : urgenti.map((t: any) => (
                <div key={t.id} onClick={() => openPanel({ type: 'task', id: t.id, data: t })}
                  style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0D1117' }}>{t.titolo || t.testo}</div>
                    <span style={{ fontSize: 10, background: '#FCEAEA', color: '#C93535', padding: '2px 7px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>Urgente</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{t.chi}{t.scadenza ? ' · ' + t.scadenza : ''}</div>
                </div>
              ))}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #F3F4F6' }}>Progetti</div>
            {(data.progetti || []).slice(0, isMob ? 3 : 5).map((p: any) => (
              <div key={p.id} onClick={() => { setSelectedProject(p); setTab('progetti') }}
                style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.colore && <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.colore }} />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0D1117' }}>{p.nome}</span>
                  </div>
                  <span style={{ fontSize: 10, background: '#EDF7F6', color: '#0A8A7A', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>{p.stato}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#0F7B5A', fontWeight: 600 }}>€{p.mrr || 0}/mo</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{p.beta_clienti || 0} clienti</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderProgetti() {
    const isMob = device.isMobile
    if (selectedProject) return (
      <ProjectDetailView
        progettoId={selectedProject.id}
        currentUser={user}
        onBack={() => setSelectedProject(null)}
      />
    )
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: isMob ? 16 : 18, fontWeight: 700, color: '#0D1117' }}>Tutti i progetti</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowTemplatePicker(true)} style={{ padding: '7px 12px', background: '#F0F7F6', color: '#0A8A7A', border: '1px solid #B2E8E3', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Da template</button>
            <button onClick={() => setShowForm('progetto')} style={{ padding: '7px 14px', background: '#0A8A7A', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>+ Aggiungi</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1fr 1fr', gap: 10 }}>
          {(data.progetti || []).map((p: any) => (
            <div key={p.id} onClick={() => setSelectedProject(p)}
              style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {p.colore && <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.colore, flexShrink: 0, marginTop: 2 }} />}
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0D1117' }}>{p.nome}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, background: '#EDF7F6', color: '#0A8A7A', padding: '2px 7px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>{p.stato}</span>
                  <button onClick={e => { e.stopPropagation(); deleteItem('progetti', p.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 13, padding: '0 2px' }}>✕</button>
                </div>
              </div>
              {p.descrizione && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>{p.descrizione}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <div style={{ background: '#F9FAFB', borderRadius: 7, padding: '7px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F7B5A' }}>€{p.mrr || 0}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>MRR</div>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 7, padding: '7px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>{p.beta_clienti || 0}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>Clienti</div>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 7, padding: '7px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#6D28D9' }}>€{p.prezzo || 0}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>Prezzo</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderTask() {
    return <TaskTimerView currentUser={user} />
  }

  function renderSpese() {
    return <FinanceRunwayView />
  }

  function renderCampagne() {
    return <CampagneProView currentUser={user} />
  }

  function renderClienti() {
    return <CrmView currentUser={user} />
  }

  function renderLabIdee() {
    const idee = data.lab_idee || []
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary }}>Lab Idee</div>
          <button onClick={() => setShowForm('idea')} style={{ padding: '7px 14px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>+ Aggiungi</button>
        </div>
        {idee.length === 0
          ? <div style={{ textAlign: 'center', padding: '32px', fontSize: 13, color: S.textMuted, background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 12, cursor: 'pointer' }} onClick={() => setShowForm('idea')}>Nessuna idea ancora · clicca per aggiungere</div>
          : <div style={{ display: 'grid', gridTemplateColumns: device.isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              {idee.map((idea: any) => (
                <div key={idea.id} onClick={() => openPanel({ type: 'campagna', id: idea.id, data: idea })}
                  style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', borderLeft: `3px solid #6D28D9` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary }}>{idea.titolo || idea.nome}</div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      {idea.stato && <span style={{ fontSize: 10, background: S.tealLight, color: S.teal, padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{idea.stato}</span>}
                      {idea.priorita && <span style={{ fontSize: 10, background: Number(idea.priorita) <= 2 ? S.redLight : S.borderLight, color: Number(idea.priorita) <= 2 ? S.red : S.textMuted, padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>P{idea.priorita}</span>}
                      <button onClick={e => { e.stopPropagation(); deleteItem('lab_idee', idea.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                  {(idea.descrizione || idea.dettaglio) && <div style={{ fontSize: 12, color: S.textSecondary, marginBottom: 8, lineHeight: 1.5 }}>{idea.descrizione || idea.dettaglio}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {idea.categoria && <span style={{ fontSize: 10, background: '#EDE9FE', color: '#6D28D9', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{idea.categoria}</span>}
                    {idea.chi && <span style={{ fontSize: 11, color: S.textMuted }}>{idea.chi}</span>}
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    )
  }

  function renderPersonale() {
    const isMob = device.isMobile
    const isFabio = user === 'fabio'
    const accent = isFabio ? '#0A8A7A' : '#BE185D'
    const accentLight = isFabio ? '#EDF7F6' : '#FDF0F6'
    const d = (data.personale || []).filter((p: any) => p.utente === user)
    const sections = [
      { key: 'task',  label: 'Task personali',   icon: '✓' },
      { key: 'note',  label: 'Note',              icon: '≡' },
      { key: 'idee',  label: 'Idee',              icon: '○' },
    ]
    return (
      <div>
        {/* Header area */}
        <div style={{ background: accentLight, border: `1px solid ${accent}30`, borderRadius: 12, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {isFabio ? 'FA' : 'LI'}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0D1117' }}>Area di {isFabio ? 'Fabio' : 'Lidia'}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Privata · visibile solo a te</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: accent, fontWeight: 600 }}>
            {d.length} elementi
          </div>
        </div>

        {/* Sections */}
        {sections.map(sec => {
          const items = d.filter((p: any) => p.tipo_item === sec.key)
          return (
            <div key={sec.key} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 }}>{sec.label} · {items.length}</div>
                <button onClick={() => setShowForm('p_' + sec.key)} style={{ padding: '5px 12px', background: accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Aggiungi</button>
              </div>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: '#9CA3AF', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer' }}
                  onClick={() => setShowForm('p_' + sec.key)}>
                  Nessun elemento · clicca per aggiungere
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMob ? '1fr' : sec.key === 'note' ? '1fr 1fr' : '1fr', gap: 8 }}>
                  {items.map((item: any) => (
                    <div key={item.id} style={{ background: '#fff', border: `1px solid #E5E7EB`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${accent}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1117' }}>{item.titolo}</div>
                          {item.contenuto && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>{item.contenuto}</div>}
                          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                            {item.stato && <span style={{ fontSize: 10, background: accentLight, color: accent, padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{item.stato}</span>}
                            {item.priorita && <span style={{ fontSize: 10, color: '#9CA3AF' }}>{item.priorita}</span>}
                            {item.scadenza && <span style={{ fontSize: 10, color: '#9CA3AF' }}>📅 {item.scadenza}</span>}
                          </div>
                        </div>
                        <button onClick={() => deleteItem('personale', item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 13 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const FI = ({ label, id, placeholder, type = 'text', options }: any) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.4, marginBottom: 3 }}>{label}</label>
      {options
        ? <select id={id} value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface, boxSizing: 'border-box' as const }}><option value="">Seleziona...</option>{options.map((o: string) => <option key={o}>{o}</option>)}</select>
        : <input id={id} type={type} value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })} placeholder={placeholder} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface, boxSizing: 'border-box' as const }} />
      }
    </div>
  )

  function handleSave() {
    const f = form
    if (showForm === 'progetto') addItem('progetti', { nome: f.nome, descrizione: f.descrizione, stato: f.stato || 'attivo', colore: f.colore || '#14B8A6', mrr: Number(f.mrr) || 0, beta_clienti: Number(f.clienti) || 0, prezzo: Number(f.prezzo) || 0, priorita: Number(f.priorita) || 3 })
    else if (showForm === 'task' || showForm === 'task_p') addItem('tasks', { titolo: f.titolo, dettaglio: f.dettaglio, chi: f.chi || user, priorita: f.priorita || '3', scadenza: f.scadenza, stato: f.stato || 'aperto', progetto: selectedProject?.nome })
    else if (showForm === 'campagna') addItem('campagne', { nome: f.nome, tipo: f.tipo, canale: f.canale, obiettivo: f.obiettivo, stato: f.stato || 'attiva', progetto_id: selectedProject?.id })
    else if (showForm === 'cliente') addItem('clienti', { nome: f.nome, ruolo: f.ruolo, email: f.email, telefono: f.tel, tipo: f.tipo || 'Lead', stato: 'attivo', note: f.note })
    else if (showForm === 'idea') addItem('lab_idee', { titolo: f.titolo, descrizione: f.descrizione, categoria: f.categoria, chi: f.chi || user, priorita: f.priorita || '3', stato: f.stato || 'aperto' })
    else if (showForm === 'spesa') addItem('spese_correnti', { nome: f.nome, importo: Number(f.importo) || 0, tipo: f.tipo || 'uscita', frequenza: f.freq || 'mensile', categoria: f.cat })
    else if (showForm?.startsWith('p_')) addItem('personale', { utente: user, tipo_item: showForm.replace('p_', ''), titolo: f.titolo, contenuto: f.contenuto, tag: f.tag, priorita: f.priorita, stato: f.stato, scadenza: f.scadenza })
  }

  const G2 = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
  )

  const forms: any = {
    progetto: { title: 'Nuovo progetto', body: <><FI label="Nome" id="nome" placeholder="Nome progetto" /><FI label="Descrizione" id="descrizione" placeholder="Descrizione" /><G2><FI label="MRR (€/mo)" id="mrr" type="number" placeholder="0" /><FI label="Prezzo/mese (€)" id="prezzo" type="number" placeholder="0" /></G2><G2><FI label="Beta clienti" id="clienti" type="number" placeholder="0" /><FI label="Priorità (1=max)" id="priorita" options={['1','2','3','4','5']} /></G2><FI label="Stato" id="stato" options={['attivo','pausa','completato','pianificato']} /><FI label="Colore (hex)" id="colore" placeholder="#0A8A7A" /></> },
    task: { title: 'Nuovo task', body: <><FI label="Titolo" id="titolo" placeholder="Cosa fare" /><FI label="Dettaglio" id="dettaglio" placeholder="Dettaglio" /><G2><FI label="Chi" id="chi" placeholder="Fabio / Lidia" /><FI label="Scadenza" id="scadenza" type="date" placeholder="" /></G2><G2><FI label="Priorità (1=max)" id="priorita" options={['1','2','3','4','5']} /><FI label="Stato" id="stato" options={['aperto','in_corso','completato']} /></G2><G2><FI label="Ricorrenza" id="ricorrenza" options={['','giornaliera','settimanale','mensile','annuale']} /><FI label="Fine ricorrenza" id="ricorrenza_fine" type="date" placeholder="" /></G2></> },
    task_p: { title: `Task per ${selectedProject?.nome}`, body: <><FI label="Titolo" id="titolo" placeholder="Cosa fare" /><FI label="Dettaglio" id="dettaglio" placeholder="Dettaglio" /><G2><FI label="Chi" id="chi" placeholder="Fabio / Lidia" /><FI label="Scadenza" id="scadenza" type="date" placeholder="" /></G2><FI label="Priorità (1=max)" id="priorita" options={['1','2','3','4','5']} /></> },
    campagna: { title: 'Nuova campagna', body: <><FI label="Nome" id="nome" placeholder="Nome campagna" /><G2><FI label="Tipo" id="tipo" options={['email','social','whatsapp','ads','evento','altro']} /><FI label="Canale" id="canale" placeholder="Brevo / TikTok / ..." /></G2><FI label="Obiettivo" id="obiettivo" placeholder="es. 500 lead serramentisti" /><FI label="Stato" id="stato" options={['pianificata','attiva','pausa','completata']} /></> },
    cliente: { title: 'Nuovo contatto', body: <><FI label="Nome / Azienda" id="nome" placeholder="Nome" /><FI label="Ruolo" id="ruolo" placeholder="Ruolo" /><G2><FI label="Email" id="email" placeholder="email@..." /><FI label="Telefono" id="tel" placeholder="+39..." /></G2><G2><FI label="Tipo" id="tipo" options={['Lead','Cliente','Partner','Fornitore']} /><FI label="Note" id="note" placeholder="Note" /></G2></> },
    idea: { title: 'Nuova idea', body: <><FI label="Titolo" id="titolo" placeholder="Titolo idea" /><FI label="Descrizione" id="descrizione" placeholder="Descrizione" /><G2><FI label="Categoria" id="categoria" placeholder="SaaS / Marketing / ..." /><FI label="Chi" id="chi" placeholder="Fabio / Lidia" /></G2><G2><FI label="Priorità (1=max)" id="priorita" options={['1','2','3','4','5']} /><FI label="Stato" id="stato" options={['aperto','in_corso','completato']} /></G2></> },
    spesa: { title: 'Nuova voce finanziaria', body: <><FI label="Nome" id="nome" placeholder="es. Vercel Pro" /><G2><FI label="Importo €" id="importo" type="number" placeholder="0" /><FI label="Tipo" id="tipo" options={['uscita','entrata']} /></G2><G2><FI label="Frequenza" id="freq" options={['mensile','annuale','una_tantum']} /><FI label="Categoria" id="cat" placeholder="Tech / Marketing..." /></G2></> },
    p_task: { title: 'Task personale', body: <><FI label="Titolo" id="titolo" placeholder="Cosa fare" /><FI label="Contenuto" id="contenuto" placeholder="Dettaglio" /><G2><FI label="Priorità" id="priorita" options={['Alta','Media','Bassa']} /><FI label="Scadenza" id="scadenza" type="date" placeholder="" /></G2><FI label="Stato" id="stato" options={['Aperto','In corso','Fatto']} /></> },
    p_note: { title: 'Nota personale', body: <><FI label="Titolo" id="titolo" placeholder="Titolo" /><FI label="Contenuto" id="contenuto" placeholder="Scrivi qui..." /><FI label="Tag" id="tag" placeholder="Tag" /></> },
    p_idee: { title: 'Idea personale', body: <><FI label="Titolo" id="titolo" placeholder="Titolo" /><FI label="Contenuto" id="contenuto" placeholder="Descrizione" /><G2><FI label="Priorità" id="priorita" options={['Alta','Media','Bassa']} /><FI label="Stato" id="stato" options={['Aperto','In corso','Fatto']} /></G2></> },
  }

  const navItems = [
    { id: 'dashboard', iconKey: 'dashboard', label: 'Dashboard', section: 'Overview' },
    { id: 'progetti',  iconKey: 'projects',  label: 'Progetti',  section: 'Lavoro' },
    { id: 'task',      iconKey: 'tasks',     label: 'Task' },
    { id: 'deleghe',   iconKey: 'deleghe',   label: 'Deleghe' },
    { id: 'team',        iconKey: 'clients',   label: 'Team',        section: 'Team' },
    { id: 'condivisa',   iconKey: 'deleghe',   label: 'Condivisa',   section: 'Team' },
    { id: 'preventivi',  iconKey: 'receipt',   label: 'Preventivi',  section: 'Finanze' },
    { id: 'campagne',  iconKey: 'campaigns', label: 'Campagne' },
    { id: 'clienti',   iconKey: 'clients',   label: 'Pipeline CRM' },
    { id: 'mrr',       iconKey: 'mrr',       label: 'MRR Tracker', section: 'Metriche' },
    { id: 'calendario', iconKey: 'calendar',  label: 'Calendario' },
    { id: 'gantt',     iconKey: 'gantt',     label: 'Gantt' },
    { id: 'lab_idee',  iconKey: 'ideas',     label: 'Lab Idee',    section: 'Idee' },
    { id: 'spese',     iconKey: 'finance',   label: 'Finanze',     section: 'Finanze' },
    { id: 'contabilita', iconKey: 'receipt', label: 'Contabilità' },
    { id: 'personale', iconKey: 'personal',  label: 'La mia area', section: 'Personale' },
  ]

  const tabTitles: any = {
    dashboard: 'Dashboard', progetti: selectedProject ? selectedProject.nome : 'Progetti',
    task: 'Task', campagne: 'Campagne', clienti: 'Pipeline CRM',
    mrr: 'MRR Tracker', calendario: 'Calendario', gantt: 'Gantt Timeline', contabilita: 'Contabilità', deleghe: 'Deleghe', team: 'Team', condivisa: '📋 Bacheca Condivisa', preventivi: 'Preventivi', lab_idee: 'Lab Idee', spese: 'Finanze', personale: 'La mia area'
  }
  const cf = showForm ? forms[showForm] : null

  const iconSvg = (key: string, active: boolean) => {
    const svgs: any = {
      dashboard: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
      projects:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4.5C2 3.12 3.12 2 4.5 2h7C12.88 2 14 3.12 14 4.5v7C14 12.88 12.88 14 11.5 14h-7C3.12 14 2 12.88 2 11.5v-7z" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 8h5M5.5 5.5h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      tasks:     <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      campaigns: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 10V6l10-4v12L2 10zm0 0h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 10v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      clients:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10.5 7.5c1.38 0 2.5 1.12 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      mrr:       <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 12l3.5-4 3 2.5L12 5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      calendar:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      gantt:     <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h6M2 8h9M2 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      receipt:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 2h10v12l-2-1.5L9 14l-2-1.5L5 14l-2-1.5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 6h4M6 9h4M6 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      deleghe:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
      ideas:     <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 014 4c0 1.5-.8 2.8-2 3.5V11H6v-1.5C4.8 8.8 4 7.5 4 6a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.5"/><path d="M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      finance:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      personal:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 13.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    }
    return svgs[key] || svgs.dashboard
  }

  const bottomNavItems = [
    { id: 'dashboard',  iconKey: 'dashboard', label: 'Home' },
    { id: 'task',       iconKey: 'tasks',     label: 'Task' },
    { id: 'clienti',    iconKey: 'clients',   label: 'CRM' },
    { id: 'personale',  iconKey: 'personal',  label: 'La mia' },
  ]

  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showFab, setShowFab] = useState(false)
  const [fabSide, setFabSide] = useState<'right' | 'left'>('right')
  const [fabTop, setFabTop] = useState('40%')

  // Onboarding — mostra solo alla prima visita
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(`mastro_onboarding_${user}`)
  })

  // Ricerca globale — CMD+K / CTRL+K
  const [showSearch, setShowSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(s => !s)
      }
      if (e.key === 'Escape') setShowSearch(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const altroItems = [
    { id: 'condivisa',  iconKey: 'deleghe',   label: 'Bacheca' },
    { id: 'preventivi', iconKey: 'receipt',   label: 'Preventivi' },
    { id: 'progetti',   iconKey: 'projects',  label: 'Progetti' },
    { id: 'deleghe',    iconKey: 'deleghe',   label: 'Deleghe' },
    { id: 'campagne',   iconKey: 'campaigns', label: 'Campagne' },
    { id: 'mrr',        iconKey: 'mrr',       label: 'MRR' },
    { id: 'calendario', iconKey: 'calendar',  label: 'Calendario' },
    { id: 'gantt',      iconKey: 'gantt',     label: 'Gantt' },
    { id: 'lab_idee',   iconKey: 'ideas',     label: 'Lab Idee' },
    { id: 'spese',      iconKey: 'finance',   label: 'Finanze' },
    { id: 'contabilita',iconKey: 'receipt',   label: 'Contabilità' },
  ]

  // Auth gate — dentro il return per rispettare le regole degli hooks
  if (!authChecked) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9CA3AF', fontFamily: 'system-ui, sans-serif' }}>Caricamento...</div>
  if (!authUser) return <LoginPage />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F7F8FA', fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* SIDEBAR — hidden on mobile, collapsible on tablet */}
      {!device.isMobile && (
        <div style={{ width: device.isTablet && !sidebarOpen ? 56 : 220, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRight: '1px solid #EFEFEF', overflow: 'hidden', transition: 'width 0.2s ease' }}>
          <div style={{ padding: device.isTablet && !sidebarOpen ? '18px 14px' : '20px 20px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#0A8A7A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: device.isTablet ? 'pointer' : 'default' }}
              onClick={() => device.isTablet && setSidebarOpen(!sidebarOpen)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 12L7 2l5 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.5 9h7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            {(!device.isTablet || sidebarOpen) && <div><div style={{ fontSize: 13, fontWeight: 600, color: '#0D1117' }}>Mastro OS</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>fabio-os</div></div>}
          </div>
          <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
            {navItems.map((item: any) => {
              const isActive = tab === item.id
              const collapsed = device.isTablet && !sidebarOpen
              return (
                <div key={item.id}>
                  {item.section && !collapsed && <div style={{ fontSize: 9.5, fontWeight: 600, color: '#C4C9D4', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 10px 5px' }}>{item.section}</div>}
                  <button onClick={() => { setTab(item.id as Tab); setSelectedProject(null) }} title={collapsed ? item.label : undefined}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 9, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px 0' : '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: isActive ? '#EDF7F6' : 'transparent', color: isActive ? '#0A8A7A' : '#5C6370', fontSize: 13, fontWeight: isActive ? 500 : 400, marginBottom: 1, textAlign: 'left', fontFamily: 'inherit', position: 'relative' }}>
                    <span style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0, position: 'relative' }}>
                      {iconSvg(item.iconKey, isActive)}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && isActive && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#0A8A7A' }} />}
                  </button>
                </div>
              )
            })}
          </nav>
          {(!device.isTablet || sidebarOpen) && (
            <div style={{ padding: '12px 10px', borderTop: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: '#C4C9D4', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, paddingLeft: 4 }}>Utente</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                {[{ id: 'fabio', label: 'Fabio', initials: 'FA', color: '#0A8A7A' }, { id: 'lidia', label: 'Lidia', initials: 'LI', color: '#BE185D' }].map(u => (
                  <button key={u.id} onClick={() => setUser(u.id as User)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: 7, border: `1px solid ${user === u.id ? u.color + '40' : '#F0F0F0'}`, background: user === u.id ? u.color + '12' : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: user === u.id ? u.color : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: user === u.id ? '#fff' : '#9CA3AF', flexShrink: 0 }}>{u.initials}</div>
                    <span style={{ fontSize: 11.5, fontWeight: user === u.id ? 500 : 400, color: user === u.id ? u.color : '#6B7280' }}>{u.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => supabase.auth.signOut()}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #F0F0F0', borderRadius: 7, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, color: '#9CA3AF', textAlign: 'left' }}>
                → Esci
              </button>
              <button onClick={() => setShowSettings(true)}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #F0F0F0', borderRadius: 7, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, color: '#9CA3AF', textAlign: 'left', marginTop: 4 }}>
                ⚙️ Impostazioni
              </button>
            </div>
          )}
        </div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EFEFEF', padding: device.isMobile ? '0 16px' : '0 28px', height: device.isMobile ? 48 : 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {device.isMobile && <div style={{ width: 24, height: 24, borderRadius: 6, background: '#0A8A7A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 12L7 2l5 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
            {!device.isMobile && <span style={{ fontSize: 13, color: '#9CA3AF' }}>Workspace /</span>}
            <span style={{ fontSize: device.isMobile ? 14 : 13, fontWeight: 600, color: '#0D1117' }}>{tabTitles[tab]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!device.isMobile && (
              <button onClick={() => setShowImportExport(true)} style={{ padding: '5px 10px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 11, color: S.textSecondary, fontFamily: DS.fonts.ui, fontWeight: 500 }}>
                Import / Export
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0F7F6', border: '1px solid #B2E8E3', borderRadius: 20, padding: '3px 8px 3px 6px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0A8A7A' }} />
              <span style={{ fontSize: device.isMobile ? 10 : 11.5, fontWeight: 500, color: '#0A8A7A' }}>live</span>
            </div>
            {!device.isMobile && <NotificheBell utente={user} />}
            {!device.isMobile && (
              <button onClick={() => setShowSearch(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', border: `1px solid ${S.border}`, borderRadius: 8, background: S.background, cursor: 'pointer', fontSize: 12, color: S.textMuted, fontFamily: DS.fonts.ui }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke={S.textMuted} strokeWidth="1.5"/><path d="M11 11l3 3" stroke={S.textMuted} strokeWidth="1.5" strokeLinecap="round"/></svg>
                Cerca
                <span style={{ fontSize: 10, background: S.borderLight, padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
              </button>
            )}
            {device.isMobile && (
              <button onClick={() => setUser(user === 'fabio' ? 'lidia' : 'fabio')} style={{ width: 28, height: 28, borderRadius: '50%', background: user === 'fabio' ? '#0A8A7A' : '#BE185D', border: 'none', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                {user === 'fabio' ? 'FA' : 'LI'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: device.isMobile ? '16px 16px 80px' : device.isTablet ? '20px 24px 80px' : '28px 32px' }}>
          {loading
            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><span style={{ fontSize: 13, color: '#9CA3AF' }}>Caricamento...</span></div>
            : <>
              {tab === 'dashboard' && <DashboardView data={data} user={user} onNavigate={(t, extra) => { setTab(t as any); if (extra) setSelectedProject(extra) }} />}
              {tab === 'progetti' && renderProgetti()}
              {tab === 'task' && renderTask()}
              {tab === 'campagne' && renderCampagne()}
              {tab === 'clienti' && renderClienti()}
              {tab === 'mrr' && <MrrTrackerView />}
              {tab === 'calendario' && <CalendarioView currentUser={user} />}
              {tab === 'gantt' && <GanttView />}
              {tab === 'contabilita' && <ContabilitaView />}
              {tab === 'deleghe' && <DelegheView currentUser={user} progetti={data.progetti || []} />}
              {tab === 'team' && <TeamView currentUser={user} />}
              {tab === 'condivisa' && <BachecaCondivisa currentUser={user} />}
              {tab === 'preventivi' && <PreventiviView currentUser={user} clienti={data.clienti || []} progetti={data.progetti || []} />}
              {tab === 'lab_idee' && <LabIdeeView currentUser={user} progetti={data.progetti || []} />}
              {tab === 'spese' && renderSpese()}
              {tab === 'personale' && <PersonaleView currentUser={user} />}
            </>
          }
        </div>

        {/* FAB LATERALE draggabile — mobile e tablet */}
        {!device.isDesktop && (
          <>
            {showFab && <div style={{ position: 'fixed', inset: 0, zIndex: 79, background: 'rgba(0,0,0,0.3)' }} onClick={() => setShowFab(false)} />}

            <div style={{ position: 'fixed', [fabSide]: 0, top: fabTop, zIndex: 80, display: 'flex', flexDirection: fabSide === 'right' ? 'row' : 'row-reverse', alignItems: 'center' }}>
              {/* Menu espanso */}
              {showFab && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 16px 20px 20px', background: 'rgba(13,27,42,0.97)', borderRadius: fabSide === 'right' ? '16px 0 0 16px' : '0 16px 16px 0', boxShadow: '-8px 0 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', maxHeight: '70vh', overflowY: 'auto' }}>
                  {[
                    { label: '+ Task',   color: '#2563EB', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, action: () => { setShowForm('task'); setShowFab(false) } },
                    { label: '+ Delega', color: '#BE185D', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>, action: () => { setTab('deleghe'); setShowFab(false) } },
                    { label: '+ Idea',   color: '#7C3AED', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="8" r="4" stroke="white" strokeWidth="2"/><path d="M8 14h4M9 16h2" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>, action: () => { setTab('lab_idee'); setShowFab(false) } },
                    { label: 'Agenda',   color: '#059669', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="2" stroke="white" strokeWidth="2"/><path d="M7 2v3M13 2v3M3 9h14" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>, action: () => { setTab('calendario'); setShowFab(false) } },
                    { label: 'Chat AI',  color: '#D97706', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="white" strokeWidth="2"/><path d="M7 10h6M7 7h4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>, action: () => setShowFab(false) },
                    { label: user === 'fabio' ? '→ Lidia' : '→ Fabio', color: user === 'fabio' ? '#BE185D' : '#0A8A7A', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="white" strokeWidth="2"/><path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>, action: () => { setUser(user === 'fabio' ? 'lidia' : 'fabio'); setShowFab(false) } },
                  ].map(a => (
                    <div key={a.label} onClick={a.action} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${a.color}60` }}>{a.icon}</div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{a.label}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10, marginTop: 2 }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                      {['Progetti','CRM','MRR','Finanze','Contabilità','Task'].map(m => {
                        const id = m === 'CRM' ? 'clienti' : m === 'Finanze' ? 'spese' : m === 'Contabilità' ? 'contabilita' : m.toLowerCase().replace('à','a')
                        return <button key={m} onClick={() => { setTab(id as Tab); setShowFab(false) }} style={{ padding: '3px 9px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, fontSize: 11, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>{m}</button>
                      })}
                    </div>
                    <button onClick={() => { setFabSide(s => s === 'right' ? 'left' : 'right'); setShowFab(false) }}
                      style={{ width: '100%', padding: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {fabSide === 'right' ? '← Sposta a sinistra' : 'Sposta a destra →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab verticale con frecce su/giù */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => setFabTop(t => `${Math.max(10, parseInt(t) - 10)}%`)}
                  style={{ width: 28, height: 20, background: '#065f46', border: 'none', borderRadius: fabSide === 'right' ? '8px 0 0 0' : '0 8px 0 0', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                <button onClick={() => setShowFab(!showFab)}
                  style={{ width: 28, height: 80, background: '#0A8A7A', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: 2, textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {showFab ? 'CHIUDI' : 'MASTRO'}
                  </span>
                </button>
                <button onClick={() => setFabTop(t => `${Math.min(80, parseInt(t) + 10)}%`)}
                  style={{ width: 28, height: 20, background: '#065f46', border: 'none', borderRadius: fabSide === 'right' ? '0 0 0 8px' : '0 0 8px 0', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
              </div>
            </div>

            {/* Bottom nav 4 tab */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#FFFFFF', borderTop: '1px solid #EFEFEF', display: 'flex', zIndex: 70, paddingBottom: 'env(safe-area-inset-bottom)' }}>
              {bottomNavItems.map((item: any) => {
                const isActive = tab === item.id
                return (
                  <button key={item.id} onClick={() => { setTab(item.id as Tab); setSelectedProject(null) }}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0 6px', border: 'none', background: 'none', cursor: 'pointer', color: isActive ? '#0A8A7A' : '#9CA3AF' }}>
                    <span style={{ opacity: isActive ? 1 : 0.5 }}>{iconSvg(item.iconKey, isActive)}</span>
                    <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400, marginTop: 3, fontFamily: 'inherit' }}>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Universal Detail Panel */}
      <DetailPanel obj={panelObj} onClose={closePanel} currentUser={user} onNavigate={navigatePanel} />

      {/* Import/Export */}
      {showImportExport && <ImportExportPanel onClose={() => setShowImportExport(false)} onSuccess={() => { setShowImportExport(false); loadAll() }} />}

      {/* Template Picker */}
      {showTemplatePicker && <TemplatePicker currentUser={user} onClose={() => setShowTemplatePicker(false)} onSuccess={(id) => { setShowTemplatePicker(false); loadAll(); setTab('progetti') }} />}

      {/* Modal */}
      {showForm && cf && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(2px)', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(null); setForm({}) } }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.12)', border: '1px solid #F0F0F0' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0D1117', marginBottom: 18 }}>{cf.title}</div>
            {cf.body}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
              <button onClick={() => { setShowForm(null); setForm({}) }} style={{ padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Annulla</button>
              <button onClick={handleSave} style={{ padding: '8px 18px', background: '#0A8A7A', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>Salva</button>
            </div>
          </div>
        </div>
      )}
      {/* Settings */}
      {showSettings && <SettingsPanel currentUser={user} onClose={() => setShowSettings(false)} />}

      {/* Ricerca globale */}
      {showSearch && <GlobalSearch onNavigate={(t, extra) => { setTab(t as any); if (extra) setSelectedProject(extra) }} onClose={() => setShowSearch(false)} />}

      {/* Onboarding — prima visita */}
      {showOnboarding && <OnboardingFlow currentUser={user} onComplete={() => setShowOnboarding(false)} />}

      {/* Workspace Intelligence — floating button */}
      <WorkspacePanel utente={user} workspaceData={data} />

    </div>
  )
}
