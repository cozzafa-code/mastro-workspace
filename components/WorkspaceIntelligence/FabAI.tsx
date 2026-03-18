// components/WorkspaceIntelligence/FabAI.tsx
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
  const [liveMode, setLiveMode] = useState(false)
  const [liveStatus, setLiveStatus] = useState<'idle' | 'listening' | 'thinking'>('idle')
  const [recognition, setRecognition] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const silenceTimer = useRef<any>(null)
  const liveRef = useRef(false)

  const oggi = new Date().toISOString().split('T')[0]
  const domani = new Date(Date.now()+86400000).toISOString().split('T')[0]
  const settProssima = new Date(Date.now()+7*86400000).toISOString().split('T')[0]
  const ACCENT = utente === 'fabio' ? '#0A8A7A' : '#BE185D'
  const altro = utente === 'fabio' ? 'lidia' : 'fabio'
  const altroNome = utente === 'fabio' ? 'Lidia' : 'Fabio'

  const progetti = workspaceData.progetti || []
  const tasks = workspaceData.tasks || []
  const clienti = workspaceData.clienti || []
  const spese = workspaceData.spese_correnti || []
  const idee = workspaceData.lab_idee || []
  const taskAperte = tasks.filter((t: any) => t.stato !== 'completato')
  const taskScadute = taskAperte.filter((t: any) => t.scadenza && t.scadenza < oggi)
  const totMRR = progetti.reduce((a: number, p: any) => a + (Number(p.mrr) || 0), 0)
  const totSpese = spese.filter((s: any) => s.tipo !== 'entrata').reduce((a: number, s: any) => a + Number(s.importo || 0), 0)

  // Setup riconoscimento vocale
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'it-IT'
    rec.continuous = true       // continua ad ascoltare
    rec.interimResults = false  // solo risultati finali

    rec.onresult = (e: any) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim()
      if (transcript && liveRef.current) {
        clearTimeout(silenceTimer.current)
        sendAI(transcript)
      }
    }

    rec.onend = () => {
      // Riavvia automaticamente se siamo in live mode
      if (liveRef.current) {
        try { rec.start() } catch {}
      } else {
        setLiveStatus('idle')
      }
    }

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') return // silenzio normale
      if (liveRef.current) {
        try { rec.start() } catch {}
      }
    }

    setRecognition(rec)
    return () => { try { rec.stop() } catch {} }
  }, [])

  const toggleLive = useCallback(() => {
    if (!recognition) return

    if (liveMode) {
      // Spegni
      liveRef.current = false
      setLiveMode(false)
      setLiveStatus('idle')
      try { recognition.stop() } catch {}
    } else {
      // Accendi
      liveRef.current = true
      setLiveMode(true)
      setLiveStatus('listening')
      try { recognition.start() } catch {}
    }
  }, [liveMode, recognition])

  const buildContext = useCallback(() => `Sei MASTRO AI — assistente vocale operativo di ${utente === 'fabio' ? 'Fabio' : 'Lidia'}.
Oggi: ${oggi}. Domani: ${domani}. Sett. prossima: ${settProssima}.
MRR: €${totMRR}/mo | Spese: €${totSpese}/mo

PROGETTI: ${progetti.slice(0,8).map((p: any) => `[${p.id}] ${p.nome} €${p.mrr||0}/mo ${p.stato}`).join(' | ')}

TASK APERTE (${taskAperte.length}, ${taskScadute.length} scadute):
${taskAperte.slice(0,12).map((t: any) => `[${t.id}] "${t.titolo||t.testo}" ${t.chi||'?'} p${t.priorita||'?'} ${t.scadenza||'no-scad'} ${t.stato}`).join('\n')}

CLIENTI: ${clienti.slice(0,6).map((c: any) => `[${c.id}] ${c.nome} ${c.stage||'?'}`).join(' | ')}
IDEE: ${idee.slice(0,5).map((i: any) => `[${i.id}] ${i.titolo||'?'}`).join(' | ')}

AZIONI — rispondi con JSON {"azione":{tipo,...}} se l'utente vuole fare qualcosa:
crea_task:{tipo,titolo,chi:"${utente}|${altro}",scadenza:"YYYY-MM-DD",priorita:"1-5",progetto}
modifica_task:{tipo,id,campo:"stato|priorita|scadenza|titolo|chi",valore}
completa_task:{tipo,id}
elimina_task:{tipo,id}
crea_delega:{tipo,titolo,a:"${altro}",scadenza}
crea_appuntamento:{tipo,titolo,data:"YYYY-MM-DD",ora:"HH:MM"}
crea_idea:{tipo,titolo,descrizione,categoria}
modifica_progetto:{tipo,id,campo:"mrr|stato|beta_clienti",valore}
crea_cliente:{tipo,nome,azienda,email,stage}
aggiungi_spesa:{tipo,nome,importo,categoria,frequenza}

Per domande rispondi in italiano, BREVISSIMO (max 2 frasi) perché sei in modalità vocale.`, [utente,altro,oggi,domani,settProssima,progetti,taskAperte,taskScadute,clienti,idee,totMRR,totSpese])

  const eseguiAzione = useCallback(async (action: any): Promise<string> => {
    try {
      switch (action.tipo) {
        case 'crea_task':
          await supabase.from('tasks').insert({ titolo: action.titolo, chi: action.chi||utente, stato: 'aperto', priorita: action.priorita||'3', scadenza: action.scadenza||null, progetto: action.progetto||null })
          onAction?.(); return `Task creata: ${action.titolo}`
        case 'modifica_task':
          await supabase.from('tasks').update({ [action.campo]: action.valore }).eq('id', action.id)
          onAction?.(); return `Task aggiornata`
        case 'completa_task':
          await supabase.from('tasks').update({ stato: 'completato' }).eq('id', action.id)
          onAction?.(); return `Task completata`
        case 'elimina_task':
          await supabase.from('tasks').delete().eq('id', action.id)
          onAction?.(); return `Task eliminata`
        case 'crea_delega':
          await supabase.from('personal_tasks').insert({ titolo: action.titolo, utente: action.a||altro, tipo: 'delega', creato_da: utente, assegnato_a: action.a||altro, stato: 'aperto', scadenza: action.scadenza||null })
          await supabase.from('notifiche').insert({ utente: action.a||altro, titolo: `📋 Da ${utente==='fabio'?'Fabio':'Lidia'}: ${action.titolo}`, tipo: 'sistema', data_invio: new Date().toISOString(), letta: false })
          onAction?.(); return `Delega inviata a ${altroNome}`
        case 'crea_appuntamento':
          await supabase.from('calendario_eventi').insert({ titolo: action.titolo, data: action.data||oggi, ora_inizio: action.ora||'09:00', tipo: 'appuntamento', utente, colore: '#2563EB' })
          onAction?.(); return `Appuntamento creato: ${action.titolo} il ${action.data||oggi}`
        case 'crea_idea':
          await supabase.from('lab_idee').insert({ titolo: action.titolo, descrizione: action.descrizione||null, chi: utente, stato: 'aperto' })
          onAction?.(); return `Idea salvata: ${action.titolo}`
        case 'modifica_progetto':
          await supabase.from('progetti').update({ [action.campo]: action.valore }).eq('id', action.id)
          onAction?.(); return `Progetto aggiornato`
        case 'crea_cliente':
          await supabase.from('clienti').insert({ nome: action.nome, azienda: action.azienda||null, email: action.email||null, stage: action.stage||'lead' })
          onAction?.(); return `Cliente aggiunto: ${action.nome}`
        case 'aggiungi_spesa':
          await supabase.from('spese_correnti').insert({ nome: action.nome, importo: Number(action.importo), categoria: action.categoria||'altro', frequenza: action.frequenza||'mensile', tipo: 'uscita' })
          onAction?.(); return `Spesa aggiunta: ${action.nome} €${action.importo}`
        default: return ''
      }
    } catch (e: any) { return `Errore: ${e.message}` }
  }, [utente, altro, altroNome, oggi, onAction])

  const sendAI = useCallback(async (testo?: string) => {
    const q = (testo || aiInput).trim()
    if (!q || aiLoading) return
    setAiInput('')
    setMsgs(m => [...m, { role: 'user', text: q }])
    setAiLoading(true)
    if (liveRef.current) setLiveStatus('thinking')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      const key = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!key) { setMsgs(m => [...m, { role: 'assistant', text: 'OpenAI key mancante.' }]); setAiLoading(false); return }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 400,
          messages: [
            { role: 'system', content: buildContext() },
            ...msgs.slice(-6).map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: q }
          ],
        }),
      })
      const d = await res.json()
      let reply = d.choices?.[0]?.message?.content || 'Errore.'

      // Prova azione JSON
      try {
        const clean = reply.trim().replace(/^```json\n?/,'').replace(/\n?```$/,'')
        const parsed = JSON.parse(clean)
        if (parsed.azione) {
          const r = await eseguiAzione(parsed.azione)
          if (r) {
            setMsgs(m => [...m, { role: 'assistant', text: '✅ ' + r, action: parsed.azione.tipo }])
            // Leggi la risposta ad alta voce
            if (liveRef.current && 'speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(r)
              utterance.lang = 'it-IT'
              utterance.rate = 1.1
              utterance.onend = () => { if (liveRef.current) setLiveStatus('listening') }
              window.speechSynthesis.speak(utterance)
            } else if (liveRef.current) setLiveStatus('listening')
            setAiLoading(false)
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
            return
          }
        }
      } catch {}

      setMsgs(m => [...m, { role: 'assistant', text: reply }])

      // Leggi la risposta ad alta voce in live mode
      if (liveRef.current && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(reply)
        utterance.lang = 'it-IT'
        utterance.rate = 1.1
        utterance.onend = () => { if (liveRef.current) setLiveStatus('listening') }
        window.speechSynthesis.speak(utterance)
      } else if (liveRef.current) setLiveStatus('listening')

    } catch {
      setMsgs(m => [...m, { role: 'assistant', text: 'Errore connessione.' }])
      if (liveRef.current) setLiveStatus('listening')
    }
    setAiLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [aiInput, aiLoading, msgs, buildContext, eseguiAzione])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* Messaggi */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.length === 0 && !liveMode && (
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Conosco tutto il workspace. Dimmi cosa fare:
            </div>
            {[
              'Cosa devo fare oggi?',
              'Crea task "call cliente" per domani',
              `Delega a ${altroNome}: controlla preventivi`,
              'Task scadute?',
              'Come va il MRR?',
            ].map(s => (
              <button key={s} onClick={() => sendAI(s)}
                style={{ display: 'block', width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '90%', padding: '9px 13px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? ACCENT : m.action ? 'rgba(15,123,90,0.25)' : 'rgba(255,255,255,0.09)', border: m.action ? '1px solid rgba(15,123,90,0.4)' : 'none', fontSize: 13, color: '#fff', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {m.text}
            </div>
          </div>
        ))}

        {aiLoading && (
          <div style={{ display: 'flex', gap: 5 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, animation: `aipulse 1.2s ${i*0.2}s ease-in-out infinite` }} />)}
            <style>{`@keyframes aipulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Barra LIVE */}
      {recognition && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <button onClick={toggleLive}
            style={{
              width: '100%', padding: '11px', border: 'none', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              background: liveMode
                ? liveStatus === 'listening' ? '#DC4444' : liveStatus === 'thinking' ? '#D97706' : '#DC4444'
                : 'rgba(255,255,255,0.08)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: liveMode ? '0 0 20px rgba(220,68,68,0.4)' : 'none',
            }}>
            {liveMode ? (
              <>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: liveStatus === 'listening' ? 'livepulse 1s ease-in-out infinite' : 'none' }} />
                <style>{`@keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}`}</style>
                {liveStatus === 'listening' ? '● In ascolto — parla liberamente' : '◌ Sto pensando...'}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="white"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                Modalità Live — tieni premuto e parla
              </>
            )}
          </button>
        </div>
      )}

      {/* Input testo */}
      <div style={{ padding: '8px 12px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <input value={aiInput} onChange={e => setAiInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI() } }}
            placeholder="Scrivi oppure usa il Live..."
            style={{ flex: 1, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: '#fff', fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={() => sendAI()} disabled={!aiInput.trim() || aiLoading}
            style={{ width: 38, height: 38, borderRadius: '50%', background: aiInput.trim() && !aiLoading ? ACCENT : 'rgba(255,255,255,0.07)', border: 'none', cursor: aiInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
