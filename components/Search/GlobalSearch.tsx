// components/Search/GlobalSearch.tsx
'use client'
import { FC, useState, useEffect, useRef, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

interface Result {
  id: string
  tipo: 'task' | 'cliente' | 'progetto' | 'idea' | 'preventivo' | 'fattura' | 'nota'
  titolo: string
  sub?: string
  colore?: string
  onClick: () => void
}

const TIPO_CFG: Record<string, { icon: string; color: string; label: string }> = {
  task:       { icon: '✓',  color: S.teal,    label: 'Task' },
  cliente:    { icon: '👤', color: S.blue,    label: 'Cliente' },
  progetto:   { icon: '🚀', color: S.green,   label: 'Progetto' },
  idea:       { icon: '💡', color: '#6D28D9', label: 'Idea' },
  preventivo: { icon: '📋', color: S.amber,   label: 'Preventivo' },
  fattura:    { icon: '📄', color: S.purple,  label: 'Fattura' },
  nota:       { icon: '📝', color: S.textMuted, label: 'Nota' },
}

interface Props {
  onNavigate: (tab: string, extra?: any) => void
  onClose: () => void
}

export const GlobalSearch: FC<Props> = ({ onNavigate, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<any>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)

    const term = `%${q}%`
    const [tasks, clienti, progetti, idee, preventivi, fatture] = await Promise.all([
      supabase.from('tasks').select('id,titolo,testo,chi,stato,scadenza').or(`titolo.ilike.${term},testo.ilike.${term}`).neq('stato','completato').limit(5),
      supabase.from('clienti').select('id,nome,email,azienda').or(`nome.ilike.${term},email.ilike.${term},azienda.ilike.${term}`).limit(5),
      supabase.from('progetti').select('id,nome,descrizione,stato,colore').or(`nome.ilike.${term},descrizione.ilike.${term}`).limit(5),
      supabase.from('lab_idee').select('id,titolo,descrizione,contenuto_ricco').or(`titolo.ilike.${term},descrizione.ilike.${term},contenuto_ricco.ilike.${term}`).limit(4),
      supabase.from('preventivi').select('id,titolo,cliente_nome,stato').or(`titolo.ilike.${term},cliente_nome.ilike.${term}`).limit(3),
      supabase.from('fatture').select('id,numero,controparte_nome,stato,totale').or(`numero.ilike.${term},controparte_nome.ilike.${term}`).limit(3),
    ])

    const res: Result[] = [
      ...(tasks.data || []).map(t => ({
        id: t.id, tipo: 'task' as const,
        titolo: t.titolo || t.testo,
        sub: [t.chi, t.scadenza, t.stato].filter(Boolean).join(' · '),
        onClick: () => { onNavigate('task'); onClose() }
      })),
      ...(clienti.data || []).map(c => ({
        id: c.id, tipo: 'cliente' as const,
        titolo: c.nome,
        sub: [c.azienda, c.email].filter(Boolean).join(' · '),
        onClick: () => { onNavigate('clienti'); onClose() }
      })),
      ...(progetti.data || []).map(p => ({
        id: p.id, tipo: 'progetto' as const,
        titolo: p.nome,
        sub: p.stato,
        colore: p.colore,
        onClick: () => { onNavigate('progetti', p); onClose() }
      })),
      ...(idee.data || []).map(i => ({
        id: i.id, tipo: 'idea' as const,
        titolo: i.titolo || 'Idea senza titolo',
        sub: (i.descrizione || i.contenuto_ricco || '').slice(0, 60),
        onClick: () => { onNavigate('lab_idee'); onClose() }
      })),
      ...(preventivi.data || []).map(p => ({
        id: p.id, tipo: 'preventivo' as const,
        titolo: p.titolo,
        sub: [p.cliente_nome, p.stato].filter(Boolean).join(' · '),
        onClick: () => { onNavigate('preventivi'); onClose() }
      })),
      ...(fatture.data || []).map(f => ({
        id: f.id, tipo: 'fattura' as const,
        titolo: `${f.numero} — ${f.controparte_nome || ''}`,
        sub: `€${Number(f.totale).toLocaleString('it-IT')} · ${f.stato}`,
        onClick: () => { onNavigate('contabilita'); onClose() }
      })),
    ]

    setResults(res)
    setSelected(0)
    setLoading(false)
  }, [onNavigate, onClose])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 200)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) { results[selected].onClick() }
    if (e.key === 'Escape') onClose()
  }

  // Highlight match
  const highlight = (text: string, q: string) => {
    if (!q || q.length < 2) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: S.tealLight, color: S.teal, borderRadius: 2, padding: '0 1px' }}>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  // Shortcuts rapide
  const SHORTCUTS = [
    { label: '+ Task', action: () => { onNavigate('task'); onClose() } },
    { label: '+ Idea', action: () => { onNavigate('lab_idee'); onClose() } },
    { label: 'Dashboard', action: () => { onNavigate('dashboard'); onClose() } },
    { label: 'Preventivi', action: () => { onNavigate('preventivi'); onClose() } },
    { label: 'Calendario', action: () => { onNavigate('calendario'); onClose() } },
    { label: 'Team', action: () => { onNavigate('team'); onClose() } },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,31,42,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, padding: '80px 16px 16px', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: S.surface, borderRadius: 16, width: '100%', maxWidth: 600, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${S.border}` }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke={S.textMuted} strokeWidth="2"/><path d="M13.5 13.5L17 17" stroke={S.textMuted} strokeWidth="2" strokeLinecap="round"/></svg>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder="Cerca task, clienti, progetti, idee, preventivi, fatture..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontFamily: DS.fonts.ui, color: S.textPrimary, background: 'transparent' }} />
          {loading && <div style={{ width: 16, height: 16, border: `2px solid ${S.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
          <button onClick={onClose} style={{ background: S.background, border: `1px solid ${S.border}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: S.textMuted, fontFamily: DS.fonts.ui }}>ESC</button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {/* Raggruppa per tipo */}
            {(['task','cliente','progetto','idea','preventivo','fattura'] as const).map(tipo => {
              const group = results.filter(r => r.tipo === tipo)
              if (group.length === 0) return null
              const cfg = TIPO_CFG[tipo]
              return (
                <div key={tipo}>
                  <div style={{ padding: '8px 20px 4px', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, background: S.background }}>{cfg.label}</div>
                  {group.map((r, i) => {
                    const globalIdx = results.indexOf(r)
                    return (
                      <div key={r.id} onClick={r.onClick}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer', background: globalIdx === selected ? S.tealLight : 'transparent', borderLeft: globalIdx === selected ? `3px solid ${S.teal}` : '3px solid transparent' }}
                        onMouseEnter={() => setSelected(globalIdx)}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: cfg.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{cfg.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{highlight(r.titolo, query)}</div>
                          {r.sub && <div style={{ fontSize: 11, color: S.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>}
                        </div>
                        {r.colore && <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.colore, flexShrink: 0 }} />}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Nessun risultato */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: S.textSecondary }}>Nessun risultato per "{query}"</div>
            <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>Prova con un altro termine</div>
          </div>
        )}

        {/* Shortcuts rapide quando vuoto */}
        {query.length < 2 && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Vai a</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SHORTCUTS.map(s => (
                <button key={s.label} onClick={s.action}
                  style={{ padding: '6px 12px', background: S.background, border: `1px solid ${S.border}`, borderRadius: 20, fontSize: 12, color: S.textSecondary, cursor: 'pointer', fontFamily: DS.fonts.ui }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = S.teal; e.currentTarget.style.color = S.teal }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.textSecondary }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: S.textMuted, marginTop: 14 }}>
              ↑↓ naviga · Enter seleziona · ESC chiudi
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
