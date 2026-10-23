import {supabase} from '../lib/supabaseClient';
import {validateAttachment,FILE_TYPES} from '../utils/partnerValidation';
export function checked(result){if(result.error)throw new Error(result.error.code==='42501'?'Seu perfil não permite esta ação nesta empresa.':result.error.message||'Falha ao acessar as ordens de serviço.');return result.data;}
export const commandOrder=async(company,action,body)=>checked(await supabase.rpc('maintenance_order_command',{target_company:company,command:action,body}));
async function allRows(table,fields,company,order,orderId){let data=[],offset=0;while(true){let q=supabase.from(table).select(fields).eq('company_id',company);if(orderId)q=q.eq('order_id',orderId);const rows=checked(await q.order(order).order('id').range(offset,offset+999));data.push(...rows);if(rows.length<1000)return data;offset+=1000;}}
export async function orderOptions(company){const [vehicles,partners,drivers,settings]=await Promise.all([allRows('veiculos','id,placa,marca_modelo,km_atual,status',company,'placa'),allRows('maintenance_partners','id,nome_fantasia,razao_social,status',company,'razao_social'),allRows('motoristas','id,nome',company,'nome'),supabase.from('maintenance_settings').select('limite_aprovacao_supervisor').eq('company_id',company).maybeSingle()]);return{vehicles,partners,drivers,supervisorLimit:checked(settings)?.limite_aprovacao_supervisor??5000};}
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
 const [order,items,timeline,attachments,visits]=await Promise.all([
 supabase.from('maintenance_orders').select('*').eq('company_id',company).eq('id',id).single().then(checked),
 ...['maintenance_order_items','maintenance_order_timeline','maintenance_attachments','workshop_visits'].map(table=>allRows(table,'*',company,'created_at',id))]);
 const actors=[...new Set(timeline.map(t=>t.usuario_id))],names={};
 for(let offset=0;offset<actors.length;offset+=100){const result=await supabase.from('profiles').select('id,full_name,email').in('id',actors.slice(offset,offset+100));if(!result.error)for(const person of result.data)names[person.id]=person.full_name||person.email||person.id;}
 return{order,items,timeline,attachments,visits,names};
}
export async function uploadOrderObject(company,id,file,visit=false){
 const invalid=validateAttachment(file);if(invalid)throw new Error(invalid);
 if(visit&&!file.type.startsWith('image/'))throw new Error('A foto da visita deve ser uma imagem.');
 const ext=file.name.split('.').pop().toLowerCase(),url=company+'/orders/'+id+'/'+(visit?'visits/':'files/')+crypto.randomUUID()+'.'+ext;
 checked(await supabase.storage.from('maintenance').upload(url,file,{contentType:FILE_TYPES[ext],upsert:false}));return{url,nome:file.name,content_type:FILE_TYPES[ext],tamanho_bytes:file.size};
}
export async function removeOrderObject(url){checked(await supabase.storage.from('maintenance').remove([url]));}
export async function downloadOrderObject(company,id,url,name){if(!url.startsWith(company+'/orders/'+id+'/'))throw new Error('Arquivo fora desta OS.');return checked(await supabase.storage.from('maintenance').createSignedUrl(url,60,{download:name||true})).signedUrl;}
