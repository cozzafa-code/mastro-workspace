// lib/types.ts
// MASTRO WORKSPACE — tipi centralizzati

export interface Progetto {
  id: string
  nome: string
  descrizione?: string
  stato: string
  colore?: string
  mrr?: number
  obiettivo_mrr?: number
  beta_clienti?: number
  prezzo?: number
  priorita?: number
  repo?: string
  url?: string
  stack?: string
  fase?: string
  responsabile?: string
  data_lancio?: string
  data_inizio?: string
  note_private?: string
  created_at?: string
}

export interface ProjectLog {
  id: string
  progetto_id: string
  tipo: 'decisione' | 'nota' | 'milestone' | 'problema' | 'meeting'
  titolo: string
  contenuto?: string
  autore: 'fabio' | 'lidia'
  priorita: 'alta' | 'normale' | 'bassa'
  data_evento?: string
  tag?: string[]
  created_at?: string
}

export interface Task {
  id: string
  titolo?: string
  testo?: string
  dettaglio?: string
  chi?: string
  priorita?: string
  scadenza?: string
  stato?: string
  progetto?: string
  progetto_id?: string
  created_at?: string
}

export interface Campagna {
  id: string
  nome: string
  tipo?: string
  canale?: string
  obiettivo?: string
  stato?: string
  progetto_id?: string
  responsabile?: string
  // Metriche base
  leads_totali?: number
  email_inviate?: number
  risposte?: number
  conversioni?: number
  click?: number
  impression?: number
  // Budget
  budget_totale?: number
  spend_attuale?: number
  // Date
  data_inizio?: string
  data_fine?: string
  target_leads?: number
  note?: string
  tag?: string[]
  created_at?: string
}

export interface CampagnaMetrica {
  id: string
  campagna_id: string
  data?: string
  spend?: number
  leads?: number
  click?: number
  impression?: number
  conversioni?: number
  note?: string
  created_at?: string
}

export interface Cliente {
  id: string
  nome?: string
  ragione_sociale?: string
  ruolo?: string
  settore?: string
  azienda?: string
  citta?: string
  paese?: string
  email?: string
  telefono?: string
  tipo?: string
  note?: string
  stato?: string
  // Pipeline CRM
  pipeline_stage?: PipelineStage
  deal_value?: number
  follow_up_date?: string
  progetto_interesse?: string
  fonte?: string
  ultimo_contatto?: string
  note_pipeline?: string
  created_at?: string
}

export type PipelineStage = 'lead' | 'contatto' | 'demo' | 'proposta' | 'chiuso_vinto' | 'chiuso_perso'

export interface CrmAttivita {
  id: string
  cliente_id: string
  tipo: 'chiamata' | 'email' | 'demo' | 'whatsapp' | 'meeting' | 'nota'
  titolo: string
  contenuto?: string
  autore: string
  data_attivita?: string
  esito?: 'positivo' | 'neutro' | 'negativo'
  created_at?: string
}

export interface Spesa {
  id: string
  nome?: string
  voce?: string
  importo?: number
  tipo?: string
  frequenza?: string
  freq?: string
  categoria?: string
  cat?: string
  created_at?: string
}

export interface ItemPersonale {
  id: string
  utente: string
  tipo_item: string
  titolo?: string
  contenuto?: string
  tag?: string
  priorita?: string
  stato?: string
  scadenza?: string
  created_at?: string
}

export interface MrrSnapshot {
  id: string
  progetto_id?: string
  progetto_nome?: string
  valore?: number
  clienti_num?: number
  mese?: string
  note?: string
  data?: string
  created_at?: string
}

export type UserType = 'fabio' | 'lidia'
export type TabType = 'dashboard' | 'progetti' | 'task' | 'campagne' | 'clienti' | 'lab_idee' | 'spese' | 'personale'
