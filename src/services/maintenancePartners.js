import {PARTNER_TYPES} from '../utils/partnerValidation';
import {supabase} from '../lib/supabaseClient';
import {partnerPayload,validatePartner,validateAttachment,FILE_TYPES} from '../utils/partnerValidation';
const checked = result => {if(result.error) {const e=result.error;throw new Error(e.code==='23505'?'CPF/CNPJ já cadastrado nesta empresa.':e.code==='42501'?'Seu perfil não tem permissão para esta operação.':e.message||'Não foi possível acessar os dados.');}return result;};
export async function listPartners(company,filters,page=1,limit=20,signal){
 let q=supabase.from('maintenance_partners').select('*',{count:'exact'}).eq('company_id',company);
 const term=filters.search.replace(/[^\p{L}\p{N} ]/gu,'').trim().slice(0,100);
 if(term)q=q.or('nome_fantasia.ilike.%'+term+'%,razao_social.ilike.%'+term+'%,cnpj_cpf.ilike.%'+term+'%');
 if(filters.tipo)q=q.or('tipo.eq.'+filters.tipo+',onboarding_profile->tipos_oficina.cs.'+JSON.stringify([PARTNER_TYPES[filters.tipo]]));
 for(const k of ['cidade','status'])if(filters[k])q=q.eq(k,filters[k]);
 if(filters.nota)q=q.gte('avaliacao_interna',Number(filters.nota));
 q=q.order('nome_fantasia',{nullsFirst:false}).order('razao_social').order('id').range((page-1)*limit,page*limit-1);
 if(signal)q=q.abortSignal(signal);return checked(await q);
}
export async function partnerCities(company){return checked(await supabase.rpc('maintenance_partner_cities',{target_company:company})).data||[];}
export async function partnerDetail(company,id){
 const results=await Promise.all([
 supabase.from('maintenance_partners').select('*').eq('company_id',company).eq('id',id).single(),
 supabase.rpc('maintenance_partner_metrics',{target_company:company,target_partner:id}),
 supabase.from('maintenance_orders').select('id,numero,status,data_abertura,valor_total').eq('company_id',company).eq('partner_id',id).order('data_abertura',{ascending:false}).limit(5),
 supabase.from('maintenance_partner_attachments').select('*').eq('company_id',company).eq('partner_id',id).order('created_at',{ascending:false}),
 supabase.from('maintenance_partner_audit').select('*').eq('company_id',company).eq('partner_id',id).order('created_at',{ascending:false}).limit(20)
 ]);results.forEach(checked);
 return {partner:results[0].data,metrics:results[1].data?.[0]||{total_os:0,custo_medio:null},orders:results[2].data,files:results[3].data,audit:results[4].data};
}
export async function savePartner(company,form,previous){
 if(Object.keys(validatePartner(form)).length)throw new Error('Revise os campos destacados.');
 const payload=partnerPayload(form);
 const result=previous?await supabase.from('maintenance_partners').update(payload).eq('company_id',company).eq('id',previous.id).eq('version',previous.version).select().maybeSingle():await supabase.from('maintenance_partners').insert({...payload,company_id:company}).select().single();
 const row=checked(result).data;if(!row)throw new Error('O cadastro foi alterado por outro usuário ou seu acesso mudou. Reabra os dados antes de editar.');return row;
}
export async function uploadPartnerFile(company,id,file,categoria){
 const error=validateAttachment(file);if(error)throw new Error(error);
 const ext=file.name.split('.').pop().toLowerCase(),object_path=company+'/partners/'+id+'/'+crypto.randomUUID()+'.'+ext,content_type=FILE_TYPES[ext];
 checked(await supabase.storage.from('maintenance').upload(object_path,file,{contentType:content_type,upsert:false}));
 const result=await supabase.from('maintenance_partner_attachments').insert({company_id:company,partner_id:id,categoria,nome:file.name,object_path,content_type,tamanho_bytes:file.size}).select().single();
 if(result.error){await supabase.storage.from('maintenance').remove([object_path]);checked(result);}return result.data;
}
function assertPath(company,id,file){if(!file.object_path.startsWith(company+'/partners/'+id+'/'))throw new Error('Anexo inválido.');}
export async function downloadPartnerFile(company,id,file){assertPath(company,id,file);return checked(await supabase.storage.from('maintenance').createSignedUrl(file.object_path,60,{download:file.nome})).data.signedUrl;}
export async function removePartnerFile(company,id,file){assertPath(company,id,file);checked(await supabase.storage.from('maintenance').remove([file.object_path]));checked(await supabase.from('maintenance_partner_attachments').delete().eq('company_id',company).eq('partner_id',id).eq('id',file.id));}
