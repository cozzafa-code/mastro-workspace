'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type User = 'fabio' | 'lidia'
type Tab = 'dashboard' | 'agenda' | 'progetti' | 'task' | 'clienti' | 'idee' | 'note' | 'decisioni' | 'budget' | 'personale'

export default function Home() {
  const [user, setUser] = useState<User>('fabio')
  const [tab, setTab] = useState<Tab>('dashboard')
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})

  const tables = ['progetti', 'task', 'agenda', 'idee', 'note', 'decisioni', 'clienti', 'budget', 'personale']

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const results = await Promise.all(tables.map(t => supabase.from(t).select('*').order('created_at', { ascending: false })))
    const newData: any = {}
    tables.forEach((t, i) => { newData[t] = results[i].data || [] })
    setData(newData)
    setLoading(false)
  }

  async function addItem(table: string, item: any) {
    await supabase.from(table).insert(item)
    loadAll()
    setShowForm(null)
    setForm({})
  }

  async function deleteItem(table: string, id: string) {
    await supabase.from(table).delete().eq('id', id)
    loadAll()
  }

  const today = new Date().toLocaleDateString('it-IT')
  const taskAperti = (data.task || []).filter((t: any) => t.stato !== 'Fatto').length
  const progAttivi = (data.progetti || []).filter((p: any) => p.stato !== 'Completato').length
  const totE = (data.budget || []).filter((b: any) => b.tipo === 'Entrata').reduce((a: number, b: any) => a + Number(b.importo), 0)
  const totU = (data.budget || []).filter((b: any) => b.tipo === 'Uscita').reduce((a: number, b: any) => a + Number(b.importo), 0)

  const Badge = ({ text, color }: { text: string, color: string }) => {
    const colors: any = {
      teal: 'bg-teal-100 text-teal-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      amber: 'bg-amber-100 text-amber-800',
      gray: 'bg-gray-100 text-gray-600',
      green: 'bg-green-100 text-green-800',
    }
    return <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${colors[color] || colors.gray}`}>{text}</span>
  }

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-sm transition-shadow">{children}</div>
  )

  const StatCard = ({ num, label, sub, color }: { num: string, label: string, sub: string, color?: string }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`text-2xl font-semibold ${color || 'text-gray-900'}`}>{num}</div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
      <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">{sub}</div>
    </div>
  )

  const SectionHeader = ({ title, onAdd }: { title: string, onAdd: () => void }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <button onClick={onAdd} className="px-3 py-1.5 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 font-medium">+ Aggiungi</button>
    </div>
  )

  const Sep = ({ label }: { label: string }) => (
    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-5 mb-3 pb-2 border-b border-gray-100">{label}</div>
  )

  const prioBadge = (p: string) => p === 'Alta' ? 'red' : p === 'Media' ? 'amber' : 'gray'
  const statoBadge = (s: string) => s === 'Fatto' ? 'green' : s === 'In corso' ? 'blue' : 'gray'

  function renderDashboard() {
    const urgenti = (data.task || []).filter((t: any) => t.priorita === 'Alta' && t.stato !== 'Fatto').slice(0, 4)
    return (
      <div>
        <div className="bg-[#0B1F2A] rounded-xl p-4 flex gap-3 items-center mb-6">
          <input
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-teal-400"
            placeholder="Chiedi alla AI segretaria... es: Cosa devo fare oggi?"
            id="ai-q"
          />
          <button
            onClick={() => {
              const q = (document.getElementById('ai-q') as HTMLInputElement)?.value
              if (!q) return
              const ctx = `MASTRO WORKSPACE — ${today} — Utente: ${user}\nTask aperti: ${(data.task || []).filter((t: any) => t.stato !== 'Fatto').map((t: any) => t.titolo + ' (' + t.chi + ', ' + t.priorita + ')').join(' | ')}\nProgetti: ${(data.progetti || []).map((p: any) => p.nome + ' ' + p.progress + '%').join(' | ')}\n\nDomanda: ${q}`
              navigator.clipboard.writeText(ctx).then(() => alert('✓ Copiato! Incolla su Claude.')).catch(() => prompt('Copia:', ctx))
            }}
            className="px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 font-medium whitespace-nowrap"
          >
            Copia per Claude ↗
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard num={String(taskAperti)} label="Task aperti" sub={`${(data.task || []).filter((t: any) => t.priorita === 'Alta' && t.stato !== 'Fatto').length} urgenti`} />
          <StatCard num={String(progAttivi)} label="Progetti attivi" sub={`su ${(data.progetti || []).length} totali`} />
          <StatCard num={`+€${totE}`} label="Entrate/mese" sub={`Saldo: €${totE - totU >= 0 ? '+' : ''}${totE - totU}`} color="text-green-600" />
          <StatCard num={`-€${totU}`} label="Uscite/mese" sub="Tech + ops" color="text-red-500" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Sep label="🔴 Task urgenti" />
            {urgenti.map((t: any) => (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-2">
                  <div><div className="text-sm font-medium">{t.titolo}</div><div className="text-xs text-gray-500 mt-1">{t.prog} · {t.scadenza}</div></div>
                  <Badge text="Alta" color="red" />
                </div>
                <div className="mt-2 text-xs text-gray-400">{t.chi}</div>
              </Card>
            ))}
          </div>
          <div>
            <Sep label="🚀 Avanzamento progetti" />
            {(data.progetti || []).map((p: any) => (
              <Card key={p.id}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-sm font-medium">{p.nome}</div>
                  <Badge text={`${p.progress}%`} color="blue" />
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="mt-2 text-xs text-gray-400">{p.chi} · {p.scadenza}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderTask() {
    const ap = (data.task || []).filter((t: any) => t.stato === 'Aperto')
    const ic = (data.task || []).filter((t: any) => t.stato === 'In corso')
    const ft = (data.task || []).filter((t: any) => t.stato === 'Fatto')
    const KCol = ({ title, items, done }: { title: string, items: any[], done?: boolean }) => (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</div>
        {items.length === 0 ? <div className="text-xs text-gray-400 text-center py-4">Vuoto</div> : items.map((t: any) => (
          <div key={t.id} className={`bg-white border border-gray-200 rounded-lg p-3 mb-2 ${done ? 'opacity-50' : ''}`}>
            <div className={`text-sm font-medium ${done ? 'line-through' : ''}`}>{t.titolo}</div>
            <div className="text-xs text-gray-500 mt-1">{t.dettaglio}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge text={t.priorita} color={prioBadge(t.priorita)} />
              <span className="text-xs text-gray-400">{t.chi}</span>
              <button onClick={() => deleteItem('task', t.id)} className="ml-auto text-xs text-gray-300 hover:text-red-400">✕</button>
            </div>
          </div>
        ))}
      </div>
    )
    return (
      <div>
        <SectionHeader title="Task — Vista Kanban" onAdd={() => setShowForm('task')} />
        <div className="grid grid-cols-3 gap-4">
          <KCol title={`📋 Aperti (${ap.length})`} items={ap} />
          <KCol title={`⚡ In corso (${ic.length})`} items={ic} />
          <KCol title={`✅ Fatti (${ft.length})`} items={ft} done />
        </div>
      </div>
    )
  }

  function renderProgetti() {
    return (
      <div>
        <SectionHeader title="Progetti" onAdd={() => setShowForm('progetto')} />
        {(data.progetti || []).map((p: any) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm font-medium">{p.nome}</div>
                <div className="text-xs text-gray-500 mt-1">{p.descrizione}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge text={p.stato} color={statoBadge(p.stato)} />
                {p.priorita === 'Alta' && <Badge text="Urgente" color="red" />}
                <button onClick={() => deleteItem('progetti', p.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden my-2">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${p.progress}%` }} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">{p.chi} · {p.scadenza} · {p.progress}%</span>
              {p.milestone?.map((m: string) => <Badge key={m} text={m} color="gray" />)}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  function renderAgenda() {
    const now = new Date(); const y = now.getFullYear(), m = now.getMonth()
    const fd = new Date(y, m, 1).getDay(); const dim = new Date(y, m + 1, 0).getDate()
    const giorni = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
    return (
      <div>
        <SectionHeader title={`📅 ${mesi[m]} ${y}`} onAdd={() => setShowForm('agenda')} />
        <Card>
          <div className="grid grid-cols-7 gap-1">
            {giorni.map(g => <div key={g} className="text-center text-xs text-gray-400 py-1 font-medium">{g}</div>)}
            {Array(fd).fill(null).map((_, i) => <div key={i} />)}
            {Array(dim).fill(null).map((_, i) => {
              const d = i + 1; const isT = d === now.getDate()
              const ds = String(d).padStart(2, '0') + '/' + String(m + 1).padStart(2, '0') + '/' + y
              const hE = (data.agenda || []).some((a: any) => a.data === ds)
              return <div key={d} className={`text-center py-1.5 rounded-lg text-xs cursor-pointer ${isT ? 'bg-teal-500 text-white font-semibold' : hE ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>{d}</div>
            })}
          </div>
        </Card>
        <Sep label="Prossimi eventi" />
        {(data.agenda || []).map((a: any) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between gap-2">
              <div><div className="text-sm font-medium">{a.titolo}</div><div className="text-xs text-gray-500 mt-1">{a.data}{a.ora ? ' alle ' + a.ora : ''}</div></div>
              <div className="flex items-center gap-2"><Badge text={a.tipo} color="teal" /><span className="text-xs text-gray-400">{a.chi}</span><button onClick={() => deleteItem('agenda', a.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  function renderSimpleList(tableKey: string, titleField: string, subField: string, formKey: string, badgeField?: string, badgeColorFn?: (v: string) => string) {
    return (
      <div>
        <SectionHeader title={tableKey.charAt(0).toUpperCase() + tableKey.slice(1)} onAdd={() => setShowForm(formKey)} />
        {(data[tableKey] || []).length === 0 ? <div className="text-center py-8 text-sm text-gray-400 bg-white border border-gray-200 rounded-xl">Nessun elemento ancora</div> : (data[tableKey] || []).map((item: any) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1"><div className="text-sm font-medium">{item[titleField]}</div><div className="text-xs text-gray-500 mt-1">{item[subField]}</div></div>
              <div className="flex items-center gap-2">
                {badgeField && item[badgeField] && <Badge text={item[badgeField]} color={badgeColorFn ? badgeColorFn(item[badgeField]) : 'gray'} />}
                <button onClick={() => deleteItem(tableKey, item.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {item.chi && <span className="text-xs text-gray-400">{item.chi}</span>}
              {item.tag && <Badge text={item.tag} color="blue" />}
              {item.cat && <Badge text={item.cat} color="teal" />}
              {item.created_at && <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString('it-IT')}</span>}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  function renderClienti() {
    const colors = [['bg-blue-100', 'text-blue-800'], ['bg-rose-100', 'text-rose-800'], ['bg-green-100', 'text-green-800'], ['bg-purple-100', 'text-purple-800']]
    return (
      <div>
        <SectionHeader title="Clienti & Contatti" onAdd={() => setShowForm('cliente')} />
        {(data.clienti || []).map((c: any, i: number) => {
          const init = c.nome.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
          const col = colors[i % colors.length]
          return (
            <Card key={c.id}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${col[0]} ${col[1]}`}>{init}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.nome}</div>
                  <div className="text-xs text-gray-500">{c.ruolo}{c.nota ? ' — ' + c.nota : ''}</div>
                  <div className="text-xs text-gray-400 mt-1">{c.email !== '-' ? c.email : ''}{c.tel !== '-' ? ' · ' + c.tel : ''}</div>
                </div>
                <div className="flex flex-col items-end gap-1"><Badge text={c.tipo} color="teal" /><button onClick={() => deleteItem('clienti', c.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button></div>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  function renderBudget() {
    const e = (data.budget || []).filter((b: any) => b.tipo === 'Entrata')
    const u = (data.budget || []).filter((b: any) => b.tipo === 'Uscita')
    return (
      <div>
        <SectionHeader title="Budget" onAdd={() => setShowForm('budget')} />
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard num={`+€${totE}/mese`} label="Entrate mensili" sub="" color="text-green-600" />
          <StatCard num={`-€${totU}/mese`} label="Uscite mensili" sub="" color="text-red-500" />
        </div>
        <Sep label="Entrate" />
        {e.map((b: any) => <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-gray-100"><div><div className="text-sm text-gray-900">{b.voce}</div><div className="text-xs text-gray-400">{b.cat} · {b.freq}</div></div><div className="flex items-center gap-3"><span className="text-sm font-semibold text-green-600">+€{b.importo}</span><button onClick={() => deleteItem('budget', b.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button></div></div>)}
        <Sep label="Uscite" />
        {u.map((b: any) => <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-gray-100"><div><div className="text-sm text-gray-900">{b.voce}</div><div className="text-xs text-gray-400">{b.cat} · {b.freq}</div></div><div className="flex items-center gap-3"><span className="text-sm font-semibold text-red-500">-€{b.importo}</span><button onClick={() => deleteItem('budget', b.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button></div></div>)}
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center mt-4">
          <div className="text-xs text-gray-400 mb-1">Saldo mensile</div>
          <div className={`text-2xl font-semibold ${totE - totU >= 0 ? 'text-green-600' : 'text-red-500'}`}>{totE - totU >= 0 ? '+' : ''}€{totE - totU}/mese</div>
        </div>
      </div>
    )
  }

  function renderPersonale() {
    const d = (data.personale || []).filter((p: any) => p.utente === user)
    const items = (type: string) => d.filter((p: any) => p.tipo_item === type)
    const labels: any = { task: 'Task personali', note: 'Note personali', idee: 'Idee personali' }
    const accentColor = user === 'fabio' ? 'bg-blue-500' : 'bg-rose-500'
    return (
      <div>
        <div className="mb-5"><div className="text-base font-semibold">Area di {user === 'fabio' ? 'Fabio' : 'Lidia'}</div><div className="text-xs text-gray-400 mt-1">Visibile solo a te</div></div>
        {['task', 'note', 'idee'].map(type => (
          <div key={type}>
            <div className="flex items-center justify-between mb-3 mt-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{labels[type]}</div>
              <button onClick={() => setShowForm('p_' + type)} className={`px-3 py-1.5 ${accentColor} text-white text-xs rounded-lg font-medium`}>+ Aggiungi</button>
            </div>
            {items(type).length === 0 ? <div className="text-xs text-gray-400 text-center py-4 bg-white border border-gray-200 rounded-xl">Nessun elemento</div> : items(type).map((item: any) => (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1"><div className="text-sm font-medium">{item.titolo}</div><div className="text-xs text-gray-500 mt-1">{item.contenuto}</div></div>
                  <div className="flex gap-1 items-start">
                    {item.stato && <Badge text={item.stato} color={statoBadge(item.stato)} />}
                    {item.priorita && <Badge text={item.priorita} color={prioBadge(item.priorita)} />}
                    <button onClick={() => deleteItem('personale', item.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </div>
    )
  }

  const FI = ({ label, id, placeholder, type = 'text', options }: any) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {options ? (
        <select id={id} value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400">
          {options.map((o: string) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input id={id} type={type} value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />
      )}
    </div>
  )

  const FormWrap = ({ title, onSave }: { title: string, onSave: () => void }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowForm(null) }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="text-base font-semibold mb-4">{title}</div>
        {showForm === 'task' && <>
          <FI label="Task" id="titolo" placeholder="Cosa fare" />
          <FI label="Dettaglio" id="dettaglio" placeholder="Dettaglio" />
          <div className="grid grid-cols-2 gap-2">
            <FI label="Progetto" id="prog" placeholder="MASTRO / Famiglia..." />
            <FI label="Chi" id="chi" placeholder="Fabio / Lidia" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FI label="Priorità" id="priorita" options={['Alta', 'Media', 'Bassa']} />
            <FI label="Scadenza" id="scadenza" placeholder="gg/mm/aaaa" />
          </div>
          <FI label="Stato" id="stato" options={['Aperto', 'In corso', 'Fatto']} />
        </>}
        {showForm === 'agenda' && <>
          <FI label="Titolo" id="titolo" placeholder="Evento" />
          <div className="grid grid-cols-2 gap-2">
            <FI label="Data" id="data" placeholder="gg/mm/aaaa" />
            <FI label="Ora" id="ora" placeholder="09:00" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FI label="Tipo" id="tipo" placeholder="MASTRO / Famiglia..." />
            <FI label="Chi" id="chi" placeholder="Fabio / Lidia" />
          </div>
        </>}
        {showForm === 'progetto' && <>
          <FI label="Nome" id="nome" placeholder="Nome progetto" />
          <FI label="Descrizione" id="descrizione" placeholder="Descrizione" />
          <div className="grid grid-cols-2 gap-2">
            <FI label="Chi" id="chi" placeholder="Fabio / Lidia" />
            <FI label="Scadenza" id="scadenza" placeholder="gg/mm/aaaa" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FI label="Fase" id="fase" placeholder="Sviluppo / Lancio..." />
            <FI label="Avanzamento %" id="progress" type="number" placeholder="0" />
          </div>
          <FI label="Stato" id="stato" options={['In corso', 'Completato', 'In pausa']} />
        </>}
        {showForm === 'idea' && <>
          <FI label="Titolo" id="titolo" placeholder="Titolo idea" />
          <FI label="Dettaglio" id="dettaglio" placeholder="Descrizione" />
          <div className="grid grid-cols-2 gap-2">
            <FI label="Categoria" id="cat" placeholder="MASTRO / Famiglia..." />
            <FI label="Chi" id="chi" placeholder="Fabio / Lidia" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FI label="Priorità" id="priorita" options={['Alta', 'Media', 'Bassa']} />
            <FI label="Stato" id="stato" options={['Aperto', 'In corso', 'Fatto']} />
          </div>
        </>}
        {showForm === 'nota' && <>
          <FI label="Titolo" id="titolo" placeholder="Titolo" />
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Contenuto</label>
            <textarea value={form.contenuto || ''} onChange={e => setForm({ ...form, contenuto: e.target.value })} placeholder="Scrivi qui..." rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FI label="Tag" id="tag" placeholder="Tecnico / Business..." />
            <FI label="Chi" id="chi" placeholder="Fabio / Lidia" />
          </div>
        </>}
        {showForm === 'decisione' && <>
          <FI label="Decisione" id="decisione" placeholder="Cosa abbiamo deciso" />
          <FI label="Motivazione" id="motivazione" placeholder="Perché" />
          <FI label="Alternative scartate" id="alternative" placeholder="Cosa abbiamo scartato" />
          <FI label="Chi" id="chi" placeholder="Fabio / Lidia / Fabio & Lidia" />
        </>}
        {showForm === 'cliente' && <>
          <FI label="Nome / Azienda" id="nome" placeholder="Nome" />
          <FI label="Ruolo" id="ruolo" placeholder="Ruolo" />
          <div className="grid grid-cols-2 gap-2">
            <FI label="Email" id="email" placeholder="email@..." />
            <FI label="Telefono" id="tel" placeholder="+39..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FI label="Tipo" id="tipo" options={['Cliente', 'Partner', 'Fornitore', 'Lead']} />
            <FI label="Note" id="nota" placeholder="Note" />
          </div>
        </>}
        {showForm === 'budget' && <>
          <FI label="Voce" id="voce" placeholder="Es. Vercel Pro" />
          <div className="grid grid-cols-2 gap-2">
            <FI label="Importo €" id="importo" type="number" placeholder="0" />
            <FI label="Tipo" id="tipo" options={['Uscita', 'Entrata']} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FI label="Frequenza" id="freq" options={['Mensile', 'Annuale', 'Una tantum']} />
            <FI label="Categoria" id="cat" placeholder="Tech / Marketing..." />
          </div>
        </>}
        {showForm?.startsWith('p_') && <>
          <FI label="Titolo" id="titolo" placeholder="Titolo" />
          <FI label="Contenuto / Dettaglio" id="contenuto" placeholder="Descrizione" />
          {showForm === 'p_task' && <>
            <div className="grid grid-cols-2 gap-2">
              <FI label="Priorità" id="priorita" options={['Alta', 'Media', 'Bassa']} />
              <FI label="Scadenza" id="scadenza" placeholder="gg/mm/aaaa" />
            </div>
            <FI label="Stato" id="stato" options={['Aperto', 'In corso', 'Fatto']} />
          </>}
          {showForm === 'p_idee' && <>
            <div className="grid grid-cols-2 gap-2">
              <FI label="Priorità" id="priorita" options={['Alta', 'Media', 'Bassa']} />
              <FI label="Stato" id="stato" options={['Aperto', 'In corso', 'Fatto']} />
            </div>
          </>}
          {showForm === 'p_note' && <FI label="Tag" id="tag" placeholder="Tag" />}
        </>}
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={() => { setShowForm(null); setForm({}) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Annulla</button>
          <button onClick={onSave} className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600">Salva</button>
        </div>
      </div>
    </div>
  )

  function handleSave() {
    const f = form
    const t = today
    if (showForm === 'task') addItem('task', { titolo: f.titolo, dettaglio: f.dettaglio, prog: f.prog, chi: f.chi, priorita: f.priorita || 'Media', scadenza: f.scadenza, stato: f.stato || 'Aperto' })
    else if (showForm === 'agenda') addItem('agenda', { titolo: f.titolo, data: f.data, ora: f.ora, tipo: f.tipo, chi: f.chi })
    else if (showForm === 'progetto') addItem('progetti', { nome: f.nome, descrizione: f.descrizione, chi: f.chi, scadenza: f.scadenza, fase: f.fase, progress: parseInt(f.progress) || 0, stato: f.stato || 'In corso', priorita: 'Media', milestone: [] })
    else if (showForm === 'idea') addItem('idee', { titolo: f.titolo, dettaglio: f.dettaglio, cat: f.cat, chi: f.chi, priorita: f.priorita || 'Media', stato: f.stato || 'Aperto' })
    else if (showForm === 'nota') addItem('note', { titolo: f.titolo, contenuto: f.contenuto, tag: f.tag, chi: f.chi })
    else if (showForm === 'decisione') addItem('decisioni', { decisione: f.decisione, motivazione: f.motivazione, alternative: f.alternative, chi: f.chi })
    else if (showForm === 'cliente') addItem('clienti', { nome: f.nome, ruolo: f.ruolo, email: f.email || '-', tel: f.tel || '-', tipo: f.tipo || 'Cliente', nota: f.nota })
    else if (showForm === 'budget') addItem('budget', { voce: f.voce, importo: parseFloat(f.importo) || 0, tipo: f.tipo || 'Uscita', freq: f.freq || 'Mensile', cat: f.cat })
    else if (showForm?.startsWith('p_')) {
      const tipo_item = showForm.replace('p_', '')
      addItem('personale', { utente: user, tipo_item, titolo: f.titolo, contenuto: f.contenuto, tag: f.tag, priorita: f.priorita, stato: f.stato, scadenza: f.scadenza })
    }
  }

  const navItems: { id: Tab, icon: string, label: string, section?: string }[] = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', section: 'Generale' },
    { id: 'agenda', icon: '📅', label: 'Agenda' },
    { id: 'progetti', icon: '🚀', label: 'Progetti', section: 'Lavoro' },
    { id: 'task', icon: '✅', label: 'Task' },
    { id: 'clienti', icon: '👥', label: 'Clienti' },
    { id: 'idee', icon: '💡', label: 'Idee', section: 'Organizzazione' },
    { id: 'note', icon: '📝', label: 'Note' },
    { id: 'decisioni', icon: '🔑', label: 'Decisioni' },
    { id: 'budget', icon: '💰', label: 'Budget', section: 'Finanze' },
    { id: 'personale', icon: '👤', label: 'La mia area', section: 'Personale' },
  ]

  const tabTitles: any = { dashboard: 'Dashboard', agenda: 'Agenda', progetti: 'Progetti', task: 'Task', clienti: 'Clienti & Contatti', idee: 'Idee', note: 'Note', decisioni: 'Decisioni', budget: 'Budget', personale: 'La mia area' }
  const formTitles: any = { task: 'Nuovo task', agenda: 'Nuovo evento', progetto: 'Nuovo progetto', idea: 'Nuova idea', nota: 'Nuova nota', decisione: 'Nuova decisione', cliente: 'Nuovo contatto', budget: 'Nuova voce budget', p_task: 'Task personale', p_note: 'Nota personale', p_idee: 'Idea personale' }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 flex flex-col overflow-y-auto" style={{ background: '#0B1F2A' }}>
        <div className="px-4 py-5 border-b border-white/10">
          <div className="text-white text-sm font-semibold leading-tight">MASTRO<br />WORKSPACE</div>
          <div className="text-white/40 text-xs mt-1">Fabio & Lidia</div>
        </div>
        <nav className="flex-1 px-2 py-3">
          {navItems.map(item => (
            <div key={item.id}>
              {item.section && <div className="text-white/30 text-[9px] font-semibold uppercase tracking-widest px-2 pt-4 pb-1">{item.section}</div>}
              <button onClick={() => setTab(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all text-left ${tab === item.id ? 'bg-teal-500 text-white' : 'text-white/60 hover:bg-white/7 hover:text-white/90'}`}>
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
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

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <h1 className="text-sm font-semibold text-gray-900">{tabTitles[tab]}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-medium">✓ Supabase connesso</span>
            <span className="text-sm text-gray-400">{user === 'fabio' ? '👤 Fabio' : '👤 Lidia'}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-gray-400">Caricamento...</div>
            </div>
          ) : (
            <>
              {tab === 'dashboard' && renderDashboard()}
              {tab === 'task' && renderTask()}
              {tab === 'progetti' && renderProgetti()}
              {tab === 'agenda' && renderAgenda()}
              {tab === 'clienti' && renderClienti()}
              {tab === 'idee' && renderSimpleList('idee', 'titolo', 'dettaglio', 'idea', 'priorita', prioBadge)}
              {tab === 'note' && renderSimpleList('note', 'titolo', 'contenuto', 'nota')}
              {tab === 'decisioni' && renderSimpleList('decisioni', 'decisione', 'motivazione', 'decisione')}
              {tab === 'budget' && renderBudget()}
              {tab === 'personale' && renderPersonale()}
            </>
          )}
        </div>
      </div>

      {showForm && <FormWrap title={formTitles[showForm] || 'Nuovo elemento'} onSave={handleSave} />}
    </div>
  )
}
