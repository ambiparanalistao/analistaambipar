import {supabase} from '../lib/supabaseClient';
const fields=['branch_id','placa','tipo','marca_modelo','ano_fabricacao','ano_modelo','chassi','renavam','capacidade_peso_ton','capacidade_volume_m3','tipo_carga','combustivel','meta_consumo_kml','km_atual','proxima_revisao_km','validade_crlv','validade_cronotacografo','validade_cipp','validade_civ','validade_fumaca_opacidade','validade_seguro_ambiental','motorista_vinculado','status','observacoes'];
export function fleetPayload(payload){const result=Object.fromEntries(fields.filter(k=>payload[k]!==undefined).map(k=>[k,payload[k]===''?null:payload[k]]));return result;}
export async function persistFleetVehicle(payload,id,userId,company){
 if(!Number.isInteger(Number(payload.km_atual))||Number(payload.km_atual)<0)throw new Error('KM deve ser um inteiro não negativo.');
 const row=fleetPayload(payload),saved=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id||'');
 let q=saved?supabase.from('veiculos').update(row).eq('id',id):supabase.from('veiculos').insert({...row,user_id:userId,...(company?{company_id:company}:{})});
 if(saved&&company)q=q.eq('company_id',company);
 const result=await q.select().single();if(result.error)throw new Error(result.error.message||'Não foi possível salvar o veículo.');return{...payload,...result.data};
}
