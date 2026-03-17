// components/Finance/FinanceRunwayView.tsx
'use client'
import { FC } from 'react'
import { DS } from '@/constants/design-system'
import { useFinanceRunway } from '@/hooks/useFinanceRunway'
import { useDevice } from '@/hooks/useDevice'
import type { Spesa } from '@/lib/types'

const S = DS.colors

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
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface, boxSizing: 'border-box' }} />
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
        <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: DS.fonts.mono }}>
          {months >= 999 ? '∞' : `${months} mesi`}
        </span>
      </div>
      <div style={{ height: 8, background: S.borderLight, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: S.red }}>0</span>
        <span style={{ fontSize: 10, color: S.amber }}>6</span>
        <span style={{ fontSize: 10, color: S.green }}>12</span>
        <span style={{ fontSize: 10, color: S.green }}>24+</span>
      </div>
    </div>
  )
}

export const FinanceRunwayView: FC = () => {
  const fin = useFinanceRunway()
  const device = useDevice()

  const uscite = fin.spese.filter(s => s.tipo !== 'entrata' && s.tipo !== 'Entrata')
  const entrate = fin.spese.filter(s => s.tipo === 'entrata' || s.tipo === 'Entrata')
  const saldo = fin.entrateMensili - fin.usciteMensili
  const f = fin.form as Partial<Spesa>

  if (fin.loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento...</span></div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Finanze</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>Burn rate · runway · entrate/uscite</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fin.openSnapshotForm} style={{ padding: '7px 12px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, background: 'none', fontSize: 12, cursor: 'pointer', color: S.textSecondary, fontFamily: DS.fonts.ui }}>Aggiorna cassa</button>
          <button onClick={() => fin.openForm()} style={{ padding: '7px 14px', background: S.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: DS.fonts.ui }}>+ Voce</button>
        </div>
      </div>

      {/* KPI + Runway */}
      <div style={{ display: 'grid', gridTemplateColumns: device.isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Uscite/mese', value: `-€${Math.round(fin.usciteMensili).toLocaleString('it-IT')}`, color: S.red },
            { label: 'Entrate/mese', value: `+€${Math.round(fin.entrateMensili).toLocaleString('it-IT')}`, color: S.green },
            { label: 'Saldo/mese', value: `${saldo >= 0 ? '+' : ''}€${Math.round(saldo).toLocaleString('it-IT')}`, color: saldo >= 0 ? S.green : S.red },
            { label: 'Burn rate', value: `€${Math.round(fin.burnRate).toLocaleString('it-IT')}/mo`, color: S.amber },
          ].map(k => (
            <div key={k.label} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.md, padding: '12px 14px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: k.color, fontFamily: DS.fonts.mono }}>{k.value}</div>
              <div style={{ fontSize: 10, color: S.textMuted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Runway card */}
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg, padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Cassa attuale</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: S.textPrimary, fontFamily: DS.fonts.mono, letterSpacing: '-1px' }}>
              €{fin.saldoCorrente.toLocaleString('it-IT')}
            </div>
            {fin.snapshots[0] && <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>Aggiornato {new Date(fin.snapshots[0].data || '').toLocaleDateString('it-IT')}</div>}
          </div>
          <RunwayMeter months={fin.runway} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: device.isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Uscite */}
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.red, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Uscite ({uscite.length})</div>
          {uscite.length === 0 ? <div style={{ fontSize: 12, color: S.textMuted, textAlign: 'center', padding: '16px 0' }}>Nessuna</div> : uscite.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${S.borderLight}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary }}>{s.nome || s.voce}</div>
                <div style={{ fontSize: 11, color: S.textMuted }}>{(s as any).categoria || ''} · {(s as any).frequenza || (s as any).freq || 'mensile'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: S.red, fontFamily: DS.fonts.mono }}>-€{s.importo}</span>
                <button onClick={() => fin.deleteSpesa(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Entrate */}
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Entrate ({entrate.length})</div>
          {entrate.length === 0 ? <div style={{ fontSize: 12, color: S.textMuted, textAlign: 'center', padding: '16px 0' }}>Nessuna</div> : entrate.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${S.borderLight}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary }}>{s.nome || s.voce}</div>
                <div style={{ fontSize: 11, color: S.textMuted }}>{(s as any).categoria || ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: S.green, fontFamily: DS.fonts.mono }}>+€{s.importo}</span>
                <button onClick={() => fin.deleteSpesa(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forms */}
      {fin.showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) fin.closeForm() }}>
          <div style={{ background: S.surface, borderRadius: DS.radius.xl, padding: 24, width: '100%', maxWidth: 420, boxShadow: DS.shadow.xl }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: S.textPrimary }}>Nuova voce finanziaria</div>
            <FI label="Nome" value={f.nome || (f as any).voce || ''} onChange={v => fin.setForm({ nome: v })} placeholder="es. Vercel Pro" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Importo €" value={String(f.importo || '')} onChange={v => fin.setForm({ importo: Number(v) })} type="number" placeholder="0" />
              <FI label="Tipo" value={f.tipo || 'uscita'} onChange={v => fin.setForm({ tipo: v })} options={['uscita', 'entrata']} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FI label="Frequenza" value={(f as any).frequenza || 'mensile'} onChange={v => fin.setForm({ ...(f as any), frequenza: v } as any)} options={['mensile', 'annuale', 'una_tantum']} />
              <FI label="Categoria" value={(f as any).categoria || ''} onChange={v => fin.setForm({ ...(f as any), categoria: v } as any)} placeholder="Tech / Marketing..." />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8, paddingTop: 14, borderTop: `1px solid ${S.borderLight}` }}>
              <button onClick={fin.closeForm} style={{ padding: '8px 14px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
              <button onClick={fin.saveSpesa} style={{ padding: '8px 18px', background: S.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: DS.fonts.ui }}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {fin.showSnapshotForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) fin.closeSnapshotForm() }}>
          <div style={{ background: S.surface, borderRadius: DS.radius.xl, padding: 24, width: '100%', maxWidth: 360, boxShadow: DS.shadow.xl }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: S.textPrimary }}>Aggiorna saldo cassa</div>
            <FI label="Saldo cassa €" value={String(fin.snapshotForm.saldo_cassa || '')} onChange={v => fin.setSnapshotForm({ saldo_cassa: Number(v) })} type="number" placeholder="es. 15000" />
            <FI label="Data" value={fin.snapshotForm.data || ''} onChange={v => fin.setSnapshotForm({ data: v })} type="date" />
            <FI label="Note" value={fin.snapshotForm.note || ''} onChange={v => fin.setSnapshotForm({ note: v })} placeholder="es. dopo pagamento Vercel" />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8, paddingTop: 14, borderTop: `1px solid ${S.borderLight}` }}>
              <button onClick={fin.closeSnapshotForm} style={{ padding: '8px 14px', border: `1px solid ${S.border}`, borderRadius: DS.radius.sm, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
              <button onClick={fin.saveSnapshot} style={{ padding: '8px 18px', background: S.teal, color: '#fff', border: 'none', borderRadius: DS.radius.sm, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: DS.fonts.ui }}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
