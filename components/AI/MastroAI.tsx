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
  onClose?: () => void
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
    `- [${t.stato}] ${t.testo}${t.scadenza ? ` (scadenza: ${t.scadenza})` : ''}`
  ).join('\n')

  const personalList = (personalTasks.data || []).map((t: any) =>
    `- [${t.stato}] ${t.titolo}${t.scadenza ? ` (scadenza: ${t.scadenza})` : ''}`
  ).join('\n')

  const totalSpese = (spese.data || [])
    .filter((s: any) => s.frequenza === 'mensile')
    .reduce((a: number, s: any) => a + (Number(s.importo) || 0), 0)

  return {
    taskList,
    personalList,
    totalSpese,
    rawTasks: tasks.data || [],
    rawPersonal: personalTasks.data || [],
    progetti: progetti.data || [],
  }
}

function buildSystemPrompt(user: User, ctx: any): string {
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const isFabio = user === 'fabio'
  return `Sei MASTRO AI, assistente operativo integrato di MASTRO Suite.
Oggi: ${oggi}
Parli con: ${isFabio ? 'Fabio (CTO, tecnico, diretto)' : 'Lidia (COO, operations, marketing)'}
Burn rate: €${ctx.totalSpese}/mese | Lancio: Giugno 2026 | Target: 30 clienti

TASK PROGETTO:
${ctx.taskList || 'Nessuno'}

TASK PERSONALI:
${ctx.personalList || 'Nessuno'}

STILE: ${isFabio ? 'Diretto, tecnico, max 3 frasi.' : 'Caldo, operativo, max 3 frasi.'}
Quando qualcuno dice "ho fatto X": <action>{"type":"update_task","task_text":"X","new_stato":"fatto"}</action>`
}

async function parseAndExecuteActions(content: string, user: User, onUpdate?: (id: string, stato: string) => void) {
  const actionRegex = /<action>([\s\S]*?)<\/action>/g
  const matches = [...content.matchAll(actionRegex)]
  for (const match of matches) {
    try {
      const action = JSON.parse(match[1])
      if (action.type === 'update_task') {
        const { data } = await supabase.from('personal_tasks').select('id').eq('creato_da', user).ilike('titolo', `%${action.task_text}%`).limit(1)
        if (data && data[0]) {
          await supabase.from('personal_tasks').update({ stato: action.new_stato }).eq('id', data[0].id)
          onUpdate?.(data[0].id, action.new_stato)
        }
      } else if (action.type === 'create_task') {
        await supabase.from('personal_tasks').insert({ titolo: action.testo, creato_da: user, assegnato_a: user, tipo: 'task', stato: 'aperto', priorita: action.priorita || 'alta' })
      }
    } catch {}
  }
}

function cleanContent(content: string): string {
  return content.replace(/<action>[\s\S]*?<\/action>/g, '').trim()
}

function formatMsg(content: string): string {
  return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
}

export function MastroAI({ currentUser, onClose, onUpdateTask }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFabio = currentUser === 'fabio'
  const accent = isFabio ? '#0A8A7A' : '#BE185D'

  useEffect(() => {
    loadContext(currentUser).then(c => {
      setCtx(c)
      const scadenze = [...(c.rawPersonal || []), ...(c.rawTasks || [])]
        .filter((t: any) => { if (!t.scadenza) return false; const diff = new Date(t.scadenza).getTime() - Date.now(); return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000 })
        .map((t: any) => t.titolo || t.testo)
      const taskCount = isFabio ? c.rawTasks.filter((t: any) => t.stato === 'aperto').length : c.rawPersonal.filter((t: any) => t.stato !== 'fatto').length
      let welcome = isFabio ? `Ciao Fabio. **${taskCount} task aperti** oggi.` : `Ciao Lidia! **${taskCount} task** da completare.`
      if (scadenze.length > 0) welcome += `\n\n⚠️ **In scadenza presto:**\n${scadenze.map((s: string) => `• ${s}`).join('\n')}`
      setMessages([{ role: 'assistant', content: welcome, ts: Date.now() }])
    })
  }, [currentUser])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 400, messages: [{ role: 'system', content: buildSystemPrompt(currentUser, ctx) }, ...newMessages.slice(-8).map(m => ({ role: m.role, content: m.content }))] }),
      })
      const data = await response.json()
      const raw = data.choices?.[0]?.message?.content || 'Errore.'
      await parseAndExecuteActions(raw, currentUser, onUpdateTask)
      const clean = cleanContent(raw)
      const updatedCtx = await loadContext(currentUser)
      setCtx(updatedCtx)
      setMessages(prev => [...prev, { role: 'assistant', content: clean, ts: Date.now() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Errore. Riprova.', ts: Date.now() }])
    }
    setLoading(false)
  }, [input, loading, ctx, messages, currentUser, onUpdateTask])

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  const quickActions = isFabio
    ? ['Cosa devo fare oggi?', 'Stato RLS?', 'Runway?']
    : ['Cosa devo fare oggi?', 'Scadenze questa settimana?', 'Stato social?']

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F8FAFC', display: 'flex', flexDirection: 'column', zIndex: 2000, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: accent, padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top))', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 20, flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>MASTRO AI</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{isFabio ? 'Assistente tecnico' : 'Assistente operativo'}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{isFabio ? 'FA' : 'LI'}</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? accent : '#fff', color: m.role === 'user' ? '#fff' : '#1A1A2E', fontSize: 15, lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: m.role === 'assistant' ? '1px solid #E8EDF2' : 'none' }}
              dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }}
            />
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 18px', borderRadius: '18px 18px 18px 4px', background: '#fff', border: '1px solid #E8EDF2', fontSize: 20, letterSpacing: 4 }}>···</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0, background: '#fff', borderTop: '1px solid #E8EDF2' }}>
        {quickActions.map(q => (
          <button key={q} onClick={() => { setInput(q); setTimeout(() => send(), 0) }}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 13, color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', background: '#fff', display: 'flex', gap: 10, alignItems: 'flex-end', borderTop: '1px solid #E8EDF2', flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={isFabio ? 'Cosa hai fatto? Cosa blocca?' : 'Dimmi cosa hai fatto oggi...'}
          rows={1}
          style={{ flex: 1, padding: '10px 16px', border: '1.5px solid #E2E8F0', borderRadius: 24, fontSize: 15, resize: 'none', outline: 'none', lineHeight: 1.4, maxHeight: 100, background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? '#E2E8F0' : accent, color: loading || !input.trim() ? '#94A3B8' : '#fff', border: 'none', borderRadius: '50%', width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontSize: 20, flexShrink: 0 }}>
          →
        </button>
      </div>
    </div>
  )
}
