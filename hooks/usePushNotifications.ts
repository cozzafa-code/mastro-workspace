// hooks/usePushNotifications.ts
// Notifiche push browser — richiede VAPID keys su Vercel
'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// VAPID public key — genera su https://vapidkeys.com e metti in NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export function usePushNotifications(currentUser: string) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [subscribed, setSubscribed] = useState(false)

  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  const richiediPermesso = useCallback(async () => {
    if (!isSupported) return false

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result !== 'granted') return false

    try {
      // Registra service worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Sottoscrivi a push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY) : undefined,
      })

      const subJson = sub.toJSON()

      // Salva subscription su Supabase
      await supabase.from('push_subscriptions').upsert({
        utente: currentUser,
        endpoint: subJson.endpoint,
        p256dh: (subJson.keys as any)?.p256dh || '',
        auth: (subJson.keys as any)?.auth || '',
        user_agent: navigator.userAgent,
      }, { onConflict: 'endpoint' })

      setSubscribed(true)
      return true
    } catch (e) {
      console.warn('Push subscription failed:', e)
      return false
    }
  }, [currentUser, isSupported])

  // Invia notifica locale (senza server — funziona sempre se permesso granted)
  const notificaLocale = useCallback((titolo: string, body: string, url?: string) => {
    if (permission !== 'granted') return
    const n = new Notification(titolo, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'mastro-os',
    })
    if (url) n.onclick = () => { window.focus(); window.location.href = url }
  }, [permission])

  return {
    isSupported,
    permission,
    subscribed,
    richiediPermesso,
    notificaLocale,
    isGranted: permission === 'granted',
  }
}
