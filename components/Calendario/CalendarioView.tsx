// components/Calendario/CalendarioView.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'
import { useDevice } from '@/hooks/useDevice'

const S = DS.colors

interface CalEvent {
  id: string
  titolo: string
  data: string       // YYYY-MM-DD
  ora?: string       // HH:MM
  tipo: 'task' | 'followup' | 'campagna' | 'milestone' | 'meeting' | 'scadenza'
  colore: string
  fonte: string      // nome progetto/campagna
  link?: string      // tab di destinazione
}

const TIPO_CONFIG = {
  task:      { bg: '#DBEAFE', text: '#2563EB', label: 'Task' },
  followup:  { bg: '#FEF3E2', text: '#B45309', label: 'Follow-up' },
  campagna:  { bg: '#EDE9FE', text: '#6D28D9', label: 'Campagna' },
  milestone: { bg: '#D1FAE5', text: '#0F7B5A', label: 'Milestone' },
  meeting:   { bg: '#FFE4E6', text: '#BE185D', label: 'Meeting' },
  scadenza:  { bg: '#FCEAEA', text: '#C93535', label: 'Scadenza' },
}

const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export const CalendarioView: FC = () => {
  const device = useDevice()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'mese' | 'settimana'>(device.isMobile ? 'settimana' : 'mese')
  const today = new Date()
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState<string | null>(today.toISOString().split('T')[0])

  const load = useCallback(async () => {
    setLoading(true)
    const [tRes, cRes, camRes, logRes] = await Promise.all([
      supabase.from('tasks').select('id, titolo, testo, scadenza, stato, chi, progetto').not('scadenza', 'is', null),
      supabase.from('clienti').select('id, nome, follow_up_date').not('follow_up_date', 'is', null),
      supabase.from('campagne').select('id, nome, data_inizio, data_fine, stato').or('data_inizio.not.is.null,data_fine.not.is.null'),
      supabase.from('project_logs').select('id, titolo, data_evento, tipo, progetto_id').not('data_evento', 'is', null),
    ])

    const evs: CalEvent[] = []

    // Task con scadenza
    ;(tRes.data || []).forEach((t: any) => {
      if (!t.scadenza || t.stato === 'completato' || t.stato === 'Fatto') return
      evs.push({
        id: `task-${t.id}`, titolo: t.titolo || t.testo || 'Task',
        data: t.scadenza, tipo: 'task', colore: '#2563EB',
        fonte: t.progetto || t.chi || '', link: 'task',
      })
    })

    // Follow-up CRM
    ;(cRes.data || []).forEach((c: any) => {
      if (!c.follow_up_date) return
      evs.push({
        id: `fu-${c.id}`, titolo: `Follow-up: ${c.nome}`,
        data: c.follow_up_date, tipo: 'followup', colore: '#B45309',
        fonte: 'CRM', link: 'clienti',
      })
    })

    // Campagne — data inizio e fine
    ;(camRes.data || []).forEach((c: any) => {
      if (c.data_inizio) evs.push({
        id: `cam-s-${c.id}`, titolo: `Avvio: ${c.nome}`,
        data: c.data_inizio, tipo: 'campagna', colore: '#6D28D9',
        fonte: 'Campagne', link: 'campagne',
      })
      if (c.data_fine) evs.push({
        id: `cam-e-${c.id}`, titolo: `Fine: ${c.nome}`,
        data: c.data_fine, tipo: 'scadenza', colore: '#C93535',
        fonte: 'Campagne', link: 'campagne',
      })
    })

    // Milestone e decisioni dai project_logs
    ;(logRes.data || []).forEach((l: any) => {
      if (!l.data_evento) return
      if (l.tipo === 'milestone' || l.tipo === 'meeting' || l.tipo === 'decisione') {
        evs.push({
          id: `log-${l.id}`, titolo: l.titolo,
          data: l.data_evento,
          tipo: l.tipo === 'milestone' ? 'milestone' : l.tipo === 'meeting' ? 'meeting' : 'task',
          colore: l.tipo === 'milestone' ? '#0F7B5A' : l.tipo === 'meeting' ? '#BE185D' : '#2563EB',
          fonte: 'Progetti', link: 'progetti',
        })
      }
    })

    setEvents(evs.sort((a, b) => a.data.localeCompare(b.data)))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const evsByDay = useCallback((date: string) => events.filter(e => e.data === date), [events])

  // ── Month view ──────────────────────────────────────────
  function renderMese() {
    const firstDay = new Date(current.year, current.month, 1)
    const lastDay = new Date(current.year, current.month + 1, 0)
    const startDow = (firstDay.getDay() + 6) % 7 // Monday=0
    const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7
    const todayStr = today.toISOString().split('T')[0]

    const cells: (number | null)[] = []
    for (let i = 0; i < totalCells; i++) {
      const d = i - startDow + 1
      cells.push(d >= 1 && d <= lastDay.getDate() ? d : null)
    }

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 1 }}>
          {GIORNI.map(g => (
            <div key={g} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: S.textMuted, padding: '6px 0', textTransform: 'uppercase', letterSpacing: 0.4 }}>{g}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} style={{ minHeight: 72 }} />
            const dateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const dayEvs = evsByDay(dateStr)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDay
            return (
              <div key={i} onClick={() => setSelectedDay(dateStr)}
                style={{ minHeight: 72, background: isSelected ? S.tealLight : isToday ? '#F0F7F6' : S.surface, border: `1px solid ${isSelected ? S.teal : isToday ? S.tealMid : S.border}`, borderRadius: 8, padding: '6px 6px', cursor: 'pointer', transition: 'border-color 0.1s' }}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? S.teal : S.textSecondary, marginBottom: 4 }}>{d}</div>
                {dayEvs.slice(0, 3).map(e => {
                  const cfg = TIPO_CONFIG[e.tipo]
                  return (
                    <div key={e.id} style={{ fontSize: 9, background: cfg.bg, color: cfg.text, borderRadius: 3, padding: '1px 4px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {e.titolo}
                    </div>
                  )
                })}
                {dayEvs.length > 3 && <div style={{ fontSize: 9, color: S.textMuted }}>+{dayEvs.length - 3}</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Week view (mobile-first) ─────────────────────────────
  function renderSettimana() {
    const todayStr = today.toISOString().split('T')[0]
    // Settimana corrente (lunedì)
    const monday = new Date(today)
    const dow = (today.getDay() + 6) % 7
    monday.setDate(today.getDate() - dow)

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })

    return (
      <div>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {days.map((d, i) => {
            const isToday = d === todayStr
            const dayNum = new Date(d).getDate()
            return (
              <div key={d} onClick={() => setSelectedDay(d)}
                style={{ textAlign: 'center', cursor: 'pointer', padding: '6px 2px', borderRadius: 8, background: selectedDay === d ? S.teal : isToday ? S.tealLight : 'transparent' }}>
                <div style={{ fontSize: 9, color: selectedDay === d ? '#fff' : S.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>{GIORNI[i]}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: selectedDay === d ? '#fff' : isToday ? S.teal : S.textPrimary, marginTop: 2 }}>{dayNum}</div>
                {evsByDay(d).length > 0 && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: selectedDay === d ? 'rgba(255,255,255,0.7)' : S.teal, margin: '3px auto 0' }} />
                )}
              </div>
            )
          })}
        </div>
        {/* Events for selected day */}
        {selectedDay && renderDayEvents(selectedDay)}
      </div>
    )
  }

  function renderDayEvents(dateStr: string) {
    const dayEvs = evsByDay(dateStr)
    const d = new Date(dateStr)
    const label = `${d.getDate()} ${MESI[d.getMonth()]}`
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary, marginBottom: 10, paddingTop: 8, borderTop: `1px solid ${S.border}` }}>
          {label} — {dayEvs.length} eventi
        </div>
        {dayEvs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: S.textMuted, background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10 }}>
            Nessun evento
          </div>
        ) : dayEvs.map(e => {
          const cfg = TIPO_CONFIG[e.tipo]
          return (
            <div key={e.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8, borderLeft: `3px solid ${e.colore}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, background: cfg.bg, color: cfg.text, padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>{cfg.label}</span>
                {e.fonte && <span style={{ fontSize: 10, color: S.textMuted }}>{e.fonte}</span>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: S.textPrimary }}>{e.titolo}</div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><span style={{ fontSize: 13, color: S.textMuted }}>Caricamento calendario...</span></div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: device.isMobile ? 16 : 18, fontWeight: 700, color: S.textPrimary, letterSpacing: '-0.3px' }}>
            {view === 'mese' ? `${MESI[current.month]} ${current.year}` : 'Questa settimana'}
          </div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{events.length} eventi totali</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {view === 'mese' && (
            <>
              <button onClick={() => setCurrent(c => { const d = new Date(c.year, c.month - 1); return { year: d.getFullYear(), month: d.getMonth() } })}
                style={{ width: 32, height: 32, border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <button onClick={() => setCurrent(c => { const d = new Date(c.year, c.month + 1); return { year: d.getFullYear(), month: d.getMonth() } })}
                style={{ width: 32, height: 32, border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </>
          )}
          {!device.isMobile && (
            <div style={{ display: 'flex', border: `1px solid ${S.border}`, borderRadius: 7, overflow: 'hidden' }}>
              {(['mese', 'settimana'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', border: 'none', background: view === v ? S.teal : 'none', color: view === v ? '#fff' : S.textSecondary, fontSize: 12, fontWeight: view === v ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(TIPO_CONFIG).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.text }} />
            <span style={{ fontSize: 10, color: S.textMuted }}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: device.isMobile ? 12 : 20 }}>
        {view === 'mese' ? renderMese() : renderSettimana()}
      </div>

      {/* Selected day detail (month view) */}
      {view === 'mese' && selectedDay && (
        <div style={{ marginTop: 16 }}>{renderDayEvents(selectedDay)}</div>
      )}
    </div>
  )
}
