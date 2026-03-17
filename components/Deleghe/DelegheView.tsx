// components/Deleghe/DelegheView.tsx
'use client'
import { FC, useState } from 'react'
import { DS } from '@/constants/design-system'
import { useDeleghe, Delega } from '@/hooks/useDeleghe'
import { useDevice } from '@/hooks/useDevice'
import { supabase } from '@/lib/supabase'

const S = DS.colors

const NOME = (u: string) => u === 'fabio' ? 'Fabio' : 'Lidia'
const ACCENT = (u: string) => u === 'fabio' ? '#0A8A7A' : '#BE185D'
const ALTRO = (u: string) => u === 'fabio' ? 'lidia' : 'fabio'

const STATO_CFG: Record<string, { bg: string; text: string; label: string }> = {
  aperta:      { bg: S.blueLight,   text: S.blue,    label: 'Aperta' },
  in_corso:    { bg: S.tealLight,   text: S.teal,    label: 'In corso' },
  completata:  { bg: S.greenLight,  text: S.green,   label: 'Completata' },
  in_ritardo:  { bg: S.redLight,    text: S.red,     label: 'In ritardo' },
  annullata:   { bg: S.borderLight, text: S.textMuted, label: 'Annullata' },
}

const PRI_CFG: Record<string, { color: string; label: string }> = {
  '1': { color: S.red,    label: '🔴 Urgente' },
  '2': { color: S.amber,  label: '🟡 Alta' },
  '3': { color: S.blue,   label: '🔵 Normale' },
  '4': { color: S.textMuted, label: 'Bassa' },
  '5': { color: S.textMuted, label: 'Minima' },
}

// ── Delega Card ───────────────────────────────────────────
const DelegaCard: FC<{
  d: Delega
  currentUser: string
  onStato: (id: string, stato: Delega['stato'], nota?: string) => void
  onDelete: (id: string) => void
}> = ({ d, currentUser, onStato, onDelete }) => {
  const [completing, setCompleting] = useState(false)
  const [nota, setNota] = useState('')
  const isMine = d.creato_da === currentUser
  const isAssignedToMe = d.assegnato_a === currentUser
  const cfg = STATO_CFG[d.stato] || STATO_CFG.aperta
  const pri = PRI_CFG[d.priorita] || PRI_CFG['3']
  const oggi = new Date().toISOString().split('T')[0]
  const isScaduta = d.scadenza && d.scadenza < oggi && d.stato !== 'completata'
  const giorni = d.scadenza ? Math.ceil((new Date(d.scadenza).getTime() - Date.now()) / 86400000) : null

  return (
    <div style={{
      background: S.surface,
      border: `1px solid ${d.stato === 'in_ritardo' ? S.red + '50' : S.border}`,
      borderRadius: DS.radius.md,
      padding: '14px 16px',
      marginBottom: 10,
      borderLeft: `4px solid ${ACCENT(isMine ? currentUser : d.creato_da)}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontSize: 10, background: cfg.bg, color: cfg.text, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>{cfg.label}</span>
            <span style={{ fontSize: 10, color: pri.color, fontWeight: 600 }}>{pri.label}</span>
            {isMine
              ? <span style={{ fontSize: 10, background: ACCENT(d.assegnato_a) + '20', color: ACCENT(d.assegnato_a), padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>→ {NOME(d.assegnato_a)}</span>
              : <span style={{ fontSize: 10, background: ACCENT(d.creato_da) + '20', color: ACCENT(d.creato_da), padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>da {NOME(d.creato_da)}</span>
            }
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: d.stato === 'completata' ? S.textMuted : S.textPrimary, textDecoration: d.stato === 'completata' ? 'line-through' : 'none' }}>
            {d.titolo}
          </div>
        </div>
        {isMine && d.stato !== 'completata' && (
          <button onClick={() => onDelete(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 14, flexShrink: 0 }}>✕</button>
        )}
      </div>

      {/* Descrizione */}
      {d.descrizione && (
        <div style={{ fontSize: 12, color: S.textSecondary, lineHeight: 1.6, marginBottom: 8, padding: '8px 10px', background: S.background, borderRadius: 7 }}>
          {d.descrizione}
        </div>
      )}

      {/* Meta info */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        {d.scadenza && (
          <span style={{ fontSize: 11, color: isScaduta ? S.red : S.textSecondary, fontWeight: isScaduta ? 700 : 400 }}>
            📅 {d.scadenza}{d.ora_scadenza ? ` ${d.ora_scadenza}` : ''}
            {giorni !== null && !isScaduta && giorni <= 3 && <span style={{ color: S.amber, fontWeight: 600 }}> ({giorni === 0 ? 'oggi' : `${giorni}g`})</span>}
            {isScaduta && <span style={{ color: S.red, fontWeight: 700 }}> (in ritardo)</span>}
          </span>
        )}
        {d.progetto_nome && <span style={{ fontSize: 11, color: S.teal }}>📁 {d.progetto_nome}</span>}
        {d.allegati && <span style={{ fontSize: 11, color: S.blue }}>📎 allegato</span>}
        <span style={{ fontSize: 10, color: S.textMuted }}>{d.created_at ? new Date(d.created_at).toLocaleDateString('it-IT') : ''}</span>
      </div>

      {/* Nota completamento */}
      {d.nota_completamento && (
        <div style={{ fontSize: 12, color: S.green, fontStyle: 'italic', padding: '6px 10px', background: S.greenLight, borderRadius: 6, marginBottom: 8 }}>
          "{d.nota_completamento}" — {d.completato_il ? new Date(d.completato_il).toLocaleDateString('it-IT') : ''}
        </div>
      )}

      {/* Actions */}
      {d.stato !== 'completata' && d.stato !== 'annullata' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {isAssignedToMe && d.stato === 'aperta' && (
            <button onClick={() => onStato(d.id, 'in_corso')} style={{ padding: '4px 12px', background: S.tealLight, color: S.teal, border: `1px solid ${S.tealMid}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
              Prendo in carico
            </button>
          )}
          {isAssignedToMe && (
            <button onClick={() => setCompleting(true)} style={{ padding: '4px 12px', background: S.greenLight, color: S.green, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
              ✓ Completa
            </button>
          )}
          {isMine && (
            <button onClick={() => onStato(d.id, 'annullata')} style={{ padding: '4px 12px', background: 'none', color: S.textMuted, border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
              Annulla
            </button>
          )}
        </div>
      )}

      {/* Completing dialog */}
      {completing && (
        <div style={{ marginTop: 10, padding: '12px', background: S.greenLight, borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: S.green, marginBottom: 6 }}>Segna come completata</div>
          <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="Nota opzionale — es. fatto, vedi doc su Drive, chiamato il cliente..." rows={2}
            style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.green}40`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.ui, resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { onStato(d.id, 'completata', nota); setCompleting(false) }}
              style={{ flex: 1, padding: '7px', background: S.green, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui }}>
              Conferma ✓
            </button>
            <button onClick={() => setCompleting(false)}
              style={{ padding: '7px 12px', border: `1px solid ${S.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.fonts.ui }}>
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Nuova Delega Form ─────────────────────────────────────
const NuovaDelegaForm: FC<{
  currentUser: string
  onSave: (d: Omit<Delega, 'id' | 'created_at' | 'stato'>) => void
  onClose: () => void
  progetti: any[]
}> = ({ currentUser, onSave, onClose, progetti }) => {
  const altro = ALTRO(currentUser)
  const accent = ACCENT(currentUser)
  const [form, setForm] = useState<any>({ assegnato_a: altro, priorita: '3', notifica_email: true })
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const save = () => {
    if (!form.titolo) return
    onSave({
      titolo: form.titolo,
      descrizione: form.descrizione || undefined,
      creato_da: currentUser,
      assegnato_a: form.assegnato_a,
      priorita: form.priorita || '3',
      scadenza: form.scadenza || undefined,
      ora_scadenza: form.ora || undefined,
      progetto_id: form.progetto_id || undefined,
      progetto_nome: form.progetto_id ? progetti.find((p: any) => p.id === form.progetto_id)?.nome : undefined,
      allegati: form.allegati || undefined,
      notifica_email: form.notifica_email,
    })
  }

  return (
    <div style={{ background: S.surface, border: `2px solid ${accent}40`, borderRadius: DS.radius.lg, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent, marginBottom: 16 }}>
        Nuova delega a {NOME(form.assegnato_a)}
      </div>

      {/* Assegna a */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['fabio', 'lidia'].filter(u => u !== currentUser).concat(currentUser === 'fabio' ? [] : []).map(u => (
          <button key={u} onClick={() => set('assegnato_a', u)} style={{ padding: '6px 14px', border: `1px solid ${form.assegnato_a === u ? ACCENT(u) : S.border}`, borderRadius: 20, background: form.assegnato_a === u ? ACCENT(u) + '20' : 'none', color: form.assegnato_a === u ? ACCENT(u) : S.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
            {NOME(u)}
          </button>
        ))}
      </div>

      <input value={form.titolo || ''} onChange={e => set('titolo', e.target.value)} placeholder="Cosa deve fare *"
        style={{ width: '100%', padding: '9px 11px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 14, fontFamily: DS.fonts.ui, marginBottom: 10, boxSizing: 'border-box', fontWeight: 500 }} />

      <textarea value={form.descrizione || ''} onChange={e => set('descrizione', e.target.value)} placeholder="Descrizione / dettagli / istruzioni..." rows={3}
        style={{ width: '100%', padding: '9px 11px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, resize: 'none', marginBottom: 10, boxSizing: 'border-box' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Scadenza</label>
          <input type="date" value={form.scadenza || ''} onChange={e => set('scadenza', e.target.value)}
            style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Ora</label>
          <input type="time" value={form.ora || ''} onChange={e => set('ora', e.target.value)}
            style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Priorità</label>
          <select value={form.priorita || '3'} onChange={e => set('priorita', e.target.value)}
            style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui }}>
            <option value="1">🔴 Urgente</option>
            <option value="2">🟡 Alta</option>
            <option value="3">🔵 Normale</option>
            <option value="4">Bassa</option>
            <option value="5">Minima</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Collega a progetto (opzionale)</label>
        <select value={form.progetto_id || ''} onChange={e => set('progetto_id', e.target.value)}
          style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui }}>
          <option value="">Nessun progetto</option>
          {progetti.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      <input value={form.allegati || ''} onChange={e => set('allegati', e.target.value)} placeholder="Allegato — URL, Google Drive, Notion..."
        style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, marginBottom: 12, boxSizing: 'border-box' }} />

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: S.textSecondary, marginBottom: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.notifica_email || false} onChange={e => set('notifica_email', e.target.checked)} />
        Notifica quando completata
      </label>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
        <button onClick={save} disabled={!form.titolo}
          style={{ padding: '8px 22px', background: form.titolo ? accent : S.borderLight, color: form.titolo ? '#fff' : S.textMuted, border: 'none', borderRadius: 7, cursor: form.titolo ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, fontFamily: DS.fonts.ui }}>
          Delega →
        </button>
      </div>
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────
export const DelegheView: FC<{ currentUser: string; progetti?: any[] }> = ({ currentUser, progetti = [] }) => {
  const dg = useDeleghe(currentUser)
  const device = useDevice()
  const [tab, setTab] = useState<'a_me' | 'da_me' | 'tutte'>('a_me')
  const [showForm, setShowForm] = useState(false)
  const altro = ALTRO(currentUser)
  const accent = ACCENT(currentUser)

  const tabItems = [
    { id: 'a_me',  label: `A me (${NOME(currentUser)})`, count: dg.aMe.filter(d => !['completata','annullata'].includes(d.stato)).length },
    { id: 'da_me', label: `Da me a ${NOME(altro)}`,      count: dg.daMe.filter(d => !['completata','annullata'].includes(d.stato)).length },
    { id: 'tutte', label: 'Tutte',                        count: dg.deleghe.length },
  ]

  const lista = tab === 'a_me' ? dg.aMe : tab === 'da_me' ? dg.daMe : dg.deleghe
  const inRitardo = dg.inRitardo.length

  if (dg.loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento...</span></div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Deleghe</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>
            {dg.pendingAMe.length} a te · {dg.daMe.filter(d => !['completata','annullata'].includes(d.stato)).length} a {NOME(altro)}
            {inRitardo > 0 && <span style={{ color: S.red, fontWeight: 700 }}> · {inRitardo} in ritardo</span>}
          </div>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: '8px 18px', background: accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          Nuova delega
        </button>
      </div>

      {/* Nuova delega form */}
      {showForm && (
        <NuovaDelegaForm
          currentUser={currentUser}
          progetti={progetti}
          onSave={async (d) => { await dg.crea(d); setShowForm(false) }}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Alert in ritardo */}
      {inRitardo > 0 && (
        <div style={{ background: S.redLight, border: `1px solid ${S.red}30`, borderRadius: DS.radius.md, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.red }}>⚠ {inRitardo} {inRitardo === 1 ? 'delega in ritardo' : 'deleghe in ritardo'}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {dg.inRitardo.slice(0, 3).map(d => (
              <span key={d.id} style={{ fontSize: 11, color: S.red, background: '#fff', padding: '2px 8px', borderRadius: 20, border: `1px solid ${S.red}30` }}>{d.titolo}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 3, background: S.background, borderRadius: 9, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        {tabItems.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{ padding: '7px 14px', border: 'none', borderRadius: 7, background: tab === t.id ? S.surface : 'none', color: tab === t.id ? S.textPrimary : S.textMuted, fontSize: 12, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui, boxShadow: tab === t.id ? DS.shadow.xs : 'none', display: 'flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>
            {t.label}
            {t.count > 0 && <span style={{ fontSize: 10, background: tab === t.id ? accent : S.borderLight, color: tab === t.id ? '#fff' : S.textMuted, padding: '0 5px', borderRadius: 20, fontWeight: 600 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', background: S.surface, border: `2px dashed ${S.border}`, borderRadius: DS.radius.lg, cursor: 'pointer' }}
          onClick={() => setShowForm(true)}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.textSecondary }}>Nessuna delega</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>Clicca per crearne una</div>
        </div>
      ) : (
        <div>
          {/* Aperte / In corso */}
          {lista.filter(d => ['aperta','in_corso','in_ritardo'].includes(d.stato)).length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Attive · {lista.filter(d => ['aperta','in_corso','in_ritardo'].includes(d.stato)).length}
              </div>
              {lista.filter(d => ['aperta','in_corso','in_ritardo'].includes(d.stato))
                .sort((a, b) => Number(a.priorita) - Number(b.priorita))
                .map(d => (
                  <DelegaCard key={d.id} d={d} currentUser={currentUser} onStato={dg.aggiornaStato} onDelete={dg.elimina} />
                ))}
            </>
          )}
          {/* Completate */}
          {lista.filter(d => d.stato === 'completata').length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary style={{ fontSize: 11, color: S.textMuted, cursor: 'pointer', padding: '4px 0', fontFamily: DS.fonts.ui, userSelect: 'none' }}>
                {lista.filter(d => d.stato === 'completata').length} completate
              </summary>
              <div style={{ marginTop: 8 }}>
                {lista.filter(d => d.stato === 'completata').map(d => (
                  <DelegaCard key={d.id} d={d} currentUser={currentUser} onStato={dg.aggiornaStato} onDelete={dg.elimina} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
