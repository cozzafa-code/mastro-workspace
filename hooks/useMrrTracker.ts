// hooks/useMrrTracker.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { MrrSnapshot, Progetto } from '@/lib/types'

interface MrrState {
  snapshots: MrrSnapshot[]
  progetti: Progetto[]
  loading: boolean
  showForm: boolean
  form: Partial<MrrSnapshot>
}

export function useMrrTracker() {
  const [state, setState] = useState<MrrState>({
    snapshots: [], progetti: [], loading: true, showForm: false, form: {},
  })

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const [sRes, pRes] = await Promise.all([
      supabase.from('mrr_snapshots').select('*').order('data', { ascending: true }),
      supabase.from('progetti').select('*').order('nome'),
    ])
    setState(s => ({ ...s, snapshots: sRes.data || [], progetti: pRes.data || [], loading: false }))
  }, [])

  useEffect(() => { load() }, [load])

  const openForm = useCallback(() => {
    const oggi = new Date().toISOString().split('T')[0]
    const mese = oggi.substring(0, 7)
    setState(s => ({ ...s, showForm: true, form: { data: oggi, mese, valore: 0, clienti_num: 0 } }))
  }, [])

  const closeForm = useCallback(() => setState(s => ({ ...s, showForm: false, form: {} })), [])

  const setForm = useCallback((patch: Partial<MrrSnapshot>) => {
    setState(s => ({ ...s, form: { ...s.form, ...patch } }))
  }, [])

  const saveSnapshot = useCallback(async () => {
    const { form } = state
    const progetto = state.progetti.find(p => p.id === form.progetto_id)
    await supabase.from('mrr_snapshots').insert({
      progetto_id: form.progetto_id || null,
      progetto_nome: progetto?.nome || form.progetto_nome || 'Totale',
      valore: Number(form.valore) || 0,
      clienti_num: Number(form.clienti_num) || 0,
      mese: form.mese || form.data?.substring(0, 7) || '',
      data: form.data || new Date().toISOString().split('T')[0],
      note: form.note || null,
    })
    await load()
    closeForm()
  }, [state, load, closeForm])

  const deleteSnapshot = useCallback(async (id: string) => {
    await supabase.from('mrr_snapshots').delete().eq('id', id)
    await load()
  }, [load])

  // Calcola MRR corrente da progetti (somma diretta)
  const mrrCorrente = state.progetti.reduce((a, p) => a + (Number(p.mrr) || 0), 0)

  // Raggruppa snapshots per mese per il grafico
  const mrrPerMese = Object.values(
    state.snapshots.reduce((acc, s) => {
      const mese = s.mese || s.data?.substring(0, 7) || ''
      if (!mese) return acc
      if (!acc[mese]) acc[mese] = { mese, totale: 0, clienti: 0 }
      acc[mese].totale += Number(s.valore) || 0
      acc[mese].clienti += Number(s.clienti_num) || 0
      return acc
    }, {} as Record<string, { mese: string; totale: number; clienti: number }>)
  ).sort((a, b) => a.mese.localeCompare(b.mese))

  // Target lancio Italia: 30 clienti @ ~147/mo media = ~4400 MRR Giugno 2026
  const targetMrr = 4400
  const targetClienti = 30
  const clientiAttuali = state.progetti.reduce((a, p) => a + (Number(p.beta_clienti) || 0), 0)
  const progressoPct = targetMrr > 0 ? Math.min(100, Math.round((mrrCorrente / targetMrr) * 100)) : 0

  return {
    ...state, load,
    openForm, closeForm, setForm, saveSnapshot, deleteSnapshot,
    mrrCorrente, mrrPerMese, targetMrr, targetClienti, clientiAttuali, progressoPct,
  }
}
