'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Message = { role: 'user' | 'assistant'; content: string; ts: number }
type User = 'fabio' | 'lidia'

interface Props {
  currentUser: User
  onUpdateTask?: (taskId: string, stato: string) => void
}

async function loadContext(user: User) {
  const [tasks, progetti, spese, personalTasks] = await Promise.all([
    supabase.from('tasks').select('*').eq('chi', user).order('scadenza'),
    supabase.from('progetti').select('*').order('nome'),
    supabase.from('spese_correnti').select('*').eq('attiva', true),
    supabase.from('personal_tasks').select('*').eq('creato_da', user).neq('stato', 'fatto').order('scadenza'),
  ])

  const taskList = (tasks.data || []).map((t: any) =>
    `- [${t.stato}] ${t.testo}${t.scadenza ? ` (scadenza: ${t.scadenza})` : ''} [priorita: ${t.priorita}]`
  ).join('\n')

  const personalList = (personalTasks.data || []).map((t: any) =>
    `- [${t.stato}] ${t.titolo}${t.scadenza ? ` (scadenza: ${t.scadenza})` : ''}`
  ).join('\n')

  const progettoList = (progetti.data || []).map((p: any) =>
    `- ${p.nome} | stato: ${p.stato} | MRR: €${p.mrr || 0}/mo | target: €${p.obiettivo_mrr || 0}/mo`
  ).join('\n')

  const speseList = (spese.data || []).map((s: any) =>
    `- ${s.descrizione}: €${s.importo}/${s.frequenza}`
  ).join('\n')

  const totalSpese = (spese.data || [])
    .filter((s: any) => s.frequenza === 'mensile')
    .reduce((a: number, s: any) => a + (Number(s.importo) || 0), 0)

  return { taskList, personalList, progettoList, speseList, totalSpese, rawTasks: tasks.data || [], rawPersonal: personalTasks.data || [] }
}

function buildSystemPrompt(user: User, ctx: any): string {
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const isFabio = user === 'fabio'

  return `Sei MASTRO AI, il cervello operativo integrato di MASTRO Suite.
Data di oggi: ${oggi}
Stai parlando con: ${isFabio ? 'Fabio (Founder & CTO — sviluppatore, tecnico, diretto)' : 'Lidia (Co-Founder & COO — operations, marketing, legale)'}

CONTESTO AZIENDALE:
- Prodotto: MASTRO ERP — SaaS verticale per serramentisti europei
- Lancio Italia: Giugno 2026
- Target: 30 clienti, €4.400 MRR
- Burn rate attuale: €${ctx.totalSpese}/mese

PROGETTI ATTIVI:
${ctx.progettoList || 'Nessun progetto'}

SPESE MENSILI:
${ctx.speseList || 'Nessuna spesa'}

TASK DI PROGETTO (${user}):
${ctx.taskList || 'Nessun task di progetto'}

TASK PERSONALI (${user}):
${ctx.personalList || 'Nessun task personale'}

ISTRUZIONI COMPORTAMENTO:
${isFabio ? `
- Tono diretto e tecnico
- Risposte concise, no filler
- Se parla di codice, RLS, Supabase, deployment — entra nel dettaglio tecnico
- Ricordagli sempre le priorità critiche (RLS, Stripe, lancio)
- Quando dice "ho fatto X" aggiorna automaticamente il task corrispondente
` : `
- Tono caldo e operativo
- Guida passo passo quando serve
- Focus su: social, email, legale, beta tester, trademark
- Ricordala delle scadenze imminenti
- Celebra i progressi
`}

AZIONI DISPONIBILI:
Quando l'utente dice di aver completato qualcosa, rispondi con un JSON action block alla fine del messaggio:
<action>{"type":"update_task","task_text":"testo task","new_stato":"fatto"}</action>

Quando suggerisci di creare un nuovo task:
<action>{"type":"create_task","testo":"testo task","chi":"${user}","priorita":"alta"}</action>

REGOLE:
- Mai inventare dati che non hai
- Se non sai qualcosa, dillo
- Massimo 3 paragrafi per risposta normale
- Sii proattivo: se vedi scadenze imminenti, avvisa
- Ricorda sempre il target lancio Giugno 2026`
}

async function parseAndExecuteActions(content: string, user: User, onUpdate?: (id: string, stato: string) => void) {
  const actionRegex = /<action>(.*?)<\/action>/gs
  const matches = [...content.matchAll(actionRegex)]

  for (const match of matches) {
    try {
      const action = JSON.parse(match[1])
      if (action.type === 'update_task') {
        const { data } = await supabase
          .from('personal_tasks')
          .select('id')
          .eq('creato_da', user)
          .ilike('titolo', `%${action.task_text}%`)
          .limit(1)
        if (data && data[0]) {
          await supabase.from('personal_tasks').update({ stato: action.new_stato }).eq('id', data[0].id)
          onUpdate?.(data[0].id, action.new_stato)
        }
      } else if (action.type === 'create_task') {
        await supabase.from('personal_tasks').insert({
          titolo: action.testo,
          creato_da: user,
          assegnato_a: user,
          tipo: 'task',
          stato: 'aperto',
          priorita: action.priorita || 'alta',
        })
      }
    } catch {}
  }
}

function cleanContent(content: string): string {
  return content.replace(/<action>.*?<\/action>/gs, '').trim()
}

export function MastroAI({ currentUser, onUpdateTask }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState<any>(null)
  const [minimized, setMinimized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFabio = currentUser === 'fabio'
  const accent = isFabio ? '#0A8A7A' : '#BE185D'

  useEffect(() => {
    loadContext(currentUser).then(c => {
      setCtx(c)
      // Messaggio di benvenuto proattivo
      const oggi = new Date()
      const scadenze = [...(c.rawPersonal || []), ...(c.rawTasks || [])]
        .filter((t: any) => t.scadenza && new Date(t.scadenza) <= new Date(oggi.getTime() + 3 * 24 * 60 * 60 * 1000))
        .map((t: any) => t.titolo || t.testo)
      
      let welcome = isFabio
        ? `Ciao Fabio. Tutto sotto controllo.\n\nHai **${c.rawTasks.filter((t:any) => t.stato === 'aperto').length} task aperti** di progetto.`
        : `Ciao Lidia! Sono qui per aiutarti.\n\nHai **${c.rawPersonal.filter((t:any) => t.stato !== 'fatto').length} task da completare**.`

      if (scadenze.length > 0) {
        welcome += `\n\n⚠️ **Scadenze prossime (3 giorni):**\n${scadenze.map(s => `• ${s}`).join('\n')}`
      }

      setMessages([{ role: 'assistant', content: welcome, ts: Date.now() }])
    })
  }, [currentUser])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async () => {
    if (!input.trim() || loading || !ctx) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg, ts: Date.now() }]
    setMessages(newMessages)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 600,
          messages: [
            { role: 'system', content: buildSystemPrompt(currentUser, ctx) },
            ...newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      })

      const data = await response.json()
      const raw = data.choices?.[0]?.message?.content || 'Errore nella risposta.'

      await parseAndExecuteActions(raw, currentUser, onUpdateTask)
      const clean = cleanContent(raw)

      const updatedCtx = await loadContext(currentUser)
      setCtx(updatedCtx)

      setMessages(prev => [...prev, { role: 'assistant', content: clean, ts: Date.now() }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Errore di connessione. Riprova.', ts: Date.now() }])
    }

    setLoading(false)
  }, [input, loading, ctx, messages, currentUser, onUpdateTask])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const formatMsg = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  if (minimized) return (
    <div
      onClick={() => setMinimized(false)}
      style={{ position: 'fixed', bottom: 24, right: 24, background: accent, color: '#fff', borderRadius: 50, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 1000, fontSize: 22 }}>
      M
    </div>
  )

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 380, height: 560, background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden', border: `1px solid ${accent}30` }}>
      {/* Header */}
      <div style={{ background: accent, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14 }}>M</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>MASTRO AI</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{isFabio ? 'Assistente tecnico' : 'Assistente operativo'}</div>
          </div>
        </div>
        <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, opacity: 0.7 }}>−</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? accent : '#F8FAFC',
              color: m.role === 'user' ? '#fff' : '#1A1A2E',
              fontSize: 13,
              lineHeight: 1.5,
              border: m.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
            }}
              dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }}
            />
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 13, color: '#94A3B8' }}>
              Sto elaborando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={isFabio ? 'Cosa hai fatto? Cosa blocca?' : 'Dimmi cosa hai fatto oggi...'}
          rows={2}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? '#E2E8F0' : accent, color: loading || !input.trim() ? '#94A3B8' : '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }}>
          →
        </button>
      </div>
    </div>
  )
}
