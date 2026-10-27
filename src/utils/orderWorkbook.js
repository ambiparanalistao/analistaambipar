import ExcelJS from 'exceljs';
import { getItemFiscalCode, getItemCleanDescription } from './orderValidation.js';
const text=v=>v===null||v===undefined||v===''?'Não informado':String(v);
const date=v=>v?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Aguardando aprovação do orçamento';
const labels={aberta:'Aberta',aguardando_orcamento:'Aguardando orçamento',orcamento_aprovado:'Orçamento aprovado',em_transito:'Em trânsito',na_oficina:'Na oficina',em_execucao:'Em execução',aguardando_peca:'Aguardando peça',concluido:'Concluído',veiculo_retirado:'Veículo retirado',encerrada:'Encerrada',cancelada:'Cancelada'};
export const orderDocumentName=data=>{
 const numero=(data?.order?.numero||'SDO').replace(/[^a-zA-Z0-9_-]/g,'_');
 const placa=(data?.vehicle?.placa||'VEICULO').replace(/[^a-zA-Z0-9_-]/g,'_');
 return `SDO_${numero}_${placa}.xlsx`;
};
export function orderMessage(data,kind='abertura'){
 const {order:o,vehicle:v,partner:p}=data;
 const partnerName=p?.nome||p?.nome_fantasia||p?.razao_social||'Prezada Oficina';
 const tiposStr=Array.isArray(o?.tipos)?o.tipos.join(', '):(o?.tipo||'Manutenção');
 return [
  'Olá, '+text(partnerName).slice(0,100)+'!',
  kind==='aprovacao'?'✅ ORÇAMENTO APROVADO — '+o.numero:'📋 SOLICITAÇÃO DE ORÇAMENTO (S.D.O) — '+o.numero,
  '🚚 Veículo: '+text(v.placa)+' · '+text(v.marca_modelo).slice(0,120),
  '📍 KM de Abertura / Odômetro: '+text(o.km_abertura)+' km',
  '🔧 Tipo(s) de Manutenção: '+text(tiposStr),
  '👤 Motorista Relator / Relator dos defeitos (motorista): '+text(data.reporter?.nome||'Não informado')+(data.reporter?.telefone?' ('+data.reporter.telefone+')':''),
  '⚠️ Problema / Defeitos informados pelo motorista:',
  text(o.descricao_problema),
  '',
  '📌 EXIGÊNCIAS PARA FORNECIMENTO DO ORÇAMENTO:',
  '1. Enviar orçamento detalhado com separação de peças e mão de obra;',
  '2. OBRIGATÓRIO: Informar o código NCM de cada peça (8 dígitos) que for trocada;',
  '3. OBRIGATÓRIO: Informar o código do serviço (LC 116 / Municipal / CNAE) em caso de orçamento de serviço;',
  '4. Informar o prazo de garantia para peças e serviços;',
  '5. Informar a estimativa de entrega em dias corridos após a aprovação formal do analista.',
  o.prazo_entrega_dias?(kind==='aprovacao'?'⏱️ Prazo acordado: ':'⏱️ Prazo desejado: ')+o.prazo_entrega_dias+' dia(s) corridos após aprovação.':'⏱️ Prazo de execução: A definir na proposta da oficina.',
  o.previsao_entrega?'📅 Previsão de entrega: '+date(o.previsao_entrega):'',
  o.aprovado_em?'Aprovado em: '+date(o.aprovado_em):'⚠️ O serviço depende de aprovação formal prévia. Não iniciar sem autorização.',
  data.portal_url?'🔗 Acesso ao portal de orçamento: '+data.portal_url:'',
  'Ano fab/mod: '+text(v.ano_fabricacao)+' / '+text(v.ano_modelo)+' · Chassi: '+text(v.chassi),
  'Ambipar Group · Divisão de Transporte e Logística'
 ].filter(Boolean).join('\n');
}
export async function buildOrderWorkbook(data){
 const book=new ExcelJS.Workbook();book.creator='Central de Manutenção Ambipar';book.subject='Solicitação de orçamento e ficha técnica do veículo';book.title=data.order.numero;book.created=new Date();
 const {order:o,vehicle:v,partner:p}=data;
 const partnerNome=p?.nome||p?.nome_fantasia||p?.razao_social||'A Definir / Cotação Avulsa';
 function sheet(name,title){const s=book.addWorksheet(name,{views:[{state:'frozen',ySplit:3}],pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.3,right:.3,top:.5,bottom:.5,header:.2,footer:.2}}});s.columns=[{width:38},{width:75}];s.mergeCells('A1:B1');s.getCell('A1').value=title;s.getRow(1).height=34;s.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF102A20'}};s.getCell('A1').font={name:'Calibri',size:17,bold:true,color:{argb:'FFB6FF3B'}};s.getCell('A1').alignment={vertical:'middle',indent:1};s.mergeCells('A2:B2');s.getCell('A2').value=text(data.company?.nome||'AMBIPAR GROUP')+' • '+o.numero+' • '+v.placa;s.getCell('A2').font={bold:true,size:11,color:{argb:'FF24764B'}};s.getRow(2).height=25;s.addRow(['INFORMAÇÃO','DADOS']);return s;}
 function rows(s,values){for(const [key,value]of values){const r=s.addRow([key,typeof value==='number'?value:text(value)]);r.height=Math.max(26,Math.min(130,Math.ceil(text(value).length/70)*15+10));}s.eachRow((r,n)=>{if(n<3)return;r.eachCell(c=>{c.font={name:'Calibri',size:11,bold:n===3||c.col===1,color:{argb:'FF18382A'}};c.alignment={vertical:'middle',wrapText:true};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:n===3?'FFDCEDE3':n%2?'FFF2F7F4':'FFFFFFFF'}};c.border={bottom:{style:'hair',color:{argb:'FFD3E0D7'}}};});});s.autoFilter={from:'A3',to:'B'+s.rowCount};s.headerFooter.oddFooter='&L'+o.numero+'&RPágina &P de &N';}
  rows(sheet('Solicitação de Orçamento','SOLICITAÇÃO DE ORÇAMENTO'),[['Número da S.D.O',o.numero],['Placa do Veículo',v.placa],['Link para responder ao orçamento',data.portal_url||'Disponível via analista de manutenção'],['Oficina Indicada',partnerNome],['Status',labels[o.status]||o.status],['Tipo(s) de Manutenção',Array.isArray(o.tipos)?o.tipos.join(', '):o.tipo],['Prioridade',o.prioridade],['Data de Abertura',date(o.data_abertura)],['KM Registrado na Abertura',o.km_abertura],['Motorista Relator dos Defeitos',data.reporter?.nome||'Não informado'],['Contato do Motorista',data.reporter?.telefone||'Não informado'],['Defeitos e Problemas Relatados',o.descricao_problema],['Diagnóstico Prévio',o.diagnostico||'A aguardar avaliação técnica da oficina'],['Prazo desejado após aprovação',o.prazo_entrega_dias?o.prazo_entrega_dias+' dia(s) corridos':'A definir na aprovação'],['Aprovação do orçamento',o.aprovado_em?date(o.aprovado_em):'Ainda não aprovado'],['Previsão de entrega',date(o.previsao_entrega)],['Regra da previsão','O prazo é contado a partir da aprovação do orçamento, em dias corridos.'],['Exigência Obrigatória (NCM / Código de Serviço)','Obrigatório detalhar peças e serviços, informando o código NCM (8 dígitos) de cada peça e o Código do Serviço (LC 116/Municipal) para serviços, sob pena de recusa do orçamento pelo fiscal.'],['Situação do Orçamento',o.orcamento_status],['Prazo estimado pela oficina após aprovação',data.quote_request?'A preencher pela oficina (dias corridos)':o.prazo_entrega_dias?o.prazo_entrega_dias+' dias corridos':'Não informado'],['Total orçado (R$)',data.quote_request?'A preencher pela oficina':Number(o.valor_total||0)]]);
 rows(sheet('Veículo','FICHA DO VEÍCULO'),[['Placa',v.placa],['Marca / modelo',v.marca_modelo],['Tipo',v.tipo],['Ano de fabricação',v.ano_fabricacao],['Ano do modelo',v.ano_modelo],['Chassi',v.chassi],['Combustível',v.combustivel],['Capacidade de peso (t)',v.capacidade_peso_ton],['Capacidade de volume (m³)',v.capacidade_volume_m3],['Tipo de carga',v.tipo_carga],['Odômetro atual (km)',v.km_atual],['KM na abertura da S.D.O',o.km_abertura],['KM na entrada na oficina',o.km_entrada]]);
 rows(sheet('Oficina','OFICINA RESPONSÁVEL'),[['Nome',partnerNome],['CNPJ / CPF',p?.cnpj_cpf||'—'],['Contato',p?.contato_nome||'—'],['Telefone',p?.telefone||'—'],['WhatsApp',p?.whatsapp||'—'],['E-mail',p?.email||'—'],['Endereço',p?.endereco||'A definir / cotação externa']]);
  const s=book.addWorksheet('Orçamento',{views:[{state:'frozen',ySplit:3}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1}});s.columns=[{width:14},{width:60},{width:15},{width:20},{width:20},{width:22}];s.mergeCells('A1:F1');s.getCell('A1').value='ORÇAMENTO • '+o.numero+' • VEÍCULO: '+v.placa;s.getRow(1).height=30;s.getCell('A1').font={size:16,bold:true,color:{argb:'FF24764B'}};s.addRow(['Situação',o.orcamento_status]);s.addRow(['Tipo','Descrição','Quantidade','Unitário (R$)','Subtotal (R$)','Código Fiscal (NCM / Cód. Serviço)']);for(const i of data.items||[])s.addRow([i.tipo==='peca'?'Peça':'Serviço',text(getItemCleanDescription(i)),Number(i.quantidade),Number(i.valor_unitario),Math.round(Number(i.quantidade)*Number(i.valor_unitario)*100)/100,text(getItemFiscalCode(i)||(i.tipo==='peca'?'Pendente NCM':'Pendente Cód.'))]);const total=s.addRow(['','TOTAL','','',data.quote_request?'A preencher pela oficina':Number(o.valor_total||0),'']);total.font={bold:true};for(const col of [4,5])s.getColumn(col).numFmt='#,##0.00';s.getColumn(2).alignment={wrapText:true};s.getColumn(6).numFmt='@';s.getRow(3).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFDCEDE3'}};s.getRow(3).font={bold:true};s.autoFilter={from:'A3',to:'F'+Math.max(3,s.rowCount-1)};
 return book.xlsx.writeBuffer();
}
export async function downloadOrderWorkbook(data){const buffer=await buildOrderWorkbook(data);const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download=orderDocumentName(data);a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
