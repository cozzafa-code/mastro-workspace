// components/WorkspaceIntelligence/FabAI.tsx
// AI Assistant integrato nel FAB — estratto da page.tsx per evitare re-render infiniti
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  utente: string
  workspaceData: any
  onAction?: () => void
}

export function FabAI({ utente, workspaceData, onAction }: Props) {
  const [msgs, setMsgs] = useState<{ role: string; text: string; action?: string }[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const progetti = workspaceData.progetti || []
  const tasks = (workspaceData.tasks || []).filter((t: any) => t.stato !== 'completato')
  const totMRR = progetti.reduce((a: number, p: any) => a + (Number(p.mrr) || 0), 0)
  const oggi = new Date().toISOString().split('T')[0]
  const ACCENT = utente === 'fabio' ? '#0A8A7A' : '#BE185D'

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'it-IT'; rec.continuous = false; rec.interimResults = false
    rec.onresult = (e: any) => { setAiInput(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    setRecognition(rec)
  }, [])

  const systemCtx = `Sei MASTRO AI per ${utente === 'fabio' ? 'Fabio' : 'Lidia'}. Oggi: ${oggi}.
MRR: €${totMRR}/mo. Task aperte: ${tasks.slice(0,5).map((t: any) => '"' + (t.titolo||t.testo) + '"').join(', ')}.
Progetti: ${progetti.slice(0,3).map((p: any) => p.nome).join(', ')}.
Per creare task rispondi SOLO: {"azione":{"tipo":"crea_task","titolo":"...","chi":"${utente}","scadenza":"YYYY-MM-DD"}}.
Per delega: {"azione":{"tipo":"crea_delega","titolo":"...","a":"${utente === 'fabio' ? 'lidia' : 'fabio'}"}}.
Per appuntamento: {"azione":{"tipo":"crea_appuntamento","titolo":"...","data":"YYYY-MM-DD","ora":"HH:MM"}}.
Altrimenti rispondi in italiano, breve e diretto.`

  const eseguiAzione = useCallback(async (action: any): Promise<string> => {
    if (action.tipo === 'crea_task') {
      await supabase.from('tasks').insert({ titolo: action.titolo, chi: action.chi || utente, stato: 'aperto', priorita: '3', scadenza: action.scadenza || null })
      onAction?.()
      return `✅ Task creata: "${action.titolo}"`
    }
    if (action.tipo === 'crea_delega') {
      const altro = utente === 'fabio' ? 'lidia' : 'fabio'
      await supabase.from('personal_tasks').insert({ titolo: action.titolo, utente: action.a || altro, tipo: 'delega', creato_da: utente, assegnato_a: action.a || altro, stato: 'aperto' })
      onAction?.()
      return `✅ Delega inviata a ${(action.a || altro) === 'fabio' ? 'Fabio' : 'Lidia'}: "${action.titolo}"`
    }
    if (action.tipo === 'crea_appuntamento') {
      await supabase.from('calendario_eventi').insert({ titolo: action.titolo, data: action.data || oggi, ora_inizio: action.ora || '09:00', tipo: 'appuntamento', utente, colore: '#2563EB' })
      onAction?.()
      return `✅ Appuntamento: "${action.titolo}" il ${action.data || oggi}`
    }
    return ''
  }, [utente, oggi, onAction])

  const sendAI = useCallback(async (testo?: string) => {
    const q = (testo || aiInput).trim()
    if (!q || aiLoading) return
    setAiInput('')
    setMsgs(m => [...m, { role: 'user', text: q }])
    setAiLoading(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      const key = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!key) { setMsgs(m => [...m, { role: 'assistant', text: '⚠️ Configura NEXT_PUBLIC_OPENAI_API_KEY su Vercel.' }]); setAiLoading(false); return }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 400, messages: [{ role: 'system', content: systemCtx }, ...msgs.slice(-4).map(m => ({ role: m.role, content: m.text })), { role: 'user', content: q }] }),
      })
      const d = await res.json()
      let reply = d.choices?.[0]?.message?.content || 'Errore.'
      try {
        const parsed = JSON.parse(reply.trim())
        if (parsed.azione) { const r = await eseguiAzione(parsed.azione); setMsgs(m => [...m, { role: 'assistant', text: r, action: parsed.azione.tipo }]); setAiLoading(false); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); return }
      } catch {}
      setMsgs(m => [...m, { role: 'assistant', text: reply }])
    } catch { setMsgs(m => [...m, { role: 'assistant', text: 'Errore di connessione.' }]) }
    setAiLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [aiInput, aiLoading, msgs, systemCtx, eseguiAzione])

  // Auto-send dopo voce
  useEffect(() => {
    if (aiInput && !listening) {
      const t = setTimeout(() => sendAI(aiInput), 400)
      return () => clearTimeout(t)
    }
  }, [aiInput, listening])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.length === 0 && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Posso fare per te:</div>
            {['✓ Crea task rapida', '📅 Appuntamento domani', '→ Delega a ' + (utente === 'fabio' ? 'Lidia' : 'Fabio'), '📊 Come va il MRR?', '⚠️ Task in scadenza?'].map(s => (
              <button key={s} onClick={() => sendAI(s.slice(2))}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, marginBottom: 5, color: 'rgba(255,255,255,0.65)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '88%', padding: '8px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? ACCENT : m.action ? 'rgba(15,123,90,0.3)' : 'rgba(255,255,255,0.09)', fontSize: 13, color: '#fff', lineHeight: 1.5, border: m.action ? '1px solid rgba(15,123,90,0.4)' : 'none' }}>
              {m.text}
            </div>
          </div>
        ))}
        {aiLoading && <div style={{ display: 'flex', gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, opacity: 0.7 }} />)}</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {listening && <div style={{ textAlign: 'center', fontSize: 11, color: '#FCA5A5', marginBottom: 6 }}>🎤 Sto ascoltando...</div>}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {recognition && (
            <button onClick={() => { if (listening) { recognition.stop(); setListening(false) } else { recognition.start(); setListening(true) } }}
              style={{ width: 40, height: 40, borderRadius: '50%', background: listening ? '#DC4444' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="rgba(255,255,255,0.8)"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          )}
          <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendAI() } }}
            placeholder="Scrivi o parla..." style={{ flex: 1, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={() => sendAI()} disabled={!aiInput.trim() || aiLoading}
            style={{ width: 40, height: 40, borderRadius: '50%', background: aiInput.trim() && !aiLoading ? ACCENT : 'rgba(255,255,255,0.07)', border: 'none', cursor: aiInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
