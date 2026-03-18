// components/Operations/ChecklistView.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

interface Template {
  id: string
  nome: string
  frequenza: string
  assegnato_a: string
  attiva: boolean
  items?: Item[]
}

interface Item {
  id: string
  template_id: string
  testo: string
  ordine: number
}

interface Esecuzione {
  id: string
  template_id: string
  data_inizio: string
  completata: boolean
  items_completati: string[]
  note?: string
}

const CHECKLIST_DEFAULT = [
  {
    nome: 'Chiusura mese',
    frequenza: 'mensile',
    items: [
      'Verifica estratto conto bancario',
      'Paga F24 / contributi',
      'Controlla scadenze prossimo mese',
      'Riconcilia pagamenti ricevuti',
      'Invia report MRR a Fabio',
      'Archivia ricevute e fatture',
      'Verifica abbonamenti attivi',
    ]
  },
  {
    nome: 'Controllo settimanale',
    frequenza: 'settimanale',
    items: [
      'Controlla email clienti',
      'Aggiorna pipeline CRM',
      'Verifica task in scadenza',
      'Aggiorna bacheca condivisa',
      'Controlla notifiche pagamenti',
    ]
  }
]

export const ChecklistView: FC<{ currentUser: string }> = ({ currentUser }) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [esecuzione, setEsecuzione] = useState<Record<string, Esecuzione>>({})
  const [showNew, setShowNew] = useState(false)
  const [newNome, setNewNome] = useState('')
  const [newFreq, setNewFreq] = useState('mensile')
  const [newItems, setNewItems] = useState([''])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: tmpl } = await supabase.from('checklist_templates').select('*, checklist_items(*)').eq('attiva', true).order('created_at')
    
    if (!tmpl || tmpl.length === 0) {
      // Crea template di default
      for (const def of CHECKLIST_DEFAULT) {
        const { data: t } = await supabase.from('checklist_templates').insert({ nome: def.nome, frequenza: def.frequenza, assegnato_a: currentUser }).select().single()
        if (t) {
          await supabase.from('checklist_items').insert(def.items.map((testo, i) => ({ template_id: t.id, testo, ordine: i })))
        }
      }
      load()
      return
    }

    setTemplates(tmpl.map(t => ({ ...t, items: t.checklist_items || [] })))

    // Carica esecuzione corrente per ogni template
    const mese = new Date().toISOString().slice(0, 7)
    const settimana = new Date().toISOString().slice(0, 10)
    const eMap: Record<string, Esecuzione> = {}

    for (const t of tmpl) {
      const dateFilter = t.frequenza === 'settimanale' ? settimana : mese + '-01'
      const { data: es } = await supabase.from('checklist_esecuzioni')
        .select('*').eq('template_id', t.id)
        .gte('data_inizio', dateFilter)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (es) {
        eMap[t.id] = { ...es, items_completati: es.items_completati || [] }
      }
    }
    setEsecuzione(eMap)
    setLoading(false)
  }, [currentUser])

  useEffect(() => { load() }, [load])

  const toggleItem = async (templateId: string, itemId: string) => {
    const es = esecuzione[templateId]
    const completati = es?.items_completati || []
    const nuovi = completati.includes(itemId)
      ? completati.filter(i => i !== itemId)
      : [...completati, itemId]

    if (es) {
      await supabase.from('checklist_esecuzioni').update({ items_completati: nuovi, completata: false }).eq('id', es.id)
    } else {
      const { data } = await supabase.from('checklist_esecuzioni').insert({
        template_id: templateId, items_completati: nuovi, data_inizio: new Date().toISOString().split('T')[0]
      }).select().single()
      if (data) setEsecuzione(prev => ({ ...prev, [templateId]: { ...data, items_completati: nuovi } }))
      load(); return
    }
    setEsecuzione(prev => ({
      ...prev,
      [templateId]: { ...prev[templateId], items_completati: nuovi }
    }))
  }

  const salvaChecklist = async () => {
    if (!newNome || newItems.filter(i => i.trim()).length === 0) return
    const { data: t } = await supabase.from('checklist_templates').insert({ nome: newNome, frequenza: newFreq, assegnato_a: currentUser }).select().single()
    if (t) {
      await supabase.from('checklist_items').insert(newItems.filter(i => i.trim()).map((testo, i) => ({ template_id: t.id, testo, ordine: i })))
    }
    setNewNome(''); setNewFreq('mensile'); setNewItems(['']); setShowNew(false); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: S.textMuted }}>{templates.length} checklist attive</div>
        <button onClick={() => setShowNew(!showNew)}
          style={{ padding: '8px 16px', background: S.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          + Nuova
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 32, color: S.textMuted }}>Caricamento...</div>}

      {templates.map(t => {
        const es = esecuzione[t.id]
        const completati = es?.items_completati || []
        const items = t.items || []
        const pct = items.length > 0 ? Math.round(completati.length / items.length * 100) : 0
        const tuttiCompletati = items.length > 0 && completati.length === items.length

        return (
          <div key={t.id} style={{ background: S.surface, border: `1px solid ${tuttiCompletati ? S.green + '40' : S.border}`, borderRadius: 14, padding: '16px', marginBottom: 12 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: S.textPrimary }}>{t.nome}</div>
                <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>
                  ↻ {t.frequenza} · {completati.length}/{items.length} completati
                </div>
              </div>
              {tuttiCompletati
                ? <div style={{ background: S.greenLight, color: S.green, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Completa</div>
                : <div style={{ fontSize: 14, fontWeight: 800, color: pct > 50 ? S.teal : S.textMuted }}>{pct}%</div>
              }
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, background: S.borderLight, borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: tuttiCompletati ? S.green : S.teal, borderRadius: 2, transition: 'width 0.3s ease' }} />
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map(item => {
                const checked = completati.includes(item.id)
                return (
                  <div key={item.id} onClick={() => toggleItem(t.id, item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: checked ? S.tealLight : 'transparent', transition: 'all 0.15s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checked ? S.teal : S.borderDark}`, background: checked ? S.teal : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: 13, color: checked ? S.teal : S.textPrimary, textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.7 : 1, flex: 1 }}>{item.testo}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Form nuova checklist */}
      {showNew && (
        <div style={{ background: S.surface, border: `1px solid ${S.teal}40`, borderRadius: 14, padding: 16, marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Nuova checklist</div>
          <input value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Nome checklist..."
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, marginBottom: 8, boxSizing: 'border-box' }} />
          <select value={newFreq} onChange={e => setNewFreq(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, marginBottom: 12, boxSizing: 'border-box' }}>
            {['settimanale','mensile','trimestrale'].map(f => <option key={f}>{f}</option>)}
          </select>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Elementi</div>
          {newItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={item} onChange={e => { const n = [...newItems]; n[i] = e.target.value; setNewItems(n) }}
                placeholder={`Elemento ${i + 1}...`}
                style={{ flex: 1, padding: '7px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, fontFamily: DS.fonts.ui }} />
              {newItems.length > 1 && <button onClick={() => setNewItems(newItems.filter((_, j) => j !== i))}
                style={{ width: 30, background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted }}>✕</button>}
            </div>
          ))}
          <button onClick={() => setNewItems([...newItems, ''])}
            style={{ fontSize: 12, color: S.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DS.fonts.ui, marginBottom: 12 }}>
            + Aggiungi elemento
          </button>
          <button onClick={salvaChecklist}
            style={{ width: '100%', padding: '11px', background: S.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
            Salva checklist
          </button>
        </div>
      )}
    </div>
  )
}
