// components/Personale/PersonaleView.tsx
'use client'
import { FC, useState } from 'react'
import { DS } from '@/constants/design-system'
import { usePersonalTasks, PersonalTask } from '@/hooks/usePersonalTasks'
import { useDevice } from '@/hooks/useDevice'

const S = DS.colors

const ALTRO = (user: string) => user === 'fabio' ? 'lidia' : 'fabio'
const NOME = (u: string) => u === 'fabio' ? 'Fabio' : 'Lidia'
const ACCENT = (u: string) => u === 'fabio' ? '#0A8A7A' : '#BE185D'
const ACCENT_LIGHT = (u: string) => u === 'fabio' ? '#EDF7F6' : '#FDF0F6'

// ── Task Card ─────────────────────────────────────────────
const TaskCard: FC<{
  t: PersonalTask
  currentUser: string
  onComplete: (id: string, nota?: string) => void
  onDelete: (id: string) => void
}> = ({ t, currentUser, onComplete, onDelete }) => {
  const [showComplete, setShowComplete] = useState(false)
  const [nota, setNota] = useState('')
  const isDelegate = t.creato_da !== currentUser
  const isDelegataAltro = t.creato_da === currentUser && t.assegnato_a !== currentUser
  const isScaduta = t.scadenza && t.scadenza < new Date().toISOString().split('T')[0] && t.stato !== 'completato'
  const isCompletata = t.stato === 'completato'
  const creatorAccent = ACCENT(t.creato_da)
  const oggi = new Date().toISOString().split('T')[0]

  return (
    <div style={{
      background: S.surface, borderRadius: 10,
      border: `1px solid ${isDelegate ? creatorAccent + '40' : S.border}`,
      borderLeft: `3px solid ${isDelegate ? creatorAccent : isDelegataAltro ? ACCENT(t.assegnato_a) + '80' : ACCENT(currentUser)}`,
      padding: '12px 14px', marginBottom: 8,
      opacity: isCompletata ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Checkbox */}
        <div onClick={() => !isCompletata && setShowComplete(true)} style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, cursor: isCompletata ? 'default' : 'pointer',
          border: `2px solid ${isCompletata ? S.green : ACCENT(currentUser)}`,
          background: isCompletata ? S.green : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isCompletata && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' }}>
            {isDelegate && (
              <span style={{ fontSize: 10, background: ACCENT_LIGHT(t.creato_da), color: creatorAccent, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>
                da {NOME(t.creato_da)}
              </span>
            )}
            {isDelegataAltro && (
              <span style={{ fontSize: 10, background: ACCENT_LIGHT(t.assegnato_a), color: ACCENT(t.assegnato_a), padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>
                → {NOME(t.assegnato_a)}
              </span>
            )}
            {t.visibilita === 'condiviso' && !isDelegate && !isDelegataAltro && (
              <span style={{ fontSize: 10, background: S.borderLight, color: S.textMuted, padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>condivisa</span>
            )}
            {t.priorita && Number(t.priorita) <= 2 && <span style={{ fontSize: 10, background: S.redLight, color: S.red, padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>urgente</span>}
            {isScaduta && <span style={{ fontSize: 10, background: S.redLight, color: S.red, padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>scaduta</span>}
            {isCompletata && <span style={{ fontSize: 10, background: S.greenLight, color: S.green, padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>completata</span>}
          </div>

          {/* Titolo */}
          <div style={{ fontSize: 13, fontWeight: 600, color: isCompletata ? S.textMuted : S.textPrimary, textDecoration: isCompletata ? 'line-through' : 'none', marginBottom: 3 }}>
            {t.titolo}
          </div>

          {/* Descrizione */}
          {t.descrizione && <div style={{ fontSize: 12, color: S.textSecondary, marginBottom: 4, lineHeight: 1.5 }}>{t.descrizione}</div>}

          {/* Nota completamento */}
          {t.nota_completamento && <div style={{ fontSize: 11, color: S.green, fontStyle: 'italic', marginBottom: 4 }}>"{t.nota_completamento}"</div>}

          {/* Meta */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {t.scadenza && <span style={{ fontSize: 11, color: isScaduta ? S.red : S.textMuted }}>📅 {t.scadenza}{t.ora_scadenza ? ` ${t.ora_scadenza}` : ''}</span>}
            {t.allegati && (() => {
              try {
                const all = JSON.parse(t.allegati)
                return all.length > 0 ? <span style={{ fontSize: 11, color: S.blue }}>📎 {all.length} allegati</span> : null
              } catch { return null }
            })()}
            {t.completato_il && <span style={{ fontSize: 11, color: S.green }}>✓ {new Date(t.completato_il).toLocaleDateString('it-IT')}</span>}
          </div>
        </div>

        {/* Delete */}
        {!isCompletata && (
          <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 13, flexShrink: 0 }}>✕</button>
        )}
      </div>

      {/* Complete dialog */}
      {showComplete && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: S.greenLight, borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: S.green, marginBottom: 6 }}>Segna come completata</div>
          <input value={nota} onChange={e => setNota(e.target.value)} placeholder="Nota opzionale (es. fatto, vedi doc...)"
            style={{ width: '100%', padding: '6px 8px', border: `1px solid ${S.green}40`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.ui, boxSizing: 'border-box', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { onComplete(t.id, nota); setShowComplete(false) }} style={{ flex: 1, padding: '6px', background: S.green, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui }}>
              Conferma ✓
            </button>
            <button onClick={() => setShowComplete(false)} style={{ padding: '6px 10px', border: `1px solid ${S.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.fonts.ui }}>
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add Task Form ─────────────────────────────────────────
const AddTaskForm: FC<{ currentUser: string; zone: 'privata' | 'condivisa' | 'delega'; onSave: (t: Omit<PersonalTask, 'id' | 'created_at'>) => void; onClose: () => void }> = ({ currentUser, zone, onSave, onClose }) => {
  const altro = ALTRO(currentUser)
  const [form, setForm] = useState<any>({
    tipo: 'task', priorita: '3',
    assegnato_a: zone === 'delega' ? altro : zone === 'condivisa' ? 'entrambi' : currentUser,
    visibilita: zone === 'privata' ? 'privato' : 'condiviso',
    notifica_email: false,
  })

  const save = () => {
    if (!form.titolo) return
    onSave({
      titolo: form.titolo, descrizione: form.descrizione || null,
      creato_da: currentUser,
      assegnato_a: form.assegnato_a,
      tipo: form.tipo || 'task',
      stato: 'aperto',
      priorita: form.priorita || '3',
      scadenza: form.scadenza || null,
      ora_scadenza: form.ora || null,
      allegati: form.allegati ? JSON.stringify([{ nome: form.allegati, url: form.allegati, tipo: 'link' }]) : null,
      notifica_email: form.notifica_email,
      visibilita: form.visibilita,
    })
  }

  const accent = ACCENT(currentUser)
  const zoneLabel = zone === 'privata' ? 'Task privata' : zone === 'condivisa' ? 'Task condivisa' : `Delega a ${NOME(altro)}`

  return (
    <div style={{ background: S.surface, border: `1px solid ${accent}40`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{zoneLabel}</div>

      <input value={form.titolo || ''} onChange={e => setForm((p: any) => ({ ...p, titolo: e.target.value }))} placeholder="Titolo *"
        style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, marginBottom: 8, boxSizing: 'border-box' }} />

      <textarea value={form.descrizione || ''} onChange={e => setForm((p: any) => ({ ...p, descrizione: e.target.value }))} placeholder="Descrizione / dettagli" rows={2}
        style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, resize: 'none', marginBottom: 8, boxSizing: 'border-box' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Scadenza</label>
          <input type="date" value={form.scadenza || ''} onChange={e => setForm((p: any) => ({ ...p, scadenza: e.target.value }))}
            style={{ width: '100%', padding: '7px 8px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Ora</label>
          <input type="time" value={form.ora || ''} onChange={e => setForm((p: any) => ({ ...p, ora: e.target.value }))}
            style={{ width: '100%', padding: '7px 8px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Priorità</label>
          <select value={form.priorita || '3'} onChange={e => setForm((p: any) => ({ ...p, priorita: e.target.value }))}
            style={{ width: '100%', padding: '7px 8px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, fontFamily: DS.fonts.ui }}>
            {['1','2','3','4','5'].map(p => <option key={p} value={p}>{p === '1' ? '1 — Urgente' : p === '5' ? '5 — Bassa' : p}</option>)}
          </select>
        </div>
      </div>

      <input value={form.allegati || ''} onChange={e => setForm((p: any) => ({ ...p, allegati: e.target.value }))} placeholder="Allegato (URL o link Google Drive)"
        style={{ width: '100%', padding: '7px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, fontFamily: DS.fonts.ui, marginBottom: 8, boxSizing: 'border-box' }} />

      {zone === 'delega' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: S.textSecondary, marginBottom: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.notifica_email || false} onChange={e => setForm((p: any) => ({ ...p, notifica_email: e.target.checked })) } />
          Invia notifica al completamento
        </label>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '7px 14px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.fonts.ui }}>Annulla</button>
        <button onClick={save} disabled={!form.titolo} style={{ padding: '7px 16px', background: form.titolo ? accent : S.borderLight, color: form.titolo ? '#fff' : S.textMuted, border: 'none', borderRadius: 7, cursor: form.titolo ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui }}>
          Salva
        </button>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────
const Section: FC<{ title: string; count: number; accent: string; accentLight: string; children: React.ReactNode; onAdd?: () => void; badge?: string; defaultOpen?: boolean }> =
  ({ title, count, accent, accentLight, children, onAdd, badge, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setOpen(!open)}>
          <span style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</span>
          <span style={{ fontSize: 11, background: accentLight, color: accent, padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{count}</span>
          {badge && <span style={{ fontSize: 10, background: S.redLight, color: S.red, padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>{badge}</span>}
          <span style={{ fontSize: 10, color: S.textMuted }}>{open ? '▲' : '▼'}</span>
        </div>
        {onAdd && open && (
          <button onClick={onAdd} style={{ padding: '4px 12px', background: accent, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>+ Aggiungi</button>
        )}
      </div>
      {open && children}
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────
export const PersonaleView: FC<{ currentUser: string }> = ({ currentUser }) => {
  const pt = usePersonalTasks(currentUser)
  const device = useDevice()
  const [activeZone, setActiveZone] = useState<'privata' | 'condivisa' | 'delega' | null>(null)
  const [activeTab, setActiveTab] = useState<'mia' | 'condivisa' | 'delegate'>('mia')
  const altro = ALTRO(currentUser)
  const accent = ACCENT(currentUser)
  const accentLight = ACCENT_LIGHT(currentUser)
  const scadute = [...pt.mie, ...pt.delegateAMe].filter(t => t.scadenza && t.scadenza < new Date().toISOString().split('T')[0] && t.stato !== 'completato').length

  const tabs = [
    { id: 'mia', label: `La mia area`, count: pt.mie.length },
    { id: 'condivisa', label: 'Condivisa', count: pt.condivise.length },
    { id: 'delegate', label: 'Delegate', count: pt.delegateAMe.length + pt.delegateDaMe.length },
  ]

  if (pt.loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento...</span></div>

  return (
    <div>
      {/* Header personale */}
      <div style={{ background: `linear-gradient(135deg, ${accentLight}, ${S.surface})`, border: `1px solid ${accent}30`, borderRadius: 12, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {currentUser === 'fabio' ? 'FA' : 'LI'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: S.textPrimary }}>Area di {NOME(currentUser)}</div>
          <div style={{ fontSize: 12, color: S.textSecondary, marginTop: 2 }}>{pt.mie.filter(t => t.stato !== 'completato').length} aperte · {pt.delegateAMe.filter(t => t.stato !== 'completato').length} delegate a te · {pt.delegateDaMe.filter(t => t.stato !== 'completato').length} delegate a {NOME(altro)}</div>
        </div>
        {scadute > 0 && <div style={{ background: S.redLight, color: S.red, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{scadute} scadute</div>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 3, background: S.background, borderRadius: 9, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{ padding: '7px 14px', border: 'none', borderRadius: 7, background: activeTab === t.id ? S.surface : 'none', color: activeTab === t.id ? S.textPrimary : S.textMuted, fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui, boxShadow: activeTab === t.id ? DS.shadow.xs : 'none', display: 'flex', gap: 6, alignItems: 'center' }}>
            {t.label}
            {t.count > 0 && <span style={{ fontSize: 10, background: activeTab === t.id ? accent : S.borderLight, color: activeTab === t.id ? '#fff' : S.textMuted, padding: '0px 5px', borderRadius: 20, fontWeight: 600 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── LA MIA AREA ── */}
      {activeTab === 'mia' && (
        <div>
          {activeZone === 'privata' && <AddTaskForm currentUser={currentUser} zone="privata" onSave={t => { pt.addTask(t); setActiveZone(null) }} onClose={() => setActiveZone(null)} />}
          <Section title="Le mie task private" count={pt.mie.filter(t => t.stato !== 'completato').length} accent={accent} accentLight={accentLight} onAdd={() => setActiveZone('privata')}>
            {pt.mie.filter(t => t.stato !== 'completato').length === 0 && activeZone !== 'privata' ? (
              <div onClick={() => setActiveZone('privata')} style={{ textAlign: 'center', padding: '16px', fontSize: 12, color: S.textMuted, background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 10, cursor: 'pointer' }}>
                Nessuna task privata · clicca per aggiungere
              </div>
            ) : pt.mie.filter(t => t.stato !== 'completato').map(t => (
              <TaskCard key={t.id} t={t} currentUser={currentUser} onComplete={pt.completeTask} onDelete={pt.deleteTask} />
            ))}
            {/* Completate collassate */}
            {pt.mie.filter(t => t.stato === 'completato').length > 0 && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 11, color: S.textMuted, cursor: 'pointer', padding: '4px 0' }}>
                  {pt.mie.filter(t => t.stato === 'completato').length} completate
                </summary>
                {pt.mie.filter(t => t.stato === 'completato').map(t => (
                  <TaskCard key={t.id} t={t} currentUser={currentUser} onComplete={pt.completeTask} onDelete={pt.deleteTask} />
                ))}
              </details>
            )}
          </Section>
        </div>
      )}

      {/* ── CONDIVISA ── */}
      {activeTab === 'condivisa' && (
        <div>
          {activeZone === 'condivisa' && <AddTaskForm currentUser={currentUser} zone="condivisa" onSave={t => { pt.addTask(t); setActiveZone(null) }} onClose={() => setActiveZone(null)} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: S.textSecondary }}>Visibile a Fabio e Lidia — tutto insieme</div>
            <button onClick={() => setActiveZone('condivisa')} style={{ padding: '5px 14px', background: accent, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>+ Aggiungi</button>
          </div>
          {pt.condivise.length === 0 ? (
            <div onClick={() => setActiveZone('condivisa')} style={{ textAlign: 'center', padding: '32px', fontSize: 13, color: S.textMuted, background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 12, cursor: 'pointer' }}>
              Nessuna task condivisa · clicca per aggiungere
            </div>
          ) : (
            <div>
              {/* Legenda */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                {['fabio', 'lidia'].map(u => (
                  <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: ACCENT(u) }} />
                    <span style={{ fontSize: 11, color: S.textMuted }}>{NOME(u)}</span>
                  </div>
                ))}
              </div>
              {pt.condivise.filter(t => t.stato !== 'completato').map(t => (
                <TaskCard key={t.id} t={t} currentUser={currentUser} onComplete={pt.completeTask} onDelete={pt.deleteTask} />
              ))}
              {pt.condivise.filter(t => t.stato === 'completato').length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 11, color: S.textMuted, cursor: 'pointer' }}>{pt.condivise.filter(t => t.stato === 'completato').length} completate</summary>
                  {pt.condivise.filter(t => t.stato === 'completato').map(t => (
                    <TaskCard key={t.id} t={t} currentUser={currentUser} onComplete={pt.completeTask} onDelete={pt.deleteTask} />
                  ))}
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DELEGATE ── */}
      {activeTab === 'delegate' && (
        <div>
          {activeZone === 'delega' && <AddTaskForm currentUser={currentUser} zone="delega" onSave={t => { pt.addTask(t); setActiveZone(null) }} onClose={() => setActiveZone(null)} />}

          {/* Da me a altro */}
          <Section title={`Da te a ${NOME(altro)}`} count={pt.delegateDaMe.length} accent={accent} accentLight={accentLight} onAdd={() => setActiveZone('delega')} defaultOpen={true}>
            {pt.delegateDaMe.length === 0 ? (
              <div onClick={() => setActiveZone('delega')} style={{ textAlign: 'center', padding: '16px', fontSize: 12, color: S.textMuted, background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 10, cursor: 'pointer' }}>
                Nessuna delega a {NOME(altro)} · clicca per aggiungere
              </div>
            ) : pt.delegateDaMe.map(t => (
              <TaskCard key={t.id} t={t} currentUser={currentUser} onComplete={pt.completeTask} onDelete={pt.deleteTask} />
            ))}
          </Section>

          {/* Da altro a me */}
          <Section
            title={`Da ${NOME(altro)} a te`}
            count={pt.delegateAMe.filter(t => t.stato !== 'completato').length}
            accent={ACCENT(altro)} accentLight={ACCENT_LIGHT(altro)}
            badge={pt.delegateAMe.filter(t => t.scadenza && t.scadenza < new Date().toISOString().split('T')[0] && t.stato !== 'completato').length > 0 ? 'in ritardo' : undefined}
            defaultOpen={true}
          >
            {pt.delegateAMe.filter(t => t.stato !== 'completato').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', fontSize: 12, color: S.textMuted, background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10 }}>
                Nessuna delega da {NOME(altro)}
              </div>
            ) : pt.delegateAMe.filter(t => t.stato !== 'completato').map(t => (
              <TaskCard key={t.id} t={t} currentUser={currentUser} onComplete={pt.completeTask} onDelete={pt.deleteTask} />
            ))}
            {pt.delegateAMe.filter(t => t.stato === 'completato').length > 0 && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 11, color: S.textMuted, cursor: 'pointer' }}>{pt.delegateAMe.filter(t => t.stato === 'completato').length} completate</summary>
                {pt.delegateAMe.filter(t => t.stato === 'completato').map(t => (
                  <TaskCard key={t.id} t={t} currentUser={currentUser} onComplete={pt.completeTask} onDelete={pt.deleteTask} />
                ))}
              </details>
            )}
          </Section>
        </div>
      )}
    </div>
  )
}
