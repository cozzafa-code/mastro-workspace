// components/Preventivi/PreventiviView.tsx
'use client'
import { FC, useState, useCallback, useEffect } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'
import { useDevice } from '@/hooks/useDevice'

const S = DS.colors

interface Voce {
  id: string
  descrizione: string
  qty: number
  prezzo_unit: number
  totale: number
}

interface Preventivo {
  id: string
  numero?: string
  titolo: string
  cliente_nome?: string
  cliente_email?: string
  stato: string
  valore_totale?: number
  valore_netto?: number
  iva_pct?: number
  scadenza?: string
  note?: string
  note_interne?: string
  voci?: string
  firma_url?: string
  firmato_il?: string
  firmato_da?: string
  creato_da?: string
  created_at?: string
}

const STATI = ['bozza','inviato','accettato','rifiutato','scaduto']
const STATO_CFG: Record<string, { bg: string; color: string }> = {
  bozza:     { bg: S.borderLight, color: S.textMuted },
  inviato:   { bg: S.blueLight,   color: S.blue },
  accettato: { bg: S.greenLight,  color: S.green },
  rifiutato: { bg: S.redLight,    color: S.red },
  scaduto:   { bg: '#FEF3C7',     color: '#B45309' },
}

// ── Voce Editor ───────────────────────────────────────────
const VociEditor: FC<{ voci: Voce[]; onChange: (v: Voce[]) => void }> = ({ voci, onChange }) => {
  const add = () => onChange([...voci, { id: Date.now().toString(), descrizione: '', qty: 1, prezzo_unit: 0, totale: 0 }])
  const update = (i: number, field: keyof Voce, val: any) => {
    const updated = voci.map((v, idx) => {
      if (idx !== i) return v
      const newV = { ...v, [field]: val }
      if (field === 'qty' || field === 'prezzo_unit') newV.totale = Number(newV.qty) * Number(newV.prezzo_unit)
      return newV
    })
    onChange(updated)
  }
  const remove = (i: number) => onChange(voci.filter((_, idx) => idx !== i))
  const totale = voci.reduce((a, v) => a + (v.totale || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Voci preventivo</label>
        <button onClick={add} style={{ fontSize: 11, color: S.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DS.fonts.ui, fontWeight: 600 }}>+ Voce</button>
      </div>
      {voci.map((v, i) => (
        <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <input value={v.descrizione} onChange={e => update(i, 'descrizione', e.target.value)} placeholder="Descrizione voce"
            style={{ padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.ui }} />
          <input type="number" value={v.qty} onChange={e => update(i, 'qty', Number(e.target.value))} placeholder="Qty"
            style={{ padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.mono, textAlign: 'center' }} />
          <input type="number" value={v.prezzo_unit} onChange={e => update(i, 'prezzo_unit', Number(e.target.value))} placeholder="€"
            style={{ padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.mono }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: S.green, fontFamily: DS.fonts.mono, textAlign: 'right' }}>€{v.totale.toLocaleString('it-IT')}</div>
          <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 14 }}>✕</button>
        </div>
      ))}
      {voci.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: `1px solid ${S.border}`, marginTop: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary }}>Totale netto: <span style={{ color: S.green, fontFamily: DS.fonts.mono }}>€{totale.toLocaleString('it-IT')}</span></span>
        </div>
      )}
    </div>
  )
}

// ── Preventivo Editor Modal ───────────────────────────────
const PreventivoForm: FC<{ prev?: Preventivo; clienti: any[]; progetti: any[]; currentUser: string; onSave: (p: any) => void; onClose: () => void }> = ({ prev, clienti, progetti, currentUser, onSave, onClose }) => {
  const [form, setForm] = useState<any>(prev || { stato: 'bozza', iva_pct: 22, creato_da: currentUser })
  const [voci, setVoci] = useState<Voce[]>(() => {
    try { return JSON.parse(prev?.voci || '[]') } catch { return [] }
  })

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const netto = voci.reduce((a, v) => a + v.totale, 0)
  const iva = netto * (Number(form.iva_pct) || 22) / 100
  const totale = netto + iva

  const handleSave = () => {
    onSave({ ...form, voci: JSON.stringify(voci), valore_netto: netto, valore_totale: totale })
  }

  const FI = ({ label, k, placeholder, type = 'text', options }: { label: string; k: string; placeholder?: string; type?: string; options?: string[] }) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</label>
      {options
        ? <select value={form[k] || ''} onChange={e => set(k, e.target.value)} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui }}>
            <option value="">—</option>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        : <input type={type} value={form[k] || ''} onChange={e => set(k, e.target.value)} placeholder={placeholder}
            style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
      }
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: '16px', overflowY: 'auto', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: S.surface, borderRadius: 14, padding: 28, width: '100%', maxWidth: 680, boxShadow: DS.shadow.xl, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary }}>{prev ? 'Modifica preventivo' : 'Nuovo preventivo'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
          <FI label="Titolo *" k="titolo" placeholder="es. Preventivo serramenti villa..." />
          <FI label="Stato" k="stato" options={STATI} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>Cliente</label>
            <select value={form.cliente_id || ''} onChange={e => {
              const c = clienti.find(x => x.id === e.target.value)
              set('cliente_id', e.target.value)
              set('cliente_nome', c?.nome || '')
              set('cliente_email', c?.email || '')
            }} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui }}>
              <option value="">Seleziona o scrivi sotto</option>
              {clienti.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <FI label="Email cliente" k="cliente_email" placeholder="email@cliente.it" />
        </div>

        {!form.cliente_id && <FI label="Nome cliente (libero)" k="cliente_nome" placeholder="Nome cliente o azienda" />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          <FI label="Scadenza" k="scadenza" type="date" />
          <FI label="IVA %" k="iva_pct" type="number" placeholder="22" />
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>Progetto</label>
            <select value={form.progetto_id || ''} onChange={e => { const p = progetti.find((x: any) => x.id === e.target.value); set('progetto_id', e.target.value); set('progetto_nome', p?.nome || '') }}
              style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui }}>
              <option value="">—</option>
              {progetti.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <VociEditor voci={voci} onChange={setVoci} />
        </div>

        {/* Riepilogo totali */}
        <div style={{ background: S.background, borderRadius: 9, padding: '12px 16px', marginBottom: 16, border: `1px solid ${S.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: S.textSecondary }}>Imponibile</span>
            <span style={{ fontSize: 12, fontFamily: DS.fonts.mono }}>€{netto.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: S.textSecondary }}>IVA {form.iva_pct || 22}%</span>
            <span style={{ fontSize: 12, fontFamily: DS.fonts.mono }}>€{iva.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: `1px solid ${S.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary }}>Totale</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: S.green, fontFamily: DS.fonts.mono }}>€{totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <FI label="Note per il cliente" k="note" placeholder="Note visibili nel preventivo..." />
        <FI label="Note interne" k="note_interne" placeholder="Note private (non visibili al cliente)" />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 16, borderTop: `1px solid ${S.borderLight}` }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
          <button onClick={handleSave} style={{ padding: '8px 24px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: DS.fonts.ui }}>Salva preventivo</button>
        </div>
      </div>
    </div>
  )
}

// ── Preventivo Card ───────────────────────────────────────
const PreventivoCard: FC<{ p: Preventivo; onClick: () => void; onDelete: () => void }> = ({ p, onClick, onDelete }) => {
  const cfg = STATO_CFG[p.stato] || STATO_CFG.bozza
  const oggi = new Date().toISOString().split('T')[0]
  const scaduto = p.scadenza && p.scadenza < oggi && p.stato !== 'accettato'
  const [pdfLoading, setPdfLoading] = useState(false)

  const downloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setPdfLoading(true)
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'preventivo', id: p.id }),
      })
      const html = await res.text()
      // Apri in nuova tab per stampa/salvataggio
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
      }
    } catch (e) {
      console.error(e)
    }
    setPdfLoading(false)
  }

  return (
    <div onClick={onClick} style={{ background: S.surface, border: `1px solid ${scaduto ? S.red + '40' : S.border}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', borderLeft: `3px solid ${cfg.color}`, transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = DS.shadow.md }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = scaduto ? S.red + '40' : S.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary, marginBottom: 3 }}>{p.titolo}</div>
          {p.cliente_nome && <div style={{ fontSize: 12, color: S.textSecondary }}>{p.cliente_nome}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
          <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{p.stato}</span>
          <button onClick={downloadPdf} disabled={pdfLoading} title="Scarica PDF"
            style={{ padding: '5px 8px', background: S.background, border: `1px solid ${S.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 12, color: S.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
            {pdfLoading ? '...' : '📄'} PDF
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 13 }}>✕</button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {p.valore_totale && <span style={{ fontSize: 16, fontWeight: 700, color: p.stato === 'accettato' ? S.green : S.textPrimary, fontFamily: DS.fonts.mono }}>€{Number(p.valore_totale).toLocaleString('it-IT')}</span>}
          {p.firma_url && <span style={{ fontSize: 10, background: S.greenLight, color: S.green, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>✓ Firmato</span>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {p.scadenza && <span style={{ fontSize: 11, color: scaduto ? S.red : S.textMuted }}>Scade: {new Date(p.scadenza).toLocaleDateString('it-IT')}</span>}
          {p.created_at && <span style={{ fontSize: 10, color: S.textMuted }}>{new Date(p.created_at).toLocaleDateString('it-IT')}</span>}
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────
export const PreventiviView: FC<{ currentUser: string; clienti: any[]; progetti: any[] }> = ({ currentUser, clienti, progetti }) => {
  const device = useDevice()
  const [preventivi, setPreventivi] = useState<Preventivo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Preventivo | undefined>()
  const [filtroStato, setFiltroStato] = useState('tutti')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('preventivi').select('*').order('created_at', { ascending: false })
    setPreventivi(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (form: any) => {
    if (editing?.id) {
      await supabase.from('preventivi').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      const count = preventivi.length + 1
      const anno = new Date().getFullYear()
      await supabase.from('preventivi').insert({ ...form, numero: `PREV-${anno}-${String(count).padStart(3,'0')}` })
    }
    setShowForm(false); setEditing(undefined); load()
  }

  const del = async (id: string) => { await supabase.from('preventivi').delete().eq('id', id); load() }

  const updateStato = async (id: string, stato: string) => {
    const update: any = { stato, updated_at: new Date().toISOString() }
    if (stato === 'accettato') update.accettato_il = new Date().toISOString()
    await supabase.from('preventivi').update(update).eq('id', id)
    load()
  }

  const filtered = filtroStato === 'tutti' ? preventivi : preventivi.filter(p => p.stato === filtroStato)

  const totAccettati = preventivi.filter(p => p.stato === 'accettato').reduce((a, p) => a + (Number(p.valore_totale) || 0), 0)
  const totInviati = preventivi.filter(p => p.stato === 'inviato').reduce((a, p) => a + (Number(p.valore_totale) || 0), 0)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento...</span></div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Preventivi</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{preventivi.length} preventivi · {preventivi.filter(p => p.stato === 'accettato').length} accettati</div>
        </div>
        <button onClick={() => { setEditing(undefined); setShowForm(true) }}
          style={{ padding: '8px 18px', background: S.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          + Preventivo
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: device.isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { v: preventivi.length, l: 'Totali', c: S.textPrimary },
          { v: preventivi.filter(p => p.stato === 'inviato').length, l: 'In attesa', c: S.blue },
          { v: preventivi.filter(p => p.stato === 'accettato').length, l: 'Accettati', c: S.green },
          { v: `€${totAccettati.toLocaleString('it-IT')}`, l: 'Valore accettato', c: S.green },
        ].map((k, i) => (
          <div key={i} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.md, padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.c, fontFamily: DS.fonts.mono }}>{k.v}</div>
            <div style={{ fontSize: 11, color: S.textSecondary, marginTop: 4, fontWeight: 600 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['tutti', ...STATI].map(s => (
          <button key={s} onClick={() => setFiltroStato(s)}
            style={{ padding: '4px 12px', border: `1px solid ${filtroStato === s ? S.teal : S.border}`, borderRadius: 20, background: filtroStato === s ? S.tealLight : 'none', color: filtroStato === s ? S.teal : S.textSecondary, fontSize: 11, fontWeight: filtroStato === s ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
            {s === 'tutti' ? 'Tutti' : s} {s !== 'tutti' && `(${preventivi.filter(p => p.stato === s).length})`}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 12, cursor: 'pointer' }} onClick={() => setShowForm(true)}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: S.textSecondary }}>Nessun preventivo</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>Crea il tuo primo preventivo</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => (
            <PreventivoCard key={p.id} p={p}
              onClick={() => { setEditing(p); setShowForm(true) }}
              onDelete={() => del(p.id)} />
          ))}
        </div>
      )}

      {showForm && (
        <PreventivoForm
          prev={editing} clienti={clienti} progetti={progetti}
          currentUser={currentUser} onSave={save}
          onClose={() => { setShowForm(false); setEditing(undefined) }} />
      )}
    </div>
  )
}
