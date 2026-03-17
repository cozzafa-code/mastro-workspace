// components/WorkspaceIntelligence/WorkspacePanel.tsx
'use client'
import { FC, useState, useEffect, useRef, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors
const NOME = (u: string) => u === 'fabio' ? 'Fabio' : 'Lidia'
const ACCENT = (u: string) => u === 'fabio' ? '#0A8A7A' : '#BE185D'

const NOTE_COLORS = ['#FEF3C7','#DBEAFE','#D1FAE5','#EDE9FE','#FFE4E6','#F3F4F6']

// ── Note rapide ───────────────────────────────────────────
const NoteTab: FC<{ utente: string; workspaceData: any }> = ({ utente, workspaceData }) => {
  const [note, setNote] = useState<any[]>([])
  const [form, setForm] = useState<any>({ colore: '#FEF3C7' })
  const [writing, setWriting] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('note_rapide').select('*').eq('utente', utente).order('pinned', { ascending: false }).order('updated_at', { ascending: false })
    setNote(data || [])
  }, [utente])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.contenuto?.trim()) return
    if (editId) {
      await supabase.from('note_rapide').update({ contenuto: form.contenuto, titolo: form.titolo || null, colore: form.colore, updated_at: new Date().toISOString() }).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('note_rapide').insert({ utente, contenuto: form.contenuto, titolo: form.titolo || null, colore: form.colore || '#FEF3C7' })
    }
    setForm({ colore: '#FEF3C7' }); setWriting(false); load()
  }

  const pin = async (id: string, pinned: boolean) => { await supabase.from('note_rapide').update({ pinned: !pinned }).eq('id', id); load() }
  const del = async (id: string) => { await supabase.from('note_rapide').delete().eq('id', id); load() }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: S.textSecondary }}>{note.length} note</span>
        <button onClick={() => { setWriting(true); setEditId(null); setForm({ colore: '#FEF3C7' }) }}
          style={{ padding: '5px 12px', background: ACCENT(utente), color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          + Nuova
        </button>
      </div>

      {writing && (
        <div style={{ background: form.colore, borderRadius: 10, padding: 12, marginBottom: 12, border: `1px solid ${S.border}` }}>
          <input value={form.titolo || ''} onChange={e => setForm((p: any) => ({ ...p, titolo: e.target.value }))} placeholder="Titolo (opzionale)"
            style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }} />
          <textarea value={form.contenuto || ''} onChange={e => setForm((p: any) => ({ ...p, contenuto: e.target.value }))} placeholder="Scrivi qui..." rows={4} autoFocus
            style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 13, fontFamily: DS.fonts.ui, outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            {NOTE_COLORS.map(c => <div key={c} onClick={() => setForm((p: any) => ({ ...p, colore: c }))} style={{ width: 18, height: 18, borderRadius: '50%', background: c, cursor: 'pointer', border: `2px solid ${form.colore === c ? '#0D1117' : 'transparent'}` }} />)}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={() => { setWriting(false); setForm({ colore: '#FEF3C7' }) }} style={{ padding: '4px 10px', border: `1px solid ${S.border}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: DS.fonts.ui }}>Annulla</button>
              <button onClick={save} style={{ padding: '4px 12px', background: ACCENT(utente), color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: DS.fonts.ui }}>Salva</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {note.map(n => (
          <div key={n.id} style={{ background: n.colore, borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: `1px solid ${S.border}`, cursor: 'pointer' }}
            onClick={() => { setEditId(n.id); setForm({ titolo: n.titolo, contenuto: n.contenuto, colore: n.colore }); setWriting(true) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {n.titolo && <div style={{ fontSize: 12, fontWeight: 700, color: S.textPrimary, marginBottom: 3 }}>{n.titolo}</div>}
                <div style={{ fontSize: 12, color: S.textSecondary, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.contenuto}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => pin(n.id, n.pinned)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, opacity: n.pinned ? 1 : 0.4 }}>📌</button>
                <button onClick={() => del(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: S.textMuted }}>✕</button>
              </div>
            </div>
            <div style={{ fontSize: 10, color: S.textMuted, marginTop: 6 }}>{new Date(n.updated_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        ))}
        {note.length === 0 && !writing && (
          <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: S.textMuted }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
            Nessuna nota · clicca "+ Nuova"
          </div>
        )}
      </div>
    </div>
  )
}

// ── Chat ──────────────────────────────────────────────────
const ChatTab: FC<{ utente: string; workspaceData: any }> = ({ utente, workspaceData }) => {
  const [msgs, setMsgs] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [allegato, setAllegato] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const altro = utente === 'fabio' ? 'lidia' : 'fabio'

  const load = useCallback(async () => {
    const { data } = await supabase.from('chat_messaggi').select('*').order('created_at', { ascending: true }).limit(100)
    setMsgs(data || [])
    // Segna come letti
    await supabase.rpc('array_append', {}).throwOnError().select().limit(0) // no-op, mark read via update
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [])

  useEffect(() => {
    load()
    const sub = supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messaggi' }, () => load()).subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [load])

  const send = async () => {
    if (!input.trim() && !allegato) return
    const msg: any = { da: utente, a: altro, testo: input.trim() || '📎 Allegato', tipo: allegato ? 'link' : 'testo' }
    if (allegato) { msg.allegato_url = allegato; msg.allegato_nome = allegato.split('/').pop() || 'File' }

    // Check for @mentions
    const progettoMention = (workspaceData.progetti || []).find((p: any) => input.includes('@' + p.nome.split(' ')[0]))
    if (progettoMention) { msg.ref_tipo = 'progetto'; msg.ref_id = progettoMention.id; msg.ref_nome = progettoMention.nome }

    await supabase.from('chat_messaggi').insert(msg)
    await supabase.from('notifiche').insert({ utente: altro, titolo: `💬 ${NOME(utente)}: ${input.trim().slice(0, 60)}`, tipo: 'sistema', data_invio: new Date().toISOString(), letta: false })
    setInput(''); setAllegato(''); setShowAttach(false)
  }

  const isMine = (m: any) => m.da === utente

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px 8px' }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: S.textMuted }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            Nessun messaggio — inizia a scrivere
          </div>
        )}
        {msgs.map((m, i) => {
          const mine = isMine(m)
          const showDate = i === 0 || new Date(msgs[i - 1].created_at).toDateString() !== new Date(m.created_at).toDateString()
          return (
            <div key={m.id}>
              {showDate && <div style={{ textAlign: 'center', fontSize: 10, color: S.textMuted, margin: '10px 0 6px', fontWeight: 600 }}>{new Date(m.created_at).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}</div>}
              <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                <div style={{ maxWidth: '80%' }}>
                  {!mine && <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT(m.da), marginBottom: 2 }}>{NOME(m.da)}</div>}
                  <div style={{ background: mine ? ACCENT(utente) : S.background, color: mine ? '#fff' : S.textPrimary, padding: '8px 12px', borderRadius: mine ? '12px 12px 2px 12px' : '12px 12px 12px 2px', fontSize: 13, lineHeight: 1.5, border: mine ? 'none' : `1px solid ${S.border}` }}>
                    {m.allegato_url ? (
                      <a href={m.allegato_url} target="_blank" rel="noopener noreferrer" style={{ color: mine ? '#fff' : S.teal, textDecoration: 'underline', fontSize: 12 }}>
                        📎 {m.allegato_nome || m.testo}
                      </a>
                    ) : m.testo}
                    {m.ref_nome && <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, borderTop: `1px solid ${mine ? 'rgba(255,255,255,0.3)' : S.border}`, paddingTop: 4 }}>📁 {m.ref_nome}</div>}
                  </div>
                  <div style={{ fontSize: 10, color: S.textMuted, marginTop: 2, textAlign: mine ? 'right' : 'left' }}>
                    {new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Attach URL */}
      {showAttach && (
        <div style={{ padding: '8px 0', borderTop: `1px solid ${S.border}` }}>
          <input value={allegato} onChange={e => setAllegato(e.target.value)} placeholder="URL allegato (Google Drive, Notion, PDF...)"
            style={{ width: '100%', padding: '6px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowAttach(!showAttach)} style={{ width: 34, height: 34, border: `1px solid ${S.border}`, borderRadius: 7, background: showAttach ? S.tealLight : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: S.textMuted, fontSize: 15 }} title="Allega URL">📎</button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Scrivi a ${NOME(altro)}... (@progetto per linkare)`}
            style={{ flex: 1, padding: '8px 12px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, outline: 'none' }} />
          <button onClick={send} disabled={!input.trim() && !allegato}
            style={{ width: 34, height: 34, background: input.trim() || allegato ? ACCENT(utente) : S.borderLight, border: 'none', borderRadius: 8, cursor: input.trim() || allegato ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke={input.trim() || allegato ? '#fff' : S.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AI Assistant ──────────────────────────────────────────
const AITab: FC<{ utente: string; workspaceData: any }> = ({ utente, workspaceData }) => {
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const oggi = new Date().toISOString().split('T')[0]
  const tasks = (workspaceData.tasks || []).filter((t: any) => t.stato !== 'completato')
  const progetti = workspaceData.progetti || []
  const totMRR = progetti.reduce((a: number, p: any) => a + (Number(p.mrr) || 0), 0)

  const buildContext = () => `Sei l'assistente AI di MASTRO OS, il workspace operativo di Fabio e Lidia Cozzafa.
Oggi: ${oggi}. Utente attivo: ${NOME(utente)}.

PROGETTI ATTIVI:
${progetti.filter((p: any) => p.stato === 'attivo').map((p: any) => `- ${p.nome}: €${p.mrr || 0}/mo, ${p.beta_clienti || 0} clienti, prezzo €${p.prezzo || 0}/mo`).join('\n')}

TASK APERTE (${tasks.length}):
${tasks.slice(0, 10).map((t: any) => `- [${t.chi || '?'}] ${t.titolo || t.testo}${t.scadenza ? ` (scadenza: ${t.scadenza})` : ''} — ${t.stato}`).join('\n')}

MRR TOTALE: €${totMRR}/mo
TARGET ODENSE: 34 clienti × €248 = €8.432/mo (${Math.round(totMRR / 8432 * 100)}% raggiunto)

Rispondi in italiano, in modo conciso e operativo. Puoi suggerire priorità, analizzare dati, rispondere a domande operative. Sii diretto.`

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMsgs(ms => [...ms, { role: 'user', text: userMsg }])
    setLoading(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      const history = msgs.slice(-6).map(m => ({ role: m.role, content: m.text }))
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildContext(),
          messages: [...history, { role: 'user', content: userMsg }],
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Errore nella risposta.'
      setMsgs(ms => [...ms, { role: 'assistant', text: reply }])
    } catch {
      setMsgs(ms => [...ms, { role: 'assistant', text: 'Errore di connessione. Riprova.' }])
    }
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const SUGGERIMENTI = [
    'Cosa devo fare oggi?',
    `Come va ${progetti[0]?.nome || 'MASTRO ERP'}?`,
    'Quali task sono in scadenza questa settimana?',
    'Quanto manca al target Odense?',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px 8px' }}>
        {msgs.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🤖</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary }}>AI Assistant MASTRO</div>
              <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>Conosce tutti i tuoi progetti, task, MRR e scadenze</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGERIMENTI.map(s => (
                <button key={s} onClick={() => { setInput(s); setTimeout(() => send, 100) }}
                  style={{ padding: '8px 12px', background: S.background, border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 12, color: S.textSecondary, cursor: 'pointer', textAlign: 'left', fontFamily: DS.fonts.ui }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT(utente); e.currentTarget.style.color = ACCENT(utente) }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.textSecondary }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: m.role === 'user' ? ACCENT(utente) : S.purple, marginBottom: 3, textTransform: 'uppercase' }}>
              {m.role === 'user' ? NOME(utente) : '🤖 AI'}
            </div>
            <div style={{ fontSize: 13, color: S.textPrimary, lineHeight: 1.6, background: m.role === 'assistant' ? S.background : 'transparent', padding: m.role === 'assistant' ? '10px 12px' : '0', borderRadius: 8, border: m.role === 'assistant' ? `1px solid ${S.border}` : 'none', whiteSpace: 'pre-wrap' }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: S.teal, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
            <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Chiedi all'AI..." disabled={loading}
            style={{ flex: 1, padding: '8px 12px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, outline: 'none' }} />
          <button onClick={send} disabled={!input.trim() || loading}
            style={{ width: 34, height: 34, background: input.trim() && !loading ? ACCENT(utente) : S.borderLight, border: 'none', borderRadius: 8, cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke={input.trim() && !loading ? '#fff' : S.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div style={{ fontSize: 10, color: S.textMuted, marginTop: 4, textAlign: 'center' }}>Conosce {tasks.length} task · {progetti.length} progetti · MRR €{totMRR}</div>
      </div>
    </div>
  )
}

// ── Main floating panel ───────────────────────────────────
export const WorkspacePanel: FC<{ utente: string; workspaceData: any }> = ({ utente, workspaceData }) => {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'note' | 'chat' | 'ai'>('ai')
  const accent = ACCENT(utente)

  const TABS = [
    { id: 'ai',   icon: '🤖', label: 'AI' },
    { id: 'chat', icon: '💬', label: 'Chat' },
    { id: 'note', icon: '📝', label: 'Note' },
  ]

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(!open)} style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 90,
        width: 52, height: 52, borderRadius: '50%',
        background: open ? '#0D1117' : accent,
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease',
        fontSize: 20,
      }}>
        {open ? '✕' : '✨'}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 88 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'fixed', bottom: 90, right: 24, zIndex: 89,
            width: 380, height: 560,
            background: S.surface, borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            border: `1px solid ${S.border}`,
            display: 'flex', flexDirection: 'column',
            animation: 'slideUp 0.2s ease',
          }}>
            <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Header */}
            <div style={{ padding: '14px 16px 0', borderBottom: `1px solid ${S.border}` }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 0 }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id as any)} style={{ flex: 1, padding: '8px 4px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? accent : S.textMuted, borderBottom: `2px solid ${tab === t.id ? accent : 'transparent'}`, fontFamily: DS.fonts.ui, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '14px 14px 0' }}>
              {tab === 'note' && <NoteTab utente={utente} workspaceData={workspaceData} />}
              {tab === 'chat' && <ChatTab utente={utente} workspaceData={workspaceData} />}
              {tab === 'ai'   && <AITab utente={utente} workspaceData={workspaceData} />}
            </div>

            {/* Footer padding */}
            <div style={{ height: 14 }} />
          </div>
        </>
      )}
    </>
  )
}
