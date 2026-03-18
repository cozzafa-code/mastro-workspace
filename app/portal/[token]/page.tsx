// app/portal/[token]/page.tsx
// Portal pubblico cliente — accessibile senza login
// URL: mastro-workspace-o4r3.vercel.app/portal/[token]
'use client'
import { FC, useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Voce {
  descrizione: string
  qty: number
  prezzo_unit: number
  totale: number
}

export default function PortalCliente({ params }: { params: { token: string } }) {
  const [prev, setPrev] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [nomeFirma, setNomeFirma] = useState('')
  const [firmato, setFirmato] = useState(false)
  const [step, setStep] = useState<'view' | 'firma' | 'done'>('view')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasFirma, setHasFirma] = useState(false)

  useEffect(() => {
    supabase.from('preventivi').select('*').eq('id', params.token).single().then(({ data, error }) => {
      if (error || !data) { setNotFound(true); setLoading(false); return }
      setPrev(data)
      setLoading(false)
      if (data.firmato_il) setFirmato(true)
    })
  }, [params.token])

  // Canvas firma
  const startDraw = (e: any) => {
    setDrawing(true)
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.moveTo(x, y)
  }

  const draw = (e: any) => {
    if (!drawing) return
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#0D1117'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasFirma(true)
  }

  const stopDraw = () => setDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasFirma(false)
  }

  const confermaFirma = async () => {
    if (!nomeFirma.trim() || !hasFirma) return
    const canvas = canvasRef.current!
    const firmaUrl = canvas.toDataURL('image/png')
    await supabase.from('preventivi').update({
      stato: 'accettato',
      firmato_il: new Date().toISOString(),
      firmato_da: nomeFirma,
      firma_url: firmaUrl,
      accettato_il: new Date().toISOString(),
    }).eq('id', params.token)
    setStep('done')
    setFirmato(true)
  }

  const S = {
    teal: '#0A8A7A', bg: '#F7F8FA', surface: '#FFFFFF',
    border: '#E5E7EB', textPrimary: '#0D1117', textSecondary: '#4B5563',
    textMuted: '#9CA3AF', green: '#0F7B5A', red: '#DC4444',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: S.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 14, color: S.textMuted }}>Caricamento preventivo...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: S.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary }}>Preventivo non trovato</div>
        <div style={{ fontSize: 13, color: S.textMuted, marginTop: 6 }}>Il link potrebbe essere scaduto o non valido.</div>
      </div>
    </div>
  )

  const voci: Voce[] = (() => { try { return JSON.parse(prev.voci || '[]') } catch { return [] } })()
  const STATO_COLOR: Record<string, string> = { bozza: S.textMuted, inviato: '#2563EB', accettato: S.green, rifiutato: S.red }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0B1F2A', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: S.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 14L8 2l6 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>MASTRO OS</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>Portal Cliente</span>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>

        {step === 'done' ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: S.surface, borderRadius: 16, border: `1px solid ${S.border}` }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: S.green, marginBottom: 8 }}>Preventivo firmato!</div>
            <div style={{ fontSize: 14, color: S.textSecondary }}>Grazie {nomeFirma}. Il tuo preventivo è stato accettato.</div>
            <div style={{ fontSize: 12, color: S.textMuted, marginTop: 8 }}>Riceverai una conferma via email.</div>
          </div>
        ) : step === 'firma' ? (
          <div style={{ background: S.surface, borderRadius: 16, padding: 28, border: `1px solid ${S.border}` }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, marginBottom: 4 }}>Firma il preventivo</div>
            <div style={{ fontSize: 13, color: S.textSecondary, marginBottom: 20 }}>Inserisci il tuo nome e disegna la firma nello spazio sottostante.</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Nome e Cognome *</label>
              <input value={nomeFirma} onChange={e => setNomeFirma(e.target.value)} placeholder="Mario Rossi"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase' }}>Firma *</label>
                <button onClick={clearCanvas} style={{ fontSize: 11, color: S.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Cancella</button>
              </div>
              <canvas ref={canvasRef} width={600} height={160}
                style={{ border: `2px dashed ${S.border}`, borderRadius: 8, width: '100%', height: 160, cursor: 'crosshair', background: '#FAFAFA', touchAction: 'none' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={e => { e.preventDefault(); startDraw(e) }}
                onTouchMove={e => { e.preventDefault(); draw(e) }}
                onTouchEnd={stopDraw} />
              <div style={{ fontSize: 11, color: S.textMuted, marginTop: 4 }}>Disegna la tua firma con il mouse o il dito</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('view')} style={{ flex: 1, padding: '10px', border: `1px solid ${S.border}`, borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 13 }}>← Torna al preventivo</button>
              <button onClick={confermaFirma} disabled={!nomeFirma.trim() || !hasFirma}
                style={{ flex: 2, padding: '10px', background: nomeFirma.trim() && hasFirma ? S.green : S.textMuted, color: '#fff', border: 'none', borderRadius: 8, cursor: nomeFirma.trim() && hasFirma ? 'pointer' : 'default', fontSize: 13, fontWeight: 700 }}>
                ✓ Conferma e firma
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Preventivo detail */}
            <div style={{ background: S.surface, borderRadius: 16, padding: 28, border: `1px solid ${S.border}`, marginBottom: 16 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 4 }}>{prev.numero || 'Preventivo'}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: S.textPrimary }}>{prev.titolo}</div>
                  {prev.cliente_nome && <div style={{ fontSize: 14, color: S.textSecondary, marginTop: 4 }}>Attenzione: {prev.cliente_nome}</div>}
                </div>
                <div style={{ background: (STATO_COLOR[prev.stato] || S.textMuted) + '20', color: STATO_COLOR[prev.stato] || S.textMuted, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {prev.stato}
                </div>
              </div>

              {/* Date */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${S.border}` }}>
                {prev.created_at && <div><div style={{ fontSize: 10, color: S.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Data</div><div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(prev.created_at).toLocaleDateString('it-IT')}</div></div>}
                {prev.scadenza && <div><div style={{ fontSize: 10, color: S.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Scadenza</div><div style={{ fontSize: 13, fontWeight: 600, color: prev.scadenza < new Date().toISOString().split('T')[0] ? S.red : S.textPrimary }}>{new Date(prev.scadenza).toLocaleDateString('it-IT')}</div></div>}
              </div>

              {/* Voci */}
              {voci.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>Dettaglio voci</div>
                  <div style={{ border: `1px solid ${S.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', padding: '8px 12px', background: S.bg, borderBottom: `1px solid ${S.border}` }}>
                      {['Descrizione','Qty','Prezzo unit.','Totale'].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase' }}>{h}</div>)}
                    </div>
                    {voci.map((v, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', padding: '10px 12px', borderBottom: i < voci.length - 1 ? `1px solid ${S.border}` : 'none' }}>
                        <div style={{ fontSize: 13 }}>{v.descrizione}</div>
                        <div style={{ fontSize: 13, color: S.textSecondary }}>{v.qty}</div>
                        <div style={{ fontSize: 13, color: S.textSecondary }}>€{Number(v.prezzo_unit).toLocaleString('it-IT')}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>€{Number(v.totale).toLocaleString('it-IT')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totali */}
              <div style={{ background: S.bg, borderRadius: 10, padding: '14px 18px', marginBottom: prev.note ? 20 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: S.textSecondary }}>Imponibile</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>€{Number(prev.valore_netto || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${S.border}` }}>
                  <span style={{ fontSize: 13, color: S.textSecondary }}>IVA {prev.iva_pct || 22}%</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>€{(Number(prev.valore_netto || 0) * (Number(prev.iva_pct) || 22) / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Totale</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: S.green }}>€{Number(prev.valore_totale || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {prev.note && (
                <div style={{ marginTop: 20, padding: '12px 16px', background: '#EDF7F6', borderRadius: 8, borderLeft: `3px solid ${S.teal}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S.teal, marginBottom: 4 }}>NOTE</div>
                  <div style={{ fontSize: 13, color: S.textSecondary, lineHeight: 1.6 }}>{prev.note}</div>
                </div>
              )}
            </div>

            {/* Firma status o CTA */}
            {firmato ? (
              <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: S.green }}>Preventivo accettato e firmato</div>
                  <div style={{ fontSize: 12, color: '#065f46' }}>Firmato da {prev.firmato_da} il {prev.firmato_il ? new Date(prev.firmato_il).toLocaleDateString('it-IT') : ''}</div>
                </div>
              </div>
            ) : prev.stato !== 'rifiutato' && (
              <div style={{ background: S.surface, borderRadius: 12, padding: '20px', border: `1px solid ${S.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: S.textPrimary, marginBottom: 8 }}>Accetta questo preventivo</div>
                <div style={{ fontSize: 13, color: S.textSecondary, marginBottom: 16 }}>Puoi firmare digitalmente qui sotto per confermare l'accettazione.</div>
                <button onClick={() => setStep('firma')}
                  style={{ padding: '12px 32px', background: S.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  ✍️ Firma e accetta
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
