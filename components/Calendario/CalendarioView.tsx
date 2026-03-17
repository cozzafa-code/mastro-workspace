// components/Calendario/CalendarioView.tsx
'use client'
import { FC, useState, useEffect, useCallback } from 'react'
import { DS } from '@/constants/design-system'
import { supabase } from '@/lib/supabase'
import { useDevice } from '@/hooks/useDevice'

const S = DS.colors

interface CalEvent {
  id: string; titolo: string; data: string; ora?: string
  tipo: 'task'|'followup'|'campagna'|'milestone'|'meeting'|'scadenza'|'evento'|'riunione'|'reminder'
  colore: string; fonte: string; custom?: boolean; note?: string
}

const TIPO_CFG: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  task:     { bg: '#DBEAFE', text: '#2563EB', label: 'Task',      dot: '#2563EB' },
  followup: { bg: '#FEF3E2', text: '#B45309', label: 'Follow-up', dot: '#B45309' },
  campagna: { bg: '#EDE9FE', text: '#6D28D9', label: 'Campagna',  dot: '#6D28D9' },
  milestone:{ bg: '#D1FAE5', text: '#0F7B5A', label: 'Milestone', dot: '#0F7B5A' },
  meeting:  { bg: '#FFE4E6', text: '#BE185D', label: 'Meeting',   dot: '#BE185D' },
  scadenza: { bg: '#FCEAEA', text: '#C93535', label: 'Scadenza',  dot: '#C93535' },
  evento:   { bg: '#EDF7F6', text: '#0A8A7A', label: 'Evento',    dot: '#0A8A7A' },
  riunione: { bg: '#FEF3C7', text: '#92400E', label: 'Riunione',  dot: '#92400E' },
  reminder: { bg: '#F3F4F6', text: '#6B7280', label: 'Reminder',  dot: '#6B7280' },
}

const GIORNI = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const fmt = (d: Date) => d.toISOString().split('T')[0]

export const CalendarioView: FC<{ currentUser?: string }> = ({ currentUser = 'fabio' }) => {
  const device = useDevice()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'mese'|'settimana'>(device.isMobile ? 'settimana' : 'mese')
  const today = new Date()
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState(fmt(today))
  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState<any>({})

  const load = useCallback(async () => {
    setLoading(true)
    const [tRes, cRes, camRes, logRes, evRes] = await Promise.all([
      supabase.from('tasks').select('id,titolo,testo,scadenza,stato,chi,progetto').not('scadenza','is',null),
      supabase.from('clienti').select('id,nome,follow_up_date').not('follow_up_date','is',null),
      supabase.from('campagne').select('id,nome,data_inizio,data_fine').or('data_inizio.not.is.null,data_fine.not.is.null'),
      supabase.from('project_logs').select('id,titolo,data_evento,tipo').not('data_evento','is',null),
      supabase.from('calendario_eventi').select('*').order('data'),
    ])
    const evs: CalEvent[] = []
    ;(tRes.data||[]).forEach((t:any) => { if(!t.scadenza||t.stato==='completato'||t.stato==='Fatto') return; evs.push({id:`task-${t.id}`,titolo:t.titolo||t.testo||'Task',data:t.scadenza,tipo:'task',colore:'#2563EB',fonte:t.progetto||t.chi||''}) })
    ;(cRes.data||[]).forEach((c:any) => { if(!c.follow_up_date) return; evs.push({id:`fu-${c.id}`,titolo:`Follow-up: ${c.nome}`,data:c.follow_up_date,tipo:'followup',colore:'#B45309',fonte:'CRM'}) })
    ;(camRes.data||[]).forEach((c:any) => {
      if(c.data_inizio) evs.push({id:`cam-s-${c.id}`,titolo:`Avvio: ${c.nome}`,data:c.data_inizio,tipo:'campagna',colore:'#6D28D9',fonte:'Campagne'})
      if(c.data_fine) evs.push({id:`cam-e-${c.id}`,titolo:`Fine: ${c.nome}`,data:c.data_fine,tipo:'scadenza',colore:'#C93535',fonte:'Campagne'})
    })
    ;(logRes.data||[]).forEach((l:any) => { if(!l.data_evento) return; const t=l.tipo==='milestone'?'milestone':l.tipo==='meeting'?'meeting':'task'; evs.push({id:`log-${l.id}`,titolo:l.titolo,data:l.data_evento,tipo:t,colore:TIPO_CFG[t].dot,fonte:'Progetti'}) })
    ;(evRes.data||[]).forEach((e:any) => { evs.push({id:`ev-${e.id}`,titolo:e.titolo,data:e.data,ora:e.ora_inizio,tipo:e.tipo||'evento',colore:e.colore||'#0A8A7A',fonte:e.utente,custom:true,note:e.note}) })
    setEvents(evs.sort((a,b) => a.data.localeCompare(b.data)))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  const evsByDay = useCallback((d:string) => events.filter(e => e.data===d), [events])

  const saveNewEvent = async () => {
    if(!newForm.titolo||!newForm.data) return
    await supabase.from('calendario_eventi').insert({ titolo:newForm.titolo, data:newForm.data, tipo:newForm.tipo||'evento', ora_inizio:newForm.ora||null, colore:TIPO_CFG[newForm.tipo||'evento']?.dot||'#0A8A7A', note:newForm.note||null, utente:currentUser })
    await load(); setShowNewForm(false); setNewForm({})
  }

  const deleteEv = async (id:string) => { await supabase.from('calendario_eventi').delete().eq('id',id.replace('ev-','')); await load() }

  const openAdd = (date: string) => { setNewForm({ data: date, tipo: 'evento' }); setShowNewForm(true) }

  function renderMese() {
    const firstDay = new Date(current.year, current.month, 1)
    const lastDay = new Date(current.year, current.month+1, 0)
    const startDow = (firstDay.getDay()+6)%7
    const total = Math.ceil((startDow+lastDay.getDate())/7)*7
    const todayStr = fmt(today)
    return (
      <div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:2}}>
          {GIORNI.map(g=><div key={g} style={{textAlign:'center',fontSize:10,fontWeight:700,color:S.textMuted,padding:'5px 0',textTransform:'uppercase',letterSpacing:0.4}}>{g}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
          {Array.from({length:total},(_,i)=>{
            const d=i-startDow+1
            if(d<1||d>lastDay.getDate()) return <div key={i} style={{minHeight:76,background:'#FAFAFA',borderRadius:6}}/>
            const ds=`${current.year}-${String(current.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const de=evsByDay(ds); const isT=ds===todayStr; const isSel=ds===selectedDay
            return (
              <div key={i} onClick={()=>setSelectedDay(ds)}
                style={{minHeight:76,background:isSel?'#EDF7F6':S.surface,border:`1px solid ${isSel?S.teal:isT?S.tealMid:S.border}`,borderRadius:8,padding:'5px 4px',cursor:'pointer'}}>
                <div style={{fontSize:11,fontWeight:isT?700:400,color:isT?'#fff':S.textSecondary,background:isT?S.teal:'transparent',width:18,height:18,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:3,fontSize:11}}>{d}</div>
                {de.slice(0,2).map(e=>{const c=TIPO_CFG[e.tipo]||TIPO_CFG.evento;return<div key={e.id} style={{fontSize:8,background:c.bg,color:c.text,borderRadius:3,padding:'1px 3px',marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600}}>{e.titolo}</div>})}
                {de.length>2&&<div style={{fontSize:8,color:S.textMuted,fontWeight:600}}>+{de.length-2}</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderSettimana() {
    const todayStr=fmt(today)
    const mon=new Date(today); mon.setDate(today.getDate()-((today.getDay()+6)%7))
    const days=Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return fmt(d)})
    return (
      <div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:12}}>
          {days.map((d,i)=>{
            const isT=d===todayStr; const isSel=d===selectedDay; const de=evsByDay(d)
            return <div key={d} onClick={()=>setSelectedDay(d)} style={{textAlign:'center',cursor:'pointer',padding:'7px 3px',borderRadius:10,background:isSel?S.teal:isT?S.tealLight:'transparent',border:`1px solid ${isSel?S.teal:isT?S.tealMid:'transparent'}`}}>
              <div style={{fontSize:9,color:isSel?'rgba(255,255,255,0.7)':S.textMuted,textTransform:'uppercase',fontWeight:600}}>{GIORNI[i]}</div>
              <div style={{fontSize:17,fontWeight:700,color:isSel?'#fff':isT?S.teal:S.textPrimary,lineHeight:1.3}}>{new Date(d).getDate()}</div>
              {de.length>0&&<div style={{display:'flex',justifyContent:'center',gap:2,marginTop:3}}>{de.slice(0,3).map((e,j)=><div key={j} style={{width:5,height:5,borderRadius:'50%',background:isSel?'rgba(255,255,255,0.7)':TIPO_CFG[e.tipo]?.dot||S.teal}}/>)}</div>}
            </div>
          })}
        </div>
        {renderDayDetail(selectedDay)}
      </div>
    )
  }

  function renderDayDetail(ds: string) {
    const de=evsByDay(ds)
    const d=new Date(ds+'T12:00:00')
    const label=`${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
    return (
      <div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,paddingTop:10,borderTop:`1px solid ${S.border}`}}>
          <div style={{fontSize:13,fontWeight:700,color:S.textPrimary}}>{label} · {de.length} eventi</div>
          <button onClick={()=>openAdd(ds)} style={{padding:'5px 10px',background:S.teal,color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Aggiungi</button>
        </div>
        {de.length===0
          ?<div onClick={()=>openAdd(ds)} style={{textAlign:'center',padding:'20px',fontSize:12,color:S.textMuted,background:S.surface,border:`2px dashed ${S.border}`,borderRadius:10,cursor:'pointer'}}>Nessun evento · clicca per aggiungere</div>
          :de.map(e=>{const c=TIPO_CFG[e.tipo]||TIPO_CFG.evento;return(
            <div key={e.id} style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:10,padding:'10px 14px',marginBottom:7,borderLeft:`3px solid ${e.colore}`,display:'flex',justifyContent:'space-between',gap:8}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                  <span style={{fontSize:10,background:c.bg,color:c.text,padding:'1px 6px',borderRadius:20,fontWeight:600}}>{c.label}</span>
                  {e.ora&&<span style={{fontSize:10,color:S.textMuted,fontFamily:DS.fonts.mono}}>{e.ora}</span>}
                  <span style={{fontSize:10,color:S.textMuted}}>{e.fonte}</span>
                </div>
                <div style={{fontSize:13,fontWeight:500,color:S.textPrimary}}>{e.titolo}</div>
                {e.note&&<div style={{fontSize:11,color:S.textMuted,marginTop:3}}>{e.note}</div>}
              </div>
              {e.custom&&<button onClick={()=>deleteEv(e.id)} style={{background:'none',border:'none',cursor:'pointer',color:S.textMuted,fontSize:13,flexShrink:0}}>✕</button>}
            </div>
          )})
        }
      </div>
    )
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300}}><span style={{fontSize:13,color:S.textMuted}}>Caricamento...</span></div>

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:device.isMobile?16:18,fontWeight:700,color:S.textPrimary,letterSpacing:'-0.3px'}}>{view==='mese'?`${MESI[current.month]} ${current.year}`:'Questa settimana'}</div>
          <div style={{fontSize:12,color:S.textMuted,marginTop:1}}>{events.length} eventi totali</div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {view==='mese'&&<>
            <button onClick={()=>setCurrent(c=>{const d=new Date(c.year,c.month-1);return{year:d.getFullYear(),month:d.getMonth()}})} style={{width:32,height:32,border:`1px solid ${S.border}`,borderRadius:7,background:'none',cursor:'pointer',fontSize:16}}>‹</button>
            <button onClick={()=>setCurrent(c=>{const d=new Date(c.year,c.month+1);return{year:d.getFullYear(),month:d.getMonth()}})} style={{width:32,height:32,border:`1px solid ${S.border}`,borderRadius:7,background:'none',cursor:'pointer',fontSize:16}}>›</button>
          </>}
          <button onClick={()=>openAdd(fmt(today))} style={{padding:'7px 12px',background:S.teal,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Evento</button>
          <div style={{display:'flex',border:`1px solid ${S.border}`,borderRadius:7,overflow:'hidden'}}>
            {(['mese','settimana'] as const).map(v=><button key={v} onClick={()=>setView(v)} style={{padding:'6px 10px',border:'none',background:view===v?S.teal:'none',color:view===v?'#fff':S.textSecondary,fontSize:11,fontWeight:view===v?600:400,cursor:'pointer',fontFamily:'inherit'}}>{v==='mese'?'Mese':'Sett.'}</button>)}
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
        {['task','followup','campagna','milestone','meeting','evento'].map(k=><div key={k} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:7,height:7,borderRadius:'50%',background:TIPO_CFG[k].dot}}/><span style={{fontSize:10,color:S.textMuted}}>{TIPO_CFG[k].label}</span></div>)}
      </div>

      <div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,padding:device.isMobile?10:20,marginBottom:16}}>
        {view==='mese'?renderMese():renderSettimana()}
      </div>

      {view==='mese'&&<div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,padding:'16px 20px'}}>{renderDayDetail(selectedDay)}</div>}

      {showNewForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:16,backdropFilter:'blur(2px)'}}
          onClick={e=>{if(e.target===e.currentTarget){setShowNewForm(false);setNewForm({})}}}>
          <div style={{background:S.surface,borderRadius:14,padding:24,width:'100%',maxWidth:400,boxShadow:DS.shadow.xl}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:16,color:S.textPrimary}}>Nuovo evento</div>
            {[{label:'Titolo *',key:'titolo',ph:'es. Call con cliente'},{label:'Data',key:'data',type:'date'},{label:'Ora',key:'ora',type:'time'}].map(f=>(
              <div key={f.key} style={{marginBottom:10}}>
                <label style={{display:'block',fontSize:10,fontWeight:700,color:S.textMuted,textTransform:'uppercase',letterSpacing:0.4,marginBottom:3}}>{f.label}</label>
                <input type={f.type||'text'} value={newForm[f.key]||''} onChange={e=>setNewForm((p:any)=>({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                  style={{width:'100%',padding:'7px 10px',border:`1px solid ${S.border}`,borderRadius:7,fontSize:13,fontFamily:'inherit',background:S.surface,boxSizing:'border-box'}}/>
              </div>
            ))}
            <div style={{marginBottom:10}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,color:S.textMuted,textTransform:'uppercase',letterSpacing:0.4,marginBottom:6}}>Tipo</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {['evento','riunione','scadenza','reminder'].map(t=>(
                  <button key={t} onClick={()=>setNewForm((p:any)=>({...p,tipo:t}))} style={{padding:'4px 10px',border:`1px solid ${newForm.tipo===t?S.teal:S.border}`,borderRadius:20,background:newForm.tipo===t?S.tealLight:'none',color:newForm.tipo===t?S.teal:S.textSecondary,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:newForm.tipo===t?600:400}}>
                    {TIPO_CFG[t]?.label||t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,color:S.textMuted,textTransform:'uppercase',letterSpacing:0.4,marginBottom:3}}>Note</label>
              <textarea value={newForm.note||''} onChange={e=>setNewForm((p:any)=>({...p,note:e.target.value}))} rows={2}
                style={{width:'100%',padding:'7px 10px',border:`1px solid ${S.border}`,borderRadius:7,fontSize:13,fontFamily:'inherit',resize:'none',background:S.surface,boxSizing:'border-box'}}/>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:12,borderTop:`1px solid ${S.borderLight}`}}>
              <button onClick={()=>{setShowNewForm(false);setNewForm({})}} style={{padding:'8px 14px',border:`1px solid ${S.border}`,borderRadius:7,background:'none',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Annulla</button>
              <button onClick={saveNewEvent} style={{padding:'8px 18px',background:S.teal,color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
