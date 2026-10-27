import React, { useState } from 'react';
import { ORDER_STATUS, ORDER_TYPES, PRIORITIES, formatTiposLabels, getOrderTipos } from '../../../utils/orderValidation';
import { money, date } from '../PartnerDetail';
import { orderDocumentName, orderMessage, downloadOrderWorkbook } from '../../../utils/orderWorkbook';
import { orderDispatchDocument } from '../../../services/maintenanceOrders';

export const PRINT_MONOCHROME_CSS = `
  @page {
    size: A4 portrait;
    margin: 5mm 7mm 5mm 7mm;
  }
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .os-doc-paper.monochrome {
    width: 100%;
    max-width: 100%;
    background: #ffffff;
    color: #000000;
    padding: 0;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif;
    font-size: 8pt;
    line-height: 1.22;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
  }
  .os-bw-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #000000;
    padding-bottom: 3px;
    margin-bottom: 4px;
  }
  .os-bw-brand-title {
    font-size: 14pt;
    font-weight: 900;
    color: #000000;
    letter-spacing: 0.5px;
    margin: 0;
    line-height: 1.1;
  }
  .os-bw-brand-sub {
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #222222;
    letter-spacing: 0.4px;
  }
  .os-bw-meta-box {
    text-align: right;
  }
  .os-bw-sdo-badge {
    display: inline-block;
    background: #000000;
    color: #ffffff;
    font-size: 7.5pt;
    font-weight: 900;
    padding: 2px 7px;
    border-radius: 2px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .os-bw-sdo-num {
    font-size: 13pt;
    font-weight: 900;
    font-family: monospace;
    color: #000000;
    letter-spacing: 1px;
    margin: 1px 0;
    line-height: 1.1;
  }
  .os-bw-sdo-date {
    font-size: 7pt;
    font-weight: 600;
    color: #333333;
  }
  .os-bw-class-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #000000;
    background: #f4f4f4;
    padding: 2.5px 6px;
    margin-bottom: 4px;
    font-size: 7.5pt;
  }
  .os-bw-class-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .os-bw-class-label {
    font-weight: 700;
    text-transform: uppercase;
    font-size: 7pt;
  }
  .os-bw-class-badge {
    display: inline-block;
    border: 1px solid #000000;
    background: #ffffff;
    padding: 1px 5px;
    font-weight: 800;
    font-size: 7.5pt;
    border-radius: 2px;
  }
  .os-bw-section {
    border: 1px solid #000000;
    margin-bottom: 4px;
    page-break-inside: avoid !important;
  }
  .os-bw-section-title {
    background: #e6e6e6;
    color: #000000;
    font-size: 7.5pt;
    font-weight: 900;
    text-transform: uppercase;
    padding: 2px 6px;
    border-bottom: 1px solid #000000;
    letter-spacing: 0.3px;
  }
  .os-bw-vehicle-layout {
    display: flex;
    align-items: center;
    padding: 3px 6px;
    gap: 8px;
  }
  .os-bw-plate-card {
    width: 105px;
    flex-shrink: 0;
    border: 2px solid #000000;
    border-radius: 3px;
    text-align: center;
    background: #ffffff;
    overflow: hidden;
  }
  .os-bw-plate-top {
    background: #000000;
    color: #ffffff;
    font-size: 6pt;
    font-weight: 900;
    letter-spacing: 0.8px;
    padding: 1px 0;
  }
  .os-bw-plate-num {
    font-size: 13.5pt;
    font-weight: 900;
    letter-spacing: 1.5px;
    font-family: monospace;
    color: #000000;
    padding: 1px 0;
    line-height: 1.1;
  }
  .os-bw-plate-bot {
    font-size: 5.5pt;
    font-weight: 800;
    color: #000000;
    border-top: 1px solid #000000;
    letter-spacing: 0.5px;
    background: #f4f4f4;
    padding: 0.5px 0;
  }
  .os-bw-km-highlight {
    border: 1.5px solid #000000;
    background: #f4f4f4;
    border-radius: 3px;
    padding: 3px 8px;
    text-align: center;
    flex-shrink: 0;
    min-width: 125px;
  }
  .os-bw-km-label {
    font-size: 6pt;
    font-weight: 800;
    text-transform: uppercase;
    color: #000000;
    margin-bottom: 1px;
  }
  .os-bw-km-val {
    font-size: 12pt;
    font-weight: 900;
    font-family: monospace;
    color: #000000;
    line-height: 1.1;
  }
  .os-bw-vehicle-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5px 8px;
    flex: 1;
    font-size: 7.2pt;
  }
  .os-bw-field-line {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dashed #d0d0d0;
    padding: 0.5px 0;
  }
  .os-bw-field-line:last-child {
    border-bottom: none;
  }
  .os-bw-label {
    font-weight: 700;
    color: #222222;
  }
  .os-bw-val {
    font-weight: 800;
    color: #000000;
    text-align: right;
  }
  .os-bw-two-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-bottom: 4px;
    page-break-inside: avoid !important;
  }
  .os-bw-card-inner {
    padding: 2.5px 6px;
    font-size: 7.2pt;
  }
  .os-bw-defects-body {
    padding: 3px 6px;
    font-size: 7.5pt;
    line-height: 1.25;
  }
  .os-bw-defects-text {
    margin: 0;
    font-weight: 600;
    color: #000000;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .os-bw-diagnostic-text {
    margin-top: 2px;
    padding-top: 2px;
    border-top: 1px dashed #888888;
    font-size: 7pt;
  }
  .os-bw-ncm-box {
    border: 1.5px solid #000000;
    background: #fafafa;
    margin-bottom: 4px;
    page-break-inside: avoid !important;
  }
  .os-bw-ncm-header {
    background: #000000;
    color: #ffffff;
    font-size: 7.2pt;
    font-weight: 900;
    text-transform: uppercase;
    padding: 2px 6px;
    letter-spacing: 0.4px;
  }
  .os-bw-ncm-body {
    padding: 2.5px 6px;
    font-size: 6.8pt;
    line-height: 1.22;
  }
  .os-bw-ncm-body ol, .os-bw-ncm-body ul {
    margin: 0;
    padding-left: 12px;
  }
  .os-bw-ncm-body li {
    margin-bottom: 1px;
  }
  .os-bw-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.2pt;
    margin-top: 0;
  }
  .os-bw-table th, .os-bw-table td {
    border: 1px solid #000000;
    padding: 2px 4px;
  }
  .os-bw-table th {
    background: #e6e6e6;
    color: #000000;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 6.8pt;
  }
  .os-bw-table th.col-ncm, .os-bw-table td.col-ncm {
    background: #f4f4f4;
    font-weight: 800;
  }
  .os-bw-table td.center { text-align: center; }
  .os-bw-table td.right { text-align: right; }
  .os-bw-table td.bold { font-weight: 800; }
  .os-bw-table td.mono { font-family: monospace; }
  .os-bw-table tr.empty-row td {
    height: 14px;
  }
  .os-bw-signatures {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 8px;
    page-break-inside: avoid !important;
  }
  .os-bw-sign-block {
    text-align: center;
  }
  .os-bw-sign-line {
    border-top: 1px solid #000000;
    margin-bottom: 2px;
  }
  .os-bw-sign-name {
    display: block;
    font-size: 7.2pt;
    font-weight: 800;
    color: #000000;
    line-height: 1.1;
  }
  .os-bw-sign-cargo {
    display: block;
    font-size: 6.2pt;
    font-weight: 600;
    color: #333333;
  }
  .os-bw-footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #000000;
    padding-top: 2px;
    margin-top: 5px;
    font-size: 6.2pt;
    font-weight: 600;
    color: #222222;
  }
`;

export default function OrderDocumentModal({ order, vehicle, driver, partner, items = [], company, onEdit, onClose }) {
  const [copied, setCopied] = useState(false);
  const [busyExcel, setBusyExcel] = useState(false);

  const placa = vehicle?.placa || 'VEICULO';
  const numero = order?.numero || 'SDO';
  const tipos = getOrderTipos(order);
  const tiposFormatados = formatTiposLabels(tipos);
  const isWorkshopPlaceholder = !partner?.id || partner?.nome_fantasia?.includes('A Definir') || partner?.razao_social?.includes('A Definir');
  const partnerNome = isWorkshopPlaceholder ? 'A Definir / Cotação Avulsa' : (partner?.nome_fantasia || partner?.razao_social || 'Oficina Credenciada');

  const snapshotData = {
    company: { nome: 'Ambipar Group' },
    order: {
      ...order,
      tipos,
      tipos_formatados: tiposFormatados
    },
    vehicle: vehicle || { placa, marca_modelo: 'Não especificado' },
    partner: isWorkshopPlaceholder ? { nome: partnerNome } : partner,
    reporter: driver || { nome: 'Não informado' },
    items
  };

  /**
   * Impressão isolada via iframe invisível:
   * 1. Elimina as páginas em branco causadas pelo layout SPA de fundo;
   * 2. Formata especificamente em Preto e Branco de alto contraste;
   * 3. Garante que o documento caiba estritamente em 1 ÚNICA folha A4.
   */
  function handlePrint() {
    const printEl = document.getElementById('printable-sdo-document');
    if (!printEl) {
      window.print();
      return;
    }

    // Remover qualquer iframe de impressão anterior
    const oldFrame = document.getElementById('sdo-print-iframe');
    if (oldFrame) {
      oldFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'sdo-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>SDO_${numero}_${placa}</title>
        <style>
          ${PRINT_MONOCHROME_CSS}
        </style>
      </head>
      <body>
        ${printEl.outerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Falha ao imprimir via iframe, utilizando fallback direto:', err);
        window.print();
      }
    }, 280);
  }

  async function handleDownloadExcel() {
    setBusyExcel(true);
    try {
      let docSnapshot;
      if (company && order?.id) {
        try {
          docSnapshot = await orderDispatchDocument(company, order.id);
        } catch {
          docSnapshot = snapshotData;
        }
      } else {
        docSnapshot = snapshotData;
      }
      await downloadOrderWorkbook(docSnapshot || snapshotData);
    } catch (e) {
      alert('Erro ao gerar Excel: ' + e.message);
    } finally {
      setBusyExcel(false);
    }
  }

  function handleCopyMessage() {
    const msg = orderMessage(snapshotData, 'abertura');
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      alert('Não foi possível copiar automaticamente. Use a visualização.');
    });
  }

  function handleOpenWhatsApp() {
    const msg = encodeURIComponent(orderMessage(snapshotData, 'abertura'));
    const phone = (partner?.whatsapp || partner?.telefone || '').replace(/\D/g, '');
    const target = phone ? `https://wa.me/55${phone.replace(/^55/, '')}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="os-doc-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Documento da S.D.O">
      <div className="os-doc-modal-container" onClick={e => e.stopPropagation()}>
        {/* BARRA DE FERRAMENTAS SUPERIOR (Não impressa) */}
        <header className="os-doc-toolbar no-print">
          <div className="os-doc-toolbar-info">
            <h3>📄 S.D.O {numero} · Placa {placa} (1 Folha A4 - Preto e Branco)</h3>
            <span className="os-doc-toolbar-sub">Layout executivo otimizado para impressão sem páginas vazias</span>
          </div>
          <div className="os-doc-toolbar-actions">
            {onEdit && (
              <button type="button" className="os-btn-edit-doc" onClick={onEdit} title="Editar SDO e registrar novas ocorrências da oficina">
                ✏️ Editar S.D.O
              </button>
            )}
            <button type="button" className="os-btn-print" onClick={handlePrint} title="Imprimir em 1 folha A4 Preto e Branco">
              🖨️ Imprimir 1 Folha A4
            </button>
            <button type="button" className="os-btn-excel" disabled={busyExcel} onClick={handleDownloadExcel} title="Baixar planilha Excel com a placa">
              📊 {busyExcel ? 'Gerando…' : 'Baixar Excel'}
            </button>
            <button type="button" className="os-btn-whatsapp" onClick={handleCopyMessage} title="Copiar mensagem para o WhatsApp">
              {copied ? '✓ Copiado!' : '📋 Copiar Msg'}
            </button>
            <button type="button" className="os-btn-whatsapp-open" onClick={handleOpenWhatsApp} title="Abrir WhatsApp para enviar">
              📲 WhatsApp
            </button>
            <button type="button" className="os-btn-close" onClick={onClose} aria-label="Fechar">
              ✕ Fechar
            </button>
          </div>
        </header>

        {/* FOLHA DO DOCUMENTO IMPRESSO/VISUALIZADO */}
        <div className="os-doc-paper-wrapper">
          <article id="printable-sdo-document" className="os-doc-paper monochrome printable-content">
            {/* CABEÇALHO INSTITUCIONAL */}
            <div className="os-bw-header">
              <div>
                <h1 className="os-bw-brand-title">AMBIPAR GROUP</h1>
                <div className="os-bw-brand-sub">Divisão de Transporte, Frotas & Logística Integrada</div>
              </div>
              <div className="os-bw-meta-box">
                <span className="os-bw-sdo-badge">SOLICITAÇÃO DE MANUTENÇÃO (S.D.O)</span>
                <div className="os-bw-sdo-num">{numero}</div>
                <div className="os-bw-sdo-date">Emissão: {date(order?.data_abertura || new Date().toISOString())}</div>
              </div>
            </div>

            {/* FAIXA DE STATUS E CLASSIFICAÇÃO */}
            <div className="os-bw-class-bar">
              <div className="os-bw-class-item">
                <span className="os-bw-class-label">Status:</span>
                <span className="os-bw-class-badge">{ORDER_STATUS[order?.status] || order?.status || 'Aberta'}</span>
              </div>
              <div className="os-bw-class-item">
                <span className="os-bw-class-label">Urgência:</span>
                <span className="os-bw-class-badge">{PRIORITIES[order?.prioridade] || 'Média'}</span>
              </div>
              <div className="os-bw-class-item">
                <span className="os-bw-class-label">Classificação da Manutenção:</span>
                <div style={{ display: 'inline-flex', gap: '3px' }}>
                  {tipos.map(t => (
                    <span key={t} className="os-bw-class-badge">
                      ✓ {ORDER_TYPES[t] || t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* QUADRO 1: DADOS DO VEÍCULO E QUILOMETRAGEM */}
            <section className="os-bw-section">
              <div className="os-bw-section-title">
                1. IDENTIFICAÇÃO DO VEÍCULO & QUILOMETRAGEM (ODÔMETRO)
              </div>
              <div className="os-bw-vehicle-layout">
                {/* Placa Mercosul em Preto e Branco */}
                <div className="os-bw-plate-card">
                  <div className="os-bw-plate-top">BRASIL · AMBIPAR</div>
                  <div className="os-bw-plate-num">{placa}</div>
                  <div className="os-bw-plate-bot">MERCOSUL</div>
                </div>

                {/* KM na abertura destacado */}
                <div className="os-bw-km-highlight">
                  <div className="os-bw-km-label">KM na Abertura da SDO</div>
                  <div className="os-bw-km-val">
                    {order?.km_abertura != null ? `${Number(order.km_abertura).toLocaleString('pt-BR')} km` : 'Não informado'}
                  </div>
                </div>

                {/* Grid com detalhes do veículo */}
                <div className="os-bw-vehicle-details">
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Marca / Modelo:</span>
                    <span className="os-bw-val">{vehicle?.marca_modelo || 'Não informado'}</span>
                  </div>
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Ano Fab. / Modelo:</span>
                    <span className="os-bw-val">{vehicle?.ano_fabricacao || '—'} / {vehicle?.ano_modelo || '—'}</span>
                  </div>
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Chassi:</span>
                    <span className="os-bw-val" style={{ fontFamily: 'monospace' }}>{vehicle?.chassi || 'Não informado'}</span>
                  </div>
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Combustível:</span>
                    <span className="os-bw-val">{vehicle?.combustivel || 'Diesel S10'}</span>
                  </div>
                  <div className="os-bw-field-line" style={{ gridColumn: 'span 2' }}>
                    <span className="os-bw-label">Implemento / Carroceria:</span>
                    <span className="os-bw-val">{vehicle?.tipo || 'Não especificado'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* QUADRO 2: MOTORISTA RELATOR & OFICINA DESTINATÁRIA */}
            <div className="os-bw-two-cols">
              <section className="os-bw-section" style={{ margin: 0 }}>
                <div className="os-bw-section-title">2. MOTORISTA RELATOR</div>
                <div className="os-bw-card-inner">
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Nome:</span>
                    <span className="os-bw-val">{driver?.nome || 'Motorista não informado'}</span>
                  </div>
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Telefone / WhatsApp:</span>
                    <span className="os-bw-val">{driver?.telefone || 'Não cadastrado'}</span>
                  </div>
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Vínculo:</span>
                    <span className="os-bw-val">Motorista da Frota Ambipar</span>
                  </div>
                </div>
              </section>

              <section className="os-bw-section" style={{ margin: 0 }}>
                <div className="os-bw-section-title">3. OFICINA MECÂNICA DESTINATÁRIA</div>
                <div className="os-bw-card-inner">
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Oficina:</span>
                    <span className="os-bw-val">{partnerNome}</span>
                  </div>
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Contato / Fone:</span>
                    <span className="os-bw-val">{partner?.whatsapp || partner?.telefone || (isWorkshopPlaceholder ? 'A preencher pelo analista' : 'Não informado')}</span>
                  </div>
                  <div className="os-bw-field-line">
                    <span className="os-bw-label">Cidade / UF:</span>
                    <span className="os-bw-val">{partner?.cidade ? `${partner.cidade} - ${partner.estado || ''}` : (isWorkshopPlaceholder ? 'Cotação Externa' : 'Não informado')}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* QUADRO 3: RELATO DOS PROBLEMAS INFORMADOS PELO MOTORISTA */}
            <section className="os-bw-section">
              <div className="os-bw-section-title">
                4. RELATO DOS PROBLEMAS & DEFEITOS INFORMADOS PELO MOTORISTA
              </div>
              <div className="os-bw-defects-body">
                <p className="os-bw-defects-text">
                  {order?.descricao_problema || 'Nenhum detalhe adicional informado na abertura.'}
                </p>
                {order?.diagnostico && (
                  <div className="os-bw-diagnostic-text">
                    <strong>Diagnóstico Prévio / Anotações Técnicas:</strong> {order.diagnostico}
                  </div>
                )}
              </div>
            </section>

            {/* QUADRO 4: EXIGÊNCIAS OBRIGATÓRIAS (NCM DAS PEÇAS) */}
            <section className="os-bw-ncm-box">
              <div className="os-bw-ncm-header">
                📌 EXIGÊNCIAS OBRIGATÓRIAS PARA APROVAÇÃO DO ORÇAMENTO PELA AMBIPAR
              </div>
              <div className="os-bw-ncm-body">
                <ol>
                  <li>
                    <strong>CÓDIGO NCM OBRIGATÓRIO (8 DÍGITOS):</strong> Toda peça e insumo a ser trocado deve conter obrigatoriamente a respectiva Nomenclatura Comum do Mercosul (NCM) na proposta e na Nota Fiscal. Cotações sem NCM das peças serão recusadas pelo setor fiscal.
                  </li>
                  <li>
                    <strong>DISCRIMINAÇÃO SEPARADA:</strong> Apresentar valores unitários e totais discriminados individualmente por peças e por mão de obra / serviços.
                  </li>
                  <li>
                    <strong>PRAZOS E GARANTIA:</strong> Informar o período de garantia (dias/meses) de cada item e o prazo total estimado de entrega em dias corridos após a autorização.
                  </li>
                  <li>
                    <strong>AUTORIZAÇÃO FORMAL PRÉVIA:</strong> Nenhum serviço ou substituição de peça adicional poderá ser executado sem prévia autorização formal escrita do analista Ambipar.
                  </li>
                </ol>
              </div>
            </section>

            {/* QUADRO 5: DISCRIMINAÇÃO DE PEÇAS, SERVIÇOS & COTAÇÃO */}
            <section className="os-bw-section">
              <div className="os-bw-section-title">
                5. DISCRIMINAÇÃO DE PEÇAS, SERVIÇOS & PROPOSTA DE COTAÇÃO
              </div>
              <table className="os-bw-table">
                <thead>
                  <tr>
                    <th style={{ width: '6%' }}>Item</th>
                    <th style={{ width: '9%' }}>Tipo</th>
                    <th>Descrição da Peça ou Serviço</th>
                    <th style={{ width: '18%' }} className="col-ncm">NCM da Peça *</th>
                    <th style={{ width: '7%' }}>Qtd</th>
                    <th style={{ width: '13%' }}>Valor Unit. (R$)</th>
                    <th style={{ width: '14%' }}>Subtotal (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((i, idx) => (
                      <tr key={i.id || idx}>
                        <td className="center">{idx + 1}</td>
                        <td className="center">{i.tipo === 'peca' ? 'Peça' : 'Serviço'}</td>
                        <td>{i.descricao}</td>
                        <td className="center mono col-ncm">{i.tipo === 'peca' ? (i.ncm || 'Pendente NCM') : '—'}</td>
                        <td className="center">{i.quantidade}</td>
                        <td className="right">{money(i.valor_unitario)}</td>
                        <td className="right bold">{money(Number(i.quantidade) * Number(i.valor_unitario))}</td>
                      </tr>
                    ))
                  ) : (
                    [1, 2, 3].map(line => (
                      <tr key={line} className="empty-row">
                        <td className="center">{line}</td>
                        <td className="center">[ ] Peça [ ] Serv.</td>
                        <td></td>
                        <td className="center mono col-ncm">___ . ___ . ___</td>
                        <td className="center"></td>
                        <td className="right"></td>
                        <td className="right"></td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="right bold">TOTAL GERAL ORÇADO:</td>
                    <td colSpan={2} className="right bold" style={{ fontSize: '8.5pt' }}>
                      {items.length > 0 ? money(order?.valor_total || 0) : 'R$ ____________________'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {/* QUADRO 6: ASSINATURAS E VALIDAÇÃO */}
            <div className="os-bw-signatures">
              <div className="os-bw-sign-block">
                <div className="os-bw-sign-line"></div>
                <span className="os-bw-sign-name">Analista de Manutenção & Frotas</span>
                <span className="os-bw-sign-cargo">Ambipar Group</span>
              </div>

              <div className="os-bw-sign-block">
                <div className="os-bw-sign-line"></div>
                <span className="os-bw-sign-name">{driver?.nome || 'Motorista Condutor'}</span>
                <span className="os-bw-sign-cargo">Motorista Responsável</span>
              </div>

              <div className="os-bw-sign-block">
                <div className="os-bw-sign-line"></div>
                <span className="os-bw-sign-name">Responsável Técnico / Mecânica</span>
                <span className="os-bw-sign-cargo">{partnerNome}</span>
              </div>
            </div>

            {/* RODAPÉ DO DOCUMENTO */}
            <footer className="os-bw-footer">
              <span>Ambipar Group · Gestão Integrada de Frotas · SDO: {numero} · Placa: {placa}</span>
              <span>Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')} · Documento Oficial Válido para Cotação (Folha A4 Única)</span>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
