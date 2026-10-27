import React,{useState} from 'react';
import {ORDER_STATUS,ORDER_TYPES,PRIORITIES,formatTiposLabels,getOrderTipos} from '../../../utils/orderValidation';
import {money,date} from '../PartnerDetail';
import {orderDocumentName,orderMessage,downloadOrderWorkbook} from '../../../utils/orderWorkbook';
import {orderDispatchDocument} from '../../../services/maintenanceOrders';

export default function OrderDocumentModal({order,vehicle,driver,partner,items=[],company,onClose}){
 const [copied,setCopied]=useState(false);
 const [busyExcel,setBusyExcel]=useState(false);

 const placa=vehicle?.placa||'VEICULO';
 const numero=order?.numero||'SDO';
 const tipos=getOrderTipos(order);
 const tiposFormatados=formatTiposLabels(tipos);
 const isWorkshopPlaceholder=!partner?.id||partner?.nome_fantasia?.includes('A Definir')||partner?.razao_social?.includes('A Definir');
 const partnerNome=isWorkshopPlaceholder?'A Definir / Cotação Avulsa':(partner?.nome_fantasia||partner?.razao_social||'Oficina Credenciada');

 const snapshotData={
  company:{nome:'Ambipar Group'},
  order:{
   ...order,
   tipos,
   tipos_formatados:tiposFormatados
  },
  vehicle:vehicle||{placa,marca_modelo:'Não especificado'},
  partner:isWorkshopPlaceholder?{nome:partnerNome}:partner,
  reporter:driver||{nome:'Não informado'},
  items
 };

 function handlePrint(){
  const originalTitle=document.title;
  document.title=`SDO_${numero}_${placa}`.replace(/[^a-zA-Z0-9_-]/g,'_');
  window.print();
  setTimeout(()=>{
   document.title=originalTitle;
  },1500);
 }

 async function handleDownloadExcel(){
  setBusyExcel(true);
  try{
   let docSnapshot;
   if(company&&order?.id){
    try{
     docSnapshot=await orderDispatchDocument(company,order.id);
    }catch{
     docSnapshot=snapshotData;
    }
   }else{
    docSnapshot=snapshotData;
   }
   await downloadOrderWorkbook(docSnapshot||snapshotData);
  }catch(e){
   alert('Erro ao gerar Excel: '+e.message);
  }finally{
   setBusyExcel(false);
  }
 }

 function handleCopyMessage(){
  const msg=orderMessage(snapshotData,'abertura');
  navigator.clipboard.writeText(msg).then(()=>{
   setCopied(true);
   setTimeout(()=>setCopied(false),3000);
  }).catch(()=>{
   alert('Não foi possível copiar automaticamente. Use a visualização.');
  });
 }

 function handleOpenWhatsApp(){
  const msg=encodeURIComponent(orderMessage(snapshotData,'abertura'));
  const phone=(partner?.whatsapp||partner?.telefone||'').replace(/\D/g,'');
  const target=phone?`https://wa.me/55${phone.replace(/^55/,'')}?text=${msg}`:`https://wa.me/?text=${msg}`;
  window.open(target,'_blank','noopener,noreferrer');
 }

 return (
  <div className="os-doc-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Documento da S.D.O">
   <div className="os-doc-modal-container" onClick={e=>e.stopPropagation()}>
    {/* BARRA DE FERRAMENTAS SUPERIOR (Não impressa) */}
    <header className="os-doc-toolbar no-print">
     <div className="os-doc-toolbar-info">
      <h3>📄 Ordem e Solicitação S.D.O · {numero} · Placa {placa}</h3>
      <span className="os-doc-toolbar-sub">Documento oficial com relato de defeitos, KM atual e exigência de NCM</span>
     </div>
     <div className="os-doc-toolbar-actions">
      <button type="button" className="os-btn-print" onClick={handlePrint} title="Imprimir ou Salvar como PDF">
       🖨️ Imprimir / Salvar PDF
      </button>
      <button type="button" className="os-btn-excel" disabled={busyExcel} onClick={handleDownloadExcel} title="Baixar planilha Excel com a placa">
       📊 {busyExcel?'Gerando…':'Baixar Excel'}
      </button>
      <button type="button" className="os-btn-whatsapp" onClick={handleCopyMessage} title="Copiar mensagem com documento para o WhatsApp">
       {copied?'✓ Mensagem Copiada!':'📋 Copiar Mensagem WhatsApp'}
      </button>
      <button type="button" className="os-btn-whatsapp-open" onClick={handleOpenWhatsApp} title="Abrir WhatsApp para enviar">
       📲 Enviar WhatsApp
      </button>
      <button type="button" className="os-btn-close" onClick={onClose} aria-label="Fechar">
       ✕ Fechar
      </button>
     </div>
    </header>

    {/* FOLHA DO DOCUMENTO IMPRESSO/VISUALIZADO */}
    <div className="os-doc-paper-wrapper">
     <article className="os-doc-paper printable-content">
      {/* CABEÇALHO INSTITUCIONAL */}
      <div className="os-doc-header">
       <div className="os-doc-brand">
        <div className="os-doc-logo-mark">AMBIPAR</div>
        <div>
         <h1 className="os-doc-org">AMBIPAR GROUP</h1>
         <div className="os-doc-dept">Divisão de Transporte, Frotas & Logística Integrada</div>
        </div>
       </div>
       <div className="os-doc-order-meta">
        <div className="os-doc-title-badge">SOLICITAÇÃO DE ORÇAMENTO (S.D.O)</div>
        <div className="os-doc-num-tag">{numero}</div>
        <div className="os-doc-date">Emissão: {date(order?.data_abertura||new Date().toISOString())}</div>
       </div>
      </div>

      {/* CLASSIFICAÇÃO E STATUS */}
      <div className="os-doc-pills-row">
       <div className="os-doc-pill-item">
        <span className="os-doc-pill-label">Status da S.D.O:</span>
        <strong className="os-doc-pill-value status">{ORDER_STATUS[order?.status]||order?.status||'Aberta'}</strong>
       </div>
       <div className="os-doc-pill-item">
        <span className="os-doc-pill-label">Grau de Urgência:</span>
        <strong className="os-doc-pill-value priority">{PRIORITIES[order?.prioridade]||'Média'}</strong>
       </div>
       <div className="os-doc-pill-item" style={{flex:2}}>
        <span className="os-doc-pill-label">Classificação da Manutenção (até 3 tipos):</span>
        <div className="os-doc-type-tags">
         {tipos.map(t=>(
          <span key={t} className="os-doc-type-badge">
           {ORDER_TYPES[t]||t}
          </span>
         ))}
        </div>
       </div>
      </div>

      {/* QUADRO 1: DADOS DO VEÍCULO (DESTAQUE PARA A PLACA E KM) */}
      <section className="os-doc-section">
       <div className="os-doc-section-title">
        <span>🚚</span> 1. IDENTIFICAÇÃO DO VEÍCULO & QUILOMETRAGEM
       </div>
       <div className="os-doc-grid-vehicle">
        <div className="os-doc-plate-box">
         <div className="os-doc-plate-flag">BRASIL · AMBIPAR</div>
         <div className="os-doc-plate-number">{placa}</div>
         <div className="os-doc-plate-footer">MERCOSUL</div>
        </div>

        <div className="os-doc-vehicle-info-grid">
         <div className="os-doc-info-cell">
          <span className="os-doc-label">Marca / Modelo:</span>
          <span className="os-doc-val">{vehicle?.marca_modelo||'Não informado'}</span>
         </div>
         <div className="os-doc-info-cell highlight-km">
          <span className="os-doc-label">📍 KM / Odômetro na Abertura:</span>
          <span className="os-doc-val-km">{order?.km_abertura!=null?`${Number(order.km_abertura).toLocaleString('pt-BR')} km`:'Não informado'}</span>
         </div>
         <div className="os-doc-info-cell">
          <span className="os-doc-label">Ano Fab. / Modelo:</span>
          <span className="os-doc-val">{vehicle?.ano_fabricacao||'—'} / {vehicle?.ano_modelo||'—'}</span>
         </div>
         <div className="os-doc-info-cell">
          <span className="os-doc-label">Chassi:</span>
          <span className="os-doc-val mono">{vehicle?.chassi||'Não informado'}</span>
         </div>
         <div className="os-doc-info-cell">
          <span className="os-doc-label">Combustível:</span>
          <span className="os-doc-val">{vehicle?.combustivel||'Diesel S10'}</span>
         </div>
         <div className="os-doc-info-cell">
          <span className="os-doc-label">Tipo de Implemento / Carroceria:</span>
          <span className="os-doc-val">{vehicle?.tipo||'Não especificado'}</span>
         </div>
        </div>
       </div>
      </section>

      {/* QUADRO 2: MOTORISTA RELATOR & OFICINA */}
      <div className="os-doc-two-cols">
       <section className="os-doc-section col">
        <div className="os-doc-section-title">
         <span>👤</span> 2. MOTORISTA RELATOR
        </div>
        <div className="os-doc-card-inner">
         <div className="os-doc-row-line">
          <strong>Nome:</strong> <span>{driver?.nome||'Relator não informado'}</span>
         </div>
         <div className="os-doc-row-line">
          <strong>Telefone / WhatsApp:</strong> <span>{driver?.telefone||'Não cadastrado'}</span>
         </div>
         <div className="os-doc-row-line">
          <strong>Vínculo Operacional:</strong> <span>Motorista da Frota Ambipar</span>
         </div>
        </div>
       </section>

       <section className="os-doc-section col">
        <div className="os-doc-section-title">
         <span>🏢</span> 3. OFICINA MECÂNICA DESTINATÁRIA
        </div>
        <div className="os-doc-card-inner">
         <div className="os-doc-row-line">
          <strong>Oficina:</strong> <span className={isWorkshopPlaceholder?'text-warning':''}>{partnerNome}</span>
         </div>
         <div className="os-doc-row-line">
          <strong>Contato / Telefone:</strong> <span>{partner?.whatsapp||partner?.telefone||(isWorkshopPlaceholder?'A preencher pelo analista':'Não informado')}</span>
         </div>
         <div className="os-doc-row-line">
          <strong>Endereço / Cidade:</strong> <span>{partner?.cidade?`${partner.cidade} - ${partner.estado||''}`:(isWorkshopPlaceholder?'Cotação externa ou aberta':'Não informado')}</span>
         </div>
        </div>
       </section>
      </div>

      {/* QUADRO 3: RELATO COMPLETO DOS PROBLEMAS / DEFEITOS */}
      <section className="os-doc-section">
       <div className="os-doc-section-title alert">
        <span>⚠️</span> 4. RELATO DOS PROBLEMAS & DEFEITOS INFORMADOS PELO MOTORISTA
       </div>
       <div className="os-doc-defects-box">
        <p className="os-doc-defects-text">
         {order?.descricao_problema||'Nenhum detalhe adicional informado na abertura.'}
        </p>
        {order?.diagnostico&&(
         <div className="os-doc-sub-diagnostic">
          <strong>Diagnóstico Técnico Complementar:</strong>
          <p>{order.diagnostico}</p>
         </div>
        )}
       </div>
      </section>

      {/* QUADRO 4: REQUISITOS OBRIGATÓRIOS DO ORÇAMENTO (NCM DAS PEÇAS) */}
      <section className="os-doc-section compliance-box">
       <div className="os-doc-compliance-header">
        <span>📌</span> EXIGÊNCIAS OBRIGATÓRIAS PARA APROVAÇÃO DO ORÇAMENTO PELA AMBIPAR
       </div>
       <div className="os-doc-compliance-body">
        <ul>
         <li>
          <strong>1. CÓDIGO NCM OBRIGATÓRIO:</strong> Todas as peças e insumos a serem trocados devem conter obrigatoriamente a respectiva Nomenclatura Comum do Mercosul (NCM de 8 dígitos) na cotação e na Nota Fiscal. Orçamentos sem NCM das peças não serão aprovados pelo setor fiscal.
         </li>
         <li>
          <strong>2. DISCRIMINAÇÃO SEPARADA:</strong> Apresentar valores unitários e subtotais discriminados individualmente por peças e por mão de obra/serviços.
         </li>
         <li>
          <strong>3. PRAZOS E GARANTIA:</strong> Informar o período de garantia (em dias ou meses) para cada peça e serviço cotado, bem como o prazo estimado de entrega em dias corridos.
         </li>
         <li>
          <strong>4. AUTORIZAÇÃO PRÉVIA:</strong> Nenhum serviço ou substituição de peça adicional poderá ser executado sem a prévia autorização formal e escrita do analista de manutenção responsável.
         </li>
        </ul>
       </div>
      </section>

      {/* QUADRO 5: ITENS E ORÇAMENTO (OU GRADE DE RESPOSTA) */}
      <section className="os-doc-section">
       <div className="os-doc-section-title">
        <span>🔧</span> 5. DISCRIMINAÇÃO DE PEÇAS, SERVIÇOS & COTAÇÃO
       </div>
       <table className="os-doc-table">
        <thead>
         <tr>
          <th style={{width:'8%'}}>Item</th>
          <th style={{width:'10%'}}>Tipo</th>
          <th>Descrição da Peça ou Serviço</th>
          <th style={{width:'16%'}} className="highlight-col">NCM da Peça *</th>
          <th style={{width:'8%'}}>Qtd</th>
          <th style={{width:'14%'}}>Valor Unit. (R$)</th>
          <th style={{width:'14%'}}>Subtotal (R$)</th>
         </tr>
        </thead>
        <tbody>
         {items.length>0?(
          items.map((i,idx)=>(
           <tr key={i.id||idx}>
            <td className="center">{idx+1}</td>
            <td className="center">{i.tipo==='peca'?'Peça':'Serviço'}</td>
            <td>{i.descricao}</td>
            <td className="center mono highlight-col">{i.tipo==='peca'?(i.ncm||<span className="text-warning">Pendente</span>):'—'}</td>
            <td className="center">{i.quantidade}</td>
            <td className="right">{money(i.valor_unitario)}</td>
            <td className="right bold">{money(Number(i.quantidade)*Number(i.valor_unitario))}</td>
           </tr>
          ))
         ):(
          // Grade vazia para preenchimento manual ou resposta da oficina
          [1,2,3,4].map(line=>(
           <tr key={line} className="empty-row">
            <td className="center">{line}</td>
            <td className="center">[ ] Peça [ ] Serv.</td>
            <td className="dashed-cell"></td>
            <td className="dashed-cell highlight-col center">___ . ___ . ___</td>
            <td className="dashed-cell center"></td>
            <td className="dashed-cell right"></td>
            <td className="dashed-cell right"></td>
           </tr>
          ))
         )}
        </tbody>
        <tfoot>
         <tr>
          <td colSpan={5} className="right bold">TOTAL GERAL ORÇADO:</td>
          <td colSpan={2} className="right bold total-price">
           {items.length>0?money(order?.valor_total||0):'A preencher pela oficina'}
          </td>
         </tr>
        </tfoot>
       </table>
      </section>

      {/* QUADRO 6: ASSINATURAS E VALIDAÇÃO */}
      <section className="os-doc-signatures">
       <div className="os-doc-sign-block">
        <div className="os-doc-sign-line"></div>
        <span className="os-doc-sign-name">Analista de Manutenção & Frotas</span>
        <span className="os-doc-sign-cargo">Ambipar Group</span>
       </div>

       <div className="os-doc-sign-block">
        <div className="os-doc-sign-line"></div>
        <span className="os-doc-sign-name">{driver?.nome||'Motorista Condutor'}</span>
        <span className="os-doc-sign-cargo">Motorista Responsável</span>
       </div>

       <div className="os-doc-sign-block">
        <div className="os-doc-sign-line"></div>
        <span className="os-doc-sign-name">Responsável Técnico / Mecânica</span>
        <span className="os-doc-sign-cargo">{partnerNome}</span>
       </div>
      </section>

      {/* RODAPÉ DO DOCUMENTO */}
      <footer className="os-doc-footer">
       <span>Ambipar Group · Sistema Integrado de Gestão de Frotas e Logística</span>
       <span>Documento gerado eletronicamente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')} · SDO: {numero} · Placa: {placa}</span>
      </footer>
     </article>
    </div>
   </div>
  </div>
 );
}
