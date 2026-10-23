import {orderPermissions} from '../utils/orderValidation';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabaseClient';
import {maintenanceRole,readableRole,writableRole} from '../utils/partnerValidation';
export default function useMaintenanceAccess(user){
 const [state,setState]=useState({loading:true,memberships:[],error:''}),[companyId,setCompanyId]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{let cancelled=false;const controller=new AbortController();
 async function fetchAccess(){
 setState({loading:true,memberships:[],error:''});
 if(!supabase||!user?.id||user.id.startsWith('demo')){setState({loading:false,memberships:[],error:''});return;}
 try{
 const members=await supabase.from('company_members').select('company_id,role,maintenance_role').eq('user_id',user.id).eq('ativo',true).abortSignal(controller.signal);if(members.error)throw members.error;
 const ids=members.data.map(m=>m.company_id);let companies=[];
 if(ids.length){const result=await supabase.from('companies').select('id,nome').in('id',ids).eq('ativo',true).abortSignal(controller.signal);if(result.error)throw result.error;companies=result.data;}
 const memberships=members.data.map(m=>({...m,...companies.find(c=>c.id===m.company_id),roleName:maintenanceRole(m)})).filter(m=>m.id);
 let preferred='';try{preferred=localStorage.getItem('maintenance_company_'+user.id)||'';}catch{/* Storage preference is optional. */}
 if(!cancelled){setState({loading:false,memberships,error:''});setCompanyId(previous=>[previous,preferred].find(id=>memberships.some(m=>m.company_id===id&&readableRole(m.roleName)))||memberships.find(m=>readableRole(m.roleName))?.company_id||'');}
 }catch(e){if(!cancelled)setState({loading:false,memberships:[],error:e.message||'Falha ao verificar acesso.'});}
 }fetchAccess();return()=>{cancelled=true;controller.abort();};},[user?.id,revision]);
 const membership=state.memberships.find(m=>m.company_id===companyId),role=membership?.roleName;
 function selectCompany(id){if(!state.memberships.some(m=>m.company_id===id&&readableRole(m.roleName)))return;setCompanyId(id);try{localStorage.setItem('maintenance_company_'+user.id,id);}catch{/* Optional preference. */}}
 return {...state,orderPermissions:orderPermissions(role),companyId,membership,role,canRead:readableRole(role),canWrite:writableRole(role),selectCompany,reload:()=>setRevision(v=>v+1)};
}
