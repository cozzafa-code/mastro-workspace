// hooks/useTaskTimer.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task, TaskSessione, UserType } from '@/lib/types'

interface TimerState {
  tasks: Task[]
  sessioni: TaskSessione[]
  loading: boolean
  activeTaskId: string | null
  timerStart: Date | null
  elapsed: number // secondi
  showForm: boolean
  form: Partial<Task>
  filterStato: string
  filterChi: string
}

export function useTaskTimer(currentUser: UserType) {
  const [state, setState] = useState<TimerState>({
    tasks: [], sessioni: [], loading: true,
    activeTaskId: null, timerStart: null, elapsed: 0,
    showForm: false, form: {}, filterStato: 'tutti', filterChi: 'tutti',
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    const [tRes, sRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('task_sessioni').select('*').order('inizio', { ascending: false }),
    ])
    setState(s => ({ ...s, tasks: tRes.data || [], sessioni: sRes.data || [], loading: false }))
  }, [])

  useEffect(() => { load() }, [load])

  // Timer tick
  useEffect(() => {
    if (state.activeTaskId && state.timerStart) {
      intervalRef.current = setInterval(() => {
        setState(s => ({
          ...s,
          elapsed: s.timerStart ? Math.floor((Date.now() - s.timerStart.getTime()) / 1000) : 0,
        }))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state.activeTaskId, state.timerStart])

  const startTimer = useCallback((taskId: string) => {
    setState(s => ({ ...s, activeTaskId: taskId, timerStart: new Date(), elapsed: 0 }))
  }, [])

  const stopTimer = useCallback(async (note?: string) => {
    const { activeTaskId, timerStart } = state
    if (!activeTaskId || !timerStart) return
    const fine = new Date()
    const durata = Math.floor((fine.getTime() - timerStart.getTime()) / 60000) // minuti

    // Salva sessione
    await supabase.from('task_sessioni').insert({
      task_id: activeTaskId,
      utente: currentUser,
      inizio: timerStart.toISOString(),
      fine: fine.toISOString(),
      durata_min: durata,
      note: note || null,
    })

    // Aggiorna tempo_totale sul task
    const task = state.tasks.find(t => t.id === activeTaskId)
    if (task) {
      await supabase.from('tasks').update({
        tempo_totale: (task.tempo_totale || 0) + durata,
      }).eq('id', activeTaskId)
    }

    setState(s => ({ ...s, activeTaskId: null, timerStart: null, elapsed: 0 }))
    await load()
  }, [state, currentUser, load])

  const updateStato = useCallback(async (id: string, stato: string) => {
    await supabase.from('tasks').update({ stato }).eq('id', id)
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, stato } : t) }))
  }, [])

  const openForm = useCallback((t?: Task) => {
    setState(s => ({ ...s, showForm: true, form: t ? { ...t } : { stato: 'aperto', chi: currentUser, priorita: '3' } }))
  }, [currentUser])

  const closeForm = useCallback(() => setState(s => ({ ...s, showForm: false, form: {} })), [])
  const setForm = useCallback((p: Partial<Task>) => setState(s => ({ ...s, form: { ...s.form, ...p } })), [])

  const saveTask = useCallback(async () => {
    const { form } = state
    if (!form.titolo) return
    if (form.id) {
      const { id, created_at, ...fields } = form as any
      await supabase.from('tasks').update(fields).eq('id', form.id)
    } else {
      await supabase.from('tasks').insert({
        titolo: form.titolo, dettaglio: form.dettaglio || null,
        chi: form.chi || currentUser, priorita: form.priorita || '3',
        stato: form.stato || 'aperto', scadenza: form.scadenza || null,
        tempo_stimato: Number(form.tempo_stimato) || 0,
        categoria: form.categoria || null,
      })
    }
    await load()
    closeForm()
  }, [state, currentUser, load, closeForm])

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    await load()
  }, [load])

  const setFilter = useCallback((key: 'filterStato' | 'filterChi', val: string) => {
    setState(s => ({ ...s, [key]: val }))
  }, [])

  const sessioniByTask = useCallback((id: string) =>
    state.sessioni.filter(s => s.task_id === id), [state.sessioni])

  const tempoOggi = state.sessioni
    .filter(s => s.inizio?.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((a, s) => a + (s.durata_min || 0), 0)

  const tempoSettimana = (() => {
    const d = new Date(); d.setDate(d.getDate() - 7)
    return state.sessioni
      .filter(s => s.inizio && new Date(s.inizio) >= d)
      .reduce((a, s) => a + (s.durata_min || 0), 0)
  })()

  const filteredTasks = state.tasks.filter(t => {
    if (state.filterStato !== 'tutti' && t.stato !== state.filterStato) return false
    if (state.filterChi !== 'tutti' && t.chi !== state.filterChi) return false
    return true
  })

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  return {
    ...state, filteredTasks, load,
    startTimer, stopTimer, updateStato,
    openForm, closeForm, setForm, saveTask, deleteTask,
    setFilter, sessioniByTask,
    tempoOggi, tempoSettimana, formatElapsed,
  }
}
