import {supabase} from '../lib/supabaseClient';
import {checked} from './maintenanceOrders';
import {validateAttachment} from '../utils/partnerValidation';
export async function vehicleCommand(company,command,body={}){if(!supabase||!company)throw new Error('Selecione uma empresa autenticada.');return checked(await supabase.rpc('maintenance_vehicle_command',{target_company:company,command,body}));}
export async function vehicleEvents(company,vehicle,filters={},all=false){let rows=[],page=all?1:filters.page||1;do{const batch=await vehicleCommand(company,'events',{vehicle_id:vehicle,...filters,page});rows.push(...batch);if(!all||batch.length<100)return rows;page++;}while(all);}
export async function reportOccurrence(company,form,files=[]){
 const row=await vehicleCommand(company,'report',form),failures=[];
 for(const file of files){let key;try{const error=validateAttachment(file);if(error||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error(error||'Use fotos JPEG, PNG ou WebP.');
 key=company+'/occurrences/'+row.id+'/'+crypto.randomUUID()+'.'+file.name.split('.').pop().toLowerCase();
 checked(await supabase.storage.from('maintenance').upload(key,file,{contentType:file.type,upsert:false}));await vehicleCommand(company,'photo_add',{id:row.id,path:key});
 }catch(e){failures.push(file.name+': '+e.message);if(key)await supabase.storage.from('maintenance').remove([key]).catch(()=>{});}}
 return{row,warning:failures.length?'Ocorrência registrada. Falha nas fotos: '+failures.join('; '):''};
}
export async function signedMaintenanceFile(key){return checked(await supabase.storage.from('maintenance').createSignedUrl(key,60)).signedUrl;}
export async function allocateVehicle(company,plate,kind,reference){
 const {vehicles:list}=await vehicleCommand(company,'options'),normalized=String(plate||'').replace(/[^a-z0-9]/gi,'').toUpperCase();
 const vehicle=list.find(v=>v.placa.replace(/[^a-z0-9]/gi,'').toUpperCase()===normalized);
 if(!vehicle)throw new Error('Veículo indisponível ou fora da empresa. Atualize a frota e selecione um veículo disponível.');
 return vehicleCommand(company,'allocate',{vehicle_id:vehicle.id,kind,reference});
}
