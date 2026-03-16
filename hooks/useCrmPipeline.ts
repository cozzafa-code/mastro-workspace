// hooks/useCrmPipeline.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cliente, CrmAttivita, PipelineStage } from '@/lib/types'

export const STAGES: { id: PipelineStage; label: string; color: string; bg: string }[] = [
  { id: 'lead',         label: 'Lead',         color: '#6B7280', bg: '#F3F4F6' },
  { id: 'contatto',     label: 'Contatto',     color: '#3B7FE0', bg: '#DBEAFE' },
  { id: 'demo',         label: 'Demo',         color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'proposta',     label: 'Proposta',     color: '#D08008', bg: '#FEF3C7' },
  { id: 'chiuso_vinto', label: 'Vinto ✓',      color: '#1A9E73', bg: '#D1FAE5' },
  { id: 'chiuso_perso', label: 'Perso ✗',      color: '#DC4444', bg: '#FEE2E2' },
]

export const FONTI = ['linkedin', 'referral', 'cold_email', 'whatsapp', 'evento', 'organico', 'altro']
export const PROGETTI_INTERESSE = ['MASTRO ERP', 'MASTRO UFFICIO', 'MASTRO MISURE', 'MASTRO MONTAGGI', 'FRAMEFLOW', 'Bundle Serramentista', 'Altro']

interface CrmState {
  clienti: Cliente[]
  attivita: CrmAttivita[]
  loading: boolean
  selectedCliente: Cliente | null
  showForm: boolean
  showAttivitaForm: boolean
  form: Partial<Cliente>
  attivitaForm: Partial<CrmAttivita>
  dragging: string | null
  filterStage: PipelineStage | 'tutti'
  view: 'kanban' | 'lista'
}

export function useCrmPipeline(currentUser: 'fabio' | 'lidia') {
  const [state, setState] = useState<CrmState>({
    clienti: [], attivita: [], loading: true,
    selectedCliente: null, showForm: false, showAttivitaForm: false,
    form: {}, attivitaForm: {}, dragging: null,
    filterStage: 'tutti', view: 'kanban',
  })

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const [cRes, aRes] = await Promise.all([
      supabase.from('clienti').select('*').order('created_at', { ascending: false }),
      supabase.from('crm_attivita').select('*').order('created_at', { ascending: false }),
    ])
    setState(s => ({ ...s, clienti: cRes.data || [], attivita: aRes.data || [], loading: false }))
  }, [])

  useEffect(() => { load() }, [load])

  const openForm = useCallback((cliente?: Cliente) => {
    setState(s => ({ ...s, showForm: true, form: cliente ? { ...cliente } : { pipeline_stage: 'lead', paese: 'IT' } }))
  }, [])

  const closeForm = useCallback(() => setState(s => ({ ...s, showForm: false, form: {} })), [])

  const setForm = useCallback((patch: Partial<Cliente>) => {
    setState(s => ({ ...s, form: { ...s.form, ...patch } }))
  }, [])

  const saveCliente = useCallback(async () => {
    const { form } = state
    if (!form.nome) return
    if (form.id) {
      const { id, created_at, ...fields } = form as any
      await supabase.from('clienti').update(fields).eq('id', form.id)
    } else {
      await supabase.from('clienti').insert({
        nome: form.nome, azienda: form.azienda, ruolo: form.ruolo,
        email: form.email, telefono: form.telefono,
        pipeline_stage: form.pipeline_stage || 'lead',
        deal_value: Number(form.deal_value) || 0,
        follow_up_date: form.follow_up_date || null,
        progetto_interesse: form.progetto_interesse || null,
        fonte: form.fonte || null,
        paese: form.paese || 'IT',
        note: form.note || null,
        note_pipeline: form.note_pipeline || null,
        tipo: 'Lead', stato: 'attivo',
      })
    }
    await load()
    closeForm()
  }, [state, load, closeForm])

  const deleteCliente = useCallback(async (id: string) => {
    await supabase.from('clienti').delete().eq('id', id)
    await load()
  }, [load])

  const moveStage = useCallback(async (clienteId: string, newStage: PipelineStage) => {
    await supabase.from('clienti').update({ pipeline_stage: newStage }).eq('id', clienteId)
    setState(s => ({
      ...s,
      clienti: s.clienti.map(c => c.id === clienteId ? { ...c, pipeline_stage: newStage } : c),
    }))
  }, [])

  const selectCliente = useCallback((c: Cliente | null) => {
    setState(s => ({ ...s, selectedCliente: c }))
  }, [])

  const openAttivitaForm = useCallback(() => {
    setState(s => ({ ...s, showAttivitaForm: true, attivitaForm: { tipo: 'chiamata', autore: currentUser, data_attivita: new Date().toISOString().split('T')[0] } }))
  }, [currentUser])

  const closeAttivitaForm = useCallback(() => setState(s => ({ ...s, showAttivitaForm: false, attivitaForm: {} })), [])

  const setAttivitaForm = useCallback((patch: Partial<CrmAttivita>) => {
    setState(s => ({ ...s, attivitaForm: { ...s.attivitaForm, ...patch } }))
  }, [])

  const saveAttivita = useCallback(async () => {
    const { attivitaForm, selectedCliente } = state
    if (!selectedCliente || !attivitaForm.titolo) return
    await supabase.from('crm_attivita').insert({
      cliente_id: selectedCliente.id,
      tipo: attivitaForm.tipo || 'nota',
      titolo: attivitaForm.titolo,
      contenuto: attivitaForm.contenuto || null,
      autore: attivitaForm.autore || currentUser,
      data_attivita: attivitaForm.data_attivita || new Date().toISOString().split('T')[0],
      esito: attivitaForm.esito || null,
    })
    // Aggiorna ultimo_contatto
    await supabase.from('clienti').update({ ultimo_contatto: attivitaForm.data_attivita }).eq('id', selectedCliente.id)
    await load()
    closeAttivitaForm()
  }, [state, currentUser, load, closeAttivitaForm])

  const setView = useCallback((view: 'kanban' | 'lista') => setState(s => ({ ...s, view })), [])
  const setFilterStage = useCallback((f: PipelineStage | 'tutti') => setState(s => ({ ...s, filterStage: f })), [])

  const attivitaByCliente = useCallback((clienteId: string) =>
    state.attivita.filter(a => a.cliente_id === clienteId), [state.attivita])

  const totalPipelineValue = state.clienti
    .filter(c => c.pipeline_stage !== 'chiuso_perso')
    .reduce((a, c) => a + (Number(c.deal_value) || 0), 0)

  const wonValue = state.clienti
    .filter(c => c.pipeline_stage === 'chiuso_vinto')
    .reduce((a, c) => a + (Number(c.deal_value) || 0), 0)

  const followUpToday = state.clienti.filter(c => {
    if (!c.follow_up_date) return false
    return c.follow_up_date <= new Date().toISOString().split('T')[0]
  })

  return {
    ...state, load,
    openForm, closeForm, setForm, saveCliente, deleteCliente,
    moveStage, selectCliente,
    openAttivitaForm, closeAttivitaForm, setAttivitaForm, saveAttivita,
    setView, setFilterStage, attivitaByCliente,
    totalPipelineValue, wonValue, followUpToday,
  }
}
