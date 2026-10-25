import {generateManagerWhatsAppMessage as legacyMessage,AUDITED_REAL_FLEET_PROVISION} from '../data/weeklyFuelProvisionData.js';
export const presentCentralText=value=>String(value??'').replace(/Analista de Logística[^\n]*?CCO(?: Ambipar)?/g,'Analista de Transporte').replace(/\bCCO\b/g,'Central de Gestão');
export const generateManagerWhatsAppMessage=(...args)=>presentCentralText(legacyMessage(...args));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeReport(value){if(typeof value==='string')return escape(presentCentralText(value));if(Array.isArray(value))return value.map(safeReport);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,safeReport(v)]));return value;}
export function renderCentralAporte(doc, isGlobalAporte = false, withTechnicalMotives = true, customQuotas = null) {
  doc=safeReport(doc);
  const veiculos = doc.veiculos || safeReport(AUDITED_REAL_FLEET_PROVISION);
  const isWithMotives = doc.withTechnicalMotives !== undefined ? doc.withTechnicalMotives : withTechnicalMotives;
  const isGlobal = doc.isGlobalAporte !== undefined ? doc.isGlobalAporte : isGlobalAporte;
  const totalGeral = doc.valorTotalSolicitado ?? veiculos.reduce((sum,v)=>sum+(Number(customQuotas?.[v.placa]??v.solicitacaoAporteSugerido)||0),0);

  const htmlRows = veiculos.map(v => {
    const isVale = !v.recebeAporteAmbipar;
    const quota = customQuotas && customQuotas[v.placa] !== undefined
      ? customQuotas[v.placa]
      : v.solicitacaoAporteSugerido;

    return `
      <tr class="${isVale ? 'tr-vale' : ''}">
        <td class="bold-cell">
          <strong>${v.placa}</strong><br>
          <span class="sub-label">${v.prefixo}</span>
        </td>
        <td>
          <div class="model-title">${v.modelo}</div>
          <div class="op-desc">${v.operacao} ${v.isSporadicGIG ? '<span class="pill-gig">ESPORÁDICO</span>' : ''}</div>
        </td>
        <td class="center-cell">
          ${isVale 
            ? '<span class="pill-vale">Abastecido pela Vale (R$ 0,00)</span>' 
            : `<strong class="card-num">${v.cartaoNumero}</strong>`}
        </td>
        <td class="right-cell">${Number(v.kmRodado || 0).toLocaleString('pt-BR')} km</td>
        <td class="right-cell">${isVale ? '-' : `${v.litrosDieselTotal} L`}</td>
        <td class="right-cell">${isVale ? 'R$ 0,00' : `R$ ${Number(v.valorTotalGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</td>
        <td class="right-cell ${isVale ? '' : 'text-emerald'}">
          ${isVale ? '-' : `+ R$ ${Number(v.margemSegurancaRS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        </td>
        <td class="right-cell highlight-cell">
          ${isVale 
            ? '<strong class="text-vale">R$ 0,00 (Vale)</strong>' 
            : (isGlobal 
                ? '<span class="text-global">Saldo Global Master</span>' 
                : `<strong>R$ ${Number(quota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>`)}
        </td>
      </tr>
    `;
  }).join('');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Central de Gestão de Frota e Logística · Solicitação de Aporte</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 12px;
    }
    .print-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 14px;
      margin-bottom: 14px;
    }
    .btn-print {
      background: #166534;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-print:hover {
      background: #15803d;
    }
    @media print {
      .print-controls { display: none !important; }
      body { padding: 0 !important; }
    }
    .doc-container {
      width: 100%;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      padding: 18px;
      border-radius: 6px;
      background: #ffffff;
    }
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #166534;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .logo-badge {
      display: inline-block;
      background: #166534;
      color: #ffffff;
      font-weight: 900;
      font-size: 15px;
      letter-spacing: 2px;
      padding: 3px 10px;
      border-radius: 4px;
    }
    .header-subtext h2 {
      margin: 4px 0 2px 0;
      font-size: 12px;
      color: #166534;
      text-transform: uppercase;
      font-weight: 800;
    }
    .header-subtext p {
      margin: 0;
      font-size: 9.5px;
      color: #64748b;
    }
    .protocol-box {
      text-align: right;
      font-size: 9.5px;
      color: #334155;
    }
    .protocol-box strong {
      display: block;
      font-size: 10.5px;
      color: #1e293b;
      font-family: monospace;
    }
    .title-banner {
      background: #f8fafc;
      border-left: 4px solid #166534;
      padding: 8px 12px;
      margin-bottom: 12px;
      border-radius: 0 4px 4px 0;
    }
    .title-banner h1 {
      margin: 0 0 3px 0;
      font-size: 13.5px;
      color: #0f172a;
      font-weight: 800;
    }
    .title-banner p {
      margin: 0;
      font-size: 10px;
      color: #475569;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
    }
    .info-card label {
      display: block;
      font-size: 8.5px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .info-card strong {
      display: block;
      font-size: 11px;
      color: #0f172a;
      margin-top: 1px;
    }
    .info-card span {
      display: block;
      font-size: 9px;
      color: #64748b;
    }
    .highlight-card strong {
      color: #166534;
      font-size: 12.5px;
    }
    .motivo-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .motivo-box h3 {
      margin: 0 0 6px 0;
      font-size: 10.5px;
      color: #166534;
      font-weight: 800;
      text-transform: uppercase;
    }
    .motivo-item {
      margin-bottom: 4px;
      font-size: 9.5px;
      color: #1e293b;
    }
    .global-mode-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .global-mode-box h3 {
      margin: 0 0 4px 0;
      font-size: 10.5px;
      color: #1d4ed8;
      font-weight: 800;
      text-transform: uppercase;
    }
    .global-mode-box p {
      margin: 0 0 4px 0;
      font-size: 9.5px;
      color: #1e3a8a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 5px 6px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 4px 6px;
      border: 1px solid #cbd5e1;
      font-size: 9px;
      vertical-align: middle;
    }
    .tr-vale {
      background: #fffbeb;
    }
    .bold-cell strong {
      font-family: monospace;
      font-size: 10px;
    }
    .sub-label {
      font-size: 8px;
      color: #64748b;
      font-weight: 600;
    }
    .model-title {
      font-weight: 600;
      color: #0f172a;
    }
    .op-desc {
      font-size: 8px;
      color: #64748b;
    }
    .pill-gig {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 7px;
      font-weight: 700;
      padding: 1px 3px;
      border-radius: 2px;
      margin-left: 3px;
    }
    .pill-vale {
      background: #fef3c7;
      color: #92400e;
      font-size: 7.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      display: inline-block;
    }
    .card-num {
      color: #0369a1;
      font-family: monospace;
      font-size: 9px;
    }
    .center-cell { text-align: center; }
    .right-cell { text-align: right; font-family: monospace; }
    .highlight-cell {
      background: #f0fdf4;
      font-weight: 700;
      color: #166534;
      font-size: 9.5px;
    }
    .text-emerald { color: #16a34a; }
    .text-vale { color: #b45309; }
    .text-global { color: #2563eb; font-size: 8.5px; }
    tfoot td {
      background: #f8fafc;
      font-weight: 800;
      border-top: 2px solid #0f172a;
    }
    .signatures-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      border-top: 1px solid #94a3b8;
      padding-top: 4px;
    }
    .sig-box strong {
      display: block;
      font-size: 10px;
      color: #0f172a;
    }
    .sig-box span {
      display: block;
      font-size: 8.5px;
      color: #64748b;
    }
    .footer-stamp {
      margin-top: 14px;
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <div>
      <strong>Central de Gestão de Frota e Logística · Visualização Executiva de Impressão (Matriz de 21 Veículos)</strong><br>
      <span style="font-size: 10px; color: #64748b;">Layout certificado padrão A4 oficial para salvar em PDF ou imprimir sem bugs ou cortes.</span>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  </div>

  <div class="doc-container">
    <div class="doc-header">
      <div>
        <span class="logo-badge">AMBIPAR</span>
        <div class="header-subtext">
          <h2>Ambipar Logistics & Environmental Solutions</h2>
          <p>Gestão Integrada de Frotas & Torre de Controle Central de Gestão · Base Duque de Caxias / RJ</p>
        </div>
      </div>
      <div class="protocol-box">
        PROTOCOLO OFICIAL
        <strong>${doc.numeroProtocolo || 'AMB-APORTE-2026-W43/001'}</strong>
        <span>Fechamento: Quarta 17h | Envio: Quinta 08h</span>
      </div>
    </div>

    <div class="title-banner">
      <h1>SOLICITAÇÃO OFICIAL DE APORTE SEMANAL · CARTÃO ABANK FROTA</h1>
      <p>
        Demonstrativo corporativo de saldo de <strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> para os <strong>15 veículos ativos Ambipar</strong>.
        Os <strong>6 veículos dedicados à Vale S.A.</strong> constam com cota <strong>R$ 0,00</strong> por abastecimento direto no terminal do cliente.
      </p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <label>Gestor Aprovador:</label>
        <strong>${doc.gestorNome || 'Responsável pela aprovação'}</strong>
        <span>${doc.gestorCargo || 'Gerente Geral Logística RJ'}</span>
      </div>
      <div class="info-card">
        <label>Analista de Transporte:</label>
        <strong>${doc.analistaNome || 'Responsável pela solicitação'}</strong>
        <span>${doc.analistaCargo || 'Analista de Operações'}</span>
      </div>
      <div class="info-card">
        <label>Convênio de Abastecimento:</label>
        <strong>${doc.convenio || 'Cartão Abank Frota'}</strong>
        <span>Recargas Corporativas</span>
      </div>
      <div class="info-card highlight-card">
        <label>Total do Aporte Solicitado:</label>
        <strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        <span>15 Veículos Ambipar | 6 Veículos Vale (R$ 0,00)</span>
      </div>
    </div>

    ${isGlobal ? `
      <div class="global-mode-box">
        <h3>Modalidade Executiva: Aporte Global Unificado na Conta Master Abank (Sem Divisão Prévia)</h3>
        <p>
          O saldo total de <strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> é solicitado como crédito unificado centralizado na <strong>Conta Master Abank Frota</strong> para alocação flexível aos 15 veículos ativos da Ambipar.
        </p>
        <p style="margin: 0; font-size: 9px;">
          <em>Regra Vale S.A.:</em> Os 6 caminhões/vans dedicados à <strong>Vale S.A. continuam com cota R$ 0,00</strong> (abastecimento pelo cliente).
        </p>
      </div>
    ` : ''}

    ${isWithMotives ? `
      <div class="motivo-box">
        <h3>1. Justificativa Técnica Operacional & Regras de Atendimento</h3>
        <div class="motivo-item">
          <strong>• Veículos da Vale S.A. (6 veículos - Cota R$ 0,00):</strong> RHU-6I87, GEB-8C37, FOT-2A43, EXR-6J33, FKD-5E24 e FJU-4A05 <em>NÃO recebem abastecimento da nossa parte e não possuem Cartão Abank</em>. O combustível é 100% fornecido pela Vale em seus terminais/minas.
        </div>
        <div class="motivo-item">
          <strong>• Amazon CD Meriti (GIG 1 / GIG 7 - Solicitação Esporádica):</strong> Atendimento sob demanda com cota de prontidão assegurada.
        </div>
        <div class="motivo-item">
          <strong>• Tomada de Força (PTO):</strong> Caminhão de Hidrovácuo (FMB-1H09) opera com sucção ligada sem rodar odômetro.
        </div>
        <div class="motivo-item">
          <strong>• Margem Significativa de Segurança:</strong> Provisão indispensável contra retenções de trânsito na Dutra e Linha Vermelha.
        </div>
      </div>
    ` : ''}

    <h3>${isGlobal ? '2. Matriz de Referência Operacional da Frota (21 Veículos Cadastrados na Base)' : '2. Matriz de Alocação de Cotas por Veículo / Cartão Abank (21 Veículos)'}</h3>
    <table>
      <thead>
        <tr>
          <th>Placa / Prefixo</th>
          <th>Modelo & Operação</th>
          <th>Cartão Abank</th>
          <th style="text-align: right;">KM Rodado</th>
          <th style="text-align: right;">Diesel (L)</th>
          <th style="text-align: right;">Gasto Real (R$)</th>
          <th style="text-align: right;">Margem (+11.8%)</th>
          <th style="text-align: right; background: #e2e8f0; color: #0f172a;">${isGlobal ? 'Alocação' : 'Cota Aporte (R$)'}</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>TOTAL CONSOLIDADO (${veiculos.length} VEÍCULOS NO PERÍODO)</strong></td>
          <td class="right-cell"><strong>${Number(doc.totalKm || 12040).toLocaleString('pt-BR')} km</strong></td>
          <td class="right-cell"><strong>${Number(doc.totalDiesel || 2548).toLocaleString('pt-BR')} L</strong></td>
          <td class="right-cell"><strong>R$ ${Number(doc.valorGastoReal || 15309.89).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
          <td class="right-cell text-emerald"><strong>+ R$ ${Number(doc.valorMargemSeguranca || 1690.11).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
          <td class="right-cell highlight-cell" style="font-size: 11px;"><strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div class="signatures-block">
      <div class="sig-box">
        <strong>${doc.analistaNome || 'Responsável pela solicitação'}</strong>
        <span>Analista de Operações & Central de Gestão Ambipar</span>
        <span style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Assinatura Digital / Emissor</span>
      </div>
      <div class="sig-box">
        <strong>${doc.gestorNome || 'Responsável pela aprovação'}</strong>
        <span>Gerente Geral de Logística & Operações RJ</span>
        <span style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Aprovação & Liberação Abank</span>
      </div>
    </div>

    <div class="footer-stamp">
      Ambipar Logistics · Central de Gestão Torre de Controle Rio de Janeiro · Documento Oficial Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)} · Protocolo: ${doc.numeroProtocolo || 'AMB-APORTE'}
    </div>
  </div>
</body>
</html>`;

  return html;
}

export function printAporteDossierCleanWindow(...args){const win=window.open('','_blank','width=1050,height=900,menubar=no,toolbar=no');if(!win){window.alert('Permita a abertura da janela de impressão para salvar o PDF.');return;}win.document.open();win.document.write(renderCentralAporte(...args));win.document.close();win.focus();}
