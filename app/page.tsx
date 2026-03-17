'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProjectDetailView } from '@/components/ProjectDetail/ProjectDetailView'
import { CrmView } from '@/components/CRM/CrmView'
import { MrrTrackerView } from '@/components/MRR/MrrTrackerView'
import type { UserType } from '@/lib/types'

type User = UserType
type Tab = 'dashboard' | 'progetti' | 'task' | 'campagne' | 'clienti' | 'mrr' | 'lab_idee' | 'spese' | 'personale'

export default function Home() {
  const [user, setUser] = useState<User>('fabio')
  const [tab, setTab] = useState<Tab>('dashboard')
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const [selectedProject, setSelectedProject] = useState<any>(null)

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
    return (
      <div>
        <div className="bg-[#0B1F2A] rounded-xl p-4 flex gap-3 items-center mb-6">
          <input className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-teal-400" placeholder="Chiedi alla AI segretaria... es: Cosa devo fare oggi?" id="ai-q" />
          <button onClick={() => { const q = (document.getElementById('ai-q') as HTMLInputElement)?.value; if (!q) return; const ctx = `MASTRO WORKSPACE — ${today} — ${user}\nProgetti: ${(data.progetti || []).map((p: any) => p.nome + ' MRR:€' + (p.mrr || 0) + ' stato:' + p.stato).join(' | ')}\nTask aperti: ${(data.tasks || []).filter((t: any) => t.stato !== 'completato').slice(0, 8).map((t: any) => (t.titolo || t.testo) + '(' + (t.chi || '') + ')').join(' | ')}\nMRR totale: €${totMRR}/mese\nDomanda: ${q}`; navigator.clipboard.writeText(ctx).then(() => alert('✓ Copiato! Incolla su Claude.')).catch(() => prompt('Copia:', ctx)) }} className="px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 font-medium whitespace-nowrap">Copia per Claude ↗</button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard num={String(taskAperti)} label="Task aperti" sub={`${urgenti.length} urgenti`} />
          <StatCard num={String(progAttivi)} label="Progetti attivi" sub={`su ${(data.progetti || []).length} totali`} />
          <StatCard num={`€${totMRR}`} label="MRR totale" sub="da tutti i progetti" color="text-green-600" />
          <StatCard num={`-€${totSpese}`} label="Spese/mese" sub="correnti" color="text-red-500" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Sep label="🔴 Task urgenti" />
            {urgenti.length === 0 ? <div className="text-xs text-gray-400 text-center py-4 bg-white border border-gray-200 rounded-xl">Nessun task urgente</div> :
              urgenti.map((t: any) => <Card key={t.id}><div className="flex items-start justify-between gap-2"><div><div className="text-sm font-medium">{t.titolo || t.testo}</div><div className="text-xs text-gray-500 mt-1">{t.progetto || ''}{t.scadenza ? ' · ' + t.scadenza : ''}</div></div><Badge text="Urgente" color="red" /></div><div className="mt-2 text-xs text-gray-400">{t.chi}</div></Card>)
            }
          </div>
          <div>
            <Sep label="🚀 Progetti" />
            {(data.progetti || []).slice(0, 5).map((p: any) => <Card key={p.id} onClick={() => { setSelectedProject(p); setTab('progetti') }}><div className="flex items-center justify-between gap-2 mb-2"><div className="flex items-center gap-2">{p.colore && <div className="w-3 h-3 rounded-full" style={{ background: p.colore }} />}<div className="text-sm font-medium">{p.nome}</div></div><Badge text={p.stato} color={sc(p.stato)} /></div><div className="flex gap-3"><span className="text-xs text-green-600 font-medium">€{p.mrr || 0}/mo</span><span className="text-xs text-gray-400">{p.beta_clienti || 0} clienti</span><span className="text-xs text-gray-400">€{p.prezzo || 0}/mo</span></div></Card>)}
          </div>
        </div>
      </div>
    )
  }

  function renderProgetti() {
    if (selectedProject) return (
      <ProjectDetailView
        progettoId={selectedProject.id}
        currentUser={user}
        onBack={() => setSelectedProject(null)}
      />
    )
    return (
      <div>
        <SH title="Tutti i progetti" onAdd={() => setShowForm('progetto')} />
        <div className="grid grid-cols-2 gap-4">
          {(data.progetti || []).map((p: any) => (
            <Card key={p.id} onClick={() => setSelectedProject(p)}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">{p.colore && <div className="w-4 h-4 rounded-full" style={{ background: p.colore }} />}<div className="text-sm font-semibold">{p.nome}</div></div>
                <div className="flex gap-1"><Badge text={p.stato} color={sc(p.stato)} /><button onClick={e => { e.stopPropagation(); deleteItem('progetti', p.id) }} className="text-xs text-gray-300 hover:text-red-400">✕</button></div>
              </div>
              <div className="text-xs text-gray-500 mb-3">{p.descrizione}</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="text-sm font-semibold text-green-600">€{p.mrr || 0}</div><div className="text-xs text-gray-400">MRR</div></div>
                <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="text-sm font-semibold text-blue-600">{p.beta_clienti || 0}</div><div className="text-xs text-gray-400">Clienti</div></div>
                <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="text-sm font-semibold text-purple-600">€{p.prezzo || 0}</div><div className="text-xs text-gray-400">Prezzo</div></div>
              </div>
              {p.repo && <div className="mt-2 text-xs text-gray-400">📦 {p.repo}</div>}
            </Card>
          ))}
        </div>
      </div>
    )
  }

  function renderTask() {
    const ap = (data.tasks || []).filter((t: any) => !t.stato || t.stato === 'aperto' || t.stato === 'Aperto')
    const ic = (data.tasks || []).filter((t: any) => t.stato === 'in_corso' || t.stato === 'In corso')
    const ft = (data.tasks || []).filter((t: any) => t.stato === 'completato' || t.stato === 'Fatto')
    const kCard = (t: any) => <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-3 mb-2"><div className="text-sm font-medium">{t.titolo || t.testo}</div>{t.dettaglio && <div className="text-xs text-gray-500 mt-1">{t.dettaglio}</div>}<div className="flex items-center gap-2 mt-2">{t.priorita && <Badge text={`P${t.priorita}`} color={pc(t.priorita)} />}<span className="text-xs text-gray-400">{t.chi}</span>{t.scadenza && <span className="text-xs text-gray-400">· {t.scadenza}</span>}<button onClick={() => deleteItem('tasks', t.id)} className="ml-auto text-xs text-gray-300 hover:text-red-400">✕</button></div></div>
    return (
      <div>
        <SH title="Task — Kanban" onAdd={() => setShowForm('task')} />
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"><div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📋 Aperti ({ap.length})</div>{ap.length === 0 ? <div className="text-xs text-gray-400 text-center py-3">Vuoto</div> : ap.map(kCard)}</div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"><div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">⚡ In corso ({ic.length})</div>{ic.length === 0 ? <div className="text-xs text-gray-400 text-center py-3">Vuoto</div> : ic.map(kCard)}</div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"><div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">✅ Completati ({ft.length})</div>{ft.length === 0 ? <div className="text-xs text-gray-400 text-center py-3">Vuoto</div> : ft.map((t: any) => <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-3 mb-2 opacity-50"><div className="text-sm font-medium line-through">{t.titolo || t.testo}</div><button onClick={() => deleteItem('tasks', t.id)} className="text-xs text-gray-300 hover:text-red-400 mt-1">✕</button></div>)}</div>
        </div>
      </div>
    )
  }

  function renderCampagne() {
    return (
      <div>
        <SH title="Campagne" onAdd={() => setShowForm('campagna')} />
        {(data.campagne || []).length === 0 ? <div className="text-center py-8 text-sm text-gray-400 bg-white border border-gray-200 rounded-xl">Nessuna campagna ancora</div> :
          (data.campagne || []).map((c: any) => <Card key={c.id}><div className="flex items-start justify-between gap-2"><div className="flex-1"><div className="text-sm font-medium">{c.nome}</div><div className="text-xs text-gray-500 mt-1">{c.tipo}{c.canale ? ' · ' + c.canale : ''}</div>{c.obiettivo && <div className="text-xs text-gray-400 mt-1">🎯 {c.obiettivo}</div>}</div><div className="flex gap-1">{c.stato && <Badge text={c.stato} color={sc(c.stato)} />}<button onClick={() => deleteItem('campagne', c.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button></div></div>{(c.leads_totali != null || c.email_inviate != null) && <div className="grid grid-cols-3 gap-2 mt-3"><div className="bg-gray-50 rounded-lg p-2 text-center"><div className="text-sm font-semibold">{c.leads_totali || 0}</div><div className="text-xs text-gray-400">Leads</div></div><div className="bg-gray-50 rounded-lg p-2 text-center"><div className="text-sm font-semibold">{c.email_inviate || 0}</div><div className="text-xs text-gray-400">Email</div></div><div className="bg-gray-50 rounded-lg p-2 text-center"><div className="text-sm font-semibold">{c.risposte || 0}</div><div className="text-xs text-gray-400">Risposte</div></div></div>}</Card>)
        }
      </div>
    )
  }

  function renderClienti() {
    return <CrmView currentUser={user} />
  }

  function renderLabIdee() {
    return (
      <div>
        <SH title="Lab Idee" onAdd={() => setShowForm('idea')} />
        {(data.lab_idee || []).length === 0 ? <div className="text-center py-8 text-sm text-gray-400 bg-white border border-gray-200 rounded-xl">Nessuna idea ancora</div> :
          (data.lab_idee || []).map((i: any) => <Card key={i.id}><div className="flex items-start justify-between gap-2"><div className="flex-1"><div className="text-sm font-medium">{i.titolo || i.nome}</div><div className="text-xs text-gray-500 mt-1">{i.descrizione || i.dettaglio}</div></div><div className="flex gap-1">{i.stato && <Badge text={i.stato} color={sc(i.stato)} />}{i.priorita && <Badge text={`P${i.priorita}`} color={pc(i.priorita)} />}<button onClick={() => deleteItem('lab_idee', i.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button></div></div><div className="flex gap-2 mt-2">{i.categoria && <Badge text={i.categoria} color="purple" />}{i.chi && <span className="text-xs text-gray-400">{i.chi}</span>}</div></Card>)
        }
      </div>
    )
  }

  function renderSpese() {
    const uscite = (data.spese_correnti || []).filter((s: any) => s.tipo !== 'entrata' && s.tipo !== 'Entrata')
    const entrate = (data.spese_correnti || []).filter((s: any) => s.tipo === 'entrata' || s.tipo === 'Entrata')
    const totE = entrate.reduce((a: number, s: any) => a + Number(s.importo || 0), 0)
    const totU = uscite.reduce((a: number, s: any) => a + Number(s.importo || 0), 0)
    return (
      <div>
        <SH title="Finanze" onAdd={() => setShowForm('spesa')} />
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard num={`€${totMRR}`} label="MRR da progetti" sub="ricorrente mensile" color="text-green-600" />
          <StatCard num={`+€${totE}`} label="Entrate correnti" sub="mensili" color="text-green-600" />
          <StatCard num={`-€${totU}`} label="Uscite correnti" sub="mensili" color="text-red-500" />
        </div>
        <Sep label="Uscite" />
        {uscite.map((s: any) => <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-100"><div><div className="text-sm text-gray-900">{s.nome || s.voce}</div><div className="text-xs text-gray-400">{s.categoria || s.cat} · {s.frequenza || s.freq}</div></div><div className="flex items-center gap-3"><span className="text-sm font-semibold text-red-500">-€{s.importo}</span><button onClick={() => deleteItem('spese_correnti', s.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button></div></div>)}
        {entrate.length > 0 && <><Sep label="Entrate" />{entrate.map((s: any) => <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-100"><div><div className="text-sm text-gray-900">{s.nome || s.voce}</div><div className="text-xs text-gray-400">{s.categoria || s.cat}</div></div><div className="flex items-center gap-3"><span className="text-sm font-semibold text-green-600">+€{s.importo}</span><button onClick={() => deleteItem('spese_correnti', s.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button></div></div>)}</>}
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center mt-4">
          <div className="text-xs text-gray-400 mb-1">Saldo mensile</div>
          <div className={`text-2xl font-semibold ${totMRR + totE - totU >= 0 ? 'text-green-600' : 'text-red-500'}`}>{totMRR + totE - totU >= 0 ? '+' : ''}€{totMRR + totE - totU}/mese</div>
        </div>
      </div>
    )
  }

  function renderPersonale() {
    const d = (data.personale || []).filter((p: any) => p.utente === user)
    const ac = user === 'fabio' ? 'bg-blue-500' : 'bg-rose-500'
    return (
      <div>
        <div className="mb-5"><div className="text-base font-semibold">Area di {user === 'fabio' ? 'Fabio' : 'Lidia'}</div><div className="text-xs text-gray-400 mt-1">Visibile solo a te</div></div>
        {['task','note','idee'].map(type => {
          const items = d.filter((p: any) => p.tipo_item === type)
          const labels: any = { task: 'Task personali', note: 'Note personali', idee: 'Idee personali' }
          return <div key={type}><div className="flex items-center justify-between mb-3 mt-5"><div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{labels[type]}</div><button onClick={() => setShowForm('p_' + type)} className={`px-3 py-1.5 ${ac} text-white text-xs rounded-lg font-medium`}>+ Aggiungi</button></div>{items.length === 0 ? <div className="text-xs text-gray-400 text-center py-4 bg-white border border-gray-200 rounded-xl">Nessun elemento</div> : items.map((item: any) => <Card key={item.id}><div className="flex items-start justify-between gap-2"><div className="flex-1"><div className="text-sm font-medium">{item.titolo}</div><div className="text-xs text-gray-500 mt-1">{item.contenuto}</div></div><div className="flex gap-1">{item.stato && <Badge text={item.stato} color={sc(item.stato)} />}<button onClick={() => deleteItem('personale', item.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button></div></div></Card>)}</div>
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
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', section: 'Generale' },
    { id: 'progetti', icon: '🚀', label: 'Progetti', section: 'Lavoro' },
    { id: 'task', icon: '✅', label: 'Task' },
    { id: 'campagne', icon: '📣', label: 'Campagne' },
    { id: 'clienti', icon: '👥', label: 'Clienti' },
    { id: 'lab_idee', icon: '💡', label: 'Lab Idee', section: 'Organizzazione' },
    { id: 'mrr', icon: '📈', label: 'MRR Tracker', section: 'Finanze' },
    { id: 'spese', icon: '💰', label: 'Finanze' },
    { id: 'personale', icon: '👤', label: 'La mia area', section: 'Personale' },
  ]

  const tabTitles: any = { dashboard: 'Dashboard', progetti: selectedProject ? selectedProject.nome : 'Progetti', task: 'Task', campagne: 'Campagne', clienti: 'Clienti', lab_idee: 'Lab Idee', spese: 'Finanze', personale: 'La mia area' }
  const cf = showForm ? forms[showForm] : null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div className="w-52 flex-shrink-0 flex flex-col overflow-y-auto" style={{ background: '#0B1F2A' }}>
        <div className="px-4 py-5 border-b border-white/10">
          <div className="text-white text-sm font-semibold leading-tight">MASTRO<br />WORKSPACE</div>
          <div className="text-white/40 text-xs mt-1">Fabio & Lidia</div>
        </div>
        <nav className="flex-1 px-2 py-3">
          {navItems.map((item: any) => (
            <div key={item.id}>
              {item.section && <div className="text-white/30 text-[9px] font-semibold uppercase tracking-widest px-2 pt-4 pb-1">{item.section}</div>}
              <button onClick={() => { setTab(item.id as Tab); setSelectedProject(null) }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all text-left ${tab === item.id ? 'bg-teal-500 text-white' : 'text-white/60 hover:bg-white/7 hover:text-white/90'}`}>
                <span className="text-base w-5 text-center">{item.icon}</span><span>{item.label}</span>
              </button>
            </div>
          ))}
        </nav>
        <div className="px-2 py-3 border-t border-white/10">
          <div className="flex gap-1.5">
            <button onClick={() => setUser('fabio')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${user === 'fabio' ? 'bg-teal-500 text-white' : 'text-white/60 border border-white/15 hover:bg-white/7'}`}>FA</button>
            <button onClick={() => setUser('lidia')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${user === 'lidia' ? 'bg-rose-500 text-white' : 'text-white/60 border border-white/15 hover:bg-white/7'}`}>LI</button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <h1 className="text-sm font-semibold text-gray-900">{tabTitles[tab]}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-medium">✓ fabio-os connesso</span>
            <span className="text-sm text-gray-400">{user === 'fabio' ? '👤 Fabio' : '👤 Lidia'}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? <div className="flex items-center justify-center h-full"><div className="text-sm text-gray-400">Caricamento da fabio-os...</div></div> : <>
            {tab === 'dashboard' && renderDashboard()}
            {tab === 'progetti' && renderProgetti()}
            {tab === 'task' && renderTask()}
            {tab === 'campagne' && renderCampagne()}
            {tab === 'clienti' && renderClienti()}
            {tab === 'mrr' && <MrrTrackerView />}
            {tab === 'lab_idee' && renderLabIdee()}
            {tab === 'spese' && renderSpese()}
            {tab === 'personale' && renderPersonale()}
          </>}
        </div>
      </div>

      {showForm && cf && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) { setShowForm(null); setForm({}) } }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="text-base font-semibold mb-4">{cf.title}</div>
            {cf.body}
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => { setShowForm(null); setForm({}) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
              <button onClick={handleSave} className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
