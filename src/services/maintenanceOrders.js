import {supabase} from '../lib/supabaseClient';
import {validateAttachment,FILE_TYPES} from '../utils/partnerValidation';
export function checked(result){if(result.error)throw new Error(result.error.code==='42501'?'Seu perfil não permite esta ação nesta empresa.':result.error.message||'Falha ao acessar as solicitações de orçamento.');return result.data;}
export const commandOrder=async(company,action,body)=>checked(await supabase.rpc(['select_partner','select_quote_types'].includes(action)?'maintenance_order_dispatch':'maintenance_order_command',{target_company:company,command:action,body}));
export async function ensureDefaultUnassignedPartner(company,existingPartners=[]){
 if(!company)return null;
 const matchName=p=>p.status==='ativo'&&!p.deleted_at&&(
  p.razao_social?.toLowerCase().includes('a definir')||
  p.nome_fantasia?.toLowerCase().includes('a definir')||
  p.nome_fantasia?.toLowerCase().includes('sem oficina')||
  p.razao_social?.toLowerCase().includes('sem oficina')
 );
 const found=(existingPartners||[]).find(matchName);
 if(found)return found;
 try{
  const {data:dbPartners}=await supabase.from('maintenance_partners').select('id,nome_fantasia,razao_social,status,deleted_at').eq('company_id',company).eq('status','ativo').is('deleted_at',null).limit(20);
  if(Array.isArray(dbPartners)&&dbPartners.length>0){
   const dbMatch=dbPartners.find(matchName);
   if(dbMatch)return dbMatch;
  }
  const defaultPayload={
   company_id:company,
   razao_social:'Oficina a Definir (Sem Oficina Cadastrada)',
   nome_fantasia:'A Definir / Cotação Avulsa',
   tipo:'outros',
   status:'ativo',
   pais:'BR',
   especialidades:[],
   tipos_veiculo_atendidos:[],
   horario_funcionamento:{},
   onboarding_profile:{tipos_oficina:['Outros']},
   valor_hora_mao_obra:0,
   prazo_pagamento_dias:0,
   desconto_percentual:0,
   atende_24h:false,
   possui_guincho:false
  };
  const {data:created,error}=await supabase.from('maintenance_partners').insert(defaultPayload).select('id,nome_fantasia,razao_social,status').single();
  if(!error&&created)return created;
  if(error)console.warn('Fallback partner insert note:',error.message);
  if(Array.isArray(dbPartners)&&dbPartners.length>0)return dbPartners[0];
 }catch(err){console.warn('Fallback partner check warning:',err);}
 const anyActive=(existingPartners||[]).find(p=>p.status==='ativo'&&!p.deleted_at);
 if(anyActive)return anyActive;
 return null;
}
async function allRows(table,fields,company,order,orderId){let data=[],offset=0;while(true){let q=supabase.from(table).select(fields).eq('company_id',company);if(orderId)q=q.eq('order_id',orderId);const rows=checked(await q.order(order).order('id').range(offset,offset+999));data.push(...rows);if(rows.length<1000)return data;offset+=1000;}}
export async function orderOptions(company){const [vehicles,partners,drivers,settings]=await Promise.all([allRows('veiculos','*',company,'placa'),allRows('maintenance_partners','id,nome_fantasia,razao_social,status,onboarding_profile,deleted_at',company,'razao_social'),allRows('motoristas','*',company,'nome'),supabase.from('maintenance_settings').select('limite_aprovacao_supervisor').eq('company_id',company).maybeSingle()]);return{vehicles,partners,drivers,supervisorLimit:checked(settings)?.limite_aprovacao_supervisor??5000};}
export async function listOrders(company,filters,page=1,board=false,signal){
 let q=supabase.from('maintenance_orders').select('*',{count:'exact'}).eq('company_id',company);
 for(const k of ['status','tipo','prioridade','vehicle_id','partner_id'])if(filters[k])q=q.eq(k,filters[k]);
 if(board)q=q.neq('status','cancelada');
 const search=(filters.search||'').replace(/[^\p{L}\p{N} -]/gu,'').slice(0,100).trim();if(search)q=q.or('numero.ilike.%'+search+'%,descricao_problema.ilike.%'+search+'%');
 if(filters.start)q=q.gte('data_abertura',new Date(filters.start+'T00:00:00').toISOString());
 if(filters.end)q=q.lte('data_abertura',new Date(filters.end+'T23:59:59.999').toISOString());
 if(filters.late)q=q.not('status','in','(encerrada,cancelada)').lt('previsao_entrega',new Date().toISOString());
 q=q.order('data_abertura',{ascending:false}).order('id').range(board?0:(page-1)*20,board?499:page*20-1);
 if(signal)q=q.abortSignal(signal);const result=await q;checked(result);return{rows:result.data,count:result.count};
}
export async function orderDetail(company,id){
 const [order,items,timeline,attachments,visits,dispatches]=await Promise.all([
 supabase.from('maintenance_orders').select('*').eq('company_id',company).eq('id',id).single().then(checked),
 ...['maintenance_order_items','maintenance_order_timeline','maintenance_attachments','workshop_visits'].map(table=>allRows(table,'*',company,'created_at',id)),allRows('maintenance_order_dispatches','id,company_id,order_id,recipient_partner_id,kind,status,attempts,claimed_at,provider_message_id,error_message,created_at,updated_at',company,'created_at',id)]);
 const actors=[...new Set(timeline.map(t=>t.usuario_id))],names={};
 for(let offset=0;offset<actors.length;offset+=100){const result=await supabase.from('profiles').select('id,full_name,email').in('id',actors.slice(offset,offset+100));if(!result.error)for(const person of result.data)names[person.id]=person.full_name||person.email||person.id;}
 return{order,items,timeline,attachments,visits,dispatches,names};
}
export async function uploadOrderObject(company,id,file,visit=false){
 const invalid=validateAttachment(file);if(invalid)throw new Error(invalid);
 if(visit&&!file.type.startsWith('image/'))throw new Error('A foto da visita deve ser uma imagem.');
 const ext=file.name.split('.').pop().toLowerCase(),url=company+'/orders/'+id+'/'+(visit?'visits/':'files/')+crypto.randomUUID()+'.'+ext;
 checked(await supabase.storage.from('maintenance').upload(url,file,{contentType:FILE_TYPES[ext],upsert:false}));return{url,nome:file.name,content_type:FILE_TYPES[ext],tamanho_bytes:file.size};
}
export async function removeOrderObject(url){checked(await supabase.storage.from('maintenance').remove([url]));}
export async function downloadOrderObject(company,id,url,name){if(!url.startsWith(company+'/orders/'+id+'/'))throw new Error('Arquivo fora desta S.D.O.');return checked(await supabase.storage.from('maintenance').createSignedUrl(url,60,{download:name||true})).signedUrl;}

export const orderDispatchDocument=async(company,id)=>checked(await supabase.rpc('maintenance_order_dispatch',{target_company:company,command:'document',body:{id}}));
async function sendOrderBatch(company,id,kind,confirmUncertain=false,dispatchId){const s=await supabase.auth.getSession();if(s.error||!s.data?.session?.access_token)throw new Error('Entre novamente para enviar a S.D.O.');let r;try{r=await fetch('/api/order-dispatch',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.data.session.access_token},body:JSON.stringify({company,id,kind,confirmUncertain,...(dispatchId?{dispatchId}:{})}),signal:AbortSignal.timeout(240000)});}catch{throw new Error('Não foi possível confirmar o envio. Confira o WhatsApp antes de repetir.');}let d;try{d=await r.json();}catch{throw new Error('Resposta inválida. Confira o WhatsApp antes de repetir.');}if(!r.ok)throw new Error(d.error||'Não foi possível enviar.');return d;}

export async function sendOrderDispatch(company,id,kind,confirmUncertain=false,dispatchId){let previous=Infinity,result;for(let batch=0;batch<1000;batch++){result=await sendOrderBatch(company,id,kind,confirmUncertain,dispatchId);if(kind!=='abertura'||dispatchId||!result.remaining||result.remaining>=previous)return result;previous=result.remaining;}return result;}

export async function updateOrderData(company, orderId, payload, currentOrder) {
  let resultOrder = { ...currentOrder, ...payload };

  // 1. Tenta a RPC dedicada de edição
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('maintenance_order_edit', {
      target_company: company,
      order_id: orderId,
      body: payload
    });
    if (!rpcErr && rpcData) {
      return { ...resultOrder, ...rpcData };
    }
    if (rpcErr) {
      console.warn('RPC maintenance_order_edit pendente de migração no banco:', rpcErr.message);
    }
  } catch (err) {
    console.warn('RPC maintenance_order_edit note:', err);
  }

  // 2. Se a oficina mudou, dispara a seleção de oficina
  if (payload.partner_id && payload.partner_id !== currentOrder?.partner_id) {
    try {
      await commandOrder(company, 'select_partner', {
        id: orderId,
        partner_id: payload.partner_id,
        version: currentOrder?.version
      });
    } catch (err) {
      console.warn('select_partner note:', err);
    }
  }

  // 3. Atualiza via command 'summary'
  const summaryPayload = {
    id: orderId,
    version: currentOrder?.version,
    diagnostico: payload.diagnostico || '',
    servicos_executados: payload.servicos_executados || '',
    prazo_entrega_dias: payload.prazo_entrega_dias ? Number(payload.prazo_entrega_dias) : null,
    previsao_entrega: payload.previsao_entrega ? new Date(payload.previsao_entrega).toISOString() : null,
    observacao: payload.observacao_edicao || 'S.D.O editada com ocorrências da oficina'
  };

  if (payload.descricao_problema) summaryPayload.descricao_problema = payload.descricao_problema;
  if (payload.prioridade) summaryPayload.prioridade = payload.prioridade;
  if (payload.tipo) summaryPayload.tipo = payload.tipo;
  if (payload.km_abertura != null) summaryPayload.km_abertura = Number(payload.km_abertura);
  if (payload.codigo_servico) summaryPayload.codigo_servico = payload.codigo_servico;

  try {
    if (payload.codigo_servico) {
      await supabase.from('maintenance_orders').update({ codigo_servico: payload.codigo_servico }).eq('company_id', company).eq('id', orderId);
    }
  } catch (directErr) {
    console.warn('Direct order codigo_servico update note:', directErr);
  }

  try {
    const cmdData = await commandOrder(company, 'summary', summaryPayload);
    if (cmdData && typeof cmdData === 'object') {
      resultOrder = { ...resultOrder, ...cmdData, ...payload };
    }
  } catch (cmdErr) {
    console.warn('summary command note:', cmdErr);
  }

  return resultOrder;
}
