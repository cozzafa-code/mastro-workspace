// hooks/useNotifiche.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Notifica } from '@/lib/types'

export function useNotifiche(utente: string) {
  const [notifiche, setNotifiche] = useState<Notifica[]>([])
  const [permesso, setPermesso] = useState<NotificationPermission>('default')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notifiche')
      .select('*')
      .eq('utente', utente)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifiche(data || [])
  }, [utente])

  useEffect(() => {
    load()
    if ('Notification' in window) setPermesso(Notification.permission)
  }, [load])

  const richiediPermesso = useCallback(async () => {
    if (!('Notification' in window)) return
    const p = await Notification.requestPermission()
    setPermesso(p)
  }, [])

  const inviaNotificaBrowser = useCallback((titolo: string, body?: string) => {
    if (permesso !== 'granted') return
    new Notification(titolo, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  }, [permesso])

  const creaNotifica = useCallback(async (n: Omit<Notifica, 'id' | 'letta' | 'created_at'>) => {
    await supabase.from('notifiche').insert({ ...n, letta: false })
    inviaNotificaBrowser(n.titolo, n.messaggio)
    await load()
  }, [load, inviaNotificaBrowser])

  const segnaLetta = useCallback(async (id: string) => {
    await supabase.from('notifiche').update({ letta: true }).eq('id', id)
    setNotifiche(ns => ns.map(n => n.id === id ? { ...n, letta: true } : n))
  }, [])

  const segnaLutteLette = useCallback(async () => {
    await supabase.from('notifiche').update({ letta: true }).eq('utente', utente).eq('letta', false)
    setNotifiche(ns => ns.map(n => ({ ...n, letta: true })))
  }, [utente])

  const eliminaNotifica = useCallback(async (id: string) => {
    await supabase.from('notifiche').delete().eq('id', id)
    setNotifiche(ns => ns.filter(n => n.id !== id))
  }, [])

  // Controlla scadenze task e crea notifiche automatiche
  const checkScadenze = useCallback(async () => {
    const oggi = new Date().toISOString().split('T')[0]
    const domani = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, titolo, testo, scadenza, stato')
      .in('scadenza', [oggi, domani])
      .neq('stato', 'completato')
      .neq('stato', 'Fatto')

    for (const t of tasks || []) {
      const isOggi = t.scadenza === oggi
      const nome = t.titolo || t.testo || 'Task'
      // Controlla se notifica già esistente per questo task oggi
      const { data: existing } = await supabase
        .from('notifiche')
        .select('id')
        .eq('ref_id', t.id)
        .eq('ref_tipo', 'task')
        .gte('created_at', `${oggi}T00:00:00`)
        .limit(1)

      if (!existing || existing.length === 0) {
        await creaNotifica({
          utente, titolo: isOggi ? `Scadenza oggi: ${nome}` : `Scadenza domani: ${nome}`,
          messaggio: isOggi ? 'Task in scadenza oggi' : 'Task in scadenza domani',
          tipo: 'scadenza', ref_tipo: 'task', ref_id: t.id, data_invio: new Date().toISOString(),
        })
      }
    }
  }, [utente, creaNotifica])

  const nonLette = notifiche.filter(n => !n.letta).length

  return {
    notifiche, permesso, nonLette,
    richiediPermesso, creaNotifica, segnaLetta, segnaLutteLette, eliminaNotifica, checkScadenze, load,
  }
}
