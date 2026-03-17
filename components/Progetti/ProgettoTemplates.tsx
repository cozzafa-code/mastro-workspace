// components/Progetti/ProgettoTemplates.tsx
'use client'
import { FC, useState } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'

const S = DS.colors

interface Template {
  id: string
  nome: string
  descrizione: string
  colore: string
  icona: string
  tasks: { titolo: string; priorita: string; chi: string; giorni?: number }[]
  businessPlan: Partial<BusinessPlan>
}

interface BusinessPlan {
  mercato_target: string
  problema: string
  soluzione: string
  value_proposition: string
  competitor: string
  revenue_model: string
  pricing: string
  target_mrr_6m: number
  target_mrr_12m: number
  target_clienti_6m: number
  costo_acquisizione: number
  canali_marketing: string
  milestone_1: string
  milestone_2: string
  milestone_3: string
  rischi: string
  note_strategiche: string
}

const TEMPLATES: Template[] = [
  {
    id: 'saas_b2b',
    nome: 'SaaS B2B',
    descrizione: 'Modulo SaaS per aziende — dalla validazione al lancio',
    colore: '#0A8A7A',
    icona: '⚡',
    tasks: [
      { titolo: 'Validazione idea con 5 prospect', priorita: '1', chi: 'fabio', giorni: 7 },
      { titolo: 'Definizione MVP e feature list', priorita: '1', chi: 'fabio', giorni: 14 },
      { titolo: 'Setup repo e ambiente dev', priorita: '1', chi: 'fabio', giorni: 3 },
      { titolo: 'Design UI/UX wireframe', priorita: '2', chi: 'fabio', giorni: 21 },
      { titolo: 'Sviluppo MVP', priorita: '1', chi: 'fabio', giorni: 60 },
      { titolo: 'Setup Supabase DB e RLS', priorita: '1', chi: 'fabio', giorni: 14 },
      { titolo: 'Integrazione pagamenti Stripe', priorita: '2', chi: 'fabio', giorni: 45 },
      { titolo: 'Landing page e copy', priorita: '2', chi: 'lidia', giorni: 30 },
      { titolo: 'Campagna beta tester', priorita: '2', chi: 'lidia', giorni: 45 },
      { titolo: 'Onboarding 10 beta clienti', priorita: '1', chi: 'entrambi', giorni: 60 },
      { titolo: 'Deploy produzione su Vercel', priorita: '1', chi: 'fabio', giorni: 60 },
      { titolo: 'Setup analytics e tracking', priorita: '3', chi: 'fabio', giorni: 45 },
    ],
    businessPlan: {
      revenue_model: 'Abbonamento mensile SaaS (MRR)',
      canali_marketing: 'LinkedIn, content marketing, referral, cold outreach',
      rischi: 'Churn elevato, lento sviluppo prodotto, competitor con più risorse',
    }
  },
  {
    id: 'lancio_mercato',
    nome: 'Lancio nuovo mercato',
    descrizione: 'Espansione in un nuovo paese o verticale',
    colore: '#6D28D9',
    icona: '🌍',
    tasks: [
      { titolo: 'Ricerca mercato e competitor locali', priorita: '1', chi: 'entrambi', giorni: 14 },
      { titolo: 'Traduzione e localizzazione prodotto', priorita: '1', chi: 'fabio', giorni: 30 },
      { titolo: 'Setup entità legale/fiscale locale', priorita: '1', chi: 'lidia', giorni: 45 },
      { titolo: 'Partnership con distributori locali', priorita: '2', chi: 'lidia', giorni: 60 },
      { titolo: 'Campagna awareness mercato target', priorita: '2', chi: 'lidia', giorni: 30 },
      { titolo: 'Adattamento pricing per mercato', priorita: '1', chi: 'entrambi', giorni: 14 },
      { titolo: 'Registrazione trademark locale', priorita: '2', chi: 'lidia', giorni: 60 },
      { titolo: 'Onboarding primi 5 clienti locali', priorita: '1', chi: 'entrambi', giorni: 90 },
    ],
    businessPlan: {
      revenue_model: 'Stesso del mercato principale, adattato localmente',
      canali_marketing: 'Fiere locali, LinkedIn mercato target, partner locali',
    }
  },
  {
    id: 'campagna_marketing',
    nome: 'Campagna Marketing',
    descrizione: 'Campagna lead generation completa',
    colore: '#BE185D',
    icona: '📣',
    tasks: [
      { titolo: 'Definizione target audience e ICP', priorita: '1', chi: 'lidia', giorni: 7 },
      { titolo: 'Creazione contenuti (testi, grafiche)', priorita: '1', chi: 'lidia', giorni: 14 },
      { titolo: 'Setup campagna ads', priorita: '1', chi: 'lidia', giorni: 14 },
      { titolo: 'Landing page ottimizzata conversione', priorita: '1', chi: 'fabio', giorni: 14 },
      { titolo: 'Setup sequenza email nurturing', priorita: '2', chi: 'lidia', giorni: 21 },
      { titolo: 'A/B test creatività', priorita: '3', chi: 'lidia', giorni: 30 },
      { titolo: 'Report performance settimanale', priorita: '2', chi: 'lidia', giorni: 7 },
      { titolo: 'Ottimizzazione budget allocation', priorita: '2', chi: 'lidia', giorni: 21 },
    ],
    businessPlan: {
      revenue_model: 'Lead generation → conversione clienti paganti',
      canali_marketing: 'Meta Ads, Google Ads, LinkedIn, email marketing',
    }
  },
  {
    id: 'sviluppo_modulo',
    nome: 'Sviluppo modulo ERP',
    descrizione: 'Nuovo modulo per MASTRO Suite',
    colore: '#14B8A6',
    icona: '🧩',
    tasks: [
      { titolo: 'Analisi requisiti e user stories', priorita: '1', chi: 'fabio', giorni: 7 },
      { titolo: 'Schema DB e migrazioni Supabase', priorita: '1', chi: 'fabio', giorni: 10 },
      { titolo: 'Hook useModulo con logica business', priorita: '1', chi: 'fabio', giorni: 14 },
      { titolo: 'Componente React principale', priorita: '1', chi: 'fabio', giorni: 21 },
      { titolo: 'RLS policies e sicurezza DB', priorita: '1', chi: 'fabio', giorni: 14 },
      { titolo: 'Test con dati reali', priorita: '1', chi: 'entrambi', giorni: 21 },
      { titolo: 'Documentazione modulo', priorita: '3', chi: 'fabio', giorni: 30 },
      { titolo: 'Deploy e verifica produzione', priorita: '1', chi: 'fabio', giorni: 30 },
    ],
    businessPlan: {
      revenue_model: 'Incluso nel bundle o add-on opzionale',
      value_proposition: 'Funzionalità unica rispetto ai competitor',
    }
  },
]

// ── Business Plan Editor ──────────────────────────────────
export const BusinessPlanEditor: FC<{ progettoId: string; nome: string }> = ({ progettoId, nome }) => {
  const [plan, setPlan] = useState<Partial<BusinessPlan>>({})
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('project_logs').select('*')
      .eq('progetto_id', progettoId).eq('tipo', 'business_plan').single()
    if (data?.contenuto) { setPlan(JSON.parse(data.contenuto)); setSaved(true) }
    setLoaded(true)
  }

  if (!loaded) { load(); return <div style={{ fontSize: 13, color: S.textMuted, padding: '20px 0' }}>Caricamento...</div> }

  const save = async () => {
    const existing = await supabase.from('project_logs').select('id').eq('progetto_id', progettoId).eq('tipo', 'business_plan').single()
    if (existing.data?.id) {
      await supabase.from('project_logs').update({ contenuto: JSON.stringify(plan), data_evento: new Date().toISOString().split('T')[0] }).eq('id', existing.data.id)
    } else {
      await supabase.from('project_logs').insert({ progetto_id: progettoId, titolo: `Business Plan — ${nome}`, tipo: 'business_plan', contenuto: JSON.stringify(plan), data_evento: new Date().toISOString().split('T')[0] })
    }
    setSaved(true)
  }

  const FI: FC<{ label: string; k: keyof BusinessPlan; ph?: string; type?: string; rows?: number }> = ({ label, k, ph, type = 'text', rows }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{label}</label>
      {rows ? (
        <textarea value={(plan[k] as string) || ''} onChange={e => { setPlan(p => ({ ...p, [k]: e.target.value })); setSaved(false) }} placeholder={ph} rows={rows}
          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, resize: 'vertical', boxSizing: 'border-box', background: S.surface }} />
      ) : (
        <input type={type} value={(plan[k] as string | number) || ''} onChange={e => { setPlan(p => ({ ...p, [k]: type === 'number' ? Number(e.target.value) : e.target.value })); setSaved(false) }} placeholder={ph}
          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box', background: S.surface }} />
      )}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary }}>Business Plan</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{nome}</div>
        </div>
        <button onClick={save} style={{ padding: '7px 16px', background: saved ? S.greenLight : S.teal, color: saved ? S.green : '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: DS.fonts.ui }}>
          {saved ? '✓ Salvato' : 'Salva'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${S.border}` }}>Prodotto e Mercato</div>
          <FI label="Mercato target" k="mercato_target" ph="es. Serramentisti italiani 5-50 dipendenti" rows={2} />
          <FI label="Problema che risolviamo" k="problema" ph="Cosa fa male al cliente oggi?" rows={2} />
          <FI label="Nostra soluzione" k="soluzione" ph="Come lo risolviamo?" rows={2} />
          <FI label="Value proposition unica" k="value_proposition" ph="Perché noi e non i competitor?" rows={2} />
          <FI label="Competitor principali" k="competitor" ph="Chi sono, punti deboli" rows={2} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${S.border}` }}>Business Model</div>
          <FI label="Revenue model" k="revenue_model" ph="SaaS mensile, one-shot, freemium..." />
          <FI label="Pricing" k="pricing" ph="es. €99/mo Core, €248 Bundle" />
          <FI label="Canali marketing" k="canali_marketing" ph="LinkedIn, SEO, eventi, referral..." rows={2} />
          <FI label="CAC stimato (€)" k="costo_acquisizione" ph="0" type="number" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FI label="Target MRR 6 mesi (€)" k="target_mrr_6m" type="number" ph="0" />
            <FI label="Target MRR 12 mesi (€)" k="target_mrr_12m" type="number" ph="0" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FI label="Clienti target 6 mesi" k="target_clienti_6m" type="number" ph="0" />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${S.border}` }}>Milestone e Rischi</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <FI label="Milestone 1" k="milestone_1" ph="es. 10 clienti paganti entro Q2" rows={2} />
          <FI label="Milestone 2" k="milestone_2" ph="es. Break-even entro Q3" rows={2} />
          <FI label="Milestone 3" k="milestone_3" ph="es. Lancio mercato PL entro Q4" rows={2} />
        </div>
        <FI label="Rischi principali" k="rischi" ph="Cosa può andare storto e come mitigiamo" rows={2} />
        <FI label="Note strategiche" k="note_strategiche" ph="Considerazioni aggiuntive" rows={2} />
      </div>
    </div>
  )
}

// ── Template Picker ───────────────────────────────────────
export const TemplatePicker: FC<{ onClose: () => void; onSuccess: (progettoId: string) => void; currentUser: string }> = ({ onClose, onSuccess, currentUser }) => {
  const [selected, setSelected] = useState<Template | null>(null)
  const [customizing, setCustomizing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [creating, setCreating] = useState(false)

  const create = async () => {
    if (!selected || !form.nome) return
    setCreating(true)
    const oggi = new Date().toISOString().split('T')[0]

    // Crea progetto
    const { data: prog } = await supabase.from('progetti').insert({
      nome: form.nome, descrizione: form.descrizione || selected.descrizione,
      colore: form.colore || selected.colore, stato: 'attivo',
      mrr: 0, beta_clienti: 0, prezzo: Number(form.prezzo) || 0, priorita: 2,
      data_inizio: oggi,
    }).select('id').single()

    if (!prog?.id) { setCreating(false); return }

    // Crea task dal template
    const tasks = selected.tasks.map(t => {
      const scadenza = t.giorni ? new Date(Date.now() + t.giorni * 86400000).toISOString().split('T')[0] : null
      return { titolo: t.titolo, chi: t.chi, priorita: t.priorita, stato: 'aperto', progetto: form.nome, progetto_id: prog.id, scadenza }
    })
    await supabase.from('tasks').insert(tasks)

    // Salva business plan iniziale
    if (selected.businessPlan && Object.keys(selected.businessPlan).length > 0) {
      await supabase.from('project_logs').insert({
        progetto_id: prog.id, titolo: `Business Plan — ${form.nome}`,
        tipo: 'business_plan', contenuto: JSON.stringify(selected.businessPlan),
        data_evento: oggi,
      })
    }

    setCreating(false)
    onSuccess(prog.id)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16, backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: S.surface, borderRadius: 14, padding: 28, width: '100%', maxWidth: 640, boxShadow: DS.shadow.xl, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.textPrimary }}>
            {customizing ? `Configura: ${selected?.nome}` : 'Template progetto'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textMuted, fontSize: 18 }}>✕</button>
        </div>

        {!customizing ? (
          <>
            <div style={{ fontSize: 12, color: S.textMuted, marginBottom: 16 }}>Scegli un template — crea il progetto con task preimpostate e business plan</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => setSelected(t)}
                  style={{ padding: '16px', border: `2px solid ${selected?.id === t.id ? S.teal : S.border}`, borderRadius: 10, cursor: 'pointer', background: selected?.id === t.id ? S.tealLight : S.surface, transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{t.icona}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: S.textPrimary, marginBottom: 4 }}>{t.nome}</div>
                  <div style={{ fontSize: 12, color: S.textSecondary, marginBottom: 8 }}>{t.descrizione}</div>
                  <div style={{ fontSize: 11, color: S.textMuted }}>{t.tasks.length} task preimpostate</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>Annulla</button>
              <button onClick={() => { if (selected) { setForm({ nome: '', colore: selected.colore }); setCustomizing(true) } }} disabled={!selected}
                style={{ padding: '8px 20px', background: selected ? S.teal : S.borderLight, color: selected ? '#fff' : S.textMuted, border: 'none', borderRadius: 7, cursor: selected ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>
                Usa template →
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: S.background, borderRadius: 9, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: S.textSecondary }}>
              Verranno create <strong>{selected?.tasks.length} task</strong> preimpostate con scadenze calcolate da oggi.
            </div>
            {[
              { k: 'nome', l: 'Nome progetto *', ph: `es. ${selected?.nome} — MASTRO` },
              { k: 'descrizione', l: 'Descrizione', ph: selected?.descrizione || '' },
              { k: 'prezzo', l: 'Prezzo/mese (€)', ph: '0', t: 'number' },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{f.l}</label>
                <input type={f.t || 'text'} value={form[f.k] || ''} onChange={e => setForm((p: any) => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${S.border}`, borderRadius: 7, fontSize: 13, fontFamily: DS.fonts.ui, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Colore</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['#0A8A7A','#6D28D9','#BE185D','#2563EB','#B45309','#0F7B5A'].map(c => (
                  <div key={c} onClick={() => setForm((p: any) => ({ ...p, colore: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${form.colore === c ? '#0D1117' : 'transparent'}` }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setCustomizing(false)} style={{ padding: '8px 14px', border: `1px solid ${S.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.fonts.ui }}>← Indietro</button>
              <button onClick={create} disabled={!form.nome || creating}
                style={{ padding: '8px 20px', background: form.nome ? S.teal : S.borderLight, color: form.nome ? '#fff' : S.textMuted, border: 'none', borderRadius: 7, cursor: form.nome ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600, fontFamily: DS.fonts.ui }}>
                {creating ? 'Creando...' : 'Crea progetto'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
