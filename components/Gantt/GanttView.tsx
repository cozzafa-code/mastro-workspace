// components/Gantt/GanttView.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'
import { useDevice } from '@/hooks/useDevice'
import type { Progetto } from '@/lib/types'

const S = DS.colors

interface GanttRow {
  id: string
  nome: string
  colore: string
  inizio: Date
  fine: Date
  stato: string
  tipo: 'progetto' | 'task' | 'campagna'
  mrr?: number
}

const MESI_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']

function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r }
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000) }

export const GanttView: FC = () => {
  const device = useDevice()
  const [rows, setRows] = useState<GanttRow[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMonths, setViewMonths] = useState(6)
  const today = new Date()
  const [viewStart, setViewStart] = useState(() => { const d = new Date(today); d.setDate(1); d.setMonth(d.getMonth() - 1); return d })

  const load = useCallback(async () => {
    setLoading(true)
    const [pRes, cRes, camRes] = await Promise.all([
      supabase.from('progetti').select('id,nome,colore,stato,mrr,data_inizio,data_lancio,created_at'),
      supabase.from('tasks').select('id,titolo,testo,scadenza,stato,progetto').not('scadenza','is',null),
      supabase.from('campagne').select('id,nome,stato,data_inizio,data_fine').or('data_inizio.not.is.null,data_fine.not.is.null'),
    ])

    const r: GanttRow[] = []

    ;(pRes.data||[]).forEach((p: any) => {
      const inizio = p.data_inizio ? new Date(p.data_inizio) : new Date(p.created_at || today)
      const fine = p.data_lancio ? new Date(p.data_lancio) : addMonths(inizio, 3)
      if (isNaN(inizio.getTime()) || isNaN(fine.getTime())) return
      r.push({ id: p.id, nome: p.nome, colore: p.colore || S.teal, inizio, fine, stato: p.stato, tipo: 'progetto', mrr: p.mrr })
    })

    ;(camRes.data||[]).forEach((c: any) => {
      if (!c.data_inizio) return
      const inizio = new Date(c.data_inizio)
      const fine = c.data_fine ? new Date(c.data_fine) : addMonths(inizio, 1)
      if (isNaN(inizio.getTime())) return
      r.push({ id: `cam-${c.id}`, nome: c.nome, colore: '#6D28D9', inizio, fine, stato: c.stato || 'pianificata', tipo: 'campagna' })
    })

    setRows(r.sort((a, b) => a.inizio.getTime() - b.inizio.getTime()))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const viewEnd = addMonths(viewStart, viewMonths)
  const totalDays = daysBetween(viewStart, viewEnd)

  function barStyle(row: GanttRow) {
    const startOffset = Math.max(0, daysBetween(viewStart, row.inizio))
    const endOffset = Math.min(totalDays, daysBetween(viewStart, row.fine))
    const width = Math.max(2, endOffset - startOffset)
    const left = (startOffset / totalDays) * 100
    const w = (width / totalDays) * 100
    const isActive = row.stato === 'attivo' || row.stato === 'attiva'
    return { left: `${left}%`, width: `${Math.max(w, 0.5)}%`, background: row.colore, opacity: isActive ? 1 : 0.55 }
  }

  // Header months
  function renderMonthHeaders() {
    const headers = []
    let cur = new Date(viewStart)
    while (cur < viewEnd) {
      const monthStart = new Date(cur)
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
      const clampedEnd = monthEnd < viewEnd ? monthEnd : viewEnd
      const pct = (daysBetween(monthStart, clampedEnd) / totalDays) * 100
      headers.push(
        <div key={`${cur.getFullYear()}-${cur.getMonth()}`} style={{ width: `${pct}%`, borderRight: `1px solid ${S.border}`, padding: '4px 8px', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 }}>
          {MESI_SHORT[cur.getMonth()]} {cur.getFullYear()}
        </div>
      )
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
    return headers
  }

  // Today line position
  const todayPct = (daysBetween(viewStart, today) / totalDays) * 100

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento Gantt...</span></div>

  if (device.isMobile) return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: S.textMuted, fontSize: 13 }}>
      Il Gantt è ottimizzato per desktop.<br />
      <span style={{ fontSize: 12 }}>Ruota il dispositivo o usa da computer.</span>
    </div>
  )

  const ROW_H = 38
  const LABEL_W = 180

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>Gantt Timeline</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{rows.filter(r => r.tipo === 'progetto').length} progetti · {rows.filter(r => r.tipo === 'campagna').length} campagne</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setViewStart(d => addMonths(d, -1))} style={{ width: 32, height: 32, border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 16 }}>‹</button>
          <button onClick={() => setViewStart(d => { const n = new Date(today); n.setDate(1); n.setMonth(n.getMonth() - 1); return n })} style={{ padding: '6px 10px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 11, color: S.textSecondary, fontFamily: DS.fonts.ui }}>Oggi</button>
          <button onClick={() => setViewStart(d => addMonths(d, 1))} style={{ width: 32, height: 32, border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 16 }}>›</button>
          <select value={viewMonths} onChange={e => setViewMonths(Number(e.target.value))} style={{ padding: '6px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 12, fontFamily: DS.fonts.ui, background: S.surface }}>
            {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} mesi</option>)}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, fontSize: 13, color: S.textMuted }}>
          Nessun elemento con date impostate.<br />
          <span style={{ fontSize: 12 }}>Aggiungi date inizio/lancio ai progetti o date alle campagne.</span>
        </div>
      ) : (
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${S.border}` }}>
            <div style={{ width: LABEL_W, flexShrink: 0, padding: '8px 14px', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', borderRight: `1px solid ${S.border}` }}>Nome</div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>{renderMonthHeaders()}</div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div key={row.id} style={{ display: 'flex', borderBottom: i < rows.length - 1 ? `1px solid ${S.borderLight}` : 'none', height: ROW_H }}>
              {/* Label */}
              <div style={{ width: LABEL_W, flexShrink: 0, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, borderRight: `1px solid ${S.borderLight}` }}>
                {row.colore && <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.colore, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: S.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.nome}</div>
                  <div style={{ fontSize: 9, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 }}>{row.tipo}</div>
                </div>
              </div>

              {/* Bar area */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {/* Grid lines */}
                {Array.from({ length: viewMonths }, (_, mi) => {
                  const x = (mi / viewMonths) * 100
                  return <div key={mi} style={{ position: 'absolute', left: `${x}%`, top: 0, bottom: 0, borderLeft: `1px solid ${S.borderLight}` }} />
                })}

                {/* Today line */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, borderLeft: `2px solid ${S.red}`, zIndex: 2, opacity: 0.6 }} />
                )}

                {/* Bar */}
                {daysBetween(viewStart, row.fine) > 0 && daysBetween(viewStart, row.inizio) < totalDays && (
                  <div style={{
                    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                    height: 20, borderRadius: 4, ...barStyle(row),
                    display: 'flex', alignItems: 'center', paddingLeft: 6, overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}>
                    {row.mrr ? <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>€{row.mrr}/mo</span> : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 20, height: 3, background: S.red, borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: S.textMuted }}>Oggi</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 10, background: S.teal, borderRadius: 3, opacity: 0.55 }} />
          <span style={{ fontSize: 11, color: S.textMuted }}>In pausa / pianificato</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 10, background: S.teal, borderRadius: 3 }} />
          <span style={{ fontSize: 11, color: S.textMuted }}>Attivo</span>
        </div>
      </div>
    </div>
  )
}
