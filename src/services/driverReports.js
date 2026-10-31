import {supabase} from '../lib/supabaseClient';import {checked} from './maintenanceOrders';
export async function driverPortal(action,body={}){const r=await fetch('/api/driver-portal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...body})});let d;try{d=await r.json();}catch{throw new Error('Não foi possível acessar o portal. Tente novamente.');}if(!r.ok||d.error)throw new Error(d.error||'Não foi possível concluir.');return d;}
export async function driverReportsCommand(company,command,body={}){if(!supabase||!company)throw new Error('Selecione uma empresa autenticada.');return checked(await supabase.rpc('driver_maintenance_admin',{target_company:company,command,body}));}
export async function dispatchDriverReport(company,id,dispatchId,confirmUncertain=false){const {data}=await supabase.auth.getSession();if(!data.session?.access_token)throw new Error('Entre novamente.');const send=async()=>{const r=await fetch('/api/driver-report-dispatch',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({company,id,...(dispatchId?{dispatchId,confirmUncertain}:{})})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Falha ao encaminhar.');return d;};let result=await send();while(!dispatchId&&result.remaining>0){const before=result.remaining;result=await send();if(result.remaining>=before)break;}return result;}

export async function reportOrder(company,command,body={}){if(!supabase||!company)throw new Error('Selecione uma empresa autenticada.');return checked(await supabase.rpc('maintenance_report_order',{target_company:company,command,body}));}

export async function deleteDriverReport(company, reportId) {
  if (!supabase || !company) throw new Error('Selecione uma empresa autenticada.');

  // 1. Tenta RPC dedicada maintenance_driver_report_delete
  try {
    const { data, error } = await supabase.rpc('maintenance_driver_report_delete', {
      target_company: company,
      report_id: reportId
    });
    if (!error && (data?.success || data?.deleted_id)) return data;
    if (error) console.warn('RPC maintenance_driver_report_delete note:', error.message);
  } catch (rpcErr) {
    console.warn('RPC maintenance_driver_report_delete catch:', rpcErr);
  }

  // 2. Tenta comando 'delete' no driver_maintenance_admin
  try {
    const { data, error } = await supabase.rpc('driver_maintenance_admin', {
      target_company: company,
      command: 'delete',
      body: { id: reportId }
    });
    if (!error && (data?.success || data?.deleted_id)) return data;
    if (error) console.warn('driver_maintenance_admin delete note:', error.message);
  } catch (adminErr) {
    console.warn('driver_maintenance_admin delete catch:', adminErr);
  }

  // 3. Fallback: exclusão direta no Supabase com limpeza de vínculos filhos
  try {
    await Promise.allSettled([
      supabase.from('maintenance_driver_report_events').delete().eq('company_id', company).eq('report_id', reportId),
      supabase.from('maintenance_driver_report_dispatches').delete().eq('company_id', company).eq('report_id', reportId),
      supabase.from('maintenance_report_orders').delete().eq('company_id', company).eq('report_id', reportId),
      supabase.from('maintenance_checklists').update({ report_id: null }).eq('company_id', company).eq('report_id', reportId)
    ]);

    const { data: directData, error: directErr } = await supabase
      .from('maintenance_driver_reports')
      .delete()
      .eq('company_id', company)
      .eq('id', reportId)
      .select();

    if (!directErr && directData && directData.length > 0) {
      return { success: true, deleted_id: reportId };
    }
    if (directErr) console.warn('Direct delete driver report note:', directErr.message);
  } catch (directErr) {
    console.warn('Direct delete driver report catch:', directErr);
  }

  // 4. Fallback de contingência: transição para status 'cancelada'
  return await driverReportsCommand(company, 'status', {
    id: reportId,
    status: 'cancelada',
    feedback: 'Solicitação cancelada e excluída pelo analista/gestor da frota.'
  });
}

