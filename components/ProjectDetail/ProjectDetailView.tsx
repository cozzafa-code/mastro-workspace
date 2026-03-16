// components/ProjectDetail/ProjectDetailView.tsx
'use client'
import { FC } from 'react'
import { DS, STATE_COLORS } from '@/constants/design-system'
import { useProjectDetail } from '@/hooks/useProjectDetail'
import { ProjectHeader } from './ProjectHeader'
import { ProjectLogPanel } from './ProjectLog'
import { ProjectEditModal } from './ProjectEditModal'
import type { UserType } from '@/lib/types'

interface Props {
  progettoId: string
  currentUser: UserType
  onBack: () => void
}

const TabBtn: FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '7px 16px', border: 'none', borderRadius: DS.radius.sm,
    background: active ? DS.colors.teal : 'none',
    color: active ? '#fff' : DS.colors.textSecondary,
    fontSize: 13, fontWeight: active ? 600 : 400,
    cursor: 'pointer', fontFamily: DS.fonts.ui,
    transition: 'all 0.15s',
  }}>
    {children}
  </button>
)

const Badge: FC<{ text: string }> = ({ text }) => {
  const cfg = STATE_COLORS[text?.toLowerCase()] || { bg: DS.colors.borderLight, text: DS.colors.textSecondary }
  return (
    <span style={{ background: cfg.bg, color: cfg.text, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {text}
    </span>
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
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: DS.colors.surface, border: `1px solid ${DS.colors.border}`,
        borderRadius: DS.radius.md, padding: 4, width: 'fit-content',
      }}>
        <TabBtn active={detail.activeTab === 'overview'} onClick={() => detail.setActiveTab('overview')}>Overview</TabBtn>
        <TabBtn active={detail.activeTab === 'log'} onClick={() => detail.setActiveTab('log')}>
          Log & Storico {detail.logs.length > 0 && `(${detail.logs.length})`}
        </TabBtn>
        <TabBtn active={detail.activeTab === 'task'} onClick={() => detail.setActiveTab('task')}>
          Task {detail.tasks.length > 0 && `(${detail.tasks.length})`}
        </TabBtn>
        <TabBtn active={detail.activeTab === 'campagne'} onClick={() => detail.setActiveTab('campagne')}>
          Campagne {detail.campagne.length > 0 && `(${detail.campagne.length})`}
        </TabBtn>
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
                  {c.email_inviate > 0 && c.risposte != null && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 700, color: DS.colors.teal }}>{((c.risposte / c.email_inviate) * 100).toFixed(1)}%</div><div style={{ fontSize: 10, color: DS.colors.textMuted }}>TASSO RISP.</div></div>}
                </div>
              )}
            </div>
          ))}
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
