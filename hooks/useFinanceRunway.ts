// hooks/useFinanceRunway.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Spesa, FinanceSnapshot } from '@/lib/types'

interface FinanceState {
  spese: Spesa[]
  snapshots: FinanceSnapshot[]
  loading: boolean
  showForm: boolean
  showSnapshotForm: boolean
  form: Partial<Spesa>
  snapshotForm: Partial<FinanceSnapshot>
}

export function useFinanceRunway() {
  const [state, setState] = useState<FinanceState>({
    spese: [], snapshots: [], loading: true,
    showForm: false, showSnapshotForm: false, form: {}, snapshotForm: {},
  })

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const [sRes, fRes] = await Promise.all([
      supabase.from('spese_correnti').select('*').order('created_at', { ascending: false }),
      supabase.from('finance_snapshot').select('*').order('data', { ascending: false }).limit(12),
    ])
    setState(s => ({ ...s, spese: sRes.data || [], snapshots: fRes.data || [], loading: false }))
  }, [])

  useEffect(() => { load() }, [load])

  const openForm = useCallback((spesa?: Spesa) => {
    setState(s => ({ ...s, showForm: true, form: spesa ? { ...spesa } : { tipo: 'uscita', frequenza: 'mensile' } }))
  }, [])
  const closeForm = useCallback(() => setState(s => ({ ...s, showForm: false, form: {} })), [])
  const setForm = useCallback((p: Partial<Spesa>) => setState(s => ({ ...s, form: { ...s.form, ...p } })), [])

  const saveSpesa = useCallback(async () => {
    const { form } = state
    if (!(form.nome || form.voce)) return
    if ((form as any).id) {
      const { id, created_at, ...fields } = form as any
      await supabase.from('spese_correnti').update(fields).eq('id', (form as any).id)
    } else {
      await supabase.from('spese_correnti').insert({
        nome: form.nome || form.voce,
        importo: Number(form.importo) || 0,
        tipo: form.tipo || 'uscita',
        frequenza: (form as any).frequenza || 'mensile',
        categoria: (form as any).categoria || null,
        note: (form as any).note || null,
        attivo: true,
      })
    }
    await load(); closeForm()
  }, [state, load, closeForm])

  const deleteSpesa = useCallback(async (id: string) => {
    await supabase.from('spese_correnti').delete().eq('id', id)
    await load()
  }, [load])

  const openSnapshotForm = useCallback(() => {
    setState(s => ({ ...s, showSnapshotForm: true, snapshotForm: { data: new Date().toISOString().split('T')[0] } }))
  }, [])
  const closeSnapshotForm = useCallback(() => setState(s => ({ ...s, showSnapshotForm: false, snapshotForm: {} })), [])
  const setSnapshotForm = useCallback((p: Partial<FinanceSnapshot>) => setState(s => ({ ...s, snapshotForm: { ...s.snapshotForm, ...p } })), [])

  const saveSnapshot = useCallback(async () => {
    const { snapshotForm } = state
    await supabase.from('finance_snapshot').insert({
      data: snapshotForm.data || new Date().toISOString().split('T')[0],
      saldo_cassa: Number(snapshotForm.saldo_cassa) || 0,
      note: snapshotForm.note || null,
    })
    await load(); closeSnapshotForm()
  }, [state, load, closeSnapshotForm])

  // Calcoli
  const normalize = (s: Spesa) => {
    const imp = Number(s.importo) || 0
    const freq = (s as any).frequenza || (s as any).freq || 'mensile'
    if (freq === 'annuale') return imp / 12
    if (freq === 'una_tantum') return 0
    return imp
  }

  const usciteMensili = state.spese
    .filter(s => s.tipo !== 'entrata' && s.tipo !== 'Entrata')
    .reduce((a, s) => a + normalize(s), 0)

  const entrateMensili = state.spese
    .filter(s => s.tipo === 'entrata' || s.tipo === 'Entrata')
    .reduce((a, s) => a + normalize(s), 0)

  const saldoCorrente = state.snapshots[0]?.saldo_cassa || 0
  const burnRate = Math.max(0, usciteMensili - entrateMensili)
  const runway = burnRate > 0 ? Math.floor(saldoCorrente / burnRate) : 999

  return {
    ...state, load,
    openForm, closeForm, setForm, saveSpesa, deleteSpesa,
    openSnapshotForm, closeSnapshotForm, setSnapshotForm, saveSnapshot,
    usciteMensili, entrateMensili, saldoCorrente, burnRate, runway,
  }
}
