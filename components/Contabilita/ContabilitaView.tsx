// components/Contabilita/ContabilitaView.tsx
'use client'
import { FC, useState } from 'react'
import { DS } from '@/constants/design-system'
import { useContabilita } from '@/hooks/useContabilita'
import { useDevice } from '@/hooks/useDevice'
import { FatturaForm } from './FatturaForm'
import type { Fattura, ScadenzarioItem } from '@/lib/types-contabilita'

const S = DS.colors

const STATO_CFG: Record<string, { bg: string; text: string; label: string }> = {
  bozza:       { bg: S.borderLight,   text: S.textMuted,    label: 'Bozza' },
  emessa:      { bg: S.blueLight,     text: S.blue,         label: 'Emessa' },
  inviata_sdi: { bg: S.purpleLight,   text: S.purple,       label: 'SDI' },
  accettata:   { bg: S.tealLight,     text: S.teal,         label: 'Accettata' },
  pagata:      { bg: S.greenLight,    text: S.green,        label: 'Pagata' },
  scaduta:     { bg: S.redLight,      text: S.red,          label: 'Scaduta' },
  annullata:   { bg: S.borderLight,   text: S.textMuted,    label: 'Annullata' },
}

const KPI: FC<{ value: string; label: string; sub?: string; color?: string; alert?: boolean }> = ({ value, label, sub, color, alert }) => (
  <div style={{ background: alert ? S.redLight : S.surface, border: `1px solid ${alert ? S.red + '40' : S.border}`, borderRadius: DS.radius.md, padding: '14px 18px', minWidth: 130 }}>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || S.textPrimary, fontFamily: DS.fonts.mono, letterSpacing: '-0.5px' }}>{value}</div>
    <div style={{ fontSize: 11, fontWeight: 600, color: S.textPrimary, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: S.textMuted, marginTop: 1 }}>{sub}</div>}
  </div>
)

const StatoBadge: FC<{ stato: string }> = ({ stato }) => {
  const cfg = STATO_CFG[stato] || STATO_CFG.bozza
  return <span style={{ background: cfg.bg, color: cfg.text, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{cfg.label}</span>
}

// ── Dashboard tab ─────────────────────────────────────────
function DashboardTab({ c }: { c: ReturnType<typeof useContabilita> }) {
  const mese = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const ricaviMese = c.fatture.filter(f => f.tipo === 'attiva' && f.stato !== 'annullata' && (f.data_emissione || '').startsWith(new Date().toISOString().substring(0, 7))).reduce((a, f) => a + (f.imponibile || 0), 0)
  const costiMese = c.fatture.filter(f => f.tipo === 'passiva' && f.stato !== 'annullata' && (f.data_emissione || '').startsWith(new Date().toISOString().substring(0, 7))).reduce((a, f) => a + (f.imponibile || 0), 0)
  const utile = ricaviMese - costiMese

  return (
    <div>
      <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 16 }}>Riepilogo contabile — {mese}</div>

      {/* KPI principali */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPI value={`€${ricaviMese.toLocaleString('it-IT')}`} label="Ricavi mese" sub="imponibile" color={S.green} />
        <KPI value={`€${costiMese.toLocaleString('it-IT')}`} label="Costi mese" sub="imponibile" color={S.red} />
        <KPI value={`€${utile.toLocaleString('it-IT')}`} label="Utile/Perdita" sub="ricavi - costi" color={utile >= 0 ? S.green : S.red} />
        <KPI value={`€${c.daIncassare.toLocaleString('it-IT')}`} label="Da incassare" sub="fatture attive aperte" color={S.blue} />
        <KPI value={`€${c.daPagare.toLocaleString('it-IT')}`} label="Da pagare" sub="fatture passive aperte" color={S.amber} />
        <KPI value={`€${c.ivaDaVersare.toLocaleString('it-IT')}`} label="IVA da versare" sub={`debito ${c.ivaDebito.toFixed(0)} - credito ${c.ivaCredito.toFixed(0)}`} color={c.ivaDaVersare > 0 ? S.purple : S.green} />
      </div>

      {/* Scadenze urgenti */}
      {c.scaduteNonPagate.length > 0 && (
        <div style={{ background: S.redLight, border: `1px solid ${S.red}30`, borderRadius: DS.radius.lg, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.red, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {c.scaduteNonPagate.length} scadenze scadute non pagate
          </div>
          {c.scaduteNonPagate.slice(0, 3).map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${S.red}20` }}>
              <span style={{ fontSize: 12, color: S.textPrimary }}>{s.descrizione}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: S.red }}>€{Number(s.importo).toLocaleString('it-IT')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ultime fatture */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {(['attiva', 'passiva'] as const).map(tipo => {
          const lista = c.fatture.filter(f => f.tipo === tipo).slice(0, 5)
          return (
            <div key={tipo} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Ultime fatture {tipo === 'attiva' ? 'emesse' : 'ricevute'}
              </div>
              {lista.length === 0 ? <div style={{ fontSize: 12, color: S.textMuted, textAlign: 'center', padding: '12px 0' }}>Nessuna</div> : lista.map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${S.borderLight}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: S.textPrimary }}>{f.numero} — {f.controparte_nome}</div>
                    <div style={{ fontSize: 10, color: S.textMuted }}>{f.data_emissione}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <StatoBadge stato={f.stato} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: tipo === 'attiva' ? S.green : S.red }}>€{Number(f.totale).toLocaleString('it-IT')}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Fatture tab ───────────────────────────────────────────
function FattureTab({ c }: { c: ReturnType<typeof useContabilita> }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['tutti', 'attiva', 'passiva'] as const).map(t => (
          <button key={t} onClick={() => c.setFiltroTipo(t)} style={{ padding: '5px 12px', border: `1px solid ${c.filtroTipo === t ? S.teal : S.border}`, borderRadius: 20, background: c.filtroTipo === t ? S.teal : 'none', color: c.filtroTipo === t ? '#fff' : S.textSecondary, fontSize: 12, fontWeight: c.filtroTipo === t ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
            {t === 'tutti' ? 'Tutte' : t === 'attiva' ? 'Emesse' : 'Ricevute'}
          </button>
        ))}
        <select value={c.filtroStato} onChange={e => c.setFiltroStato(e.target.value)} style={{ padding: '5px 10px', border: `1px solid ${S.border}`, borderRadius: 20, fontSize: 12, fontFamily: DS.fonts.ui, background: S.surface }}>
          {['tutti','bozza','emessa','inviata_sdi','accettata','pagata','scaduta'].map(s => <option key={s} value={s}>{s === 'tutti' ? 'Tutti gli stati' : STATO_CFG[s]?.label || s}</option>)}
        </select>
      </div>

      {c.filteredFatture.length === 0
        ? <div style={{ textAlign: 'center', padding: '40px 0', color: S.textMuted, fontSize: 13, background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg }}>Nessuna fattura</div>
        : <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: S.background }}>
                  {['N°', 'Data', 'Controparte', 'Regime', 'Imponibile', 'IVA', 'Totale', 'Stato', 'SDI', ''].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', borderBottom: `1px solid ${S.border}`, fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.filteredFatture.map(f => (
                  <tr key={f.id} style={{ borderBottom: `1px solid ${S.borderLight}`, cursor: 'pointer' }}
                    onClick={() => c.selectFattura(f)}
                    onMouseEnter={e => e.currentTarget.style.background = S.background}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: S.textPrimary, whiteSpace: 'nowrap' }}>{f.numero}</td>
                    <td style={{ padding: '9px 12px', color: S.textSecondary, whiteSpace: 'nowrap' }}>{f.data_emissione}</td>
                    <td style={{ padding: '9px 12px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.controparte_nome}</td>
                    <td style={{ padding: '9px 12px', fontSize: 11, color: S.textMuted }}>{f.emittente_regime || 'ord.'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: DS.fonts.mono, fontWeight: 500 }}>€{Number(f.imponibile).toLocaleString('it-IT')}</td>
                    <td style={{ padding: '9px 12px', fontFamily: DS.fonts.mono, color: S.textSecondary }}>€{Number(f.iva_importo).toLocaleString('it-IT')}</td>
                    <td style={{ padding: '9px 12px', fontFamily: DS.fonts.mono, fontWeight: 700, color: f.tipo === 'attiva' ? S.green : S.red }}>€{Number(f.totale).toLocaleString('it-IT')}</td>
                    <td style={{ padding: '9px 12px' }}><StatoBadge stato={f.stato} /></td>
                    <td style={{ padding: '9px 12px' }}>
                      {f.sdi_stato && f.sdi_stato !== 'non_inviata' && (
                        <span style={{ fontSize: 10, background: S.purpleLight, color: S.purple, padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>{f.sdi_stato}</span>
                      )}
                    </td>
                    <td style={{ padding: '9px 12px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => c.openFatturaForm(f)} style={{ padding: '3px 8px', border: `1px solid ${S.border}`, borderRadius: 5, background: 'none', cursor: 'pointer', fontSize: 11, color: S.textSecondary }}>Edit</button>
                        {f.stato === 'emessa' && <button onClick={() => c.cambiaStato(f.id, 'pagata')} style={{ padding: '3px 8px', border: 'none', borderRadius: 5, background: S.greenLight, cursor: 'pointer', fontSize: 11, color: S.green, fontWeight: 600 }}>Paga</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  )
}

// ── Scadenzario tab ───────────────────────────────────────
function ScadenzarioTab({ c }: { c: ReturnType<typeof useContabilita> }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({})
  const oggi = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary }}>Scadenzario · {c.scadenzario.filter(s => s.stato === 'aperto').length} aperti</div>
        <button onClick={() => setShowForm(true)} style={{ padding: '6px 14px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>+ Scadenza</button>
      </div>

      {showForm && (
        <div style={{ background: S.background, border: `1px solid ${S.teal}40`, borderRadius: DS.radius.lg, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[{k:'descrizione',l:'Descrizione',ph:'es. IVA trimestrale'},{k:'importo',l:'Importo €',t:'number'},{k:'data_scadenza',l:'Scadenza',t:'date'}].map(f => (
              <div key={f.k}>
                <label style={{ display:'block', fontSize:10, fontWeight:700, color:S.textMuted, textTransform:'uppercase', marginBottom:3 }}>{f.l}</label>
                <input type={f.t||'text'} value={form[f.k]||''} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                  style={{width:'100%',padding:'7px 9px',border:`1px solid ${S.border}`,borderRadius:7,fontSize:13,fontFamily:DS.fonts.ui,boxSizing:'border-box' as any}}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <select value={form.tipo||'pagamento'} onChange={e=>setForm((p:any)=>({...p,tipo:e.target.value}))} style={{padding:'7px 9px',border:`1px solid ${S.border}`,borderRadius:7,fontSize:13,fontFamily:DS.fonts.ui}}>
              {['incasso','pagamento','tassa','contributo'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={async()=>{if(!form.descrizione||!form.importo||!form.data_scadenza) return; await c.addScadenza({...form,importo:Number(form.importo),stato:'aperto'}); setShowForm(false);setForm({})}} style={{padding:'7px 14px',background:S.teal,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:DS.fonts.ui}}>Salva</button>
            <button onClick={()=>{setShowForm(false);setForm({})}} style={{padding:'7px 12px',border:`1px solid ${S.border}`,borderRadius:7,background:'none',cursor:'pointer',fontSize:12,fontFamily:DS.fonts.ui}}>Annulla</button>
          </div>
        </div>
      )}

      {c.scadenzario.map(s => {
        const isScaduto = s.stato === 'aperto' && s.data_scadenza < oggi
        const isPagato = s.stato === 'pagato'
        const TIPO_COLOR: Record<string, string> = { incasso: S.green, pagamento: S.red, tassa: S.purple, contributo: S.amber }
        return (
          <div key={s.id} style={{ background: S.surface, border: `1px solid ${isScaduto ? S.red + '40' : S.border}`, borderRadius: DS.radius.md, padding: '12px 16px', marginBottom: 8, opacity: isPagato ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, background: TIPO_COLOR[s.tipo] + '20', color: TIPO_COLOR[s.tipo], padding: '1px 7px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>{s.tipo}</span>
                  {isScaduto && <span style={{ fontSize: 10, background: S.redLight, color: S.red, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>SCADUTO</span>}
                  {isPagato && <span style={{ fontSize: 10, background: S.greenLight, color: S.green, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>PAGATO</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary }}>{s.descrizione}</div>
                <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>Scadenza: {new Date(s.data_scadenza).toLocaleDateString('it-IT')}{s.data_pagato ? ` · Pagato: ${new Date(s.data_pagato).toLocaleDateString('it-IT')}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: TIPO_COLOR[s.tipo], fontFamily: DS.fonts.mono }}>€{Number(s.importo).toLocaleString('it-IT')}</span>
                {!isPagato && <button onClick={() => c.pagaScadenza(s.id)} style={{ padding: '5px 10px', background: S.greenLight, color: S.green, border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>Paga</button>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Prima Nota tab ────────────────────────────────────────
function PrimaNotaTab({ c }: { c: ReturnType<typeof useContabilita> }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 16 }}>Movimenti contabili generati automaticamente dalle fatture</div>
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: DS.radius.lg, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: S.background }}>
              {['Data','Descrizione','Conto','D/A','Importo'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', borderBottom: `1px solid ${S.border}`, fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.primaNota.slice(0, 50).map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${S.borderLight}` }}>
                <td style={{ padding: '8px 14px', color: S.textSecondary, whiteSpace: 'nowrap' }}>{p.data}</td>
                <td style={{ padding: '8px 14px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descrizione}</td>
                <td style={{ padding: '8px 14px', fontSize: 12, color: S.textMuted }}>{p.conto_nome}</td>
                <td style={{ padding: '8px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.tipo === 'dare' ? S.red : S.green, background: p.tipo === 'dare' ? S.redLight : S.greenLight, padding: '1px 6px', borderRadius: 4 }}>{p.tipo.toUpperCase()}</span>
                </td>
                <td style={{ padding: '8px 14px', fontWeight: 700, fontFamily: DS.fonts.mono, color: p.tipo === 'dare' ? S.red : S.green }}>
                  {p.tipo === 'dare' ? '-' : '+'}€{Number(p.importo).toLocaleString('it-IT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {c.primaNota.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: S.textMuted }}>Nessun movimento. Emetti fatture per generare la prima nota automaticamente.</div>}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export const ContabilitaView: FC = () => {
  const c = useContabilita()
  const device = useDevice()
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'fatture',   label: `Fatture (${c.fatture.length})` },
    { id: 'scadenzario', label: `Scadenzario (${c.scadenzario.filter(s => s.stato === 'aperto').length})` },
    { id: 'prima_nota', label: 'Prima Nota' },
  ]

  if (c.loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento contabilità...</span></div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Contabilità</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>Fatture · SDI · Prima nota · Scadenzario</div>
        </div>
        <button onClick={() => c.openFatturaForm()} style={{ padding: '8px 16px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          + Fattura
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: S.background, borderRadius: 9, padding: 3, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => c.setView(t.id as any)} style={{ padding: '6px 14px', border: 'none', borderRadius: 7, background: c.view === t.id ? S.surface : 'none', color: c.view === t.id ? S.textPrimary : S.textMuted, fontSize: 12, fontWeight: c.view === t.id ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui, boxShadow: c.view === t.id ? DS.shadow.xs : 'none', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {c.view === 'dashboard'   && <DashboardTab c={c} />}
      {c.view === 'fatture'     && <FattureTab c={c} />}
      {c.view === 'scadenzario' && <ScadenzarioTab c={c} />}
      {c.view === 'prima_nota'  && <PrimaNotaTab c={c} />}

      {/* Fattura form */}
      {c.showFatturaForm && <FatturaForm c={c} />}
    </div>
  )
}
