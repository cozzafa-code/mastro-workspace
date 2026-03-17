// lib/types-contabilita.ts
// Tipi per il modulo contabilità M11

export interface Fattura {
  id: string
  numero: string
  tipo: 'attiva' | 'passiva'
  stato: 'bozza' | 'emessa' | 'inviata_sdi' | 'accettata' | 'pagata' | 'scaduta' | 'annullata'
  data_emissione: string
  data_scadenza?: string
  data_pagamento?: string
  // Controparte
  controparte_nome: string
  controparte_piva?: string
  controparte_cf?: string
  controparte_indirizzo?: string
  controparte_cap?: string
  controparte_citta?: string
  controparte_paese?: string
  // Emittente
  emittente_nome?: string
  emittente_piva?: string
  emittente_regime?: 'ordinario' | 'forfettario' | 'danese'
  // Importi
  imponibile: number
  iva_aliquota: number
  iva_importo: number
  totale: number
  totale_pagato?: number
  // SDI
  sdi_id?: string
  sdi_xml?: string
  sdi_stato?: 'non_inviata' | 'in_attesa' | 'consegnata' | 'accettata' | 'rifiutata'
  sdi_data_invio?: string
  // Meta
  causale?: string
  note?: string
  progetto_id?: string
  cliente_id?: string
  valuta?: string
  paese_fiscale?: string
  created_at?: string
}

export interface RigaFattura {
  id?: string
  fattura_id?: string
  descrizione: string
  quantita: number
  prezzo_unit: number
  iva_aliquota: number
  imponibile: number
  iva_importo: number
  totale: number
  ordine?: number
}

export interface PrimaNota {
  id: string
  data: string
  descrizione: string
  tipo: 'dare' | 'avere'
  importo: number
  conto_id?: string
  conto_nome?: string
  fattura_id?: string
  categoria?: string
  note?: string
  created_at?: string
}

export interface ScadenzarioItem {
  id: string
  tipo: 'incasso' | 'pagamento' | 'tassa' | 'contributo'
  descrizione: string
  importo: number
  data_scadenza: string
  data_pagato?: string
  stato: 'aperto' | 'pagato' | 'scaduto' | 'parziale'
  fattura_id?: string
  note?: string
  created_at?: string
}

export interface Conto {
  id: string
  codice: string
  nome: string
  tipo: 'attivo' | 'passivo' | 'ricavo' | 'costo' | 'patrimoniale'
  categoria?: string
  attivo: boolean
}
