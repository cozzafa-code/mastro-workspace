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
import { WorkspacePanel } from '@/components/WorkspaceIntelligence/WorkspacePanel'
import { usePanel } from '@/context/PanelContext'
import type { PanelObject, PanelObjectType } from '@/components/Universal/DetailPanel'
import { useDevice } from '@/hooks/useDevice'
import type { UserType } from '@/lib/types'

type User = UserType
type Tab = 'dashboard' | 'progetti' | 'task' | 'campagne' | 'clienti' | 'mrr' | 'calendario' | 'gantt' | 'contabilita' | 'deleghe' | 'lab_idee' | 'spese' | 'personale'

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

  const tables = ['progetti', 'tasks', 'campagne', 'clienti', 'lab_idee', 'spese_correnti', 'personale', 'mrr_snapshots']

  useEffect(() => { loadAll() }, [])

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
    const c: any = { teal: 'bg-teal-100 text-teal-800', blue: 'bg-blue-100 text-blue-800', red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', gray: 'bg-gray-100 text-gray-600', green: 'bg-green-100 text-green-800', purple: 'bg-purple-100 text-purple-800' }
    return <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${c[color] || c.gray}`}>{text}</span>
  }

  const Card = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-sm transition-shadow ${onClick ? 'cursor-pointer hover:border-teal-300' : ''}`} onClick={onClick}>{children}</div>
  )

  const StatCard = ({ num, label, sub, color }: any) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`text-2xl font-semibold ${color || 'text-gray-900'}`}>{num}</div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
      <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">{sub}</div>
    </div>
  )

  const SH = ({ title, onAdd }: { title: string, onAdd?: () => void }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {onAdd && <button onClick={onAdd} className="px-3 py-1.5 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 font-medium">+ Aggiungi</button>}
    </div>
  )

  const Sep = ({ label }: { label: string }) => (
    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-5 mb-3 pb-2 border-b border-gray-100">{label}</div>
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
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {options ? <select id={id} value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"><option value="">Seleziona...</option>{options.map((o: string) => <option key={o}>{o}</option>)}</select>
        : <input id={id} type={type} value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />}
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

  const forms: any = {
    progetto: { title: 'Nuovo progetto', body: <><FI label="Nome" id="nome" placeholder="Nome progetto" /><FI label="Descrizione" id="descrizione" placeholder="Descrizione" /><div className="grid grid-cols-2 gap-2"><FI label="MRR (€/mo)" id="mrr" type="number" placeholder="0" /><FI label="Prezzo/mese (€)" id="prezzo" type="number" placeholder="0" /></div><div className="grid grid-cols-2 gap-2"><FI label="Beta clienti" id="clienti" type="number" placeholder="0" /><FI label="Priorità (1=max)" id="priorita" options={['1','2','3','4','5']} /></div><FI label="Stato" id="stato" options={['attivo','pausa','completato','pianificato']} /><FI label="Colore (hex)" id="colore" placeholder="#14B8A6" /></> },
    task: { title: 'Nuovo task', body: <><FI label="Titolo" id="titolo" placeholder="Cosa fare" /><FI label="Dettaglio" id="dettaglio" placeholder="Dettaglio" /><div className="grid grid-cols-2 gap-2"><FI label="Chi" id="chi" placeholder="Fabio / Lidia" /><FI label="Scadenza" id="scadenza" placeholder="gg/mm/aaaa" /></div><div className="grid grid-cols-2 gap-2"><FI label="Priorità (1=max)" id="priorita" options={['1','2','3','4','5']} /><FI label="Stato" id="stato" options={['aperto','in_corso','completato']} /></div></> },
    task_p: { title: `Task per ${selectedProject?.nome}`, body: <><FI label="Titolo" id="titolo" placeholder="Cosa fare" /><FI label="Dettaglio" id="dettaglio" placeholder="Dettaglio" /><div className="grid grid-cols-2 gap-2"><FI label="Chi" id="chi" placeholder="Fabio / Lidia" /><FI label="Scadenza" id="scadenza" placeholder="gg/mm/aaaa" /></div><FI label="Priorità (1=max)" id="priorita" options={['1','2','3','4','5']} /></> },
    campagna: { title: 'Nuova campagna', body: <><FI label="Nome" id="nome" placeholder="Nome campagna" /><div className="grid grid-cols-2 gap-2"><FI label="Tipo" id="tipo" options={['email','social','whatsapp','ads','evento','altro']} /><FI label="Canale" id="canale" placeholder="Brevo / TikTok / ..." /></div><FI label="Obiettivo" id="obiettivo" placeholder="es. 500 lead serramentisti" /><FI label="Stato" id="stato" options={['pianificata','attiva','pausa','completata']} /></> },
    cliente: { title: 'Nuovo contatto', body: <><FI label="Nome / Azienda" id="nome" placeholder="Nome" /><FI label="Ruolo" id="ruolo" placeholder="Ruolo" /><div className="grid grid-cols-2 gap-2"><FI label="Email" id="email" placeholder="email@..." /><FI label="Telefono" id="tel" placeholder="+39..." /></div><div className="grid grid-cols-2 gap-2"><FI label="Tipo" id="tipo" options={['Lead','Cliente','Partner','Fornitore']} /><FI label="Note" id="note" placeholder="Note" /></div></> },
    idea: { title: 'Nuova idea', body: <><FI label="Titolo" id="titolo" placeholder="Titolo idea" /><FI label="Descrizione" id="descrizione" placeholder="Descrizione" /><div className="grid grid-cols-2 gap-2"><FI label="Categoria" id="categoria" placeholder="SaaS / Marketing / ..." /><FI label="Chi" id="chi" placeholder="Fabio / Lidia" /></div><div className="grid grid-cols-2 gap-2"><FI label="Priorità (1=max)" id="priorita" options={['1','2','3','4','5']} /><FI label="Stato" id="stato" options={['aperto','in_corso','completato']} /></div></> },
    spesa: { title: 'Nuova voce finanziaria', body: <><FI label="Nome" id="nome" placeholder="es. Vercel Pro" /><div className="grid grid-cols-2 gap-2"><FI label="Importo €" id="importo" type="number" placeholder="0" /><FI label="Tipo" id="tipo" options={['uscita','entrata']} /></div><div className="grid grid-cols-2 gap-2"><FI label="Frequenza" id="freq" options={['mensile','annuale','una_tantum']} /><FI label="Categoria" id="cat" placeholder="Tech / Marketing..." /></div></> },
    p_task: { title: 'Task personale', body: <><FI label="Titolo" id="titolo" placeholder="Cosa fare" /><FI label="Contenuto" id="contenuto" placeholder="Dettaglio" /><div className="grid grid-cols-2 gap-2"><FI label="Priorità" id="priorita" options={['Alta','Media','Bassa']} /><FI label="Scadenza" id="scadenza" placeholder="gg/mm/aaaa" /></div><FI label="Stato" id="stato" options={['Aperto','In corso','Fatto']} /></> },
    p_note: { title: 'Nota personale', body: <><FI label="Titolo" id="titolo" placeholder="Titolo" /><FI label="Contenuto" id="contenuto" placeholder="Scrivi qui..." /><FI label="Tag" id="tag" placeholder="Tag" /></> },
    p_idee: { title: 'Idea personale', body: <><FI label="Titolo" id="titolo" placeholder="Titolo" /><FI label="Contenuto" id="contenuto" placeholder="Descrizione" /><div className="grid grid-cols-2 gap-2"><FI label="Priorità" id="priorita" options={['Alta','Media','Bassa']} /><FI label="Stato" id="stato" options={['Aperto','In corso','Fatto']} /></div></> },
  }

  const navItems = [
    { id: 'dashboard', iconKey: 'dashboard', label: 'Dashboard', section: 'Overview' },
    { id: 'progetti',  iconKey: 'projects',  label: 'Progetti',  section: 'Lavoro' },
    { id: 'task',      iconKey: 'tasks',     label: 'Task' },
    { id: 'deleghe',   iconKey: 'deleghe',   label: 'Deleghe' },
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
    mrr: 'MRR Tracker', calendario: 'Calendario', gantt: 'Gantt Timeline', contabilita: 'Contabilità', deleghe: 'Deleghe', lab_idee: 'Lab Idee', spese: 'Finanze', personale: 'La mia area'
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
    { id: 'dashboard', iconKey: 'dashboard', label: 'Home' },
    { id: 'progetti',  iconKey: 'projects',  label: 'Progetti' },
    { id: 'task',      iconKey: 'tasks',     label: 'Task' },
    { id: 'clienti',   iconKey: 'clients',   label: 'CRM' },
    { id: 'spese',     iconKey: 'finance',   label: 'Finanze' },
  ]

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
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ id: 'fabio', label: 'Fabio', initials: 'FA', color: '#0A8A7A' }, { id: 'lidia', label: 'Lidia', initials: 'LI', color: '#BE185D' }].map(u => (
                  <button key={u.id} onClick={() => setUser(u.id as User)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: 7, border: `1px solid ${user === u.id ? u.color + '40' : '#F0F0F0'}`, background: user === u.id ? u.color + '12' : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: user === u.id ? u.color : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: user === u.id ? '#fff' : '#9CA3AF', flexShrink: 0 }}>{u.initials}</div>
                    <span style={{ fontSize: 11.5, fontWeight: user === u.id ? 500 : 400, color: user === u.id ? u.color : '#6B7280' }}>{u.label}</span>
                  </button>
                ))}
              </div>
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
            {device.isMobile && (
              <button onClick={() => setUser(user === 'fabio' ? 'lidia' : 'fabio')} style={{ width: 28, height: 28, borderRadius: '50%', background: user === 'fabio' ? '#0A8A7A' : '#BE185D', border: 'none', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                {user === 'fabio' ? 'FA' : 'LI'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: device.isMobile ? '16px 16px 80px' : '28px 32px' }}>
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
              {tab === 'lab_idee' && renderLabIdee()}
              {tab === 'spese' && renderSpese()}
              {tab === 'personale' && <PersonaleView currentUser={user} />}
            </>
          }
        </div>

        {/* BOTTOM NAV — mobile only */}
        {device.isMobile && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#FFFFFF', borderTop: '1px solid #EFEFEF', display: 'flex', zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {bottomNavItems.map((item: any) => {
              const isActive = tab === item.id
              return (
                <button key={item.id} onClick={() => { setTab(item.id as Tab); setSelectedProject(null) }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0 6px', border: 'none', background: 'none', cursor: 'pointer', color: isActive ? '#0A8A7A' : '#9CA3AF' }}>
                  <span style={{ opacity: isActive ? 1 : 0.5 }}>{iconSvg(item.iconKey, isActive)}</span>
                  <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400, marginTop: 3, fontFamily: 'inherit' }}>{item.label}</span>
                </button>
              )
            })}
          </div>
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
      {/* Workspace Intelligence — floating button */}
      <WorkspacePanel utente={user} workspaceData={data} />

    </div>
  )
}
