// components/Campagne/CampagneProView.tsx
'use client'
import { FC } from 'react'
import { DS } from '@/constants/design-system'
import { useCampagnePro, CANALI, TIPI } from '@/hooks/useCampagnePro'
import { usePanel } from '@/context/PanelContext'
import type { Campagna, CampagnaMetrica, UserType } from '@/lib/types'

const S = DS.colors

// ── Shared atoms ──────────────────────────────────────────
const Chip: FC<{ label: string; color?: string; bg?: string }> = ({ label, color = S.textSecondary, bg = S.borderLight }) => (
  <span style={{ background: bg, color, padding: '2px 8px', borderRadius: DS.radius.full, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
)

const KPIBox: FC<{ value: string; label: string; sub?: string; color?: string }> = ({ value, label, sub, color }) => (
  <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.md, padding: '14px 18px', minWidth: 110 }}>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || S.textPrimary, fontFamily: DS.fonts.mono, letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ fontSize: 11, fontWeight: 600, color: S.textPrimary, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: S.textMuted, marginTop: 1 }}>{sub}</div>}
  </div>
)

const FI: FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; options?: string[]; half?: boolean }> =
  ({ label, value, onChange, placeholder, type = 'text', options }) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface, color: S.textPrimary }}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface, color: S.textPrimary, boxSizing: 'border-box' }} />
      )}
    </div>
  )

// ── Mini sparkline SVG ────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 120, h = 32
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Campaign card ─────────────────────────────────────────
const CampagnaCard: FC<{ c: Campagna; metriche: CampagnaMetrica[]; onSelect: () => void; onDelete: () => void; onEdit: () => void }> =
  ({ c, metriche, onSelect, onDelete, onEdit }) => {
    const spend = Number(c.spend_attuale) || 0
    const budget = Number(c.budget_totale) || 0
    const leads = Number(c.leads_totali) || 0
    const conv = Number(c.conversioni) || 0
    const budgetPct = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0
    const cpl = leads > 0 ? Math.round(spend / leads) : 0
    const cac = conv > 0 ? Math.round(spend / conv) : 0
    const sparkData = metriche.map(m => Number(m.leads) || 0)

    const stateColor: Record<string, { bg: string; text: string }> = {
      attiva:      { bg: S.greenLight,  text: S.green },
      pianificata: { bg: S.blueLight,   text: S.blue },
      pausa:       { bg: S.amberLight,  text: S.amber },
      completata:  { bg: S.borderLight, text: S.textMuted },
    }
    const sc = stateColor[c.stato?.toLowerCase() || ''] || stateColor.pianificata

    return (
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg, padding: '18px 20px', marginBottom: 10, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
        onClick={onSelect}
        onMouseEnter={e => e.currentTarget.style.boxShadow = DS.shadow.md}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary }}>{c.nome}</span>
              <Chip label={c.stato || 'bozza'} bg={sc.bg} color={sc.text} />
              {c.canale && <Chip label={c.canale} />}
              {c.tipo && <Chip label={c.tipo} />}
            </div>
            {c.obiettivo && <div style={{ fontSize: 12, color: S.textMuted }}>{c.obiettivo}</div>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button onClick={onEdit} style={{ padding: '4px 10px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 11, color: S.textSecondary, fontFamily: DS.fonts.ui }}>Modifica</button>
            <button onClick={onDelete} style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 13 }}>✕</button>
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: budget > 0 ? 12 : 0 }}>
          {[
            { label: 'Leads', value: leads, color: S.blue },
            { label: 'Conv.', value: conv, color: S.green },
            { label: 'Spend', value: spend > 0 ? `€${spend}` : '—', color: S.textPrimary },
            { label: 'CPL', value: cpl > 0 ? `€${cpl}` : '—', color: S.amber },
            { label: 'CAC', value: cac > 0 ? `€${cac}` : '—', color: S.red },
          ].map(m => (
            <div key={m.label} style={{ background: S.background, borderRadius: DS.radius.sm, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: m.color, fontFamily: DS.fonts.mono }}>{m.value}</div>
              <div style={{ fontSize: 9.5, color: S.textMuted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Budget bar */}
        {budget > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: S.textMuted }}>Budget: €{spend} / €{budget}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: budgetPct > 85 ? S.red : S.textSecondary }}>{budgetPct}%</span>
            </div>
            <div style={{ height: 4, background: S.borderLight, borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${budgetPct}%`, background: budgetPct > 85 ? S.red : S.teal, borderRadius: 2, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}

        {/* Sparkline */}
        {sparkData.length > 1 && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: S.textMuted }}>Leads trend</span>
            <Sparkline data={sparkData} color={S.teal} />
          </div>
        )}
      </div>
    )
  }

// ── Detail panel ──────────────────────────────────────────
const DetailPanel: FC<{ c: Campagna; metriche: CampagnaMetrica[]; showMetricaForm: boolean; metricaForm: Partial<CampagnaMetrica>; onClose: () => void; onOpenMetrica: () => void; onCloseMetrica: () => void; onSetMetrica: (p: Partial<CampagnaMetrica>) => void; onSaveMetrica: () => void }> =
  ({ c, metriche, showMetricaForm, metricaForm, onClose, onOpenMetrica, onCloseMetrica, onSetMetrica, onSaveMetrica }) => {
    const spend = Number(c.spend_attuale) || 0
    const leads = Number(c.leads_totali) || 0
    const conv = Number(c.conversioni) || 0
    const click = Number(c.click) || 0
    const impression = Number(c.impression) || 0
    const ctr = impression > 0 ? ((click / impression) * 100).toFixed(2) : '—'
    const convRate = leads > 0 ? ((conv / leads) * 100).toFixed(1) : '—'
    const cpl = leads > 0 ? Math.round(spend / leads) : 0
    const cac = conv > 0 ? Math.round(spend / conv) : 0
    const roi = spend > 0 && conv > 0 ? Math.round(((conv * 248 - spend) / spend) * 100) : null

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'flex-end', zIndex: 100, backdropFilter: 'blur(2px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div style={{ width: 460, height: '100vh', background: S.surface, overflowY: 'auto', boxShadow: DS.shadow.xl, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${S.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: S.textPrimary }}>{c.nome}</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, padding: 4 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {c.stato && <Chip label={c.stato} bg={S.tealLight} color={S.teal} />}
              {c.canale && <Chip label={c.canale} />}
              {c.tipo && <Chip label={c.tipo} />}
              {c.responsabile && <Chip label={c.responsabile} />}
            </div>
          </div>

          {/* Full metrics */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${S.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Metriche complete</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Leads', value: leads, color: S.blue },
                { label: 'Conversioni', value: conv, color: S.green },
                { label: 'Click', value: click, color: S.purple },
                { label: 'Impression', value: impression, color: S.textSecondary },
                { label: 'CTR', value: `${ctr}%`, color: S.purple },
                { label: 'Conv. rate', value: `${convRate}%`, color: S.green },
                { label: 'CPL', value: cpl > 0 ? `€${cpl}` : '—', color: S.amber },
                { label: 'CAC', value: cac > 0 ? `€${cac}` : '—', color: S.red },
                { label: 'ROI stimato', value: roi !== null ? `${roi}%` : '—', color: roi !== null && roi > 0 ? S.green : S.red },
              ].map(m => (
                <div key={m.label} style={{ background: S.background, borderRadius: DS.radius.sm, padding: '10px 12px' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.color, fontFamily: DS.fonts.mono }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: S.textMuted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</div>
                </div>
              ))}
            </div>
            {c.budget_totale ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: S.textMuted }}>Budget usato: €{spend} / €{c.budget_totale}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{c.budget_totale > 0 ? Math.round((spend / Number(c.budget_totale)) * 100) : 0}%</span>
                </div>
                <div style={{ height: 5, background: S.borderLight, borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, c.budget_totale > 0 ? (spend / Number(c.budget_totale)) * 100 : 0)}%`, background: S.teal, borderRadius: 3 }} />
                </div>
              </div>
            ) : null}
          </div>

          {/* Metriche storiche */}
          <div style={{ padding: '16px 24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Storico metriche ({metriche.length})</div>
              <button onClick={onOpenMetrica} style={{ padding: '5px 10px', background: S.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>+ Aggiorna</button>
            </div>

            {showMetricaForm && (
              <div style={{ background: S.background, border: `1px solid ${S.teal}40`, borderRadius: DS.radius.md, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <FI label="Data" value={metricaForm.data || ''} onChange={v => onSetMetrica({ data: v })} type="date" />
                  <FI label="Leads" value={String(metricaForm.leads || '')} onChange={v => onSetMetrica({ leads: Number(v) })} type="number" placeholder="0" />
                  <FI label="Spend €" value={String(metricaForm.spend || '')} onChange={v => onSetMetrica({ spend: Number(v) })} type="number" placeholder="0" />
                  <FI label="Click" value={String(metricaForm.click || '')} onChange={v => onSetMetrica({ click: Number(v) })} type="number" placeholder="0" />
                  <FI label="Impression" value={String(metricaForm.impression || '')} onChange={v => onSetMetrica({ impression: Number(v) })} type="number" placeholder="0" />
                  <FI label="Conversioni" value={String(metricaForm.conversioni || '')} onChange={v => onSetMetrica({ conversioni: Number(v) })} type="number" placeholder="0" />
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                  <button onClick={onCloseMetrica} style={{ padding: '5px 10px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.fonts.ui }}>Annulla</button>
                  <button onClick={onSaveMetrica} style={{ padding: '5px 12px', background: S.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui }}>Salva</button>
                </div>
              </div>
            )}

            {metriche.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: S.textMuted }}>Nessuna metrica registrata</div>
            ) : [...metriche].reverse().map(m => (
              <div key={m.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${S.borderLight}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: S.textPrimary }}>{m.data ? new Date(m.data).toLocaleDateString('it-IT') : ''}</span>
                  {m.spend ? <span style={{ fontSize: 12, color: S.red }}>-€{m.spend}</span> : null}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {m.leads ? <span style={{ fontSize: 11, color: S.blue }}>{m.leads} leads</span> : null}
                  {m.click ? <span style={{ fontSize: 11, color: S.purple }}>{m.click} click</span> : null}
                  {m.conversioni ? <span style={{ fontSize: 11, color: S.green }}>{m.conversioni} conv.</span> : null}
                </div>
                {m.note && <div style={{ fontSize: 11, color: S.textMuted, marginTop: 3 }}>{m.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

// ── Main view ─────────────────────────────────────────────
export const CampagneProView: FC<{ currentUser: UserType }> = ({ currentUser }) => {
  const cp = useCampagnePro(currentUser)
  const { openPanel } = usePanel()
  const f = cp.form as Partial<Campagna>

  if (cp.loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento...</span></div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Campagne</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{cp.campagne.length} campagne · budget, metriche, ROI</div>
        </div>
        <button onClick={() => cp.openForm()} style={{ padding: '8px 16px', background: S.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: DS.fonts.ui }}>+ Campagna</button>
      </div>

      {/* KPI bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <KPIBox value={`€${cp.totBudget.toLocaleString('it-IT')}`} label="Budget totale" sub="tutte le campagne" />
        <KPIBox value={`€${cp.totSpend.toLocaleString('it-IT')}`} label="Spend totale" color={S.red} />
        <KPIBox value={String(cp.totLeads)} label="Lead totali" color={S.blue} />
        <KPIBox value={String(cp.totConversioni)} label="Conversioni" color={S.green} />
        <KPIBox value={cp.cpl > 0 ? `€${cp.cpl}` : '—'} label="CPL medio" color={S.amber} sub="costo per lead" />
        <KPIBox value={cp.cac > 0 ? `€${cp.cac}` : '—'} label="CAC medio" color={S.red} sub="costo acquisizione" />
        <KPIBox value={`${cp.convRate}%`} label="Conv. rate" color={S.purple} />
      </div>

      {/* List */}
      {cp.campagne.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg, color: S.textMuted, fontSize: 13 }}>
          Nessuna campagna ancora.<br /><span style={{ fontSize: 12 }}>Crea la prima per tracciare budget e metriche.</span>
        </div>
      ) : cp.campagne.map(c => (
        <CampagnaCard key={c.id} c={c} metriche={cp.metricheByC(c.id)}
          onSelect={() => { cp.selectCampagna(c); openPanel({ type: 'campagna', id: c.id, data: c }) }}
          onDelete={() => cp.deleteCampagna(c.id)}
          onEdit={() => cp.openForm(c)}
        />
      ))}

      {/* Form modal */}
      {cp.showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) cp.closeForm() }}>
          <div style={{ background: S.surface, borderRadius: DS.radius.xl, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: DS.shadow.xl, border: `1px solid ${S.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: S.textPrimary }}>{f.id ? 'Modifica campagna' : 'Nuova campagna'}</div>
            <FI label="Nome *" value={f.nome || ''} onChange={v => cp.setForm({ nome: v })} placeholder="Nome campagna" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Tipo" value={f.tipo || ''} onChange={v => cp.setForm({ tipo: v })} options={TIPI} />
              <FI label="Canale" value={f.canale || ''} onChange={v => cp.setForm({ canale: v })} options={CANALI} />
            </div>
            <FI label="Obiettivo" value={f.obiettivo || ''} onChange={v => cp.setForm({ obiettivo: v })} placeholder="es. 200 lead serramentisti IT" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <FI label="Budget €" value={String(f.budget_totale || '')} onChange={v => cp.setForm({ budget_totale: Number(v) })} type="number" placeholder="0" />
              <FI label="Spend €" value={String(f.spend_attuale || '')} onChange={v => cp.setForm({ spend_attuale: Number(v) })} type="number" placeholder="0" />
              <FI label="Target leads" value={String(f.target_leads || '')} onChange={v => cp.setForm({ target_leads: Number(v) })} type="number" placeholder="0" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Data inizio" value={f.data_inizio || ''} onChange={v => cp.setForm({ data_inizio: v })} type="date" />
              <FI label="Data fine" value={f.data_fine || ''} onChange={v => cp.setForm({ data_fine: v })} type="date" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Stato" value={f.stato || ''} onChange={v => cp.setForm({ stato: v })} options={['pianificata', 'attiva', 'pausa', 'completata']} />
              <FI label="Responsabile" value={f.responsabile || ''} onChange={v => cp.setForm({ responsabile: v })} options={['fabio', 'lidia', 'entrambi']} />
            </div>
            <FI label="Note" value={f.note || ''} onChange={v => cp.setForm({ note: v })} placeholder="Note..." />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8, paddingTop: 14, borderTop: `1px solid ${S.borderLight}` }}>
              <button onClick={cp.closeForm} style={{ padding: '8px 14px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
              <button onClick={cp.saveCampagna} style={{ padding: '8px 18px', background: S.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: DS.fonts.ui }}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {cp.selected && (
        <DetailPanel
          c={cp.selected}
          metriche={cp.metricheByC(cp.selected.id)}
          showMetricaForm={cp.showMetricaForm}
          metricaForm={cp.metricaForm}
          onClose={() => cp.selectCampagna(null)}
          onOpenMetrica={cp.openMetricaForm}
          onCloseMetrica={cp.closeMetricaForm}
          onSetMetrica={cp.setMetricaForm}
          onSaveMetrica={cp.saveMetrica}
        />
      )}
    </div>
  )
}
