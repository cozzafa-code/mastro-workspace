// components/LabIdee/LabIdeeView.tsx
'use client'
import { FC, useState, useEffect, useCallback, useRef } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'
import { useDevice } from '@/hooks/useDevice'
import { usePanel } from '@/context/PanelContext'

const S = DS.colors

interface Idea {
  id: string
  titolo?: string
  descrizione?: string
  dettaglio?: string
  contenuto_ricco?: string  // markdown/testo lungo
  categoria?: string
  chi?: string
  priorita?: string
  stato?: string
  colore?: string
  tags?: string[]
  file_links?: string  // JSON array {nome, url, tipo}
  progetto_id?: string
  progetto_nome?: string
  is_pinned?: boolean
  created_at?: string
}

const COLORI = ['#FEF3C7','#DBEAFE','#D1FAE5','#EDE9FE','#FFE4E6','#F0FDF4','#F7F8FA']
const CATEGORIE = ['SaaS','Marketing','Prodotto','Design','Business','Tech','Personale','Altro']
const STATI = ['aperto','in_corso','completato','archiviato']

const StatoBadge: FC<{ stato: string }> = ({ stato }) => {
  const cfg: Record<string, { bg: string; color: string }> = {
    aperto:     { bg: S.blueLight,   color: S.blue },
    in_corso:   { bg: S.tealLight,   color: S.teal },
    completato: { bg: S.greenLight,  color: S.green },
    archiviato: { bg: S.borderLight, color: S.textMuted },
  }
  const c = cfg[stato] || cfg.aperto
  return <span style={{ background: c.bg, color: c.color, padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{stato}</span>
}

// ── Editor idea espanso ───────────────────────────────────
const IdeaEditor: FC<{ idea?: Idea; onSave: (i: Partial<Idea>) => void; onClose: () => void; progetti: any[] }> = ({ idea, onSave, onClose, progetti }) => {
  const [form, setForm] = useState<Partial<Idea>>(idea || { colore: '#FEF3C7', stato: 'aperto', priorita: '3' })
  const [newLink, setNewLink] = useState({ nome: '', url: '' })
  const [showLinkForm, setShowLinkForm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const set = (k: keyof Idea, v: any) => setForm(p => ({ ...p, [k]: v }))

  const links: { nome: string; url: string; tipo: string }[] = (() => {
    try { return JSON.parse(form.file_links || '[]') } catch { return [] }
  })()

  const addLink = () => {
    if (!newLink.url) return
    const tipo = newLink.url.includes('drive.google') ? 'gdrive' : newLink.url.includes('notion') ? 'notion' : newLink.url.match(/\.(pdf|doc|docx|xlsx|pptx)$/i) ? 'documento' : 'link'
    const updated = [...links, { nome: newLink.nome || newLink.url.split('/').pop() || 'File', url: newLink.url, tipo }]
    set('file_links', JSON.stringify(updated))
    setNewLink({ nome: '', url: '' }); setShowLinkForm(false)
  }

  const removeLink = (i: number) => {
    const updated = links.filter((_, idx) => idx !== i)
    set('file_links', JSON.stringify(updated))
  }

  const TIPO_ICON: Record<string, string> = { gdrive: '📁', notion: '📓', documento: '📄', link: '🔗' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, padding: '20px 16px', overflowY: 'auto', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: form.colore || S.surface, borderRadius: 14, padding: 28, width: '100%', maxWidth: 680, boxShadow: DS.shadow.xl, marginBottom: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary }}>{idea ? 'Modifica idea' : 'Nuova idea'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 20 }}>✕</button>
        </div>

        {/* Colori */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {COLORI.map(c => <div key={c} onClick={() => set('colore', c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${form.colore === c ? '#0D1117' : 'transparent'}`, boxShadow: form.colore === c ? '0 0 0 1px #0D1117' : 'none' }} />)}
        </div>

        {/* Titolo */}
        <input value={form.titolo || ''} onChange={e => set('titolo', e.target.value)} placeholder="Titolo dell'idea..."
          style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 22, fontWeight: 700, color: S.textPrimary, fontFamily: DS.fonts.ui, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />

        {/* Testo ricco */}
        <textarea ref={textareaRef} value={form.contenuto_ricco || form.descrizione || ''} onChange={e => set('contenuto_ricco', e.target.value)}
          placeholder="Scrivi tutto — dettagli, riflessioni, contesto, istruzioni... Nessun limite."
          rows={8} style={{ width: '100%', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: DS.fonts.ui, outline: 'none', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box', marginBottom: 16 }} />

        {/* Meta row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Categoria', key: 'categoria' as keyof Idea, options: CATEGORIE },
            { label: 'Stato', key: 'stato' as keyof Idea, options: STATI },
            { label: 'Priorità', key: 'priorita' as keyof Idea, options: ['1','2','3','4','5'], labels: ['🔴 Urgente','🟡 Alta','🔵 Normale','Bassa','Minima'] },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{f.label}</label>
              <select value={(form[f.key] as string) || ''} onChange={e => set(f.key, e.target.value)}
                style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, background: 'rgba(255,255,255,0.7)' }}>
                <option value="">—</option>
                {f.options.map((o, i) => <option key={o} value={o}>{f.labels ? f.labels[i] : o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Collega progetto */}
        {progetti.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>Collega a progetto</label>
            <select value={form.progetto_id || ''} onChange={e => { const p = progetti.find((x: any) => x.id === e.target.value); set('progetto_id', e.target.value); set('progetto_nome', p?.nome || '') }}
              style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, background: 'rgba(255,255,255,0.7)' }}>
              <option value="">Nessun progetto</option>
              {progetti.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        )}

        {/* File & Link */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>File & Link</label>
            <button onClick={() => setShowLinkForm(!showLinkForm)} style={{ fontSize: 11, color: S.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DS.fonts.ui, fontWeight: 600 }}>+ Aggiungi</button>
          </div>
          {showLinkForm && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <input value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))} placeholder="URL (Google Drive, Notion, PDF, immagine...)"
                style={{ flex: 2, padding: '7px 9px', border: `1px solid ${S.teal}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, minWidth: 200 }} />
              <input value={newLink.nome} onChange={e => setNewLink(p => ({ ...p, nome: e.target.value }))} placeholder="Nome (opzionale)"
                style={{ flex: 1, padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, minWidth: 100 }} />
              <button onClick={addLink} style={{ padding: '7px 14px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui }}>OK</button>
            </div>
          )}
          {links.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {links.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', border: `1px solid ${S.border}`, borderRadius: 20, padding: '4px 10px 4px 8px' }}>
                  <span style={{ fontSize: 13 }}>{TIPO_ICON[l.tipo] || '🔗'}</span>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: S.teal, textDecoration: 'none', fontWeight: 500 }}>{l.nome}</a>
                  <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 11, padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          {links.length === 0 && !showLinkForm && (
            <div style={{ fontSize: 12, color: S.textMuted, fontStyle: 'italic' }}>Nessun file allegato — aggiungi Google Drive, PDF, immagini, Notion...</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 16, borderTop: `1px solid rgba(0,0,0,0.08)` }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
          <button onClick={() => onSave(form)} style={{ padding: '8px 22px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: DS.fonts.ui }}>Salva idea</button>
        </div>
      </div>
    </div>
  )
}

// ── Idea Card ─────────────────────────────────────────────
const IdeaCard: FC<{ idea: Idea; onClick: () => void; onDelete: () => void }> = ({ idea, onClick, onDelete }) => {
  const links: any[] = (() => { try { return JSON.parse(idea.file_links || '[]') } catch { return [] } })()
  const testo = idea.contenuto_ricco || idea.descrizione || idea.dettaglio || ''
  const TIPO_ICON: Record<string, string> = { gdrive: '📁', notion: '📓', documento: '📄', link: '🔗' }

  return (
    <div onClick={onClick} style={{ background: idea.colore || S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: '16px', cursor: 'pointer', position: 'relative', transition: 'transform 0.1s, box-shadow 0.1s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = DS.shadow.md }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>

      {/* Delete */}
      <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 13, opacity: 0.6, padding: '2px 4px' }}>✕</button>

      {/* Categoria + stato */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {idea.categoria && <span style={{ fontSize: 10, background: 'rgba(109,40,217,0.15)', color: '#6D28D9', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{idea.categoria}</span>}
        {idea.stato && <StatoBadge stato={idea.stato} />}
        {idea.priorita && Number(idea.priorita) <= 2 && <span style={{ fontSize: 10, background: 'rgba(201,53,53,0.15)', color: S.red, padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>Urgente</span>}
      </div>

      {/* Titolo */}
      <div style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary, marginBottom: testo ? 6 : 0, lineHeight: 1.3 }}>
        {idea.titolo || 'Senza titolo'}
      </div>

      {/* Testo preview */}
      {testo && (
        <div style={{ fontSize: 12, color: S.textSecondary, lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {testo}
        </div>
      )}

      {/* File links */}
      {links.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ fontSize: 11, color: S.teal, background: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 20, textDecoration: 'none', fontWeight: 500, border: `1px solid ${S.border}` }}>
              {TIPO_ICON[l.tipo] || '🔗'} {l.nome}
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {idea.progetto_nome && <span style={{ fontSize: 10, color: S.teal, fontWeight: 600 }}>📁 {idea.progetto_nome}</span>}
          {idea.chi && <span style={{ fontSize: 10, color: S.textMuted }}>{idea.chi}</span>}
        </div>
        <span style={{ fontSize: 10, color: S.textMuted }}>{idea.created_at ? new Date(idea.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : ''}</span>
      </div>
    </div>
  )
}

// ── Quick capture bar ─────────────────────────────────────
const QuickCapture: FC<{ onSave: (titolo: string) => void }> = ({ onSave }) => {
  const [val, setVal] = useState('')
  const handle = () => { if (!val.trim()) return; onSave(val.trim()); setVal('') }
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: S.surface, border: `2px solid ${S.teal}40`, borderRadius: 10, padding: '8px 12px' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handle() }}
        placeholder="Cattura un'idea al volo... (Invio per salvare)"
        style={{ flex: 1, background: 'none', border: 'none', fontSize: 14, fontFamily: DS.fonts.ui, outline: 'none', color: S.textPrimary }} />
      <button onClick={handle} disabled={!val.trim()} style={{ padding: '5px 14px', background: val.trim() ? S.teal : S.borderLight, color: val.trim() ? '#fff' : S.textMuted, border: 'none', borderRadius: 7, cursor: val.trim() ? 'pointer' : 'default', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui, flexShrink: 0 }}>
        Salva
      </button>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────
export const LabIdeeView: FC<{ currentUser: string; progetti: any[] }> = ({ currentUser, progetti }) => {
  const device = useDevice()
  const [idee, setIdee] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>()
  const [filtroStato, setFiltroStato] = useState<string>('tutti')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('tutti')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('lab_idee').select('*').order('created_at', { ascending: false })
    setIdee(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (form: Partial<Idea>) => {
    if (editingIdea?.id) {
      const { id, created_at, ...fields } = form as any
      await supabase.from('lab_idee').update({ ...fields, descrizione: form.contenuto_ricco || form.descrizione }).eq('id', editingIdea.id)
    } else {
      await supabase.from('lab_idee').insert({ ...form, chi: currentUser, descrizione: form.contenuto_ricco || form.descrizione, stato: form.stato || 'aperto' })
    }
    setShowEditor(false); setEditingIdea(undefined); load()
  }

  const quickSave = async (titolo: string) => {
    await supabase.from('lab_idee').insert({ titolo, chi: currentUser, stato: 'aperto', colore: '#FEF3C7' })
    load()
  }

  const del = async (id: string) => { await supabase.from('lab_idee').delete().eq('id', id); load() }

  const filtered = idee.filter(i => {
    if (filtroStato !== 'tutti' && i.stato !== filtroStato) return false
    if (filtroCategoria !== 'tutti' && i.categoria !== filtroCategoria) return false
    if (search && !((i.titolo || '') + (i.descrizione || '') + (i.contenuto_ricco || '')).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const categorie = [...new Set(idee.map(i => i.categoria).filter(Boolean))]

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento...</span></div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Lab Idee</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{idee.length} idee · {idee.filter(i => i.stato === 'aperto').length} aperte</div>
        </div>
        <button onClick={() => { setEditingIdea(undefined); setShowEditor(true) }}
          style={{ padding: '8px 18px', background: S.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          + Nuova idea
        </button>
      </div>

      {/* Quick capture */}
      <QuickCapture onSave={quickSave} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca idee..."
          style={{ padding: '6px 12px', border: `1px solid ${S.border}`, borderRadius: 20, fontSize: 12, fontFamily: DS.fonts.ui, outline: 'none', minWidth: 160 }} />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['tutti', ...STATI].map(s => (
            <button key={s} onClick={() => setFiltroStato(s)} style={{ padding: '4px 12px', border: `1px solid ${filtroStato === s ? S.teal : S.border}`, borderRadius: 20, background: filtroStato === s ? S.tealLight : 'none', color: filtroStato === s ? S.teal : S.textSecondary, fontSize: 11, fontWeight: filtroStato === s ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
              {s === 'tutti' ? 'Tutte' : s}
            </button>
          ))}
        </div>
        {categorie.length > 0 && (
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ padding: '5px 10px', border: `1px solid ${S.border}`, borderRadius: 20, fontSize: 12, fontFamily: DS.fonts.ui }}>
            <option value="tutti">Tutte le categorie</option>
            {categorie.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 12, cursor: 'pointer' }}
          onClick={() => { setEditingIdea(undefined); setShowEditor(true) }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💡</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: S.textSecondary }}>Nessuna idea ancora</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>Cattura la tua prossima idea — testo, link, file, tutto</div>
        </div>
      ) : (
        <div style={{ columns: device.isMobile ? 1 : device.isTablet ? 2 : 3, columnGap: 14 }}>
          {filtered.map(idea => (
            <div key={idea.id} style={{ breakInside: 'avoid', marginBottom: 14 }}>
              <IdeaCard idea={idea} onClick={() => { setEditingIdea(idea); setShowEditor(true) }} onDelete={() => del(idea.id)} />
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {showEditor && (
        <IdeaEditor idea={editingIdea} onSave={save} onClose={() => { setShowEditor(false); setEditingIdea(undefined) }} progetti={progetti} />
      )}
    </div>
  )
}
