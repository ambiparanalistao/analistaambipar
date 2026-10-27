import {supabase} from '../lib/supabaseClient';
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function requireCompany(company){if(!supabase||!uuid.test(company||''))throw new Error('Selecione uma empresa e conecte-se ao banco para usar os cadastros.');}
export function registryChanged(company){window.dispatchEvent(new CustomEvent('fleet-registry-changed',{detail:{company}}));}
export async function registryRows(table,company,order){requireCompany(company);let rows=[];for(let offset=0;;offset+=1000){const r=await supabase.from(table).select('*').eq('company_id',company).order(order).order('id').range(offset,offset+999);if(r.error)throw new Error(r.error.message||'Não foi possível carregar os cadastros.');rows.push(...(r.data||[]));if(!r.data||r.data.length<1000)return rows;}}
export async function loadFleetDirectory(company){const [vehicles,drivers]=await Promise.all([registryRows('veiculos',company,'placa'),registryRows('motoristas',company,'nome')]);return {vehicles,drivers};}
const driverFields=['nome','cpf','telefone','telefone_emergencia','cnh','categoria_cnh','validade_cnh','mopp_numero','validade_toxicologico','nr20','nr35','validade_nr20','validade_nr35','validade_nr33','validade_direcao_defensiva','validade_cargas_especiais','validade_hazmat_pae','veiculo_vinculado','status','observacoes'];
export function driverPayload(form){return Object.fromEntries(driverFields.filter(k=>form[k]!==undefined).map(k=>[k,typeof form[k]==='string'?form[k].trim()||null:form[k]]));}
export async function saveDriver(form,id,userId,company){requireCompany(company);if(!form.nome?.trim())throw new Error('Informe o nome do motorista.');if(!form.cnh?.trim()||!form.validade_cnh)throw new Error('Informe a CNH e a validade reais do motorista.');const row=driverPayload(form);let q=id?supabase.from('motoristas').update(row).eq('id',id).eq('company_id',company):supabase.from('motoristas').insert({...row,user_id:userId,company_id:company});const r=await q.select().single();if(r.error||!r.data)throw new Error(r.error?.message||'Cadastro não salvo.');registryChanged(company);return r.data;}
export async function updateRegistryStatus(table,id,status,company){requireCompany(company);const r=await supabase.from(table).update({status}).eq('id',id).eq('company_id',company).select().single();if(r.error||!r.data)throw new Error(r.error?.message||'Status não alterado.');registryChanged(company);return r.data;}
export async function deleteRegistryRecord(table, id, company) {
  requireCompany(company);

  // 1. Caso especial: veiculos -> Usa a RPC dedicada ou limpeza prévia de dependências
  if (table === 'veiculos') {
    try {
      const { data, error } = await supabase.rpc('maintenance_vehicle_delete', {
        target_company: company,
        vehicle_id: id
      });
      if (!error && (data?.success || data?.deleted_id)) {
        registryChanged(company);
        return { success: true, id };
      }
      if (error) console.warn('RPC maintenance_vehicle_delete note:', error.message);
    } catch (err) {
      console.warn('RPC maintenance_vehicle_delete catch:', err);
    }

    // Fallback client-side: desvincula e limpa tabelas filhas antes de deletar o veículo
    try {
      await Promise.allSettled([
        supabase.from('vehicle_preventive_settings').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_plan_vehicles').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_plans').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_vehicle_preferences').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_driver_bindings').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_vehicle_events').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_allocations').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('vehicle_occurrences').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_checklists').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('fuel_provision_vehicles').delete().eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_orders').update({ vehicle_id: null }).eq('company_id', company).eq('vehicle_id', id),
        supabase.from('workshop_visits').update({ vehicle_id: null }).eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_driver_reports').update({ vehicle_id: null }).eq('company_id', company).eq('vehicle_id', id),
        supabase.from('vehicle_infractions').update({ vehicle_id: null }).eq('company_id', company).eq('vehicle_id', id),
        supabase.from('fuel_transactions').update({ vehicle_id: null }).eq('company_id', company).eq('vehicle_id', id),
        supabase.from('maintenance_assets').update({ vehicle_id: null, status: 'estoque', position: null }).eq('company_id', company).eq('vehicle_id', id)
      ]);
    } catch (cleanErr) {
      console.warn('Client cleanup note before vehicle delete:', cleanErr);
    }
  }

  // 2. Caso especial: motoristas -> Desvincula tabelas dependentes
  if (table === 'motoristas') {
    try {
      await Promise.allSettled([
        supabase.from('maintenance_driver_bindings').delete().eq('company_id', company).eq('driver_id', id),
        supabase.from('maintenance_checklists').update({ driver_id: null }).eq('company_id', company).eq('driver_id', id),
        supabase.from('maintenance_driver_reports').update({ driver_id: null }).eq('company_id', company).eq('driver_id', id)
      ]);
    } catch (driverErr) {
      console.warn('Driver clean note:', driverErr);
    }
  }

  const r = await supabase.from(table).delete().eq('id', id).eq('company_id', company).select('id');
  if (r.error || !r.data?.length) {
    throw new Error(r.error?.code === '23503' ? 'Este cadastro tem vínculos ativos e não pôde ser desvinculado.' : (r.error?.message || 'Exclusão não confirmada pelo banco.'));
  }
  registryChanged(company);
  return { success: true, id };
}
