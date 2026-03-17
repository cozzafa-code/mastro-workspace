// hooks/useDeleghe.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Delega {
  id: string
  titolo: string
  descrizione?: string
  creato_da: string
  assegnato_a: string
  stato: 'aperta' | 'in_corso' | 'completata' | 'in_ritardo' | 'annullata'
  priorita: '1' | '2' | '3' | '4' | '5'
  scadenza?: string
  ora_scadenza?: string
  progetto_id?: string
  progetto_nome?: string
  task_id?: string
  allegati?: string
  nota_completamento?: string
  completato_il?: string
  notifica_email?: boolean
  created_at?: string
}

export function useDeleghe(currentUser: string) {
  const [deleghe, setDeleghe] = useState<Delega[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('tipo', 'delega')
      .or(`creato_da.eq.${currentUser},assegnato_a.eq.${currentUser}`)
      .order('created_at', { ascending: false })

    // Aggiorna stato in_ritardo automaticamente
    const oggi = new Date().toISOString().split('T')[0]
    const aggiornate = (data || []).map((d: any) => ({
      ...d,
      stato: d.stato !== 'completata' && d.stato !== 'annullata' && d.scadenza && d.scadenza < oggi
        ? 'in_ritardo' : d.stato
    }))
    setDeleghe(aggiornate)
    setLoading(false)
  }, [currentUser])

  useEffect(() => { load() }, [load])

  const crea = useCallback(async (d: Omit<Delega, 'id' | 'created_at' | 'stato'>) => {
    const { data } = await supabase.from('personal_tasks').insert({
      ...d, tipo: 'delega', stato: 'aperta', visibilita: 'condiviso',
    }).select().single()

    // Notifica immediata all'assegnatario
    if (d.assegnato_a !== currentUser) {
      await supabase.from('notifiche').insert({
        utente: d.assegnato_a,
        titolo: `📋 Nuova delega da ${currentUser === 'fabio' ? 'Fabio' : 'Lidia'}`,
        messaggio: d.titolo + (d.scadenza ? ` · scadenza ${d.scadenza}` : ''),
        tipo: 'reminder', ref_tipo: 'delega', ref_id: data?.id,
        data_invio: new Date().toISOString(), letta: false,
      })
    }
    await load()
    return data
  }, [currentUser, load])

  const aggiornaStato = useCallback(async (id: string, stato: Delega['stato'], nota?: string) => {
    const patch: any = { stato }
    if (stato === 'completata') {
      patch.completato_il = new Date().toISOString()
      patch.nota_completamento = nota || null
    }
    await supabase.from('personal_tasks').update(patch).eq('id', id)

    // Notifica al creatore se completata
    const delega = deleghe.find(d => d.id === id)
    if (stato === 'completata' && delega && delega.creato_da !== currentUser) {
      await supabase.from('notifiche').insert({
        utente: delega.creato_da,
        titolo: `✅ Completata: ${delega.titolo}`,
        messaggio: nota ? `Nota: ${nota}` : `Completata da ${currentUser === 'fabio' ? 'Fabio' : 'Lidia'}`,
        tipo: 'sistema', ref_tipo: 'delega', ref_id: id,
        data_invio: new Date().toISOString(), letta: false,
      })
    }
    await load()
  }, [deleghe, currentUser, load])

  const elimina = useCallback(async (id: string) => {
    await supabase.from('personal_tasks').delete().eq('id', id)
    setDeleghe(ds => ds.filter(d => d.id !== id))
  }, [])

  const daMe = deleghe.filter(d => d.creato_da === currentUser && d.assegnato_a !== currentUser)
  const aMe = deleghe.filter(d => d.assegnato_a === currentUser && d.creato_da !== currentUser)
  const pendingAMe = aMe.filter(d => !['completata', 'annullata'].includes(d.stato))
  const inRitardo = deleghe.filter(d => d.stato === 'in_ritardo')

  return {
    deleghe, loading, load,
    daMe, aMe, pendingAMe, inRitardo,
    crea, aggiornaStato, elimina,
  }
}
