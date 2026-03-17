// hooks/useContabilita.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Fattura, RigaFattura, PrimaNota, ScadenzarioItem, Conto } from '@/lib/types-contabilita'

interface ContabilitaState {
  fatture: Fattura[]
  primaNota: PrimaNota[]
  scadenzario: ScadenzarioItem[]
  conti: Conto[]
  loading: boolean
  view: 'dashboard' | 'fatture' | 'prima_nota' | 'scadenzario' | 'calendario'
  filtroTipo: 'tutti' | 'attiva' | 'passiva'
  filtroStato: string
  showFatturaForm: boolean
  fatturaForm: Partial<Fattura>
  righe: RigaFattura[]
  selectedFattura: Fattura | null
}

const REGIME_IVA = {
  ordinario:   { iva: 22, label: 'Regime Ordinario', descrizione: 'IVA 22% standard' },
  forfettario: { iva: 0,  label: 'Regime Forfettario', descrizione: 'Esenzione IVA art.1 c.54-89' },
  danese:      { iva: 25, label: 'ApS Danese', descrizione: 'MVA 25% danese' },
}

export function useContabilita() {
  const [state, setState] = useState<ContabilitaState>({
    fatture: [], primaNota: [], scadenzario: [], conti: [],
    loading: true, view: 'dashboard',
    filtroTipo: 'tutti', filtroStato: 'tutti',
    showFatturaForm: false, fatturaForm: {}, righe: [],
    selectedFattura: null,
  })

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const [fRes, pRes, scRes, cRes] = await Promise.all([
      supabase.from('fatture').select('*').order('data_emissione', { ascending: false }),
      supabase.from('prima_nota').select('*').order('data', { ascending: false }).limit(200),
      supabase.from('scadenzario').select('*').order('data_scadenza', { ascending: true }),
      supabase.from('conti').select('*').eq('attivo', true).order('codice'),
    ])
    setState(s => ({
      ...s,
      fatture: fRes.data || [],
      primaNota: pRes.data || [],
      scadenzario: scRes.data || [],
      conti: cRes.data || [],
      loading: false,
    }))
  }, [])

  useEffect(() => { load() }, [load])

  // ── Fattura CRUD ──────────────────────────────────────
  const openFatturaForm = useCallback((fattura?: Fattura) => {
    const defaultRiga: RigaFattura = { descrizione: '', quantita: 1, prezzo_unit: 0, iva_aliquota: 22, imponibile: 0, iva_importo: 0, totale: 0 }
    setState(s => ({
      ...s,
      showFatturaForm: true,
      fatturaForm: fattura ? { ...fattura } : {
        tipo: 'attiva', stato: 'bozza',
        data_emissione: new Date().toISOString().split('T')[0],
        emittente_regime: 'ordinario', iva_aliquota: 22,
        valuta: 'EUR', paese_fiscale: 'IT',
      },
      righe: fattura ? [] : [defaultRiga],
    }))
  }, [])

  const closeFatturaForm = useCallback(() => {
    setState(s => ({ ...s, showFatturaForm: false, fatturaForm: {}, righe: [] }))
  }, [])

  const setFatturaForm = useCallback((patch: Partial<Fattura>) => {
    setState(s => ({ ...s, fatturaForm: { ...s.fatturaForm, ...patch } }))
  }, [])

  const setRighe = useCallback((righe: RigaFattura[]) => {
    setState(s => ({ ...s, righe }))
  }, [])

  const calcolaRiga = (r: Partial<RigaFattura>): RigaFattura => {
    const q = Number(r.quantita) || 1
    const p = Number(r.prezzo_unit) || 0
    const iva = Number(r.iva_aliquota) || 0
    const imponibile = q * p
    const iva_importo = imponibile * (iva / 100)
    return {
      descrizione: r.descrizione || '',
      quantita: q, prezzo_unit: p, iva_aliquota: iva,
      imponibile, iva_importo, totale: imponibile + iva_importo,
    }
  }

  const calcolaTotali = (righe: RigaFattura[]) => {
    const imponibile = righe.reduce((a, r) => a + (r.imponibile || 0), 0)
    const iva_importo = righe.reduce((a, r) => a + (r.iva_importo || 0), 0)
    return { imponibile, iva_importo, totale: imponibile + iva_importo }
  }

  const saveFattura = useCallback(async () => {
    const { fatturaForm, righe } = state
    if (!fatturaForm.numero || !fatturaForm.controparte_nome) return

    const totali = calcolaTotali(righe)
    const fatturaData = {
      ...fatturaForm,
      ...totali,
      iva_aliquota: Number(fatturaForm.iva_aliquota) || 22,
      sdi_stato: 'non_inviata',
    }

    let fatturaId: string
    if (fatturaForm.id) {
      const { id, created_at, ...fields } = fatturaData as any
      await supabase.from('fatture').update(fields).eq('id', fatturaForm.id)
      fatturaId = fatturaForm.id
    } else {
      const { data } = await supabase.from('fatture').insert(fatturaData).select('id').single()
      fatturaId = data?.id
    }

    // Salva righe
    if (fatturaId && righe.length > 0) {
      await supabase.from('righe_fattura').delete().eq('fattura_id', fatturaId)
      await supabase.from('righe_fattura').insert(righe.map((r, i) => ({ ...r, fattura_id: fatturaId, ordine: i })))
    }

    // Registra in prima nota automaticamente
    if (fatturaId && fatturaForm.tipo) {
      await registraPrimaNota(fatturaId, fatturaForm as Fattura, totali)
    }

    // Aggiungi a scadenzario se ha data_scadenza
    if (fatturaId && fatturaForm.data_scadenza && fatturaForm.tipo === 'attiva') {
      await supabase.from('scadenzario').insert({
        tipo: 'incasso', fattura_id: fatturaId,
        descrizione: `Incasso fattura ${fatturaForm.numero} - ${fatturaForm.controparte_nome}`,
        importo: totali.totale,
        data_scadenza: fatturaForm.data_scadenza,
        stato: 'aperto',
      })
    }

    await load()
    closeFatturaForm()
  }, [state, load, closeFatturaForm])

  const registraPrimaNota = async (fatturaId: string, fattura: Fattura, totali: any) => {
    const isAttiva = fattura.tipo === 'attiva'
    const entries = [
      {
        fattura_id: fatturaId,
        data: fattura.data_emissione,
        descrizione: `Fattura ${fattura.numero} - ${fattura.controparte_nome}`,
        tipo: isAttiva ? 'dare' : 'avere',
        importo: totali.totale,
        conto_nome: isAttiva ? 'Crediti verso clienti' : 'Debiti verso fornitori',
        categoria: isAttiva ? 'ricavo' : 'costo',
      },
    ]
    if (totali.iva_importo > 0) {
      entries.push({
        fattura_id: fatturaId,
        data: fattura.data_emissione,
        descrizione: `IVA fattura ${fattura.numero}`,
        tipo: isAttiva ? 'avere' : 'dare',
        importo: totali.iva_importo,
        conto_nome: isAttiva ? 'IVA a debito' : 'IVA a credito',
        categoria: 'iva',
      })
    }
    await supabase.from('prima_nota').insert(entries)
  }

  const deleteFattura = useCallback(async (id: string) => {
    await supabase.from('fatture').delete().eq('id', id)
    await load()
  }, [load])

  const cambiaStato = useCallback(async (id: string, stato: Fattura['stato']) => {
    await supabase.from('fatture').update({ stato }).eq('id', id)
    if (stato === 'pagata') {
      await supabase.from('scadenzario').update({ stato: 'pagato', data_pagato: new Date().toISOString().split('T')[0] }).eq('fattura_id', id)
    }
    setState(s => ({ ...s, fatture: s.fatture.map(f => f.id === id ? { ...f, stato } : f) }))
  }, [])

  // Aggiungi scadenza manuale
  const addScadenza = useCallback(async (item: Omit<ScadenzarioItem, 'id' | 'created_at'>) => {
    await supabase.from('scadenzario').insert(item)
    await load()
  }, [load])

  const pagaScadenza = useCallback(async (id: string) => {
    const oggi = new Date().toISOString().split('T')[0]
    await supabase.from('scadenzario').update({ stato: 'pagato', data_pagato: oggi }).eq('id', id)
    setState(s => ({ ...s, scadenzario: s.scadenzario.map(x => x.id === id ? { ...x, stato: 'pagato' as const, data_pagato: oggi } : x) }))
  }, [])

  // Views and filters
  const setView = useCallback((view: ContabilitaState['view']) => setState(s => ({ ...s, view })), [])
  const setFiltroTipo = useCallback((f: ContabilitaState['filtroTipo']) => setState(s => ({ ...s, filtroTipo: f })), [])
  const setFiltroStato = useCallback((f: string) => setState(s => ({ ...s, filtroStato: f })), [])
  const selectFattura = useCallback((f: Fattura | null) => setState(s => ({ ...s, selectedFattura: f })), [])

  // KPI
  const oggi = new Date().toISOString().split('T')[0]
  const mese = oggi.substring(0, 7)

  const totFattureAttive = state.fatture.filter(f => f.tipo === 'attiva' && f.stato !== 'annullata').reduce((a, f) => a + (f.totale || 0), 0)
  const totFatturePassive = state.fatture.filter(f => f.tipo === 'passiva' && f.stato !== 'annullata').reduce((a, f) => a + (f.totale || 0), 0)
  const daIncassare = state.fatture.filter(f => f.tipo === 'attiva' && !['pagata', 'annullata'].includes(f.stato)).reduce((a, f) => a + ((f.totale || 0) - (f.totale_pagato || 0)), 0)
  const daPagare = state.fatture.filter(f => f.tipo === 'passiva' && !['pagata', 'annullata'].includes(f.stato)).reduce((a, f) => a + ((f.totale || 0) - (f.totale_pagato || 0)), 0)
  const ivaDebito = state.fatture.filter(f => f.tipo === 'attiva' && f.stato !== 'annullata' && (f.data_emissione || '').startsWith(mese)).reduce((a, f) => a + (f.iva_importo || 0), 0)
  const ivaCredito = state.fatture.filter(f => f.tipo === 'passiva' && f.stato !== 'annullata' && (f.data_emissione || '').startsWith(mese)).reduce((a, f) => a + (f.iva_importo || 0), 0)
  const ivaDaVersare = Math.max(0, ivaDebito - ivaCredito)
  const scaduteNonPagate = state.scadenzario.filter(s => s.stato === 'aperto' && s.data_scadenza < oggi)

  const filteredFatture = state.fatture.filter(f => {
    if (state.filtroTipo !== 'tutti' && f.tipo !== state.filtroTipo) return false
    if (state.filtroStato !== 'tutti' && f.stato !== state.filtroStato) return false
    return true
  })

  return {
    ...state, filteredFatture, load,
    openFatturaForm, closeFatturaForm, setFatturaForm, setRighe, calcolaRiga, calcolaTotali,
    saveFattura, deleteFattura, cambiaStato, addScadenza, pagaScadenza,
    setView, setFiltroTipo, setFiltroStato, selectFattura,
    totFattureAttive, totFatturePassive, daIncassare, daPagare,
    ivaDaVersare, ivaDebito, ivaCredito, scaduteNonPagate,
    REGIME_IVA,
  }
}
