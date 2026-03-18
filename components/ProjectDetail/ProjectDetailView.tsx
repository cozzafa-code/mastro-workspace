// components/ProjectDetail/ProjectDetailView.tsx
'use client'
import { FC, useState } from 'react'
import { DS, STATE_COLORS } from '@/constants/design-system'
import { useProjectDetail } from '@/hooks/useProjectDetail'
import { ProjectHeader } from './ProjectHeader'
import { ProjectLogPanel } from './ProjectLog'
import { ProjectEditModal } from './ProjectEditModal'
import { OKRTab } from './OKRTab'
import { supabase } from '@/lib/supabase'
import type { UserType } from '@/lib/types'

interface Props {
  progettoId: string
  currentUser: UserType
  onBack: () => void
}

const TabBtn: FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '7px 14px', border: 'none', borderRadius: DS.radius.sm,
    background: active ? DS.colors.teal : 'none',
    color: active ? '#fff' : DS.colors.textSecondary,
    fontSize: 12, fontWeight: active ? 600 : 400,
    cursor: 'pointer', fontFamily: DS.fonts.ui, whiteSpace: 'nowrap',
  }}>
    {children}
  </button>
)

const Badge: FC<{ text: string }> = ({ text }) => {
  const cfg = STATE_COLORS[text?.toLowerCase()] || { bg: DS.colors.borderLight, text: DS.colors.textSecondary }
  return <span style={{ background: cfg.bg, color: cfg.text, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{text}</span>
}

// File & Link tab
const FileTab: FC<{ progettoId: string; progetto: any }> = ({ progettoId, progetto }) => {
  const [links, setLinks] = useState<{ nome: string; url: string; tipo: string }[]>(() => {
    try { return JSON.parse(progetto.file_links || '[]') } catch { return [] }
  })
  const [form, setForm] = useState({ nome: '', url: '' })
  const TIPO_ICON: Record<string, string> = { gdrive: '📁', notion: '📓', documento: '📄', link: '🔗', figma: '🎨', github: '💻' }

  const add = async () => {
    if (!form.url) return
    const tipo = form.url.includes('drive.google') ? 'gdrive' : form.url.includes('notion') ? 'notion' : form.url.includes('figma') ? 'figma' : form.url.includes('github') ? 'github' : form.url.match(/\.(pdf|doc|xlsx|pptx)$/i) ? 'documento' : 'link'
    const updated = [...links, { nome: form.nome || form.url.split('/').pop() || 'File', url: form.url, tipo }]
    await supabase.from('progetti').update({ file_links: JSON.stringify(updated) }).eq('id', progettoId)
    setLinks(updated); setForm({ nome: '', url: '' })
  }

  const del = async (i: number) => {
    const updated = links.filter((_, idx) => idx !== i)
    await supabase.from('progetti').update({ file_links: JSON.stringify(updated) }).eq('id', progettoId)
    setLinks(updated)
  }

  return (
    <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: DS.colors.textPrimary }}>File & Documenti</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="URL (Google Drive, GitHub, Figma, Notion, PDF...)"
          style={{ flex: 2, padding: '8px 10px', border: `1px solid ${DS.colors.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, minWidth: 200 }} />
        <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome (opzionale)"
          style={{ flex: 1, padding: '8px 10px', border: `1px solid ${DS.colors.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, minWidth: 120 }} />
        <button onClick={add} style={{ padding: '8px 16px', background: DS.colors.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>+ Aggiungi</button>
      </div>
      {links.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', fontSize: 12, color: DS.colors.textMuted, background: DS.colors.background, borderRadius: 9, border: `2px dashed ${DS.colors.border}` }}>
          Nessun file allegato — aggiungi link Google Drive, GitHub, Figma, documenti PDF...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {links.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: DS.colors.background, border: `1px solid ${DS.colors.border}`, borderRadius: 9 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{TIPO_ICON[l.tipo] || '🔗'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: DS.colors.teal, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nome}</a>
                <div style={{ fontSize: 10, color: DS.colors.textMuted, marginTop: 2 }}>{l.tipo}</div>
              </div>
              <button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.colors.textMuted, fontSize: 13 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Note libere tab
const NoteTab: FC<{ progettoId: string; progetto: any }> = ({ progettoId, progetto }) => {
  const [note, setNote] = useState(progetto.note_libere || '')
  const [saved, setSaved] = useState(true)

  const save = async () => {
    await supabase.from('progetti').update({ note_libere: note }).eq('id', progettoId)
    setSaved(true)
  }

  return (
    <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DS.colors.textPrimary }}>Note del progetto</div>
        <button onClick={save} style={{ padding: '5px 14px', background: saved ? DS.colors.greenLight : DS.colors.teal, color: saved ? DS.colors.green : '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          {saved ? '✓ Salvato' : 'Salva'}
        </button>
      </div>
      <textarea value={note} onChange={e => { setNote(e.target.value); setSaved(false) }}
        placeholder="Note libere del progetto — strategie, decisioni, considerazioni, TODO, link, qualsiasi cosa..."
        rows={16} style={{ width: '100%', padding: '12px 14px', border: `1px solid ${DS.colors.border}`, borderRadius: 9, fontSize: 14, fontFamily: DS.fonts.ui, resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box', outline: 'none', background: DS.colors.background }} />
    </div>
  )
}

function renderOverview(progetto: any, tasks: any[], campagne: any[]) {
  const openTasks = tasks.filter(t => t.stato !== 'completato' && t.stato !== 'Fatto').length
  const activeCampaigns = campagne.filter(c => c.stato === 'attiva').length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Task preview */}
      <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: DS.colors.textPrimary }}>
          Task ({openTasks} aperti)
        </div>
        {tasks.length === 0 ? (
          <div style={{ fontSize: 12, color: DS.colors.textMuted, textAlign: 'center', padding: '16px 0' }}>Nessun task</div>
        ) : tasks.slice(0, 5).map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${DS.colors.borderLight}` }}>
            <div>
              <div style={{ fontSize: 13, color: DS.colors.textPrimary }}>{t.titolo || t.testo}</div>
              {t.scadenza && <div style={{ fontSize: 11, color: DS.colors.textMuted, marginTop: 2 }}>📅 {t.scadenza}</div>}
            </div>
            {t.stato && <Badge text={t.stato} />}
          </div>
        ))}
        {tasks.length > 5 && <div style={{ fontSize: 11, color: DS.colors.textMuted, textAlign: 'center' }}>+{tasks.length - 5} altri</div>}
      </div>

      {/* Campagne preview */}
      <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: DS.colors.textPrimary }}>
          Campagne ({activeCampaigns} attive)
        </div>
        {campagne.length === 0 ? (
          <div style={{ fontSize: 12, color: DS.colors.textMuted, textAlign: 'center', padding: '16px 0' }}>Nessuna campagna</div>
        ) : campagne.slice(0, 4).map(c => (
          <div key={c.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${DS.colors.borderLight}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 13, color: DS.colors.textPrimary }}>{c.nome}</div>
              {c.stato && <Badge text={c.stato} />}
            </div>
            {(c.leads_totali != null || c.email_inviate != null) && (
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {c.leads_totali != null && <span style={{ fontSize: 11, color: DS.colors.textMuted }}>👥 {c.leads_totali} leads</span>}
                {c.email_inviate != null && <span style={{ fontSize: 11, color: DS.colors.textMuted }}>📧 {c.email_inviate} email</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Note private */}
      {progetto.note_private && (
        <div style={{ gridColumn: '1 / -1', background: DS.colors.amberLight, border: `1px solid ${DS.colors.amber}20`, borderRadius: DS.radius.lg, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: DS.colors.amber, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Note private</div>
          <div style={{ fontSize: 13, color: DS.colors.textPrimary, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{progetto.note_private}</div>
        </div>
      )}
    </div>
  )
}

export const ProjectDetailView: FC<Props> = ({ progettoId, currentUser, onBack }) => {
  const detail = useProjectDetail(progettoId, currentUser)

  if (detail.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ fontSize: 13, color: DS.colors.textMuted, fontFamily: DS.fonts.ui }}>Caricamento progetto...</div>
      </div>
    )
  }

  if (!detail.progetto) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <button onClick={onBack} style={{ fontSize: 13, color: DS.colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>← Torna indietro</button>
        <div style={{ fontSize: 14, color: DS.colors.red, marginTop: 12 }}>Progetto non trovato.</div>
      </div>
    )
  }

  return (
    <div>
      <ProjectHeader
        progetto={detail.progetto}
        logsCount={detail.logs.length}
        tasksCount={detail.tasks.length}
        campagneCount={detail.campagne.length}
        onBack={onBack}
        onEdit={detail.openEditProject}
      />

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, padding: 4, overflowX: 'auto' }}>
        <TabBtn active={detail.activeTab === 'overview'} onClick={() => detail.setActiveTab('overview')}>Overview</TabBtn>
        <TabBtn active={detail.activeTab === 'log'} onClick={() => detail.setActiveTab('log')}>Log {detail.logs.length > 0 && `(${detail.logs.length})`}</TabBtn>
        <TabBtn active={detail.activeTab === 'task'} onClick={() => detail.setActiveTab('task')}>Task {detail.tasks.length > 0 && `(${detail.tasks.length})`}</TabBtn>
        <TabBtn active={detail.activeTab === 'campagne'} onClick={() => detail.setActiveTab('campagne')}>Campagne {detail.campagne.length > 0 && `(${detail.campagne.length})`}</TabBtn>
        <TabBtn active={detail.activeTab === 'file'} onClick={() => detail.setActiveTab('file' as any)}>📁 File</TabBtn>
        <TabBtn active={detail.activeTab === 'note'} onClick={() => detail.setActiveTab('note' as any)}>📝 Note</TabBtn>
        <TabBtn active={detail.activeTab === 'okr'} onClick={() => detail.setActiveTab('okr' as any)}>🎯 OKR</TabBtn>
      </div>

      {/* Tab content */}
      {detail.activeTab === 'overview' && renderOverview(detail.progetto, detail.tasks, detail.campagne)}

      {detail.activeTab === 'log' && (
        <ProjectLogPanel
          logs={detail.logs}
          showForm={detail.showLogForm}
          logForm={detail.logForm}
          onOpenForm={detail.openLogForm}
          onCloseForm={detail.closeLogForm}
          onSetForm={detail.setLogForm}
          onSave={detail.saveLog}
          onDelete={detail.deleteLog}
        />
      )}

      {detail.activeTab === 'task' && (
        <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: DS.colors.textPrimary }}>Task del progetto</div>
          {detail.tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: DS.colors.textMuted }}>Nessun task per questo progetto</div>
          ) : detail.tasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${DS.colors.borderLight}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: DS.colors.textPrimary }}>{t.titolo || t.testo}</div>
                {t.dettaglio && <div style={{ fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 }}>{t.dettaglio}</div>}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {t.chi && <span style={{ fontSize: 11, color: DS.colors.textMuted }}>👤 {t.chi}</span>}
                  {t.scadenza && <span style={{ fontSize: 11, color: DS.colors.textMuted }}>📅 {t.scadenza}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                {t.stato && <Badge text={t.stato} />}
                <button onClick={() => detail.deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.colors.textMuted, fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail.activeTab === 'campagne' && (
        <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: DS.colors.textPrimary }}>Campagne del progetto</div>
          {detail.campagne.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: DS.colors.textMuted }}>Nessuna campagna</div>
          ) : detail.campagne.map(c => (
            <div key={c.id} style={{ background: DS.colors.background, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: DS.colors.textPrimary }}>{c.nome}</div>
                {c.stato && <Badge text={c.stato} />}
              </div>
              <div style={{ fontSize: 12, color: DS.colors.textSecondary }}>{c.tipo}{c.canale ? ` · ${c.canale}` : ''}</div>
              {c.obiettivo && <div style={{ fontSize: 12, color: DS.colors.textMuted, marginTop: 4 }}>🎯 {c.obiettivo}</div>}
              {(c.leads_totali != null || c.email_inviate != null || c.risposte != null) && (
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  {c.leads_totali != null && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 700 }}>{c.leads_totali}</div><div style={{ fontSize: 10, color: DS.colors.textMuted }}>LEADS</div></div>}
                  {c.email_inviate != null && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 700 }}>{c.email_inviate}</div><div style={{ fontSize: 10, color: DS.colors.textMuted }}>EMAIL</div></div>}
                  {c.risposte != null && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 700 }}>{c.risposte}</div><div style={{ fontSize: 10, color: DS.colors.textMuted }}>RISPOSTE</div></div>}
                  {(c.email_inviate ?? 0) > 0 && c.risposte != null && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 700, color: DS.colors.teal }}>{((c.risposte / (c.email_inviate!)) * 100).toFixed(1)}%</div><div style={{ fontSize: 10, color: DS.colors.textMuted }}>TASSO RISP.</div></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(detail.activeTab as string) === 'file' && (
        <FileTab progettoId={progettoId} progetto={detail.progetto} />
      )}

      {(detail.activeTab as string) === 'note' && (
        <NoteTab progettoId={progettoId} progetto={detail.progetto} />
      )}

      {(detail.activeTab as string) === 'okr' && (
        <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: 20 }}>
          <OKRTab progettoId={progettoId} />
        </div>
      )}

      {/* Edit modal */}
      {detail.editingProject && (
        <ProjectEditModal
          projectForm={detail.projectForm}
          onSetForm={detail.setProjectForm}
          onSave={detail.saveProject}
          onClose={detail.closeEditProject}
        />
      )}
    </div>
  )
}
