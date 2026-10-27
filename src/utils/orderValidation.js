import {validQuoteTypes} from './quoteFilters.js';
export const ORDER_STATUS={aberta:'Aberta',aguardando_orcamento:'Aguardando orçamento',orcamento_aprovado:'Orçamento aprovado',em_transito:'Em trânsito',na_oficina:'Na oficina',em_execucao:'Em execução',aguardando_peca:'Aguardando peça',concluido:'Concluído',veiculo_retirado:'Veículo retirado',encerrada:'Encerrada',cancelada:'Cancelada'};
export const ORDER_TYPES={preventiva:'Preventiva',corretiva:'Corretiva',preditiva:'Preditiva',sinistro:'Sinistro',revisao:'Revisão',inspecao:'Inspeção',pneus:'Pneus'};
export const PRIORITIES={baixa:'Baixa',media:'Média',alta:'Alta',critica:'Crítica'};
export const ATTACHMENT_TYPES={foto_antes:'Foto antes',foto_depois:'Foto depois',orcamento:'Orçamento PDF',nota_fiscal:'Nota fiscal',outros:'Outros'};
export const CLOSED=['encerrada','cancelada'];
export const isLate=(order,now=Date.now())=>!CLOSED.includes(order.status)&&!!order.previsao_entrega&&new Date(order.previsao_entrega).getTime()<now;
export const orderPermissions=role=>({create:['admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico'].includes(role),manage:['admin_geral','admin_empresa','analista_transporte'].includes(role),budget:['admin_geral','admin_empresa','analista_transporte','supervisor'].includes(role),visit:['admin_geral','admin_empresa','analista_transporte','operador_logistico'].includes(role)});
export function nextStatuses(o){return ({aberta:['aguardando_orcamento','na_oficina'],aguardando_orcamento:o.orcamento_status==='aprovado'?['orcamento_aprovado','na_oficina']:['na_oficina'],orcamento_aprovado:['em_transito','na_oficina'],em_transito:['na_oficina'],na_oficina:['em_execucao'],em_execucao:['aguardando_peca','concluido'],aguardando_peca:['em_execucao'],concluido:['veiculo_retirado'],veiculo_retirado:['encerrada']})[o.status]||[];}
export function formatTiposLabels(tipos){
 if(!tipos)return 'Corretiva';
 const arr=Array.isArray(tipos)?tipos:[tipos];
 if(!arr.length)return 'Corretiva';
 return arr.map(t=>ORDER_TYPES[t]||t).join(', ');
}
export function getOrderTipos(order){
 if(!order)return ['corretiva'];
 if(Array.isArray(order.tipos)&&order.tipos.length)return order.tipos.slice(0,3);
 const textToSearch=(order.descricao_problema||'')+' '+(order.observacoes||'');
 const match=textToSearch.match(/\[Tipos(?:\s+de\s+manutenção)?:\s*([^\]]+)\]/i);
 if(match){
  const foundNames=match[1].split(',').map(s=>s.trim().toLowerCase());
  const matchedCodes=[];
  for(const [code,label] of Object.entries(ORDER_TYPES)){
   if(foundNames.some(name=>name===code.toLowerCase()||name===label.toLowerCase())){
    matchedCodes.push(code);
   }
  }
  if(matchedCodes.length)return matchedCodes.slice(0,3);
 }
 return [order.tipo||'corretiva'];
}
export function validateOrder(f,vehicle,now=Date.now()){
 const e={};if(f.quote_partner_types!==undefined&&!validQuoteTypes(f.quote_partner_types))e.quote_partner_types='Filtros de oficinas inválidos.';if(!vehicle||vehicle.id!==f.vehicle_id)e.vehicle_id='Selecione um veículo salvo nesta empresa.';
 if(vehicle&&vehicle.status==='Em Viagem')e.vehicle_id='Finalize a viagem antes de abrir a S.D.O.';
 if(Array.isArray(f.tipos)){
  if(!f.tipos.length)e.tipo='Selecione pelo menos 1 tipo de manutenção.';
  else if(f.tipos.length>3)e.tipo='Selecione no máximo 3 tipos de manutenção.';
  else if(f.tipos.some(t=>!ORDER_TYPES[t]))e.tipo='Tipo de manutenção inválido.';
 }else if(!ORDER_TYPES[f.tipo]){
  e.tipo='Selecione o tipo.';
 }
 if(!PRIORITIES[f.prioridade])e.prioridade='Selecione a prioridade.';
 if(!f.descricao_problema?.trim())e.descricao_problema='Descreva o problema.';
 if(f.km_abertura===''||!Number.isInteger(Number(f.km_abertura))||Number(f.km_abertura)<Math.max(0,Number(vehicle?.km_atual||0)))e.km_abertura='Informe KM inteiro igual ou superior à última leitura do veículo.';
 if(f.prazo_entrega_dias!==undefined&&f.prazo_entrega_dias!==''&&f.prazo_entrega_dias!==null&&(!Number.isInteger(Number(f.prazo_entrega_dias))||Number(f.prazo_entrega_dias)<1||Number(f.prazo_entrega_dias)>3650))e.prazo_entrega_dias='Informe de 1 a 3650 dias corridos.';
 if(f.previsao_entrega&&(!Number.isFinite(Date.parse(f.previsao_entrega))||Date.parse(f.previsao_entrega)<now))e.previsao_entrega='Informe uma previsão futura.';return e;
}
export function validateAction(action,f,o,vehicle){
 const e={};if(action==='budget'&&f.decisao==='aprovado'&&(!Number.isInteger(Number(f.prazo_entrega_dias||o.prazo_entrega_dias))||Number(f.prazo_entrega_dias||o.prazo_entrega_dias)<1||Number(f.prazo_entrega_dias||o.prazo_entrega_dias)>3650))e.prazo_entrega_dias='Informe de 1 a 3650 dias corridos após aprovação.';if(['transition','arrival','departure','budget'].includes(action)&&!f.observacao?.trim())e.observacao='Informe uma observação.';
 if(['arrival','departure'].includes(action)||['na_oficina','veiculo_retirado'].includes(f.status)){
 if(f.km===''||!Number.isInteger(Number(f.km))||Number(f.km)<Math.max(Number(vehicle?.km_atual||0),Number(o.km_abertura||0),Number(o.km_entrada||0)))e.km='KM deve ser inteiro e não pode diminuir.';}
 if(f.status==='concluido'){if(!f.servicos_executados?.trim())e.servicos_executados='Informe os serviços executados.';if(f.valor_final===''||Number(f.valor_final)!==Number(o.valor_total))e.valor_final='O valor final deve conferir com os itens do orçamento.';}
 return e;
}
export function validateItem(f){const e={};if(f.tipo==='peca'&&String(f.ncm||'').trim()&&!/^[0-9]{8}$/.test(String(f.ncm).replace(/[.\s]/g,'')))e.ncm='Informe 8 dígitos de NCM ou deixe vazio quando não aplicável.';if(!['peca','servico'].includes(f.tipo))e.tipo='Tipo inválido.';if(!f.descricao?.trim())e.descricao='Descreva o item.';if(!Number.isFinite(Number(f.quantidade))||Number(f.quantidade)<=0)e.quantidade='Quantidade deve ser maior que zero.';if(f.valor_unitario===''||!Number.isFinite(Number(f.valor_unitario))||Number(f.valor_unitario)<0)e.valor_unitario='Informe um valor não negativo.';return e;}
export function toLocalInput(value){if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}

export function getItemFiscalCode(item) {
  if (!item) return '';
  if (item.tipo === 'peca') {
    return item.ncm ? String(item.ncm).trim() : '';
  }
  if (item.codigo_servico) {
    return String(item.codigo_servico).trim();
  }
  const match = String(item.descricao || '').match(/\[(?:Cód(?:\.|\s+do)?\s*Serviço|Serviço\s*Cód):\s*([^\]]+)\]/i);
  if (match) return match[1].trim();
  if (item.ncm) return String(item.ncm).trim();
  return '';
}

export function getItemCleanDescription(item) {
  if (!item) return '';
  const desc = typeof item === 'string' ? item : String(item.descricao || '');
  return desc.replace(/^\s*\[(?:Cód(?:\.|\s+do)?\s*Serviço|Serviço\s*Cód):\s*[^\]]+\]\s*/i, '').trim();
}

