import {supabase} from '../lib/supabaseClient';
async function checked(result){if(result.error)throw new Error(result.error.message||'Não foi possível concluir.');return result.data;}
export async function publicRegistration(invite,command,body={}){return checked(await supabase.rpc('maintenance_partner_registration',{invite,command,body}));}
export async function registrationCommand(company,command,body={}){return checked(await supabase.rpc('maintenance_partner_requests_command',{target_company:company,command,body}));}
export const registrationUrl=token=>window.location.origin+'/cadastro/oficinas#convite='+encodeURIComponent(token);
export async function allRequests(company,status){let rows=[],page=1;while(true){const data=await registrationCommand(company,'list',{status,page,size:500});rows.push(...(data.rows||[]));if(rows.length>=data.count||!data.rows?.length)break;page++;}return rows;}
