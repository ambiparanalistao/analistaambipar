import {supabase} from '../lib/supabaseClient';
import {checked} from './maintenanceOrders';
const reads=new Set(['alerts','context','count','notifications']);
export async function planCommand(company,command,body={}){if(!company||!supabase)throw new Error('Selecione uma empresa autenticada.');const data=checked(await supabase.rpc('maintenance_plan_command',{target_company:company,command,body}));if(!reads.has(command))window.dispatchEvent(new CustomEvent('maintenance:plans-changed',{detail:{company}}));return data;}
