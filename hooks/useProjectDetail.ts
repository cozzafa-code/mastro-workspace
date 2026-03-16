// hooks/useProjectDetail.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Progetto, ProjectLog, Task, Campagna } from '@/lib/types'

interface ProjectDetailState {
  progetto: Progetto | null
  logs: ProjectLog[]
  tasks: Task[]
  campagne: Campagna[]
  loading: boolean
  activeTab: 'overview' | 'log' | 'task' | 'campagne'
  showLogForm: boolean
  logForm: Partial<ProjectLog>
  editingProject: boolean
  projectForm: Partial<Progetto>
}

export function useProjectDetail(progettoId: string | null, currentUser: 'fabio' | 'lidia') {
  const [state, setState] = useState<ProjectDetailState>({
    progetto: null,
    logs: [],
    tasks: [],
    campagne: [],
    loading: true,
    activeTab: 'overview',
    showLogForm: false,
    logForm: {},
    editingProject: false,
    projectForm: {},
  })

  const load = useCallback(async () => {
    if (!progettoId) return
    setState(s => ({ ...s, loading: true }))

    const [pRes, lRes, tRes, cRes] = await Promise.all([
      supabase.from('progetti').select('*').eq('id', progettoId).single(),
      supabase.from('project_logs').select('*').eq('progetto_id', progettoId).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('progetto_id', progettoId).order('created_at', { ascending: false }),
      supabase.from('campagne').select('*').eq('progetto_id', progettoId).order('created_at', { ascending: false }),
    ])

    // Fallback: cerca task per nome progetto se progetto_id non matcha
    let tasks = tRes.data || []
    if (tasks.length === 0 && pRes.data?.nome) {
      const tFallback = await supabase.from('tasks').select('*').eq('progetto', pRes.data.nome)
      tasks = tFallback.data || []
    }

    setState(s => ({
      ...s,
      progetto: pRes.data,
      logs: lRes.data || [],
      tasks,
      campagne: cRes.data || [],
      loading: false,
    }))
  }, [progettoId])

  useEffect(() => { load() }, [load])

  const setActiveTab = useCallback((tab: ProjectDetailState['activeTab']) => {
    setState(s => ({ ...s, activeTab: tab }))
  }, [])

  const openLogForm = useCallback(() => {
    setState(s => ({ ...s, showLogForm: true, logForm: { tipo: 'nota', priorita: 'normale', autore: currentUser } }))
  }, [currentUser])

  const closeLogForm = useCallback(() => {
    setState(s => ({ ...s, showLogForm: false, logForm: {} }))
  }, [])

  const setLogForm = useCallback((patch: Partial<ProjectLog>) => {
    setState(s => ({ ...s, logForm: { ...s.logForm, ...patch } }))
  }, [])

  const saveLog = useCallback(async () => {
    if (!progettoId || !state.logForm.titolo) return
    await supabase.from('project_logs').insert({
      progetto_id: progettoId,
      tipo: state.logForm.tipo || 'nota',
      titolo: state.logForm.titolo,
      contenuto: state.logForm.contenuto || null,
      autore: state.logForm.autore || currentUser,
      priorita: state.logForm.priorita || 'normale',
      data_evento: state.logForm.data_evento || new Date().toISOString().split('T')[0],
    })
    await load()
    closeLogForm()
  }, [progettoId, state.logForm, currentUser, load, closeLogForm])

  const deleteLog = useCallback(async (id: string) => {
    await supabase.from('project_logs').delete().eq('id', id)
    await load()
  }, [load])

  const openEditProject = useCallback(() => {
    setState(s => ({ ...s, editingProject: true, projectForm: { ...s.progetto } }))
  }, [])

  const closeEditProject = useCallback(() => {
    setState(s => ({ ...s, editingProject: false, projectForm: {} }))
  }, [])

  const setProjectForm = useCallback((patch: Partial<Progetto>) => {
    setState(s => ({ ...s, projectForm: { ...s.projectForm, ...patch } }))
  }, [])

  const saveProject = useCallback(async () => {
    if (!progettoId) return
    const { id, created_at, ...fields } = state.projectForm as any
    await supabase.from('progetti').update(fields).eq('id', progettoId)
    await load()
    closeEditProject()
  }, [progettoId, state.projectForm, load, closeEditProject])

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    await load()
  }, [load])

  return {
    ...state,
    setActiveTab,
    openLogForm,
    closeLogForm,
    setLogForm,
    saveLog,
    deleteLog,
    openEditProject,
    closeEditProject,
    setProjectForm,
    saveProject,
    deleteTask,
    reload: load,
  }
}
