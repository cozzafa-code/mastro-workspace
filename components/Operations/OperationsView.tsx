// components/Operations/OperationsView.tsx
'use client'
import { FC, useState } from 'react'
import { DS } from '@/constants/design-system'
import { ScadenzarioView } from './ScadenzarioView'
import { FornitoriView } from './FornitoriView'
import { ChecklistView } from './ChecklistView'

const S = DS.colors

const TABS = [
  { id: 'scadenze',   label: 'Scadenze',   emoji: '📅', desc: 'Tutto ciò che scade' },
  { id: 'pagamenti',  label: 'Pagamenti',  emoji: '💳', desc: 'Fornitori e uscite' },
  { id: 'checklist',  label: 'Checklist',  emoji: '✅', desc: 'Routine ricorrenti' },
]

export const OperationsView: FC<{ currentUser: string }> = ({ currentUser }) => {
  const [tab, setTab] = useState('scadenze')

  return (
    <div>
      {/* Header ops */}
      <div style={{ background: `linear-gradient(135deg, ${S.lidia}15, ${S.lidiaLight})`, border: `1px solid ${S.lidia}20`, borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: S.lidia, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>LI</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: S.textPrimary, letterSpacing: '-0.3px' }}>Operations</div>
            <div style={{ fontSize: 12, color: S.textMuted, marginTop: 1 }}>Gestione operativa aziendale</div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '12px 8px', border: `1px solid ${tab === t.id ? S.lidia + '40' : S.border}`,
              borderRadius: 12, background: tab === t.id ? S.lidiaLight : S.surface,
              cursor: 'pointer', fontFamily: DS.fonts.ui, textAlign: 'center', transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{t.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: tab === t.id ? 700 : 600, color: tab === t.id ? S.lidia : S.textSecondary }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'scadenze'  && <ScadenzarioView currentUser={currentUser} />}
      {tab === 'pagamenti' && <FornitoriView currentUser={currentUser} />}
      {tab === 'checklist' && <ChecklistView currentUser={currentUser} />}
    </div>
  )
}
