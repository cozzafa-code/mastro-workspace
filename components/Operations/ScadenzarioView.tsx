// components/Operations/ScadenzarioView.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

interface Scadenza {
  id: string
  descrizione: string
  data_scadenza: string
  importo?: number
  stato: string
  fornitore_nome?: string
  categoria?: string
  ricorrenza?: string
  giorni_avviso?: number
  assegnato_a?: string
  note?: string
}

const CATEGORIE = ['Tutto', 'Bollette', 'Abbonamenti', 'Tasse/F24', 'Fornitori', 'Dipendenti', 'Altro']

const semaforo = (data: string): { color: string; bg: string; label: string; urgenza: number } => {
  const oggi = new Date()
  const scad = new Date(data)
  const diff = Math.ceil((scad.getTime() - oggi.getTime()) / 86400000)
  if (diff < 0)  return { color: S.red,   bg: S.redLight,   label: 'Scaduta',        urgenza: 0 }
  if (diff === 0) return { color: S.red,   bg: S.redLight,   label: 'Oggi',           urgenza: 1 }
  if (diff <= 3)  return { color: S.red,   bg: S.redLight,   label: `${diff}g`,       urgenza: 2 }
  if (diff <= 7)  return { color: S.amber, bg: S.amberLight, label: `${diff}g`,       urgenza: 3 }
  if (diff <= 30) return { color: S.amber, bg: S.amberLight, label: `${diff}g`,       urgenza: 4 }
  return { color: S.green, bg: S.greenLight, label: `${diff}g`, urgenza: 5 }
}

export const ScadenzarioView: FC<{ currentUser: string }> = ({ currentUser }) => {
  const [scadenze, setScadenze] = useState<Scadenza[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('Tutto')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('scadenzario')
      .select('*')
      .eq('stato', 'aperto')
      .order('data_scadenza')
    setScadenze(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const segna_pagata = async (id: string) => {
    await supabase.from('scadenzario').update({ stato: 'pagato', completato_il: new Date().toISOString().split('T')[0] }).eq('id', id)
    load()
  }

  const salva = async () => {
    if (!form.descrizione || !form.data_scadenza) return
    setSaving(true)
    await supabase.from('scadenzario').insert({
      descrizione: form.descrizione,
      data_scadenza: form.data_scadenza,
      importo: Number(form.importo) || null,
      categoria: form.categoria || 'Altro',
      fornitore_nome: form.fornitore_nome || null,
      ricorrenza: form.ricorrenza || null,
      giorni_avviso: Number(form.giorni_avviso) || 7,
      assegnato_a: currentUser,
      stato: 'aperto',
      note: form.note || null,
    })
    setForm({})
    setShowForm(false)
    setSaving(false)
    load()
  }

  const filtrate = scadenze.filter(s => filtro === 'Tutto' || s.categoria === filtro)
  const urgenti = filtrate.filter(s => semaforo(s.data_scadenza).urgenza <= 3)
  const prossime = filtrate.filter(s => semaforo(s.data_scadenza).urgenza === 4)
  const future = filtrate.filter(s => semaforo(s.data_scadenza).urgenza === 5)

  const FI = ({ label, id, type = 'text', options, placeholder }: any) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{label}</label>
      {options
        ? <select value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, background: '#fff', boxSizing: 'border-box' }}>
            <option value="">Seleziona...</option>
            {options.map((o: string) => <option key={o}>{o}</option>)}
          </select>
        : <input type={type} value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })} placeholder={placeholder}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, background: '#fff', boxSizing: 'border-box' }} />
      }
    </div>
  )

  const ScadenzaCard = ({ s }: { s: Scadenza }) => {
    const sem = semaforo(s.data_scadenza)
    return (
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Semaforo */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: sem.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: sem.color, marginBottom: 2 }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: sem.color, letterSpacing: 0.3 }}>{sem.label}</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.descrizione}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            {s.fornitore_nome && <span style={{ fontSize: 11, color: S.textMuted }}>{s.fornitore_nome}</span>}
            {s.categoria && <span style={{ fontSize: 11, background: S.borderLight, color: S.textMuted, padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>{s.categoria}</span>}
            {s.ricorrenza && <span style={{ fontSize: 10, color: S.teal }}>↻ {s.ricorrenza}</span>}
          </div>
        </div>

        {/* Importo + azione */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {s.importo && <span style={{ fontSize: 15, fontWeight: 800, color: S.textPrimary, fontFamily: DS.fonts.mono }}>€{Number(s.importo).toLocaleString('it-IT')}</span>}
          <button onClick={() => segna_pagata(s.id)}
            style={{ padding: '5px 12px', background: S.teal, color: '#fff', border: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui, whiteSpace: 'nowrap' }}>
            ✓ Pagata
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {urgenti.length > 0 && <span style={{ color: S.red }}>⚠️ {urgenti.length} urgenti · </span>}
            {scadenze.length} totali
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '8px 16px', background: S.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          + Scadenza
        </button>
      </div>

      {/* Filtri categoria */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIE.map(c => (
          <button key={c} onClick={() => setFiltro(c)}
            style={{ padding: '5px 12px', border: `1px solid ${filtro === c ? S.teal : S.border}`, borderRadius: 20, background: filtro === c ? S.tealLight : S.surface, color: filtro === c ? S.teal : S.textMuted, fontSize: 12, fontWeight: filtro === c ? 700 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {c}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 32, color: S.textMuted }}>Caricamento...</div> : (
        <>
          {urgenti.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: S.red, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>⚠ Urgenti / Scadute</div>
              {urgenti.map(s => <ScadenzaCard key={s.id} s={s} />)}
            </div>
          )}

          {prossime.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: S.amber, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>📅 Questo mese</div>
              {prossime.map(s => <ScadenzaCard key={s.id} s={s} />)}
            </div>
          )}

          {future.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Prossime scadenze</div>
              {future.map(s => <ScadenzaCard key={s.id} s={s} />)}
            </div>
          )}

          {filtrate.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: S.textSecondary }}>Nessuna scadenza aperta</div>
              <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>Tutto in regola</div>
            </div>
          )}
        </>
      )}

      {/* Form nuova scadenza */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: S.surface, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto', padding: '20px 20px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary }}>Nuova scadenza</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: S.textMuted }}>✕</button>
            </div>
            <FI label="Descrizione *" id="descrizione" placeholder="es. Bolletta luce, F24, Stripe..." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Data scadenza *" id="data_scadenza" type="date" />
              <FI label="Importo €" id="importo" type="number" placeholder="0.00" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Categoria" id="categoria" options={['Bollette','Abbonamenti','Tasse/F24','Fornitori','Dipendenti','Altro']} />
              <FI label="Ricorrenza" id="ricorrenza" options={['','mensile','trimestrale','semestrale','annuale']} />
            </div>
            <FI label="Fornitore" id="fornitore_nome" placeholder="es. Enel, Stripe, AdE..." />
            <FI label="Note" id="note" placeholder="Note aggiuntive" />
            <button onClick={salva} disabled={saving || !form.descrizione || !form.data_scadenza}
              style={{ width: '100%', padding: '13px', background: form.descrizione && form.data_scadenza ? S.teal : S.borderLight, color: form.descrizione && form.data_scadenza ? '#fff' : S.textMuted, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui, marginTop: 8 }}>
              {saving ? 'Salvataggio...' : 'Salva scadenza'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
