// components/ProjectDetail/OKRTab.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

interface KeyResult {
  id: string
  titolo: string
  target: number
  attuale: number
  unita: string  // %, clienti, €, ...
  completato: boolean
}

interface Obiettivo {
  id: string
  titolo: string
  descrizione?: string
  trimestre: string  // Q1-2026, Q2-2026...
  progresso: number  // 0-100
  key_results: KeyResult[]
}

const TRIMESTRI = ['Q1-2026','Q2-2026','Q3-2026','Q4-2026','Q1-2027']

const ProgressBar: FC<{ pct: number; color?: string }> = ({ pct, color }) => {
  const c = color || (pct >= 70 ? S.green : pct >= 40 ? S.amber : S.red)
  return (
    <div style={{ height: 6, background: S.borderLight, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: c, borderRadius: 3, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export const OKRTab: FC<{ progettoId: string }> = ({ progettoId }) => {
  const [obiettivi, setObiettivi] = useState<Obiettivo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOkr, setEditingOkr] = useState<Obiettivo | null>(null)
  const [form, setForm] = useState<Partial<Obiettivo>>({ trimestre: 'Q2-2026', key_results: [] })
  const [newKR, setNewKR] = useState({ titolo: '', target: 0, unita: '%' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('okr').select('*').eq('progetto_id', progettoId).order('created_at')
    const parsed = (data || []).map((o: any) => ({
      ...o,
      key_results: (() => { try { return JSON.parse(o.key_results || '[]') } catch { return [] } })()
    }))
    setObiettivi(parsed)
    setLoading(false)
  }, [progettoId])

  useEffect(() => { load() }, [load])

  const calcolaProgresso = (krs: KeyResult[]) => {
    if (!krs.length) return 0
    const tot = krs.reduce((a, kr) => a + Math.min((kr.attuale / (kr.target || 1)) * 100, 100), 0)
    return Math.round(tot / krs.length)
  }

  const saveOkr = async () => {
    if (!form.titolo?.trim()) return
    const krs = form.key_results || []
    const progresso = calcolaProgresso(krs)
    const payload = { ...form, progetto_id: progettoId, key_results: JSON.stringify(krs), progresso }
    if (editingOkr?.id) {
      await supabase.from('okr').update(payload).eq('id', editingOkr.id)
    } else {
      await supabase.from('okr').insert(payload)
    }
    setShowForm(false); setEditingOkr(null); setForm({ trimestre: 'Q2-2026', key_results: [] }); load()
  }

  const deleteOkr = async (id: string) => { await supabase.from('okr').delete().eq('id', id); load() }

  const updateKRAttuale = async (okrId: string, krId: string, val: number) => {
    const okr = obiettivi.find(o => o.id === okrId)
    if (!okr) return
    const krs = okr.key_results.map(kr => kr.id === krId ? { ...kr, attuale: val } : kr)
    const progresso = calcolaProgresso(krs)
    await supabase.from('okr').update({ key_results: JSON.stringify(krs), progresso }).eq('id', okrId)
    load()
  }

  const addKR = () => {
    if (!newKR.titolo.trim()) return
    const kr: KeyResult = { id: Date.now().toString(), titolo: newKR.titolo, target: newKR.target, attuale: 0, unita: newKR.unita, completato: false }
    setForm(p => ({ ...p, key_results: [...(p.key_results || []), kr] }))
    setNewKR({ titolo: '', target: 0, unita: '%' })
  }

  const removeKR = (id: string) => setForm(p => ({ ...p, key_results: (p.key_results || []).filter(kr => kr.id !== id) }))

  if (loading) return <div style={{ padding: '20px', fontSize: 13, color: S.textMuted }}>Caricamento OKR...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>OKR — Obiettivi e Key Results</div>
        <button onClick={() => { setEditingOkr(null); setForm({ trimestre: 'Q2-2026', key_results: [] }); setShowForm(true) }}
          style={{ padding: '6px 14px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          + Obiettivo
        </button>
      </div>

      {obiettivi.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '32px', background: S.background, border: `2px dashed ${S.border}`, borderRadius: 10, cursor: 'pointer' }}
          onClick={() => setShowForm(true)}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: S.textSecondary }}>Nessun OKR definito</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>Aggiungi obiettivi trimestrali con Key Results misurabili</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {obiettivi.map(okr => (
            <div key={okr.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Header obiettivo */}
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${S.borderLight}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 10, background: S.tealLight, color: S.teal, padding: '1px 7px', borderRadius: 20, fontWeight: 700, marginRight: 8 }}>{okr.trimestre}</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: S.textPrimary, marginTop: 4 }}>{okr.titolo}</div>
                    {okr.descrizione && <div style={{ fontSize: 12, color: S.textSecondary, marginTop: 2 }}>{okr.descrizione}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: okr.progresso >= 70 ? S.green : okr.progresso >= 40 ? S.amber : S.red, fontFamily: DS.fonts.mono }}>{okr.progresso}%</span>
                    <button onClick={() => { setEditingOkr(okr); setForm({ ...okr, key_results: okr.key_results }); setShowForm(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 12 }}>✏️</button>
                    <button onClick={() => deleteOkr(okr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 12 }}>✕</button>
                  </div>
                </div>
                <ProgressBar pct={okr.progresso} />
              </div>

              {/* Key Results */}
              <div style={{ padding: '12px 18px' }}>
                {okr.key_results.map(kr => {
                  const pct = Math.min((kr.attuale / (kr.target || 1)) * 100, 100)
                  return (
                    <div key={kr.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: S.textSecondary }}>{kr.titolo}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="number" value={kr.attuale} onChange={e => updateKRAttuale(okr.id, kr.id, Number(e.target.value))}
                            style={{ width: 56, padding: '2px 6px', border: `1px solid ${S.border}`, borderRadius: 5, fontSize: 11, fontFamily: DS.fonts.mono, textAlign: 'center' }} />
                          <span style={{ fontSize: 11, color: S.textMuted }}>/ {kr.target}{kr.unita}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 100 ? S.green : S.textMuted }}>{Math.round(pct)}%</span>
                        </div>
                      </div>
                      <ProgressBar pct={pct} />
                    </div>
                  )
                })}
                {okr.key_results.length === 0 && <div style={{ fontSize: 12, color: S.textMuted, fontStyle: 'italic' }}>Nessun Key Result — modifica per aggiungerne</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modale */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: 16, overflowY: 'auto', backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditingOkr(null) } }}>
          <div style={{ background: S.surface, borderRadius: 14, padding: 24, width: '100%', maxWidth: 520, boxShadow: DS.shadow.xl, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: S.textPrimary }}>{editingOkr ? 'Modifica obiettivo' : 'Nuovo obiettivo'}</div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Obiettivo *</label>
              <input value={form.titolo || ''} onChange={e => setForm(p => ({ ...p, titolo: e.target.value }))} placeholder="es. Raggiungere 10 clienti paganti"
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Trimestre</label>
                <select value={form.trimestre || 'Q2-2026'} onChange={e => setForm(p => ({ ...p, trimestre: e.target.value }))}
                  style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui }}>
                  {TRIMESTRI.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>Descrizione</label>
                <input value={form.descrizione || ''} onChange={e => setForm(p => ({ ...p, descrizione: e.target.value }))} placeholder="Contesto..."
                  style={{ width: '100%', padding: '7px 9px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Key Results */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>Key Results</div>
              {(form.key_results || []).map(kr => (
                <div key={kr.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '6px 10px', background: S.background, borderRadius: 7 }}>
                  <span style={{ flex: 1, fontSize: 12, color: S.textPrimary }}>{kr.titolo}</span>
                  <span style={{ fontSize: 11, color: S.textMuted }}>Target: {kr.target}{kr.unita}</span>
                  <button onClick={() => removeKR(kr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 12 }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input value={newKR.titolo} onChange={e => setNewKR(p => ({ ...p, titolo: e.target.value }))} placeholder="Key Result..."
                  style={{ flex: 2, padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.ui }} />
                <input type="number" value={newKR.target} onChange={e => setNewKR(p => ({ ...p, target: Number(e.target.value) }))} placeholder="Target"
                  style={{ width: 60, padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.fonts.mono }} />
                <input value={newKR.unita} onChange={e => setNewKR(p => ({ ...p, unita: e.target.value }))} placeholder="%"
                  style={{ width: 40, padding: '6px 8px', border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 12 }} />
                <button onClick={addKR} style={{ padding: '6px 12px', background: S.teal, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 14, borderTop: `1px solid ${S.borderLight}` }}>
              <button onClick={() => { setShowForm(false); setEditingOkr(null) }} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
              <button onClick={saveOkr} style={{ padding: '8px 22px', background: S.teal, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
