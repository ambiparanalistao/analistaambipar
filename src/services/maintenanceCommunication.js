import {supabase} from '../lib/supabaseClient';import {checked} from './maintenanceOrders';
const reads=new Set(['context','history','config','overview','notifications']);
export async function communicationCommand(company,command,body={}){if(!supabase||!company)throw new Error('Selecione uma empresa autenticada.');const data=checked(await supabase.rpc('maintenance_communication_command',{target_company:company,command,body}));if(!reads.has(command))window.dispatchEvent(new CustomEvent('maintenance:communication-changed',{detail:{company,order:body.order_id}}));return data;}
