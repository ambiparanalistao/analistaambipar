import {supabase} from '../lib/supabaseClient';
import {checked} from './maintenanceOrders';
export async function workshopQuote(token,command,body={}){if(!supabase)throw new Error('Serviço indisponível.');return checked(await supabase.rpc('maintenance_workshop_quote',{token,command,body}));}
export async function quoteAdmin(company,command,body={}){if(!supabase||!company)throw new Error('Entre e selecione a empresa.');return checked(await supabase.rpc('maintenance_quote_admin',{target_company:company,command,body}));}
