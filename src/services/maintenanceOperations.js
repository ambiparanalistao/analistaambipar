import {supabase} from '../lib/supabaseClient';import {checked} from './maintenanceOrders';
export async function operations(company,command,body={}){if(!supabase||!company)throw new Error('Selecione uma empresa autenticada.');return checked(await supabase.rpc('maintenance_operations',{target_company:company,command,body}));}
export async function cashflow(company,body={}){if(!supabase||!company)throw new Error('Selecione uma empresa autenticada.');return checked(await supabase.rpc('maintenance_cashflow',{target_company:company,body}));}
