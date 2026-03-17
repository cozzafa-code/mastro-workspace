// hooks/useCampagnePro.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Campagna, CampagnaMetrica, Progetto } from '@/lib/types'

interface CampagneState {
  campagne: Campagna[]
  metriche: CampagnaMetrica[]
  progetti: Progetto[]
  loading: boolean
  selected: Campagna | null
  showForm: boolean
  showMetricaForm: boolean
  form: Partial<Campagna>
  metricaForm: Partial<CampagnaMetrica>
}

export const CANALI = ['Email', 'LinkedIn', 'TikTok', 'Instagram', 'WhatsApp', 'Google Ads', 'Meta Ads', 'Cold outreach', 'Evento', 'Referral', 'Organico', 'Altro']
export const TIPI = ['Awareness', 'Lead generation', 'Nurturing', 'Conversione', 'Retention', 'Lancio prodotto']

export function useCampagnePro(currentUser: 'fabio' | 'lidia') {
  const [state, setState] = useState<CampagneState>({
    campagne: [], metriche: [], progetti: [], loading: true,
    selected: null, showForm: false, showMetricaForm: false, form: {}, metricaForm: {},
  })

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const [cRes, mRes, pRes] = await Promise.all([
      supabase.from('campagne').select('*').order('created_at', { ascending: false }),
      supabase.from('campagna_metriche').select('*').order('data', { ascending: true }),
      supabase.from('progetti').select('*').order('nome'),
    ])
    setState(s => ({ ...s, campagne: cRes.data || [], metriche: mRes.data || [], progetti: pRes.data || [], loading: false }))
  }, [])

  useEffect(() => { load() }, [load])

  const openForm = useCallback((c?: Campagna) => {
    setState(s => ({ ...s, showForm: true, form: c ? { ...c } : { stato: 'pianificata', responsabile: currentUser, data_inizio: new Date().toISOString().split('T')[0] } }))
  }, [currentUser])

  const closeForm = useCallback(() => setState(s => ({ ...s, showForm: false, form: {} })), [])
  const setForm = useCallback((patch: Partial<Campagna>) => setState(s => ({ ...s, form: { ...s.form, ...patch } })), [])

  const saveCampagna = useCallback(async () => {
    const { form } = state
    if (!form.nome) return
    if (form.id) {
      const { id, created_at, ...fields } = form as any
      await supabase.from('campagne').update(fields).eq('id', form.id)
    } else {
      await supabase.from('campagne').insert({
        nome: form.nome, tipo: form.tipo, canale: form.canale,
        obiettivo: form.obiettivo, stato: form.stato || 'pianificata',
        progetto_id: form.progetto_id || null,
        responsabile: form.responsabile || currentUser,
        budget_totale: Number(form.budget_totale) || 0,
        spend_attuale: Number(form.spend_attuale) || 0,
        target_leads: Number(form.target_leads) || 0,
        leads_totali: Number(form.leads_totali) || 0,
        conversioni: Number(form.conversioni) || 0,
        data_inizio: form.data_inizio || null,
        data_fine: form.data_fine || null,
        note: form.note || null,
      })
    }
    await load()
    closeForm()
  }, [state, currentUser, load, closeForm])

  const deleteCampagna = useCallback(async (id: string) => {
    await supabase.from('campagne').delete().eq('id', id)
    await load()
  }, [load])

  const selectCampagna = useCallback((c: Campagna | null) => setState(s => ({ ...s, selected: c })), [])

  const openMetricaForm = useCallback(() => {
    setState(s => ({ ...s, showMetricaForm: true, metricaForm: { data: new Date().toISOString().split('T')[0] } }))
  }, [])

  const closeMetricaForm = useCallback(() => setState(s => ({ ...s, showMetricaForm: false, metricaForm: {} })), [])
  const setMetricaForm = useCallback((patch: Partial<CampagnaMetrica>) => setState(s => ({ ...s, metricaForm: { ...s.metricaForm, ...patch } })), [])

  const saveMetrica = useCallback(async () => {
    const { metricaForm, selected } = state
    if (!selected) return
    await supabase.from('campagna_metriche').insert({
      campagna_id: selected.id,
      data: metricaForm.data || new Date().toISOString().split('T')[0],
      spend: Number(metricaForm.spend) || 0,
      leads: Number(metricaForm.leads) || 0,
      click: Number(metricaForm.click) || 0,
      impression: Number(metricaForm.impression) || 0,
      conversioni: Number(metricaForm.conversioni) || 0,
      note: metricaForm.note || null,
    })
    // Aggiorna totali campagna
    const allM = [...state.metriche.filter(m => m.campagna_id === selected.id), metricaForm as CampagnaMetrica]
    const totSpend = allM.reduce((a, m) => a + (Number(m.spend) || 0), 0)
    const totLeads = allM.reduce((a, m) => a + (Number(m.leads) || 0), 0)
    await supabase.from('campagne').update({ spend_attuale: totSpend, leads_totali: totLeads }).eq('id', selected.id)
    await load()
    closeMetricaForm()
  }, [state, load, closeMetricaForm])

  const metricheByC = useCallback((id: string) => state.metriche.filter(m => m.campagna_id === id), [state.metriche])

  // KPI aggregati
  const totBudget = state.campagne.reduce((a, c) => a + (Number(c.budget_totale) || 0), 0)
  const totSpend = state.campagne.reduce((a, c) => a + (Number(c.spend_attuale) || 0), 0)
  const totLeads = state.campagne.reduce((a, c) => a + (Number(c.leads_totali) || 0), 0)
  const totConversioni = state.campagne.reduce((a, c) => a + (Number(c.conversioni) || 0), 0)
  const cpl = totLeads > 0 ? Math.round(totSpend / totLeads) : 0
  const cac = totConversioni > 0 ? Math.round(totSpend / totConversioni) : 0
  const convRate = totLeads > 0 ? ((totConversioni / totLeads) * 100).toFixed(1) : '0'

  return {
    ...state, load,
    openForm, closeForm, setForm, saveCampagna, deleteCampagna, selectCampagna,
    openMetricaForm, closeMetricaForm, setMetricaForm, saveMetrica, metricheByC,
    totBudget, totSpend, totLeads, totConversioni, cpl, cac, convRate,
  }
}
