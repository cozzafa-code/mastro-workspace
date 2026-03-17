// hooks/usePersonalTasks.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface PersonalTask {
  id: string
  titolo: string
  descrizione?: string
  creato_da: string
  assegnato_a: string
  tipo: 'task' | 'nota' | 'idea' | 'delega'
  stato: 'aperto' | 'in_corso' | 'completato'
  priorita: string
  scadenza?: string
  ora_scadenza?: string
  allegati?: string
  tag?: string[]
  nota_completamento?: string
  completato_il?: string
  notifica_email?: boolean
  follow_up_giorni?: number
  visibilita: 'privato' | 'condiviso'
  created_at?: string
}

export function usePersonalTasks(currentUser: string) {
  const [tasks, setTasks] = useState<PersonalTask[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    // Carica: mie private + condivise + delegate a me
    const { data } = await supabase
      .from('personal_tasks')
      .select('*')
      .or(`assegnato_a.eq.${currentUser},assegnato_a.eq.entrambi,visibilita.eq.condiviso`)
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }, [currentUser])

  useEffect(() => { load() }, [load])

  const mie = tasks.filter(t => t.assegnato_a === currentUser && t.creato_da === currentUser && t.visibilita === 'privato')
  const delegateAMe = tasks.filter(t => t.assegnato_a === currentUser && t.creato_da !== currentUser)
  const condivise = tasks.filter(t => t.visibilita === 'condiviso' || t.assegnato_a === 'entrambi')
  const delegateDaMe = tasks.filter(t => t.creato_da === currentUser && t.assegnato_a !== currentUser && t.assegnato_a !== 'entrambi')

  const addTask = useCallback(async (task: Omit<PersonalTask, 'id' | 'created_at'>) => {
    const { data } = await supabase.from('personal_tasks').insert(task).select().single()
    await load()

    // Notifica in-app se è una delega
    if (task.assegnato_a !== currentUser && task.assegnato_a !== 'entrambi') {
      await supabase.from('notifiche').insert({
        utente: task.assegnato_a,
        titolo: `Nuova delega da ${currentUser === 'fabio' ? 'Fabio' : 'Lidia'}`,
        messaggio: task.titolo,
        tipo: 'reminder',
        ref_tipo: 'personal_task',
        ref_id: data?.id,
        data_invio: new Date().toISOString(),
        letta: false,
      })
    }
    return data
  }, [currentUser, load])

  const updateTask = useCallback(async (id: string, patch: Partial<PersonalTask>) => {
    await supabase.from('personal_tasks').update(patch).eq('id', id)
    setTasks(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t))
  }, [])

  const completeTask = useCallback(async (id: string, nota?: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const now = new Date().toISOString()
    await supabase.from('personal_tasks').update({
      stato: 'completato', completato_il: now, nota_completamento: nota || null,
    }).eq('id', id)

    // Notifica al creatore se era una delega
    if (task.creato_da !== currentUser) {
      await supabase.from('notifiche').insert({
        utente: task.creato_da,
        titolo: `✓ Completato: ${task.titolo}`,
        messaggio: nota ? `Nota: ${nota}` : `Completato da ${currentUser === 'fabio' ? 'Fabio' : 'Lidia'}`,
        tipo: 'sistema',
        ref_tipo: 'personal_task',
        ref_id: id,
        data_invio: now,
        letta: false,
      })
    }
    await load()
  }, [tasks, currentUser, load])

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('personal_tasks').delete().eq('id', id)
    setTasks(ts => ts.filter(t => t.id !== id))
  }, [])

  // Controlla scadenze e crea follow-up
  const checkFollowUp = useCallback(async () => {
    const oggi = new Date().toISOString().split('T')[0]
    const scadute = tasks.filter(t =>
      t.stato !== 'completato' &&
      t.scadenza && t.scadenza < oggi &&
      t.assegnato_a === currentUser
    )
    for (const t of scadute) {
      await supabase.from('notifiche').insert({
        utente: currentUser,
        titolo: `Follow-up: ${t.titolo}`,
        messaggio: `Scaduto il ${t.scadenza} — ancora aperto`,
        tipo: 'scadenza',
        ref_tipo: 'personal_task',
        ref_id: t.id,
        data_invio: new Date().toISOString(),
        letta: false,
      }).throwOnError().select()
    }
  }, [tasks, currentUser])

  return {
    tasks, loading, load,
    mie, delegateAMe, condivise, delegateDaMe,
    addTask, updateTask, completeTask, deleteTask, checkFollowUp,
  }
}
