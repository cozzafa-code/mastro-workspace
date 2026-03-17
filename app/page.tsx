'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProjectDetailView } from '@/components/ProjectDetail/ProjectDetailView'
import { CrmView } from '@/components/CRM/CrmView'
import { MrrTrackerView } from '@/components/MRR/MrrTrackerView'
import { CampagneProView } from '@/components/Campagne/CampagneProView'
import { TaskTimerView } from '@/components/Tasks/TaskTimerView'
import { FinanceRunwayView } from '@/components/Finance/FinanceRunwayView'
import { useDevice } from '@/hooks/useDevice'
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
  const device = useDevice()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    { id: 'dashboard', iconKey: 'dashboard', label: 'Dashboard', section: 'Overview' },
    { id: 'progetti',  iconKey: 'projects',  label: 'Progetti',  section: 'Lavoro' },
    { id: 'task',      iconKey: 'tasks',     label: 'Task' },
    { id: 'campagne',  iconKey: 'campaigns', label: 'Campagne' },
    { id: 'clienti',   iconKey: 'clients',   label: 'Pipeline CRM' },
    { id: 'mrr',       iconKey: 'mrr',       label: 'MRR Tracker', section: 'Metriche' },
    { id: 'lab_idee',  iconKey: 'ideas',     label: 'Lab Idee',    section: 'Idee' },
    { id: 'spese',     iconKey: 'finance',   label: 'Finanze',     section: 'Finanze' },
    { id: 'personale', iconKey: 'personal',  label: 'La mia area', section: 'Personale' },
  ]

  const tabTitles: any = {
    dashboard: 'Dashboard', progetti: selectedProject ? selectedProject.nome : 'Progetti',
    task: 'Task', campagne: 'Campagne', clienti: 'Pipeline CRM',
    mrr: 'MRR Tracker', lab_idee: 'Lab Idee', spese: 'Finanze', personale: 'La mia area'
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
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 9, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px 0' : '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: isActive ? '#EDF7F6' : 'transparent', color: isActive ? '#0A8A7A' : '#5C6370', fontSize: 13, fontWeight: isActive ? 500 : 400, marginBottom: 1, textAlign: 'left', fontFamily: 'inherit' }}>
                    <span style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }}>{iconSvg(item.iconKey, isActive)}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0F7F6', border: '1px solid #B2E8E3', borderRadius: 20, padding: '3px 8px 3px 6px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0A8A7A' }} />
              <span style={{ fontSize: device.isMobile ? 10 : 11.5, fontWeight: 500, color: '#0A8A7A' }}>live</span>
            </div>
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
              {tab === 'dashboard' && renderDashboard()}
              {tab === 'progetti' && renderProgetti()}
              {tab === 'task' && renderTask()}
              {tab === 'campagne' && renderCampagne()}
              {tab === 'clienti' && renderClienti()}
              {tab === 'mrr' && <MrrTrackerView />}
              {tab === 'lab_idee' && renderLabIdee()}
              {tab === 'spese' && renderSpese()}
              {tab === 'personale' && renderPersonale()}
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
    </div>
  )
}
