import {supabase} from '../lib/supabaseClient';
async function checked(result){if(result.error)throw new Error(result.error.message||'Não foi possível concluir.');return result.data;}
export async function publicRegistration(invite,command,body={}){return checked(await supabase.rpc('maintenance_partner_registration',{invite,command,body}));}
export async function registrationCommand(company,command,body={}){return checked(await supabase.rpc('maintenance_partner_requests_command',{target_company:company,command,body}));}
export const registrationUrl=token=>window.location.origin+'/cadastro/oficinas#convite='+encodeURIComponent(token);
export async function allRequests(company,status){let rows=[],page=1;while(true){const data=await registrationCommand(company,'list',{status,page,size:500});rows.push(...(data.rows||[]));if(rows.length>=data.count||!data.rows?.length)break;page++;}return rows;}

export async function sendPartnerApproval(company,id,command='approve',note='',confirmUncertain=false){
 const session=await supabase.auth.getSession();if(session.error||!session.data?.session?.access_token)throw new Error('Entre novamente para aprovar a oficina.');
 let response;try{response=await fetch('/api/partner-approval',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.data.session.access_token},body:JSON.stringify({company,id,command,note,confirmUncertain}),signal:AbortSignal.timeout(90000)});}catch{throw new Error('Não foi possível confirmar a operação. Atualize a solicitação para consultar a aprovação e o envio antes de repetir.');}
 let data;try{data=await response.json();}catch{throw new Error('Resposta inválida. Atualize a solicitação antes de repetir.');}if(!response.ok)throw new Error(data.error||'Não foi possível aprovar a oficina.');return data;
}
export async function getApprovalNotice(company,id){return checked(await supabase.from('maintenance_partner_approval_notices').select('request_id,status,phone,body,attempts,claimed_at,provider_message_id,error_message,accepted_at,updated_at').eq('company_id',company).eq('request_id',id).maybeSingle());}
