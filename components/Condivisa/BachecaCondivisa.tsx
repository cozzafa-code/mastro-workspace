// components/Condivisa/BachecaCondivisa.tsx
'use client'
import { FC, useState, useEffect, useCallback, useRef } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'
import { useDevice } from '@/hooks/useDevice'

const S = DS.colors
const ACCENT = (u: string) => u === 'fabio' ? '#0A8A7A' : '#BE185D'
const ACCENT_LIGHT = (u: string) => u === 'fabio' ? '#EDF7F6' : '#FDF0F6'
const NOME = (u: string) => u === 'fabio' ? 'Fabio' : 'Lidia'
const INIZIALI = (u: string) => u === 'fabio' ? 'FA' : 'LI'

type ItemType = 'nota' | 'decisione' | 'task' | 'link' | 'urgente'

interface BachecaItem {
  id: string
  tipo: ItemType
  titolo: string
  contenuto?: string
  url?: string
  creato_da: string
  completato: boolean
  pinned: boolean
  created_at: string
}

const TIPO_CFG: Record<ItemType, { icon: string; label: string; color: string; bg: string }> = {
  nota:      { icon: '📝', label: 'Nota',      color: '#B45309', bg: '#FEF3C7' },
  decisione: { icon: '⚡', label: 'Decisione', color: '#6D28D9', bg: '#EDE9FE' },
  task:      { icon: '✓',  label: 'Task',      color: S.teal,    bg: S.tealLight },
  link:      { icon: '🔗', label: 'Link',      color: S.blue,    bg: S.blueLight },
  urgente:   { icon: '🔴', label: 'Urgente',   color: S.red,     bg: S.redLight },
}

// ── Item Card ─────────────────────────────────────────────
const BachecaCard: FC<{ item: BachecaItem; currentUser: string; onToggle: () => void; onDelete: () => void; onPin: () => void }> = ({ item, currentUser, onToggle, onDelete, onPin }) => {
  const cfg = TIPO_CFG[item.tipo]
  const isMine = item.creato_da === currentUser

  return (
    <div style={{
      background: item.completato ? S.background : S.surface,
      border: `1px solid ${item.pinned ? ACCENT(item.creato_da) + '60' : S.border}`,
      borderLeft: `3px solid ${item.pinned ? ACCENT(item.creato_da) : cfg.color}`,
      borderRadius: 10, padding: '12px 14px',
      opacity: item.completato ? 0.6 : 1,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Tipo icon / checkbox */}
        <div onClick={item.tipo === 'task' ? onToggle : undefined}
          style={{ width: 28, height: 28, borderRadius: 7, background: item.completato ? S.greenLight : cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: item.tipo === 'task' ? 'pointer' : 'default', fontSize: 13 }}>
          {item.tipo === 'task' && item.completato ? '✓' : cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 10, background: cfg.bg, color: cfg.color, padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>{cfg.label}</span>
            <span style={{ fontSize: 10, color: ACCENT(item.creato_da), fontWeight: 600 }}>{NOME(item.creato_da)}</span>
            {item.pinned && <span style={{ fontSize: 10 }}>📌</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: item.completato ? S.textMuted : S.textPrimary, textDecoration: item.completato ? 'line-through' : 'none' }}>
            {item.titolo}
          </div>
          {item.contenuto && <div style={{ fontSize: 12, color: S.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{item.contenuto}</div>}
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: S.teal, display: 'block', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</a>}
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={onPin} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: item.pinned ? 1 : 0.3 }} title="Pin">📌</button>
          {item.tipo === 'task' && <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: S.green }} title="Completa">✓</button>}
          {isMine && <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: S.textMuted }} title="Elimina">✕</button>}
        </div>
      </div>

      <div style={{ fontSize: 10, color: S.textMuted, marginTop: 6, textAlign: 'right' }}>
        {new Date(item.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}

// ── Quick Add Form ────────────────────────────────────────
const QuickAdd: FC<{ currentUser: string; onSave: (item: Partial<BachecaItem>) => void }> = ({ currentUser, onSave }) => {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<ItemType>('nota')
  const [titolo, setTitolo] = useState('')
  const [contenuto, setContenuto] = useState('')
  const [url, setUrl] = useState('')
  const accent = ACCENT(currentUser)

  const save = () => {
    if (!titolo.trim()) return
    onSave({ tipo, titolo: titolo.trim(), contenuto: contenuto.trim() || undefined, url: url.trim() || undefined, creato_da: currentUser, completato: false, pinned: false })
    setTitolo(''); setContenuto(''); setUrl(''); setOpen(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width: '100%', padding: '12px', background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, color: S.textMuted, fontFamily: DS.fonts.ui, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 18 }}>+</span> Aggiungi alla bacheca condivisa
    </button>
  )

  return (
    <div style={{ background: ACCENT_LIGHT(currentUser), border: `1px solid ${accent}30`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
      {/* Tipo selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {(Object.keys(TIPO_CFG) as ItemType[]).map(t => (
          <button key={t} onClick={() => setTipo(t)}
            style={{ padding: '4px 10px', border: `1px solid ${tipo === t ? TIPO_CFG[t].color : S.border}`, borderRadius: 20, background: tipo === t ? TIPO_CFG[t].bg : 'none', color: tipo === t ? TIPO_CFG[t].color : S.textMuted, fontSize: 11, fontWeight: tipo === t ? 700 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
            {TIPO_CFG[t].icon} {TIPO_CFG[t].label}
          </button>
        ))}
      </div>

      <input value={titolo} onChange={e => setTitolo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) save() }}
        placeholder={tipo === 'decisione' ? 'Abbiamo deciso...' : tipo === 'urgente' ? 'Urgente:' : tipo === 'link' ? 'Nome link...' : 'Scrivi qui...'}
        autoFocus style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, marginBottom: 8, boxSizing: 'border-box' }} />

      {(tipo === 'nota' || tipo === 'decisione') && (
        <textarea value={contenuto} onChange={e => setContenuto(e.target.value)} placeholder="Dettagli (opzionale)..." rows={2}
          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, fontFamily: DS.fonts.ui, resize: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
      )}

      {tipo === 'link' && (
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." type="url"
          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, fontFamily: DS.fonts.ui, marginBottom: 8, boxSizing: 'border-box' }} />
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={() => setOpen(false)} style={{ padding: '6px 14px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.fonts.ui }}>Annulla</button>
        <button onClick={save} disabled={!titolo.trim()} style={{ padding: '6px 16px', background: titolo.trim() ? accent : S.borderLight, color: titolo.trim() ? '#fff' : S.textMuted, border: 'none', borderRadius: 7, cursor: titolo.trim() ? 'pointer' : 'default', fontSize: 12, fontWeight: 700, fontFamily: DS.fonts.ui }}>
          Aggiungi
        </button>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────
export const BachecaCondivisa: FC<{ currentUser: string }> = ({ currentUser }) => {
  const device = useDevice()
  const [items, setItems] = useState<BachecaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<ItemType | 'tutti'>('tutti')
  const [mostraCompletati, setMostraCompletati] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('bacheca_condivisa').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const sub = supabase.channel('bacheca').on('postgres_changes', { event: '*', schema: 'public', table: 'bacheca_condivisa' }, load).subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [load])

  const add = async (item: Partial<BachecaItem>) => {
    await supabase.from('bacheca_condivisa').insert(item)
    // Notifica all'altro utente
    const altro = currentUser === 'fabio' ? 'lidia' : 'fabio'
    await supabase.from('notifiche').insert({ utente: altro, titolo: `📋 ${NOME(currentUser)} ha aggiunto: ${item.titolo}`, tipo: 'sistema', data_invio: new Date().toISOString(), letta: false })
    load()
  }

  const toggle = async (id: string, completato: boolean) => {
    await supabase.from('bacheca_condivisa').update({ completato: !completato }).eq('id', id); load()
  }

  const del = async (id: string) => { await supabase.from('bacheca_condivisa').delete().eq('id', id); load() }

  const pin = async (id: string, pinned: boolean) => { await supabase.from('bacheca_condivisa').update({ pinned: !pinned }).eq('id', id); load() }

  const filtered = items.filter(i => {
    if (!mostraCompletati && i.completato) return false
    if (filtro !== 'tutti' && i.tipo !== filtro) return false
    return true
  })

  const pinned = filtered.filter(i => i.pinned)
  const resto = filtered.filter(i => !i.pinned)

  // Stats
  const totTask = items.filter(i => i.tipo === 'task' && !i.completato).length
  const totDecisioni = items.filter(i => i.tipo === 'decisione').length
  const totUrgenti = items.filter(i => i.tipo === 'urgente' && !i.completato).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Bacheca Condivisa</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>
            Fabio & Lidia · {totTask > 0 && `${totTask} task aperte · `}{totUrgenti > 0 && `🔴 ${totUrgenti} urgenti · `}{totDecisioni} decisioni
          </div>
        </div>
        {/* Avatar coppia */}
        <div style={{ display: 'flex', gap: -4 }}>
          {['fabio','lidia'].map(u => (
            <div key={u} style={{ width: 32, height: 32, borderRadius: '50%', background: ACCENT(u), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', border: `2px solid ${S.surface}`, marginLeft: u === 'lidia' ? -8 : 0 }}>
              {INIZIALI(u)}
            </div>
          ))}
        </div>
      </div>

      {/* Quick add */}
      <QuickAdd currentUser={currentUser} onSave={add} />

      {/* Filtri */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setFiltro('tutti')} style={{ padding: '3px 10px', border: `1px solid ${filtro === 'tutti' ? S.teal : S.border}`, borderRadius: 20, background: filtro === 'tutti' ? S.tealLight : 'none', color: filtro === 'tutti' ? S.teal : S.textMuted, fontSize: 11, fontWeight: filtro === 'tutti' ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui }}>Tutti ({items.filter(i => !i.completato).length})</button>
        {(Object.keys(TIPO_CFG) as ItemType[]).map(t => {
          const count = items.filter(i => i.tipo === t && !i.completato).length
          if (count === 0) return null
          return (
            <button key={t} onClick={() => setFiltro(t)}
              style={{ padding: '3px 10px', border: `1px solid ${filtro === t ? TIPO_CFG[t].color : S.border}`, borderRadius: 20, background: filtro === t ? TIPO_CFG[t].bg : 'none', color: filtro === t ? TIPO_CFG[t].color : S.textMuted, fontSize: 11, fontWeight: filtro === t ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
              {TIPO_CFG[t].icon} {TIPO_CFG[t].label} ({count})
            </button>
          )
        })}
        <button onClick={() => setMostraCompletati(!mostraCompletati)} style={{ padding: '3px 10px', border: `1px solid ${S.border}`, borderRadius: 20, background: 'none', color: S.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: DS.fonts.ui, marginLeft: 'auto' }}>
          {mostraCompletati ? 'Nascondi completati' : 'Mostra completati'}
        </button>
      </div>

      {/* Loading */}
      {loading && <div style={{ textAlign: 'center', padding: '32px', fontSize: 13, color: S.textMuted }}>Caricamento...</div>}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>📌 In evidenza</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pinned.map(i => <BachecaCard key={i.id} item={i} currentUser={currentUser} onToggle={() => toggle(i.id, i.completato)} onDelete={() => del(i.id)} onPin={() => pin(i.id, i.pinned)} />)}
          </div>
        </div>
      )}

      {/* Resto */}
      {resto.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pinned.length > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tutto il resto</div>}
          {resto.map(i => <BachecaCard key={i.id} item={i} currentUser={currentUser} onToggle={() => toggle(i.id, i.completato)} onDelete={() => del(i.id)} onPin={() => pin(i.id, i.pinned)} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.textSecondary }}>Bacheca vuota</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>Aggiungi note, decisioni, task e link condivisi</div>
        </div>
      )}
    </div>
  )
}
