import {supabase} from '../lib/supabaseClient';
import {checked,commandOrder} from './maintenanceOrders';
import {DEFAULT_PREVENTIVE_PLANS,generateFleetAlerts,computeVehiclePreventiveAlerts} from '../utils/planValidation';

const reads=new Set(['alerts','context','count','notifications']);

export async function planCommand(company,command,body={}){
  if(!company||!supabase)throw new Error('Selecione uma empresa autenticada.');

  if(command==='create_order'&&typeof body.plan_vehicle_id==='string'&&body.plan_vehicle_id.startsWith('auto-')){
    const payload={
      ...body,
      tipo:'preventiva'
    };
    const row=await commandOrder(company,'create',payload);
    window.dispatchEvent(new CustomEvent('maintenance:plans-changed',{detail:{company}}));
    return row;
  }

  let remoteData=null;
  let remoteError=null;

  try{
    remoteData=checked(await supabase.rpc('maintenance_plan_command',{target_company:company,command,body}));
  }catch(err){
    remoteError=err;
    if(!reads.has(command)){
      throw err;
    }
  }

  if(command==='alerts'){
    let rows=remoteData?.rows||[];
    if(!rows.length){
      try{
        const [vehiclesRes,ordersRes]=await Promise.all([
          supabase.from('veiculos').select('id, placa, tipo, km_atual').eq('company_id',company).order('placa'),
          supabase.from('maintenance_orders').select('id, vehicle_id, status').eq('company_id',company).not('status','in','("encerrada","cancelada")')
        ]);
        const vehicles=vehiclesRes.data||[];
        const openOrders=ordersRes.data||[];
        const generated=generateFleetAlerts(vehicles,[],{antecedencia_alerta_km:500,antecedencia_alerta_dias:7},openOrders);
        rows=body.vehicle_id?generated.filter(a=>a.vehicle_id===body.vehicle_id):generated;
      }catch(fallbackErr){
        console.warn('Falha ao gerar alertas preventivos automáticos da frota:',fallbackErr);
      }
    }
    return {rows};
  }

  if(command==='count'){
    if(remoteData?.count!=null&&Number(remoteData.count)>0){
      return remoteData;
    }
    try{
      const {data:vehicles}=await supabase.from('veiculos').select('id, placa, tipo, km_atual').eq('company_id',company);
      const generated=generateFleetAlerts(vehicles||[]);
      const count=generated.filter(a=>a.estado!=='dia').length;
      return {count};
    }catch{
      return {count:remoteData?.count||0};
    }
  }

  if(command==='context'){
    const plans=remoteData?.plans&&remoteData.plans.length?remoteData.plans:DEFAULT_PREVENTIVE_PLANS;
    let vehicles=remoteData?.vehicles||[];
    if(!vehicles.length){
      const {data:vList}=await supabase.from('veiculos').select('id, placa, tipo, km_atual').eq('company_id',company).order('placa');
      vehicles=vList||[];
    }
    const settings=remoteData?.settings||{
      antecedencia_alerta_km:500,
      antecedencia_alerta_dias:7,
      version:1
    };
    return {plans,vehicles,settings};
  }

  if(!reads.has(command)){
    window.dispatchEvent(new CustomEvent('maintenance:plans-changed',{detail:{company}}));
  }

  if(remoteError)throw remoteError;
  return remoteData;
}

