// components/Operations/FornitoriView.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

const CATEGORIE_FORNITORI = ['Tech', 'Utilities', 'Banca', 'Legale', 'Marketing', 'Logistica', 'Altro']

interface Fornitore {
  id: string
  nome: string
  categoria?: string
  email?: string
  telefono?: string
  sito?: string
  contatto_ref?: string
  note?: string
  attivo: boolean
}

interface Pagamento {
  id: string
  descrizione: string
  importo: number
  tipo: string
  data: string
  metodo?: string
  fornitore_nome?: string
  categoria?: string
  note?: string
}

export const FornitoriView: FC<{ currentUser: string }> = ({ currentUser }) => {
  const [tab, setTab] = useState<'fornitori' | 'pagamenti'>('fornitori')
  const [fornitori, setFornitori] = useState<Fornitore[]>([])
  const [pagamenti, setPagamenti] = useState<Pagamento[]>([])
  const [showForm, setShowForm] = useState<'fornitore' | 'pagamento' | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Fornitore | null>(null)

  const load = useCallback(async () => {
    const [f, p] = await Promise.all([
      supabase.from('fornitori').select('*').eq('attivo', true).order('nome'),
      supabase.from('pagamenti').select('*').order('data', { ascending: false }).limit(50),
    ])
    setFornitori(f.data || [])
    setPagamenti(p.data || [])
  }, [])

  useEffect(() => { load() }, [load])

  const salvaFornitore = async () => {
    if (!form.nome) return
    setSaving(true)
    await supabase.from('fornitori').insert({
      nome: form.nome, categoria: form.categoria || 'Altro',
      email: form.email || null, telefono: form.telefono || null,
      sito: form.sito || null, contatto_ref: form.contatto_ref || null,
      note: form.note || null,
    })
    setForm({}); setShowForm(null); setSaving(false); load()
  }

  const salvaPagamento = async () => {
    if (!form.descrizione || !form.importo) return
    setSaving(true)
    await supabase.from('pagamenti').insert({
      descrizione: form.descrizione, importo: Number(form.importo),
      tipo: form.tipo || 'uscita', data: form.data || new Date().toISOString().split('T')[0],
      metodo: form.metodo || null, fornitore_nome: form.fornitore_nome || null,
      categoria: form.categoria || null, note: form.note || null,
      registrato_da: currentUser,
    })
    setForm({}); setShowForm(null); setSaving(false); load()
  }

  const totMese = (() => {
    const mese = new Date().toISOString().slice(0, 7)
    return pagamenti.filter(p => p.data.startsWith(mese) && p.tipo === 'uscita').reduce((a, p) => a + Number(p.importo), 0)
  })()

  const FI = ({ label, id, type = 'text', options, placeholder }: any) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{label}</label>
      {options
        ? <select value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, background: '#fff', boxSizing: 'border-box' }}>
            <option value="">Seleziona...</option>
            {options.map((o: string) => <option key={o}>{o}</option>)}
          </select>
        : <input type={type} value={form[id] || ''} onChange={e => setForm({ ...form, [id]: e.target.value })} placeholder={placeholder}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: DS.fonts.ui, background: '#fff', boxSizing: 'border-box' }} />
      }
    </div>
  )

  return (
    <div>
      {/* Tab switch */}
      <div style={{ display: 'flex', background: S.borderLight, borderRadius: 10, padding: 3, marginBottom: 20, gap: 3 }}>
        {[['fornitori','Fornitori'],['pagamenti','Pagamenti']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t as any)}
            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: tab === t ? S.surface : 'none', color: tab === t ? S.textPrimary : S.textMuted, fontSize: 13, fontWeight: tab === t ? 700 : 400, cursor: 'pointer', fontFamily: DS.fonts.ui, boxShadow: tab === t ? DS.shadow.xs : 'none' }}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'fornitori' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: S.textMuted }}>{fornitori.length} fornitori attivi</div>
            <button onClick={() => setShowForm('fornitore')}
              style={{ padding: '8px 16px', background: S.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
              + Fornitore
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fornitori.map(f => (
              <div key={f.id} onClick={() => setSelected(selected?.id === f.id ? null : f)}
                style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = S.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = S.border}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: S.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: S.teal, flexShrink: 0 }}>
                    {f.nome.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary }}>{f.nome}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      {f.categoria && <span style={{ fontSize: 11, background: S.borderLight, color: S.textMuted, padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>{f.categoria}</span>}
                      {f.contatto_ref && <span style={{ fontSize: 11, color: S.textMuted }}>👤 {f.contatto_ref}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {f.telefono && <a href={`tel:${f.telefono}`} onClick={e => e.stopPropagation()}
                      style={{ width: 32, height: 32, borderRadius: 8, background: S.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5-1.5 1a9 9 0 004.5 4.5l1-1.5L15 11v3c-7 0-12-5-12-12z" stroke={S.green} strokeWidth="1.4" strokeLinejoin="round"/></svg>
                    </a>}
                    {f.email && <a href={`mailto:${f.email}`} onClick={e => e.stopPropagation()}
                      style={{ width: 32, height: 32, borderRadius: 8, background: S.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke={S.blue} strokeWidth="1.4"/><path d="M1 5l7 5 7-5" stroke={S.blue} strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </a>}
                  </div>
                </div>
                {selected?.id === f.id && f.note && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: S.background, borderRadius: 8, fontSize: 12, color: S.textSecondary, lineHeight: 1.6 }}>
                    {f.note}
                  </div>
                )}
              </div>
            ))}
            {fornitori.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: S.textMuted, fontSize: 14 }}>
                Nessun fornitore · aggiungi il primo
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'pagamenti' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: S.textPrimary }}>Questo mese</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: S.red, fontFamily: DS.fonts.mono }}>-€{totMese.toLocaleString('it-IT')}</div>
            </div>
            <button onClick={() => setShowForm('pagamento')}
              style={{ padding: '8px 16px', background: S.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
              + Pagamento
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pagamenti.map(p => (
              <div key={p.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.tipo === 'uscita' ? S.red : S.green, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: S.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descrizione}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: S.textMuted }}>{new Date(p.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                    {p.fornitore_nome && <span style={{ fontSize: 11, color: S.textMuted }}>{p.fornitore_nome}</span>}
                    {p.metodo && <span style={{ fontSize: 11, background: S.borderLight, color: S.textMuted, padding: '0 5px', borderRadius: 20 }}>{p.metodo}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: p.tipo === 'uscita' ? S.red : S.green, fontFamily: DS.fonts.mono, flexShrink: 0 }}>
                  {p.tipo === 'uscita' ? '-' : '+'}€{Number(p.importo).toLocaleString('it-IT')}
                </span>
              </div>
            ))}
            {pagamenti.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: S.textMuted }}>Nessun pagamento registrato</div>
            )}
          </div>
        </>
      )}

      {/* Form modale */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(null) }}>
          <div style={{ background: S.surface, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto', padding: '20px 20px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{showForm === 'fornitore' ? 'Nuovo fornitore' : 'Registra pagamento'}</div>
              <button onClick={() => setShowForm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: S.textMuted }}>✕</button>
            </div>

            {showForm === 'fornitore' ? (
              <>
                <FI label="Nome *" id="nome" placeholder="es. Enel, Stripe, Studio Rossi..." />
                <FI label="Categoria" id="categoria" options={CATEGORIE_FORNITORI} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FI label="Email" id="email" type="email" placeholder="info@..." />
                  <FI label="Telefono" id="telefono" placeholder="+39..." />
                </div>
                <FI label="Contatto di riferimento" id="contatto_ref" placeholder="Nome persona" />
                <FI label="Sito web" id="sito" placeholder="https://..." />
                <FI label="Note" id="note" placeholder="Contratto, condizioni, note..." />
                <button onClick={salvaFornitore} disabled={saving || !form.nome}
                  style={{ width: '100%', padding: '13px', background: form.nome ? S.teal : S.borderLight, color: form.nome ? '#fff' : S.textMuted, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui, marginTop: 8 }}>
                  {saving ? '...' : 'Salva fornitore'}
                </button>
              </>
            ) : (
              <>
                <FI label="Descrizione *" id="descrizione" placeholder="es. Stripe mensile, Bolletta gas..." />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FI label="Importo € *" id="importo" type="number" placeholder="0.00" />
                  <FI label="Data" id="data" type="date" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FI label="Tipo" id="tipo" options={['uscita','entrata']} />
                  <FI label="Metodo" id="metodo" options={['bonifico','carta','RID','PayPal','contanti']} />
                </div>
                <FI label="Fornitore" id="fornitore_nome" placeholder="A chi hai pagato" />
                <FI label="Note" id="note" placeholder="Riferimento fattura, note..." />
                <button onClick={salvaPagamento} disabled={saving || !form.descrizione || !form.importo}
                  style={{ width: '100%', padding: '13px', background: form.descrizione && form.importo ? S.teal : S.borderLight, color: form.descrizione && form.importo ? '#fff' : S.textMuted, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: DS.fonts.ui, marginTop: 8 }}>
                  {saving ? '...' : 'Registra'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
