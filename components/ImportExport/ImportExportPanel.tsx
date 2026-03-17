// components/ImportExport/ImportExportPanel.tsx
'use client'
import { FC, useState, useRef } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

interface Props {
  onClose: () => void
  onSuccess: () => void
}

type ImportType = 'clienti' | 'tasks' | 'fatture'
type ExportType = 'clienti' | 'tasks' | 'fatture' | 'prima_nota' | 'scadenzario'

// ── CSV parser ────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = vals[i] || '' })
    return obj
  })
}

// ── CSV builder ───────────────────────────────────────────
function toCSV(rows: any[], cols: { key: string; label: string }[]): string {
  const header = cols.map(c => `"${c.label}"`).join(',')
  const lines = rows.map(r => cols.map(c => `"${r[c.key] ?? ''}"`).join(','))
  return [header, ...lines].join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Import templates ──────────────────────────────────────
const TEMPLATES: Record<ImportType, { cols: string[]; example: string[][] }> = {
  clienti: {
    cols: ['nome','azienda','email','telefono','ruolo','pipeline_stage','deal_value','fonte','paese','note_pipeline'],
    example: [
      ['Mario Rossi','Rossi Serramenti srl','mario@rossi.it','+39 333 1234567','Titolare','lead','2976','linkedin','IT','Interessato al bundle serramentista'],
      ['Luigi Bianchi','Bianchi Infissi','luigi@bianchi.it','+39 340 9876543','Admin','contatto','1488','referral','IT',''],
    ]
  },
  tasks: {
    cols: ['titolo','dettaglio','chi','priorita','scadenza','stato','progetto'],
    example: [
      ['Fix RLS Supabase','Correggere 59 vulnerabilità','fabio','1','2026-04-01','aperto','MASTRO ERP'],
      ['Registrare social @mastrosuite','Instagram Facebook TikTok LinkedIn','lidia','2','2026-03-25','aperto',''],
    ]
  },
  fatture: {
    cols: ['numero','tipo','data_emissione','data_scadenza','controparte_nome','controparte_piva','imponibile','iva_aliquota','totale','stato'],
    example: [
      ['2026/001','attiva','2026-03-17','2026-04-17','Cliente SRL','IT12345678901','1000','22','1220','emessa'],
    ]
  }
}

const EXPORT_COLS: Record<ExportType, { key: string; label: string }[]> = {
  clienti: [
    {key:'nome',label:'Nome'},{key:'azienda',label:'Azienda'},{key:'email',label:'Email'},
    {key:'telefono',label:'Telefono'},{key:'pipeline_stage',label:'Stage'},{key:'deal_value',label:'Deal Value €'},
    {key:'fonte',label:'Fonte'},{key:'progetto_interesse',label:'Interesse'},{key:'paese',label:'Paese'},
    {key:'follow_up_date',label:'Follow-up'},{key:'created_at',label:'Creato il'},
  ],
  tasks: [
    {key:'titolo',label:'Titolo'},{key:'chi',label:'Assegnato a'},{key:'priorita',label:'Priorità'},
    {key:'scadenza',label:'Scadenza'},{key:'stato',label:'Stato'},{key:'progetto',label:'Progetto'},
    {key:'tempo_totale',label:'Tempo (min)'},{key:'created_at',label:'Creato il'},
  ],
  fatture: [
    {key:'numero',label:'Numero'},{key:'tipo',label:'Tipo'},{key:'data_emissione',label:'Data'},
    {key:'data_scadenza',label:'Scadenza'},{key:'controparte_nome',label:'Cliente/Fornitore'},
    {key:'controparte_piva',label:'P.IVA'},{key:'imponibile',label:'Imponibile €'},
    {key:'iva_aliquota',label:'IVA %'},{key:'iva_importo',label:'IVA €'},{key:'totale',label:'Totale €'},
    {key:'stato',label:'Stato'},{key:'sdi_stato',label:'Stato SDI'},
  ],
  prima_nota: [
    {key:'data',label:'Data'},{key:'descrizione',label:'Descrizione'},{key:'tipo',label:'D/A'},
    {key:'importo',label:'Importo €'},{key:'conto_nome',label:'Conto'},{key:'categoria',label:'Categoria'},
  ],
  scadenzario: [
    {key:'tipo',label:'Tipo'},{key:'descrizione',label:'Descrizione'},{key:'importo',label:'Importo €'},
    {key:'data_scadenza',label:'Scadenza'},{key:'stato',label:'Stato'},{key:'data_pagato',label:'Pagato il'},
  ],
}

// ── Main component ────────────────────────────────────────
export const ImportExportPanel: FC<Props> = ({ onClose, onSuccess }) => {
  const [tab, setTab] = useState<'import' | 'export'>('import')
  const [importType, setImportType] = useState<ImportType>('clienti')
  const [exportType, setExportType] = useState<ExportType>('clienti')
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ ok: number; err: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      setPreview(rows.slice(0, 5))
      setResult(null)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const doImport = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      const rows = parseCSV(ev.target?.result as string)
      let ok = 0, err = 0
      for (const row of rows) {
        try {
          if (importType === 'clienti') {
            await supabase.from('clienti').insert({
              nome: row.nome || row.Nome, azienda: row.azienda || row.Azienda,
              email: row.email || row.Email, telefono: row.telefono || row.Telefono,
              ruolo: row.ruolo || row.Ruolo,
              pipeline_stage: (row.pipeline_stage || row['Pipeline Stage'] || 'lead').toLowerCase(),
              deal_value: Number(row.deal_value || row['Deal Value €'] || 0),
              fonte: row.fonte || row.Fonte || null,
              paese: row.paese || row.Paese || 'IT',
              note_pipeline: row.note_pipeline || row.Note || null,
              tipo: 'Lead', stato: 'attivo',
            })
          } else if (importType === 'tasks') {
            await supabase.from('tasks').insert({
              titolo: row.titolo || row.Titolo,
              dettaglio: row.dettaglio || row.Dettaglio || null,
              chi: row.chi || row['Assegnato a'] || 'fabio',
              priorita: row.priorita || row['Priorità'] || '3',
              scadenza: row.scadenza || row.Scadenza || null,
              stato: row.stato || row.Stato || 'aperto',
              progetto: row.progetto || row.Progetto || null,
            })
          } else if (importType === 'fatture') {
            await supabase.from('fatture').insert({
              numero: row.numero || row.Numero,
              tipo: (row.tipo || row.Tipo || 'attiva').toLowerCase(),
              data_emissione: row.data_emissione || row.Data || new Date().toISOString().split('T')[0],
              data_scadenza: row.data_scadenza || row.Scadenza || null,
              controparte_nome: row.controparte_nome || row['Cliente/Fornitore'] || '',
              controparte_piva: row.controparte_piva || row['P.IVA'] || null,
              imponibile: Number(row.imponibile || row['Imponibile €'] || 0),
              iva_aliquota: Number(row.iva_aliquota || row['IVA %'] || 22),
              iva_importo: Number(row.iva_importo || row['IVA €'] || 0),
              totale: Number(row.totale || row['Totale €'] || 0),
              stato: (row.stato || row.Stato || 'bozza').toLowerCase(),
            })
          }
          ok++
        } catch { err++ }
      }
      setResult({ ok, err })
      setImporting(false)
      if (ok > 0) onSuccess()
    }
    reader.readAsText(file, 'UTF-8')
  }

  const doExport = async () => {
    const tableMap: Record<ExportType, string> = {
      clienti: 'clienti', tasks: 'tasks', fatture: 'fatture',
      prima_nota: 'prima_nota', scadenzario: 'scadenzario',
    }
    const { data } = await supabase.from(tableMap[exportType]).select('*').limit(5000)
    if (!data || data.length === 0) { alert('Nessun dato da esportare'); return }
    const csv = toCSV(data, EXPORT_COLS[exportType])
    downloadCSV(csv, `mastro_${exportType}_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const downloadTemplate = () => {
    const t = TEMPLATES[importType]
    const header = t.cols.map(c => `"${c}"`).join(',')
    const rows = t.example.map(r => r.map(v => `"${v}"`).join(','))
    downloadCSV([header, ...rows].join('\n'), `template_${importType}.csv`)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16, backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: S.surface, borderRadius: 14, padding: 28, width: '100%', maxWidth: 580, boxShadow: DS.shadow.xl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary }}>Import / Export</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 18 }}>✕</button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: S.background, borderRadius: 9, padding: 3, marginBottom: 20, width: 'fit-content' }}>
          {(['import', 'export'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 18px', border: 'none', borderRadius: 7, background: tab === t ? S.surface : 'none', color: tab === t ? S.textPrimary : S.textMuted, fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui, boxShadow: tab === t ? DS.shadow.xs : 'none' }}>
              {t === 'import' ? 'Importa' : 'Esporta'}
            </button>
          ))}
        </div>

        {tab === 'import' && (
          <div>
            {/* Type selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Cosa importare</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['clienti', 'tasks', 'fatture'] as ImportType[]).map(t => (
                  <button key={t} onClick={() => { setImportType(t); setPreview([]); setResult(null) }} style={{ padding: '7px 16px', border: `1px solid ${importType === t ? S.teal : S.border}`, borderRadius: 7, background: importType === t ? S.tealLight : 'none', color: importType === t ? S.teal : S.textSecondary, fontSize: 13, fontWeight: importType === t ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
                    {t === 'clienti' ? 'Clienti CRM' : t === 'tasks' ? 'Task' : 'Fatture'}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div style={{ background: S.background, borderRadius: 9, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: S.textSecondary, lineHeight: 1.6 }}>
              Il file CSV deve avere queste colonne: <strong>{TEMPLATES[importType].cols.join(', ')}</strong>
              <br />
              <button onClick={downloadTemplate} style={{ color: S.teal, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.fonts.ui, padding: 0, marginTop: 4, fontWeight: 600 }}>
                Scarica template CSV con esempi →
              </button>
            </div>

            {/* File input */}
            <div style={{ marginBottom: 16 }}>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile}
                style={{ display: 'block', width: '100%', padding: '10px', border: `2px dashed ${S.border}`, borderRadius: 9, fontSize: 13, fontFamily: DS.fonts.ui, cursor: 'pointer' }} />
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Anteprima ({preview.length} righe)</div>
                <div style={{ background: S.background, borderRadius: 8, padding: 10, fontSize: 11, fontFamily: DS.fonts.mono, overflowX: 'auto', maxHeight: 120, overflowY: 'auto' }}>
                  {preview.map((r, i) => <div key={i} style={{ marginBottom: 3, color: S.textSecondary }}>{Object.values(r).slice(0, 4).join(' | ')}</div>)}
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: result.err === 0 ? S.greenLight : S.amberLight, marginBottom: 16, fontSize: 13, color: result.err === 0 ? S.green : S.amber, fontWeight: 600 }}>
                {result.ok} importati con successo{result.err > 0 ? `, ${result.err} errori` : ' ✓'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Chiudi</button>
              <button onClick={doImport} disabled={importing || preview.length === 0}
                style={{ padding: '8px 20px', background: preview.length > 0 ? S.teal : S.borderLight, color: preview.length > 0 ? '#fff' : S.textMuted, border: 'none', borderRadius: 7, cursor: preview.length > 0 ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>
                {importing ? 'Importando...' : `Importa ${importType}`}
              </button>
            </div>
          </div>
        )}

        {tab === 'export' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Cosa esportare</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {([
                  { id: 'clienti', label: 'Clienti CRM' },
                  { id: 'tasks', label: 'Task' },
                  { id: 'fatture', label: 'Fatture' },
                  { id: 'prima_nota', label: 'Prima Nota' },
                  { id: 'scadenzario', label: 'Scadenzario' },
                ] as { id: ExportType; label: string }[]).map(t => (
                  <button key={t.id} onClick={() => setExportType(t.id)} style={{ padding: '10px 12px', border: `1px solid ${exportType === t.id ? S.teal : S.border}`, borderRadius: 8, background: exportType === t.id ? S.tealLight : S.surface, color: exportType === t.id ? S.teal : S.textSecondary, fontSize: 13, fontWeight: exportType === t.id ? 600 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui, textAlign: 'center' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: S.background, borderRadius: 9, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: S.textSecondary }}>
              Esporta tutti i <strong>{exportType}</strong> in CSV — compatibile con Excel, Google Sheets, software contabilità.
              <br />Colonne: <span style={{ fontFamily: DS.fonts.mono, fontSize: 11 }}>{EXPORT_COLS[exportType].map(c => c.label).join(', ')}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Chiudi</button>
              <button onClick={doExport} style={{ padding: '8px 20px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>
                Scarica CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
