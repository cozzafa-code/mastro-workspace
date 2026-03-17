// app/api/fattura-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const fattura = await req.json()

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; padding: 40px; background: white; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #14B8A6; }
  .logo { font-size: 22px; font-weight: 800; color: #0A8A7A; letter-spacing: -0.5px; }
  .fattura-title { text-align: right; }
  .fattura-title h1 { font-size: 28px; font-weight: 700; color: #0D1117; }
  .fattura-title .numero { font-size: 16px; color: #6B7280; margin-top: 4px; }
  .parti { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 36px; }
  .parte h3 { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
  .parte .nome { font-size: 15px; font-weight: 600; color: #0D1117; margin-bottom: 4px; }
  .parte .info { font-size: 12px; color: #6B7280; line-height: 1.6; }
  .meta { display: flex; gap: 32px; margin-bottom: 32px; padding: 16px 20px; background: #F7F8FA; border-radius: 8px; }
  .meta-item label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
  .meta-item span { font-size: 13px; font-weight: 500; color: #0D1117; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #F7F8FA; }
  thead th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB; }
  tbody tr { border-bottom: 1px solid #F3F4F6; }
  tbody td { padding: 11px 12px; font-size: 13px; color: #374151; }
  .text-right { text-align: right; }
  .totali { margin-left: auto; width: 280px; }
  .totale-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #6B7280; }
  .totale-finale { display: flex; justify-content: space-between; padding: 12px 16px; background: #0A8A7A; border-radius: 8px; margin-top: 8px; }
  .totale-finale span { color: white; font-weight: 700; }
  .totale-finale .importo { font-size: 20px; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; }
  .regime-nota { margin-top: 20px; padding: 12px 16px; background: #FEF3E2; border-radius: 6px; font-size: 11px; color: #B45309; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">MASTRO</div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">Suite ERP per Serramentisti</div>
    </div>
    <div class="fattura-title">
      <h1>FATTURA</h1>
      <div class="numero">N° ${fattura.numero}</div>
    </div>
  </div>

  <div class="parti">
    <div class="parte">
      <h3>Emittente</h3>
      <div class="nome">${fattura.emittente_nome || ''}</div>
      <div class="info">
        P.IVA: ${fattura.emittente_piva || ''}<br>
        Regime: ${fattura.emittente_regime === 'forfettario' ? 'Forfettario' : fattura.emittente_regime === 'danese' ? 'ApS Danese' : 'Ordinario'}
      </div>
    </div>
    <div class="parte">
      <h3>${fattura.tipo === 'attiva' ? 'Cliente' : 'Fornitore'}</h3>
      <div class="nome">${fattura.controparte_nome}</div>
      <div class="info">
        ${fattura.controparte_piva ? `P.IVA: ${fattura.controparte_piva}<br>` : ''}
        ${fattura.controparte_cf ? `C.F.: ${fattura.controparte_cf}<br>` : ''}
        ${fattura.controparte_citta ? `${fattura.controparte_citta}, ${fattura.controparte_paese || 'IT'}` : ''}
      </div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item"><label>Data emissione</label><span>${fattura.data_emissione}</span></div>
    ${fattura.data_scadenza ? `<div class="meta-item"><label>Scadenza</label><span>${fattura.data_scadenza}</span></div>` : ''}
    <div class="meta-item"><label>Valuta</label><span>${fattura.valuta || 'EUR'}</span></div>
    <div class="meta-item"><label>Stato</label><span>${fattura.stato}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descrizione</th>
        <th class="text-right">Q.tà</th>
        <th class="text-right">Prezzo unit.</th>
        <th class="text-right">IVA%</th>
        <th class="text-right">Imponibile</th>
        <th class="text-right">Totale</th>
      </tr>
    </thead>
    <tbody>
      ${(fattura.righe || []).map((r: any) => `
      <tr>
        <td>${r.descrizione}</td>
        <td class="text-right">${r.quantita}</td>
        <td class="text-right">€${Number(r.prezzo_unit).toFixed(2)}</td>
        <td class="text-right">${r.iva_aliquota}%</td>
        <td class="text-right">€${Number(r.imponibile).toFixed(2)}</td>
        <td class="text-right" style="font-weight:600">€${Number(r.totale).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totali">
    <div class="totale-row"><span>Imponibile</span><span>€${Number(fattura.imponibile).toFixed(2)}</span></div>
    <div class="totale-row"><span>IVA ${fattura.iva_aliquota || 22}%</span><span>€${Number(fattura.iva_importo).toFixed(2)}</span></div>
    <div class="totale-finale">
      <span style="font-size:14px">TOTALE</span>
      <span class="importo">€${Number(fattura.totale).toFixed(2)}</span>
    </div>
  </div>

  ${fattura.causale ? `<div style="margin-top:28px"><div style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Causale</div><div style="font-size:13px;color:#374151">${fattura.causale}</div></div>` : ''}

  ${fattura.emittente_regime === 'forfettario' ? `<div class="regime-nota">Operazione effettuata ai sensi dell'art. 1, commi 54-89, della Legge n. 190/2014 e successive modifiche. Imposta non esposta in fattura ai sensi delle disposizioni sopra citate. Marca da bollo assolta sull'originale.</div>` : ''}

  <div class="footer">
    Fattura generata da Mastro Suite — mastrosuite.com
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    }
  })
}
