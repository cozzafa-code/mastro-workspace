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
  const [listening, setListening] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const oggi = new Date().toISOString().split('T')[0]
  const domani = new Date(Date.now()+86400000).toISOString().split('T')[0]
  const settProssima = new Date(Date.now()+7*86400000).toISOString().split('T')[0]
  const ACCENT = utente === 'fabio' ? '#0A8A7A' : '#BE185D'
  const altro = utente === 'fabio' ? 'lidia' : 'fabio'
  const altroNome = utente === 'fabio' ? 'Lidia' : 'Fabio'

  const progetti = workspaceData.progetti || []
  const tasks = workspaceData.tasks || []
  const clienti = workspaceData.clienti || []
  const campagne = workspaceData.campagne || []
  const spese = workspaceData.spese_correnti || []
  const idee = workspaceData.lab_idee || []
  const taskAperte = tasks.filter((t: any) => t.stato !== 'completato')
  const taskScadute = taskAperte.filter((t: any) => t.scadenza && t.scadenza < oggi)
  const totMRR = progetti.reduce((a: number, p: any) => a + (Number(p.mrr) || 0), 0)
  const totSpese = spese.filter((s: any) => s.tipo !== 'entrata').reduce((a: number, s: any) => a + Number(s.importo || 0), 0)

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

  const buildContext = useCallback(() => `Sei MASTRO AI — assistente operativo di ${utente === 'fabio' ? 'Fabio' : 'Lidia'}.
Oggi: ${oggi}. Domani: ${domani}. Settimana prossima: ${settProssima}.
Hai accesso COMPLETO al workspace. Puoi leggere e modificare TUTTO.

MRR: €${totMRR}/mo | Spese: €${totSpese}/mo

PROGETTI (${progetti.length}):
${progetti.slice(0,8).map((p: any) => `[${p.id}] ${p.nome} — €${p.mrr||0}/mo, ${p.beta_clienti||0} clienti, ${p.stato}`).join('\n')}

TASK APERTE (${taskAperte.length}, ${taskScadute.length} scadute):
${taskAperte.slice(0,12).map((t: any) => `[${t.id}] "${t.titolo||t.testo}" — ${t.chi||'?'}, p${t.priorita||'?'}, ${t.scadenza||'no-scad'}, ${t.stato}`).join('\n')}

CLIENTI (${clienti.length}):
${clienti.slice(0,6).map((c: any) => `[${c.id}] ${c.nome} — ${c.azienda||''}, ${c.stage||'?'}`).join('\n')}

IDEE (${idee.length}):
${idee.slice(0,5).map((i: any) => `[${i.id}] ${i.titolo||'senza titolo'}`).join('\n')}

AZIONI — rispondi SOLO con JSON {"azione":{...}} quando l'utente vuole fare qualcosa:
crea_task: {tipo,titolo,chi:"${utente}|${altro}",scadenza:"YYYY-MM-DD",priorita:"1-5",progetto}
modifica_task: {tipo,id,campo:"stato|priorita|scadenza|titolo|chi",valore}
completa_task: {tipo,id}
elimina_task: {tipo,id}
crea_delega: {tipo,titolo,a:"${altro}",scadenza}
crea_appuntamento: {tipo,titolo,data:"YYYY-MM-DD",ora:"HH:MM",descrizione}
crea_idea: {tipo,titolo,descrizione,categoria}
modifica_progetto: {tipo,id,campo:"mrr|stato|beta_clienti|nome",valore}
crea_cliente: {tipo,nome,azienda,email,stage:"lead|contatto|demo|proposta"}
modifica_cliente: {tipo,id,campo:"stage|note|follow_up_date",valore}
aggiungi_spesa: {tipo,nome,importo,categoria,frequenza:"mensile|annuale|una_tantum"}

Per domande informative rispondi normalmente in italiano, breve e diretto.`, [utente,altro,oggi,domani,settProssima,progetti,taskAperte,taskScadute,clienti,idee,totMRR,totSpese])

  const eseguiAzione = useCallback(async (action: any): Promise<string> => {
    try {
      switch (action.tipo) {
        case 'crea_task':
          await supabase.from('tasks').insert({ titolo: action.titolo, chi: action.chi||utente, stato: 'aperto', priorita: action.priorita||'3', scadenza: action.scadenza||null, progetto: action.progetto||null })
          onAction?.()
          return `✅ Task: "${action.titolo}"${action.scadenza ? ` · ${action.scadenza}` : ''}${action.chi!==utente ? ` · per ${altroNome}` : ''}`
        case 'modifica_task':
          await supabase.from('tasks').update({ [action.campo]: action.valore }).eq('id', action.id)
          onAction?.()
          return `✅ Task aggiornata: ${action.campo} = ${action.valore}`
        case 'completa_task':
          await supabase.from('tasks').update({ stato: 'completato' }).eq('id', action.id)
          onAction?.()
          return `✅ Task completata`
        case 'elimina_task':
          await supabase.from('tasks').delete().eq('id', action.id)
          onAction?.()
          return `🗑️ Task eliminata`
        case 'crea_delega':
          await supabase.from('personal_tasks').insert({ titolo: action.titolo, utente: action.a||altro, tipo: 'delega', creato_da: utente, assegnato_a: action.a||altro, stato: 'aperto', scadenza: action.scadenza||null })
          await supabase.from('notifiche').insert({ utente: action.a||altro, titolo: `📋 Da ${utente==='fabio'?'Fabio':'Lidia'}: ${action.titolo}`, tipo: 'sistema', data_invio: new Date().toISOString(), letta: false })
          onAction?.()
          return `✅ Delega a ${altroNome}: "${action.titolo}"`
        case 'crea_appuntamento':
          await supabase.from('calendario_eventi').insert({ titolo: action.titolo, data: action.data||oggi, ora_inizio: action.ora||'09:00', tipo: 'appuntamento', descrizione: action.descrizione||null, utente, colore: '#2563EB' })
          onAction?.()
          return `✅ Appuntamento: "${action.titolo}" · ${action.data||oggi} ${action.ora||'09:00'}`
        case 'crea_idea':
          await supabase.from('lab_idee').insert({ titolo: action.titolo, descrizione: action.descrizione||null, categoria: action.categoria||null, chi: utente, stato: 'aperto' })
          onAction?.()
          return `✅ Idea salvata: "${action.titolo}"`
        case 'modifica_progetto':
          await supabase.from('progetti').update({ [action.campo]: action.valore }).eq('id', action.id)
          onAction?.()
          return `✅ Progetto aggiornato: ${action.campo} = ${action.valore}`
        case 'crea_cliente':
          await supabase.from('clienti').insert({ nome: action.nome, azienda: action.azienda||null, email: action.email||null, stage: action.stage||'lead' })
          onAction?.()
          return `✅ Cliente: ${action.nome}`
        case 'modifica_cliente':
          await supabase.from('clienti').update({ [action.campo]: action.valore }).eq('id', action.id)
          onAction?.()
          return `✅ Cliente aggiornato: ${action.campo} = ${action.valore}`
        case 'aggiungi_spesa':
          await supabase.from('spese_correnti').insert({ nome: action.nome, importo: Number(action.importo), categoria: action.categoria||'altro', frequenza: action.frequenza||'mensile', tipo: 'uscita' })
          onAction?.()
          return `✅ Spesa aggiunta: ${action.nome} €${action.importo}/mese`
        default:
          return ''
      }
    } catch (e: any) {
      return `❌ Errore: ${e.message||'operazione fallita'}`
    }
  }, [utente, altro, altroNome, oggi, onAction])

  const sendAI = useCallback(async (testo?: string) => {
    const q = (testo || aiInput).trim()
    if (!q || aiLoading) return
    setAiInput('')
    setMsgs(m => [...m, { role: 'user', text: q }])
    setAiLoading(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    try {
      const key = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!key) { setMsgs(m => [...m, { role: 'assistant', text: '⚠️ OpenAI key non configurata.' }]); setAiLoading(false); return }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'gpt-4o', max_tokens: 600, messages: [{ role: 'system', content: buildContext() }, ...msgs.slice(-8).map(m => ({ role: m.role, content: m.text })), { role: 'user', content: q }] }),
      })
      const d = await res.json()
      let reply = d.choices?.[0]?.message?.content || 'Errore.'
      try {
        const clean = reply.trim().replace(/^```json\n?/,'').replace(/\n?```$/,'')
        const parsed = JSON.parse(clean)
        if (parsed.azione) {
          const r = await eseguiAzione(parsed.azione)
          if (r) { setMsgs(m => [...m, { role: 'assistant', text: r, action: parsed.azione.tipo }]); setAiLoading(false); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); return }
        }
      } catch {}
      setMsgs(m => [...m, { role: 'assistant', text: reply }])
    } catch { setMsgs(m => [...m, { role: 'assistant', text: 'Errore connessione.' }]) }
    setAiLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [aiInput, aiLoading, msgs, buildContext, eseguiAzione])

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
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Conosco tutto. Dimmi cosa fare:</div>
            {[
              'Cosa devo fare oggi?',
              'Crea task "call con cliente" per domani',
              `Delega a ${altroNome}: controlla preventivi`,
              'Task scadute questa settimana?',
              'Aggiungi cliente Acme Corp',
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
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        {listening && <div style={{ textAlign: 'center', fontSize: 11, color: '#FCA5A5', marginBottom: 6 }}>🎤 In ascolto...</div>}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {recognition && (
            <button onClick={() => { if (listening) { recognition.stop(); setListening(false) } else { recognition.start(); setListening(true) } }}
              style={{ width: 38, height: 38, borderRadius: '50%', background: listening ? '#DC4444' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="rgba(255,255,255,0.85)"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          )}
          <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI() } }}
            placeholder="Dimmi cosa fare..."
            style={{ flex: 1, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff', fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={() => sendAI()} disabled={!aiInput.trim() || aiLoading}
            style={{ width: 38, height: 38, borderRadius: '50%', background: aiInput.trim() && !aiLoading ? ACCENT : 'rgba(255,255,255,0.07)', border: 'none', cursor: aiInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
