// components/MRR/MrrTrackerView.tsx
'use client'
import { FC } from 'react'
import { DS } from '@/constants/design-system'
import { useMrrTracker } from '@/hooks/useMrrTracker'
import type { MrrSnapshot } from '@/lib/types'

const FI: FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; options?: { id: string; label: string }[] }> =
  ({ label, value, onChange, placeholder, type = 'text', options }) => (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: DS.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: DS.colors.surface }}>
          <option value="">Tutti i progetti</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: DS.colors.surface, boxSizing: 'border-box' }} />
      )}
    </div>
  )

function MiniBarChart({ data }: { data: { mese: string; totale: number }[] }) {
  if (data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: DS.colors.textMuted, fontSize: 13 }}>
      Nessun dato storico. Aggiungi snapshot mensili.
    </div>
  )
  const max = Math.max(...data.map(d => d.totale), 1)
  const w = 700, h = 180, pad = 40, barW = Math.min(40, (w - pad * 2) / data.length - 6)

  return (
    <svg viewBox={`0 0 ${w} ${h + 40}`} style={{ width: '100%', fontFamily: DS.fonts.ui }}>
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = pad + (1 - pct) * h
        return (
          <g key={pct}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke={DS.colors.border} strokeWidth={1} />
            <text x={pad - 6} y={y + 4} textAnchor="end" fontSize={9} fill={DS.colors.textMuted}>
              {String.fromCharCode(8364)}{Math.round(max * pct).toLocaleString('it-IT')}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = pad + i * ((w - pad * 2) / data.length) + ((w - pad * 2) / data.length - barW) / 2
        const barH = Math.max(2, (d.totale / max) * h)
        const y = pad + h - barH
        return (
          <g key={d.mese}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={DS.colors.teal} opacity={0.85} />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={DS.colors.teal} fontWeight={600}>
              {d.totale > 0 ? `${String.fromCharCode(8364)}${d.totale}` : ''}
            </text>
            <text x={x + barW / 2} y={pad + h + 16} textAnchor="middle" fontSize={9} fill={DS.colors.textMuted}>
              {d.mese.substring(5)}
            </text>
            <text x={x + barW / 2} y={pad + h + 28} textAnchor="middle" fontSize={8} fill={DS.colors.textMuted}>
              {d.mese.substring(0, 4)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: DS.colors.textSecondary }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: DS.colors.borderLight, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export const MrrTrackerView: FC = () => {
  const mrr = useMrrTracker()

  const f = mrr.form as Partial<MrrSnapshot>
  const lastMese = mrr.mrrPerMese[mrr.mrrPerMese.length - 1]
  const prevMese = mrr.mrrPerMese[mrr.mrrPerMese.length - 2]
  const growth = lastMese && prevMese && prevMese.totale > 0
    ? Math.round(((lastMese.totale - prevMese.totale) / prevMese.totale) * 100)
    : null

  if (mrr.loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ fontSize: 13, color: DS.colors.textMuted }}>Caricamento MRR...</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: DS.colors.textPrimary }}>MRR Tracker</div>
          <div style={{ fontSize: 12, color: DS.colors.textMuted, marginTop: 2 }}>Storico mensile · Target lancio Italia</div>
        </div>
        <button onClick={mrr.openForm} style={{ padding: '7px 14px', background: DS.colors.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Snapshot
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'MRR attuale', value: `${String.fromCharCode(8364)}${mrr.mrrCorrente.toLocaleString('it-IT')}/mo`, color: DS.colors.green, sub: 'da progetti attivi' },
          { label: 'Target lancio', value: `${String.fromCharCode(8364)}${mrr.targetMrr.toLocaleString('it-IT')}/mo`, color: DS.colors.textSecondary, sub: '30 clienti · Giugno 2026' },
          { label: 'Clienti totali', value: String(mrr.clientiAttuali), color: DS.colors.blue, sub: `su ${mrr.targetClienti} target` },
          { label: 'Crescita m/m', value: growth !== null ? `${growth > 0 ? '+' : ''}${growth}%` : '—', color: growth !== null && growth > 0 ? DS.colors.green : DS.colors.red, sub: 'vs mese precedente' },
        ].map(k => (
          <div key={k.label} style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, padding: '12px 18px', minWidth: 140 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: DS.fonts.mono }}>{k.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: DS.colors.textPrimary, marginTop: 2 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: DS.colors.textMuted, marginTop: 1 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 20 }}>
        <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: '20px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: DS.colors.textPrimary }}>Andamento MRR mensile</div>
          <MiniBarChart data={mrr.mrrPerMese} />
        </div>

        <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: '20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: DS.colors.textPrimary }}>Target lancio</div>
          <ProgressBar value={mrr.mrrCorrente} max={mrr.targetMrr} label={`MRR: ${String.fromCharCode(8364)}${mrr.mrrCorrente} / ${String.fromCharCode(8364)}${mrr.targetMrr}`} color={DS.colors.teal} />
          <ProgressBar value={mrr.clientiAttuali} max={mrr.targetClienti} label={`Clienti: ${mrr.clientiAttuali} / ${mrr.targetClienti}`} color={DS.colors.blue} />
          <div style={{ marginTop: 16, padding: 12, background: DS.colors.tealLight, borderRadius: DS.radius.sm }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: DS.colors.tealDark, marginBottom: 4 }}>MANCANO</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: DS.colors.tealDark }}>
              {String.fromCharCode(8364)}{Math.max(0, mrr.targetMrr - mrr.mrrCorrente).toLocaleString('it-IT')}/mo
            </div>
            <div style={{ fontSize: 11, color: DS.colors.tealDark, marginTop: 2 }}>
              {Math.max(0, mrr.targetClienti - mrr.clientiAttuali)} clienti al target
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: DS.colors.textPrimary }}>MRR per progetto</div>
        {mrr.progetti.filter(p => (p.mrr || 0) > 0 || p.stato === 'attivo').length === 0 ? (
          <div style={{ fontSize: 12, color: DS.colors.textMuted, textAlign: 'center', padding: '16px 0' }}>Nessun progetto con MRR. Aggiorna i valori nei progetti.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mrr.progetti.filter(p => p.stato === 'attivo' || (p.mrr || 0) > 0).map(p => {
              const pct = mrr.mrrCorrente > 0 ? Math.round(((p.mrr || 0) / mrr.mrrCorrente) * 100) : 0
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.colore && <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.colore, flexShrink: 0 }} />}
                  <div style={{ fontSize: 13, fontWeight: 500, color: DS.colors.textPrimary, minWidth: 160 }}>{p.nome}</div>
                  <div style={{ flex: 1, height: 6, background: DS.colors.borderLight, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: p.colore || DS.colors.teal, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DS.colors.green, minWidth: 80, textAlign: 'right' }}>{String.fromCharCode(8364)}{p.mrr || 0}/mo</div>
                  <div style={{ fontSize: 11, color: DS.colors.textMuted, minWidth: 30 }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {mrr.snapshots.length > 0 && (
        <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.lg, padding: '20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: DS.colors.textPrimary }}>Storico snapshot ({mrr.snapshots.length})</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: DS.colors.background }}>
                {['Data', 'Progetto', 'MRR', 'Clienti', 'Note', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${DS.colors.border}`, fontSize: 11, fontWeight: 700, color: DS.colors.textMuted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...mrr.snapshots].reverse().slice(0, 20).map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${DS.colors.borderLight}` }}>
                  <td style={{ padding: '9px 12px', color: DS.colors.textSecondary }}>{s.data ? new Date(s.data).toLocaleDateString('it-IT') : '—'}</td>
                  <td style={{ padding: '9px 12px', fontWeight: 500 }}>{s.progetto_nome || '—'}</td>
                  <td style={{ padding: '9px 12px', fontWeight: 700, color: DS.colors.green }}>{String.fromCharCode(8364)}{s.valore || 0}/mo</td>
                  <td style={{ padding: '9px 12px', color: DS.colors.blue }}>{s.clienti_num || 0}</td>
                  <td style={{ padding: '9px 12px', color: DS.colors.textMuted, fontSize: 12 }}>{s.note || '—'}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <button onClick={() => mrr.deleteSnapshot(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.colors.textMuted, fontSize: 12 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mrr.showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) mrr.closeForm() }}>
          <div style={{ background: DS.colors.surface, borderRadius: DS.radius.xl, padding: 24, width: '100%', maxWidth: 440, boxShadow: DS.shadow.lg }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: DS.colors.textPrimary }}>Nuovo snapshot MRR</div>
            <FI label="Progetto" value={f.progetto_id || ''} onChange={v => mrr.setForm({ progetto_id: v })}
              options={mrr.progetti.map(p => ({ id: p.id, label: p.nome }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <FI label="MRR €/mo" value={String(f.valore || '')} onChange={v => mrr.setForm({ valore: Number(v) })} type="number" placeholder="0" />
              <FI label="Clienti" value={String(f.clienti_num || '')} onChange={v => mrr.setForm({ clienti_num: Number(v) })} type="number" placeholder="0" />
              <FI label="Data" value={f.data || ''} onChange={v => mrr.setForm({ data: v, mese: v.substring(0, 7) })} type="date" />
            </div>
            <FI label="Note" value={f.note || ''} onChange={v => mrr.setForm({ note: v })} placeholder="es. Primo cliente beta" />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={mrr.closeForm} style={{ padding: '8px 14px', border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 13 }}>Annulla</button>
              <button onClick={mrr.saveSnapshot} style={{ padding: '8px 18px', background: DS.colors.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
