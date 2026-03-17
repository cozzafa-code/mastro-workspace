// components/Contabilita/FatturaForm.tsx
'use client'
import { FC } from 'react'
import { DS } from '@/constants/design-system'
import type { RigaFattura } from '@/lib/types-contabilita'

const S = DS.colors

const FI: FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; options?: { value: string; label: string }[]; col?: number }> =
  ({ label, value, onChange, placeholder, type = 'text', options }) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, background: S.surface, boxSizing: 'border-box' }} />
      )}
    </div>
  )

export const FatturaForm: FC<{ c: any }> = ({ c }) => {
  const f = c.fatturaForm
  const righe: RigaFattura[] = c.righe
  const totali = c.calcolaTotali(righe)
  const isForfettario = f.emittente_regime === 'forfettario'

  const updateRiga = (idx: number, patch: Partial<RigaFattura>) => {
    const nuove = righe.map((r, i) => i === idx ? c.calcolaRiga({ ...r, ...patch }) : r)
    c.setRighe(nuove)
  }

  const addRiga = () => c.setRighe([...righe, { descrizione: '', quantita: 1, prezzo_unit: 0, iva_aliquota: isForfettario ? 0 : 22, imponibile: 0, iva_importo: 0, totale: 0 }])
  const removeRiga = (idx: number) => c.setRighe(righe.filter((_: any, i: number) => i !== idx))

  const generateXML = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12" xmlns="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>${f.paese_fiscale || 'IT'}</IdPaese>
        <IdCodice>${f.emittente_piva || ''}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${f.numero}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>0000000</CodiceDestinatario>
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${f.emittente_piva || ''}</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica><Denominazione>${f.emittente_nome || ''}</Denominazione></Anagrafica>
        <RegimeFiscale>${f.emittente_regime === 'forfettario' ? 'RF19' : 'RF01'}</RegimeFiscale>
      </DatiAnagrafici>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>${f.controparte_paese || 'IT'}</IdPaese>
          <IdCodice>${f.controparte_piva || ''}</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica><Denominazione>${f.controparte_nome || ''}</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>${f.valuta || 'EUR'}</Divisa>
        <Data>${f.data_emissione}</Data>
        <Numero>${f.numero}</Numero>
        <ImportoTotaleDocumento>${totali.totale.toFixed(2)}</ImportoTotaleDocumento>
        ${f.causale ? `<Causale>${f.causale}</Causale>` : ''}
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      ${righe.map((r, i) => `<DettaglioLinee>
        <NumeroLinea>${i + 1}</NumeroLinea>
        <Descrizione>${r.descrizione}</Descrizione>
        <Quantita>${r.quantita.toFixed(2)}</Quantita>
        <PrezzoUnitario>${r.prezzo_unit.toFixed(2)}</PrezzoUnitario>
        <PrezzoTotale>${r.imponibile.toFixed(2)}</PrezzoTotale>
        <AliquotaIVA>${r.iva_aliquota.toFixed(2)}</AliquotaIVA>
        ${r.iva_aliquota === 0 ? '<Natura>N2.2</Natura>' : ''}
      </DettaglioLinee>`).join('\n      ')}
      <DatiRiepilogo>
        <AliquotaIVA>${isForfettario ? '0.00' : righe[0]?.iva_aliquota?.toFixed(2) || '22.00'}</AliquotaIVA>
        <ImponibileImporto>${totali.imponibile.toFixed(2)}</ImponibileImporto>
        <Imposta>${totali.iva_importo.toFixed(2)}</Imposta>
        ${isForfettario ? '<Natura>N2.2</Natura><RiferimentoNormativo>Operazione effettuata ai sensi dell&apos;art. 1, commi 54-89, l. 190/2014</RiferimentoNormativo>' : ''}
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</FatturaElettronica>`

    const blob = new Blob([xml], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fattura_${f.numero?.replace(/\//g, '_')}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: '20px 16px', overflowY: 'auto', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) c.closeFatturaForm() }}>
      <div style={{ background: S.surface, borderRadius: 14, padding: 28, width: '100%', maxWidth: 760, boxShadow: DS.shadow.xl, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary }}>
            {f.id ? `Modifica fattura ${f.numero}` : 'Nuova fattura'}
          </div>
          <button onClick={c.closeFatturaForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 18 }}>✕</button>
        </div>

        {/* Tipo e regime */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          <FI label="Tipo" value={f.tipo || 'attiva'} onChange={v => c.setFatturaForm({ tipo: v })}
            options={[{ value: 'attiva', label: 'Fattura attiva (emessa)' }, { value: 'passiva', label: 'Fattura passiva (ricevuta)' }]} />
          <FI label="Numero" value={f.numero || ''} onChange={v => c.setFatturaForm({ numero: v })} placeholder="es. 2026/001" />
          <FI label="Data emissione" value={f.data_emissione || ''} onChange={v => c.setFatturaForm({ data_emissione: v })} type="date" />
          <FI label="Data scadenza" value={f.data_scadenza || ''} onChange={v => c.setFatturaForm({ data_scadenza: v })} type="date" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Emittente */}
          <div style={{ background: S.background, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Emittente</div>
            <FI label="Nome/Ragione sociale" value={f.emittente_nome || ''} onChange={v => c.setFatturaForm({ emittente_nome: v })} placeholder="La tua azienda" />
            <FI label="P.IVA" value={f.emittente_piva || ''} onChange={v => c.setFatturaForm({ emittente_piva: v })} placeholder="IT12345678901" />
            <FI label="Regime fiscale" value={f.emittente_regime || 'ordinario'} onChange={v => c.setFatturaForm({ emittente_regime: v as any })}
              options={[{ value: 'ordinario', label: 'Regime ordinario (IVA 22%)' }, { value: 'forfettario', label: 'Regime forfettario (no IVA)' }, { value: 'danese', label: 'ApS danese (MVA 25%)' }]} />
            <FI label="Paese fiscale" value={f.paese_fiscale || 'IT'} onChange={v => c.setFatturaForm({ paese_fiscale: v })}
              options={[{value:'IT',label:'Italia'},{value:'DK',label:'Danimarca'}]} />
          </div>

          {/* Controparte */}
          <div style={{ background: S.background, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              {f.tipo === 'attiva' ? 'Cliente' : 'Fornitore'}
            </div>
            <FI label="Nome/Ragione sociale *" value={f.controparte_nome || ''} onChange={v => c.setFatturaForm({ controparte_nome: v })} placeholder="Nome cliente" />
            <FI label="P.IVA" value={f.controparte_piva || ''} onChange={v => c.setFatturaForm({ controparte_piva: v })} placeholder="IT..." />
            <FI label="Codice fiscale" value={f.controparte_cf || ''} onChange={v => c.setFatturaForm({ controparte_cf: v })} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
              <FI label="Città" value={f.controparte_citta || ''} onChange={v => c.setFatturaForm({ controparte_citta: v })} />
              <FI label="Paese" value={f.controparte_paese || 'IT'} onChange={v => c.setFatturaForm({ controparte_paese: v })}
                options={[{value:'IT',label:'IT'},{value:'DK',label:'DK'},{value:'DE',label:'DE'},{value:'FR',label:'FR'}]} />
            </div>
          </div>
        </div>

        {/* Righe */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Voci / Servizi</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: S.background }}>
                {['Descrizione', 'Q.tà', 'Prezzo unit.', `IVA%`, 'Imponibile', 'IVA', 'Totale', ''].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `1px solid ${S.border}`, fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {righe.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: '4px 6px' }}><input value={r.descrizione} onChange={e => updateRiga(i, { descrizione: e.target.value })} placeholder="Descrizione servizio" style={{ width: '100%', padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.ui }} /></td>
                  <td style={{ padding: '4px 4px', width: 60 }}><input type="number" value={r.quantita} onChange={e => updateRiga(i, { quantita: Number(e.target.value) })} style={{ width: '100%', padding: '6px 6px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.mono, textAlign: 'right' }} /></td>
                  <td style={{ padding: '4px 4px', width: 90 }}><input type="number" value={r.prezzo_unit} onChange={e => updateRiga(i, { prezzo_unit: Number(e.target.value) })} style={{ width: '100%', padding: '6px 6px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.mono, textAlign: 'right' }} /></td>
                  <td style={{ padding: '4px 4px', width: 60 }}><input type="number" value={r.iva_aliquota} onChange={e => updateRiga(i, { iva_aliquota: Number(e.target.value) })} style={{ width: '100%', padding: '6px 6px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.mono, textAlign: 'right' }} /></td>
                  <td style={{ padding: '4px 8px', fontSize: 12, fontFamily: DS.fonts.mono, textAlign: 'right', color: S.textSecondary }}>€{r.imponibile.toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', fontSize: 12, fontFamily: DS.fonts.mono, textAlign: 'right', color: S.textSecondary }}>€{r.iva_importo.toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', fontSize: 12, fontFamily: DS.fonts.mono, textAlign: 'right', fontWeight: 600 }}>€{r.totale.toFixed(2)}</td>
                  <td style={{ padding: '4px 4px' }}><button onClick={() => removeRiga(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 14 }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRiga} style={{ marginTop: 8, padding: '6px 14px', border: `1px dashed ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: S.textSecondary, fontFamily: DS.fonts.ui }}>+ Aggiungi riga</button>
        </div>

        {/* Totali */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ background: S.background, borderRadius: 10, padding: '14px 20px', minWidth: 260 }}>
            {[
              { label: 'Imponibile', value: `€${totali.imponibile.toFixed(2)}` },
              { label: isForfettario ? 'IVA (esente)' : `IVA ${righe[0]?.iva_aliquota || 22}%`, value: `€${totali.iva_importo.toFixed(2)}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: S.textSecondary }}>
                <span>{r.label}</span><span style={{ fontFamily: DS.fonts.mono }}>{r.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: `1px solid ${S.border}`, marginTop: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary }}>TOTALE</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: S.teal, fontFamily: DS.fonts.mono }}>€{totali.totale.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Causale */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 }}>Causale</label>
          <input value={f.causale || ''} onChange={e => c.setFatturaForm({ causale: e.target.value })} placeholder="Descrizione dei servizi prestati" style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${S.borderLight}` }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={generateXML} style={{ padding: '8px 14px', border: `1px solid ${S.purple}`, borderRadius: 7, background: S.purpleLight, color: S.purple, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui }}>
              XML SDI
            </button>
            <button onClick={async () => {
              if (!f.numero || !f.controparte_nome) return
              const resp = await fetch('/api/fattura-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, righe, ...c.calcolaTotali(righe) }) })
              const html = await resp.text()
              const win = window.open('', '_blank')
              if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500) }
            }} style={{ padding: '8px 14px', border: `1px solid ${S.blue}`, borderRadius: 7, background: S.blueLight, color: S.blue, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: DS.fonts.ui }}>
              Stampa PDF
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(!f.numero || !f.controparte_nome) && (
              <span style={{ fontSize: 11, color: S.red }}>* Numero e Cliente obbligatori</span>
            )}
            <button onClick={c.closeFatturaForm} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
            <button onClick={() => { c.setFatturaForm({ stato: 'bozza' }); c.saveFattura() }}
              disabled={!f.numero || !f.controparte_nome}
              style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: S.background, color: S.textSecondary, cursor: f.numero && f.controparte_nome ? 'pointer' : 'not-allowed', fontSize: 13, fontFamily: DS.fonts.ui, opacity: f.numero && f.controparte_nome ? 1 : 0.5 }}>
              Bozza
            </button>
            <button onClick={() => { c.setFatturaForm({ stato: 'emessa' }); c.saveFattura() }}
              disabled={!f.numero || !f.controparte_nome}
              style={{ padding: '8px 20px', background: f.numero && f.controparte_nome ? S.teal : S.borderLight, color: f.numero && f.controparte_nome ? '#fff' : S.textMuted, border: 'none', borderRadius: 7, cursor: f.numero && f.controparte_nome ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>
              Emetti
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
