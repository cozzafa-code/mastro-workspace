// components/Finance/FinanceRunwayView.tsx
'use client'
import { FC, useState } from 'react'
import { DS } from '@/constants/design-system'
import { useFinanceRunway } from '@/hooks/useFinanceRunway'
import { useDevice } from '@/hooks/useDevice'
import type { Spesa } from '@/lib/types'

const S = DS.colors

const CAT_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  tech:      { bg: '#DBEAFE', color: '#2563EB', icon: '💻' },
  marketing: { bg: '#EDE9FE', color: '#6D28D9', icon: '📣' },
  personale: { bg: '#FFE4E6', color: '#BE185D', icon: '👤' },
  ufficio:   { bg: '#FEF3C7', color: '#B45309', icon: '🏢' },
  legale:    { bg: '#D1FAE5', color: '#0F7B5A', icon: '⚖️' },
  banche:    { bg: '#F3F4F6', color: '#374151', icon: '🏦' },
  altro:     { bg: S.borderLight, color: S.textMuted, icon: '📦' },
}

const FI: FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; options?: string[] }> =
  ({ label, value, onChange, placeholder, type = 'text', options }) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface }}>
          <option value="">—</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '7px 10px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface, boxSizing: 'border-box' }} />
      )}
    </div>
  )

function RunwayMeter({ months }: { months: number }) {
  const capped = Math.min(months, 24)
  const pct = (capped / 24) * 100
  const color = months < 3 ? S.red : months < 6 ? S.amber : S.green
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: S.textSecondary }}>Runway stimato</span>
        <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: DS.fonts.mono }}>{months >= 999 ? '∞' : `${months} mesi`}</span>
      </div>
      <div style={{ height: 10, background: S.borderLight, borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5, transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: S.red }}>Critico &lt;3m</span>
        <span style={{ fontSize: 10, color: S.amber }}>Attenzione &lt;6m</span>
        <span style={{ fontSize: 10, color: S.green }}>Sicuro 12m+</span>
      </div>
    </div>
  )
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0)
  if (total === 0) return null
  let offset = 0
  const r = 38, cx = 50, cy = 50, stroke = 16, circumference = 2 * Math.PI * r
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        {data.map((d, i) => {
          const pct = d.value / total
          const dashArray = `${pct * circumference} ${circumference}`
          const rotate = offset * 360 - 90
          offset += pct
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={stroke} strokeDasharray={dashArray} style={{ transform: `rotate(${rotate}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
        })}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fontWeight: 700, fill: S.textPrimary, fontFamily: DS.fonts.mono }}>€{Math.round(total).toLocaleString('it-IT')}</text>
      </svg>
      <div style={{ flex: 1 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color }} />
              <span style={{ fontSize: 11, color: S.textSecondary }}>{d.label}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: DS.fonts.mono }}>€{Math.round(d.value).toLocaleString('it-IT')} <span style={{ fontSize: 9, color: S.textMuted }}>({Math.round(d.value / total * 100)}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SpesaCard: FC<{ s: Spesa; onEdit: () => void; onDelete: () => void }> = ({ s, onEdit, onDelete }) => {
  const cat = (s.categoria || 'altro').toLowerCase()
  const cfg = CAT_COLORS[cat] || CAT_COLORS.altro
  const isEntrata = s.tipo === 'entrata'
  const freq = s.frequenza === 'mensile' ? '/mo' : s.frequenza === 'annuale' ? '/anno' : ''
  return (
    <div onClick={onEdit} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = S.teal}
      onMouseLeave={e => e.currentTarget.style.borderColor = S.border}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{cfg.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nome}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 10, background: cfg.bg, color: cfg.color, padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>{s.categoria || 'altro'}</span>
          {s.frequenza && <span style={{ fontSize: 10, color: S.textMuted }}>{s.frequenza}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: isEntrata ? S.green : S.red, fontFamily: DS.fonts.mono }}>{isEntrata ? '+' : '-'}€{Number(s.importo).toLocaleString('it-IT')}{freq}</div>
        {s.frequenza === 'annuale' && <div style={{ fontSize: 10, color: S.textMuted }}>€{Math.round(Number(s.importo) / 12).toLocaleString('it-IT')}/mo</div>}
      </div>
      <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 13 }}>✕</button>
    </div>
  )
}

export const FinanceRunwayView: FC = () => {
  const fr = useFinanceRunway()
  const device = useDevice()
  const [tab, setTab] = useState<'overview' | 'uscite' | 'entrate'>('overview')
  const [editingSpesa, setEditingSpesa] = useState<Spesa | null>(null)

  const uscite = fr.spese.filter(s => s.tipo !== 'entrata')
  const entrate = fr.spese.filter(s => s.tipo === 'entrata')

  const mensile = (s: Spesa) => s.frequenza === 'annuale' ? Number(s.importo) / 12 : s.frequenza === 'mensile' ? Number(s.importo) : 0
  const totUscite = uscite.reduce((a, s) => a + mensile(s), 0)
  const totEntrate = entrate.reduce((a, s) => a + mensile(s), 0)
  const flusso = totEntrate - totUscite

  const catData = Object.entries(
    uscite.reduce((acc: Record<string, number>, s) => { const c = s.categoria?.toLowerCase() || 'altro'; acc[c] = (acc[c] || 0) + mensile(s); return acc }, {})
  ).map(([label, value]) => ({ label, value, color: CAT_COLORS[label]?.color || S.textMuted }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Finanze</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>Runway · Burn rate · Entrate e uscite</div>
        </div>
        <button onClick={() => fr.openForm()} style={{ padding: '8px 16px', background: S.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>+ Voce</button>
      </div>

      <div style={{ display: 'flex', gap: 3, background: S.background, borderRadius: 9, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        {[{id:'overview',l:'Overview'},{id:'uscite',l:`Uscite (${uscite.length})`},{id:'entrate',l:`Entrate (${entrate.length})`}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{ padding: '7px 14px', border: 'none', borderRadius: 7, background: tab === t.id ? S.surface : 'none', color: tab === t.id ? S.textPrimary : S.textMuted, fontSize: 12, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui, boxShadow: tab === t.id ? DS.shadow.xs : 'none' }}>{t.l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: device.isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10 }}>
            {[
              { v: `€${Math.round(totUscite).toLocaleString('it-IT')}`, l: 'Burn rate/mese', c: S.red },
              { v: `€${Math.round(totEntrate).toLocaleString('it-IT')}`, l: 'Entrate/mese', c: S.green },
              { v: flusso >= 0 ? `+€${Math.round(flusso).toLocaleString('it-IT')}` : `-€${Math.round(Math.abs(flusso)).toLocaleString('it-IT')}`, l: 'Flusso netto', c: flusso >= 0 ? S.green : S.red },
              { v: fr.runway >= 999 ? '∞' : `${fr.runway}m`, l: 'Runway', c: fr.runway < 3 ? S.red : fr.runway < 6 ? S.amber : S.green },
            ].map((k, i) => (
              <div key={i} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.md, padding: '14px 16px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: k.c, fontFamily: DS.fonts.mono }}>{k.v}</div>
                <div style={{ fontSize: 11, color: S.textPrimary, marginTop: 4, fontWeight: 600 }}>{k.l}</div>
              </div>
            ))}
          </div>

          <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg, padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: device.isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
              <div>
                <RunwayMeter months={fr.runway} />
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Cassa attuale (€)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" value={fr.saldoCorrente} onChange={e => fr.setSnapshotForm({...fr.snapshotForm, saldo_cassa: Number(e.target.value)})} style={{ flex: 1, padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 14, fontFamily: DS.fonts.mono, fontWeight: 600, background: S.background }} />
                    <button onClick={fr.saveSnapshot} style={{ padding: '8px 14px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>Salva</button>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Composizione uscite mensili</div>
                {catData.length > 0 ? <DonutChart data={catData} /> : <div style={{ fontSize: 12, color: S.textMuted, textAlign: 'center', padding: '20px 0' }}>Nessuna uscita categorizzata</div>}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Tutte le voci</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fr.spese.map(s => <SpesaCard key={s.id} s={s} onEdit={() => setEditingSpesa(s)} onDelete={() => fr.deleteSpesa(s.id)} />)}
            </div>
          </div>
        </div>
      )}

      {(tab === 'uscite' || tab === 'entrate') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(tab === 'uscite' ? uscite : entrate).length === 0
            ? <div style={{ textAlign: 'center', padding: '40px', background: S.surface, border: `2px dashed ${S.border}`, borderRadius: 12, fontSize: 13, color: S.textMuted, cursor: 'pointer' }} onClick={() => fr.openForm()}>Nessuna voce · clicca per aggiungere</div>
            : (tab === 'uscite' ? uscite : entrate).map(s => <SpesaCard key={s.id} s={s} onEdit={() => setEditingSpesa(s)} onDelete={() => fr.deleteSpesa(s.id)} />)
          }
        </div>
      )}

      {(fr.showForm || editingSpesa) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) { fr.closeForm(); setEditingSpesa(null) } }}>
          <div style={{ background: S.surface, borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, boxShadow: DS.shadow.xl }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: S.textPrimary }}>{editingSpesa ? 'Modifica voce' : 'Nuova voce finanziaria'}</div>
            <FI label="Nome *" value={fr.form.nome || ''} onChange={v => fr.setForm({ ...fr.form, nome: v })} placeholder="es. Vercel Pro" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Importo €" value={String(fr.form.importo || '')} onChange={v => fr.setForm({ ...fr.form, importo: Number(v) })} type="number" placeholder="0" />
              <FI label="Tipo" value={fr.form.tipo || ''} onChange={v => fr.setForm({ ...fr.form, tipo: v })} options={['uscita','entrata']} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Frequenza" value={fr.form.frequenza || ''} onChange={v => fr.setForm({ ...fr.form, frequenza: v })} options={['mensile','annuale','una_tantum']} />
              <FI label="Categoria" value={fr.form.categoria || ''} onChange={v => fr.setForm({ ...fr.form, categoria: v })} options={Object.keys(CAT_COLORS)} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 14, borderTop: `1px solid ${S.borderLight}` }}>
              <button onClick={() => { fr.closeForm(); setEditingSpesa(null) }} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
              <button onClick={() => { fr.saveSpesa(); setEditingSpesa(null) }} style={{ padding: '8px 20px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
