// hooks/useWorkflow.ts
// Gestisce workflow automatici: task→notifica→dashboard
import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type EventType =
  | 'task_completata'
  | 'task_urgente'
  | 'delega_ricevuta'
  | 'delega_completata'
  | 'preventivo_firmato'
  | 'scadenza_domani'
  | 'nuovo_cliente'
  | 'mrr_aggiornato'

interface WorkflowEvent {
  tipo: EventType
  da: string
  a?: string
  titolo: string
  dati?: Record<string, any>
}

export function useWorkflow(currentUser: string) {
  const altro = currentUser === 'fabio' ? 'lidia' : 'fabio'

  // Invia notifica interna
  const notifica = useCallback(async (utente: string, titolo: string, tipo: string = 'sistema') => {
    await supabase.from('notifiche').insert({
      utente,
      titolo,
      tipo,
      data_invio: new Date().toISOString(),
      letta: false,
    })
  }, [])

  // Gestisce evento workflow
  const trigger = useCallback(async (event: WorkflowEvent) => {
    const { tipo, da, a, titolo, dati } = event

    switch (tipo) {
      case 'task_completata':
        // Notifica all'altro se era una delega
        if (dati?.assegnato_da && dati.assegnato_da !== da) {
          await notifica(dati.assegnato_da, `✅ ${titolo} — completata da ${da === 'fabio' ? 'Fabio' : 'Lidia'}`)
        }
        // Log nella bacheca condivisa se era condivisa
        if (dati?.condivisa) {
          await supabase.from('bacheca_condivisa').insert({
            tipo: 'nota',
            titolo: `✅ Completato: ${titolo}`,
            creato_da: da,
            completato: false,
            pinned: false,
          })
        }
        break

      case 'task_urgente':
        // Notifica immediata all'altro
        await notifica(altro, `🔴 Task urgente: ${titolo}`)
        break

      case 'delega_ricevuta':
        await notifica(a || altro, `📋 Nuova delega da ${da === 'fabio' ? 'Fabio' : 'Lidia'}: ${titolo}`)
        break

      case 'delega_completata':
        await notifica(dati?.delegato_da || altro, `✅ Delega completata: ${titolo}`)
        break

      case 'preventivo_firmato':
        await notifica(da, `🖊️ Preventivo firmato: ${titolo}`)
        await notifica(altro, `🖊️ Preventivo firmato: ${titolo}`)
        // Aggiorna stato preventivo
        if (dati?.preventivo_id) {
          await supabase.from('preventivi').update({ stato: 'accettato', accettato_il: new Date().toISOString() }).eq('id', dati.preventivo_id)
        }
        break

      case 'scadenza_domani':
        await notifica(a || da, `⏰ Scadenza domani: ${titolo}`)
        break

      case 'nuovo_cliente':
        await notifica(altro, `👤 Nuovo cliente aggiunto: ${titolo}`)
        break

      case 'mrr_aggiornato':
        await notifica(altro, `📈 MRR aggiornato: ${titolo}`)
        break
    }
  }, [currentUser, altro, notifica])

  // Completa task con workflow automatico
  const completaTask = useCallback(async (taskId: string, taskTitolo: string, opzioni?: { condivisa?: boolean; assegnato_da?: string }) => {
    // Aggiorna stato task
    await supabase.from('tasks').update({
      stato: 'completato',
      updated_at: new Date().toISOString(),
    }).eq('id', taskId)

    // Trigger workflow
    await trigger({
      tipo: 'task_completata',
      da: currentUser,
      titolo: taskTitolo,
      dati: opzioni,
    })
  }, [currentUser, trigger])

  // Crea delega con notifica automatica
  const creaDelega = useCallback(async (delega: { titolo: string; assegnato_a: string; scadenza?: string; progetto?: string }) => {
    const { data } = await supabase.from('personal_tasks').insert({
      titolo: delega.titolo,
      utente: delega.assegnato_a,
      tipo: 'delega',
      creato_da: currentUser,
      assegnato_a: delega.assegnato_a,
      stato: 'aperto',
      scadenza: delega.scadenza || null,
      progetto: delega.progetto || null,
    }).select().single()

    await trigger({
      tipo: 'delega_ricevuta',
      da: currentUser,
      a: delega.assegnato_a,
      titolo: delega.titolo,
    })

    return data
  }, [currentUser, trigger])

  // Check scadenze domani — da chiamare ogni mattina
  const checkScadenze = useCallback(async () => {
    const domani = new Date()
    domani.setDate(domani.getDate() + 1)
    const domaniStr = domani.toISOString().split('T')[0]

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, titolo, chi, scadenza')
      .eq('scadenza', domaniStr)
      .neq('stato', 'completato')

    for (const task of tasks || []) {
      await trigger({
        tipo: 'scadenza_domani',
        da: task.chi || currentUser,
        a: task.chi || currentUser,
        titolo: task.titolo || task.testo,
      })
    }

    return tasks?.length || 0
  }, [currentUser, trigger])

  return { trigger, completaTask, creaDelega, checkScadenze, notifica }
}
