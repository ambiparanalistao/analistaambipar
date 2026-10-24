// Sends only the approved workshop's persisted congratulatory message.
import {readConfig} from './evolution.js';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function createApprovalHandler({env=process.env,fetcher=fetch}={}){
 return async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Método não permitido.'});}
 try{
 if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{throw fail(403,'Origem inválida.');}if(origin.host!==req.headers.host||!['http:','https:'].includes(origin.protocol))throw fail(403,'Origem não permitida.');}
 const token=req.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1];if(!token||['anonymous','demo'].includes(token))throw fail(401,'Entre na plataforma para aprovar a oficina.');
 const authUrl=env.SUPABASE_URL||env.VITE_SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL;
 const authKey=env.SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_ANON_KEY||env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!authUrl||!authKey)throw fail(503,'Autenticação do servidor não configurada.');
 let userResponse;try{userResponse=await fetcher(new URL('/auth/v1/user',authUrl),{headers:{apikey:authKey,Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000),redirect:'error'});}catch{throw fail(503,'Não foi possível validar a sessão.');}
 if(!userResponse.ok)throw fail(401,'Sessão inválida. Entre novamente.');const user=await userResponse.json();if(!user.id||user.is_anonymous)throw fail(403,'É necessário um usuário autenticado.');
 let body=req.body;try{if(typeof body==='string'){if(body.length>20000)throw new Error();body=JSON.parse(body);}}catch{throw fail(400,'Solicitação inválida.');}
 if(!body||typeof body!=='object'||Array.isArray(body)||!uuid.test(body.company)||!uuid.test(body.id)||!['approve','retry'].includes(body.command)||Object.keys(body).some(k=>!['company','id','command','note','confirmUncertain'].includes(k))||(body.note!=null&&(typeof body.note!=='string'||body.note.length>4000)))throw fail(400,'Solicitação inválida.');
 const rpc=async(name,command,payload)=>{
 let response;try{response=await fetcher(new URL('/rest/v1/rpc/'+name,authUrl),{method:'POST',headers:{apikey:authKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({target_company:body.company,command,body:payload}),signal:AbortSignal.timeout(10000),redirect:'error'});}catch{throw fail(503,'Não foi possível confirmar a operação no banco. Atualize a solicitação antes de repetir.');}
 let data;try{data=await response.json();}catch{throw fail(503,'Resposta inválida do banco. Atualize a solicitação.');}
 if(!response.ok)throw fail(data?.code==='42501'?403:data?.code==='40001'?409:400,data?.message||'Operação não permitida.');return data;};
 if(body.command==='approve')await rpc('maintenance_partner_requests_command','approve',{id:body.id,note:body.note||''});
 const result=notification=>res.status(200).json({approved:true,notification});
 let claim;try{claim=await rpc('maintenance_partner_approval_notice','claim',{id:body.id,confirm_uncertain:body.confirmUncertain===true});}catch(e){if(body.command==='retry')throw e;return result({status:'pending',error:'Oficina aprovada. Não foi possível iniciar a mensagem; consulte a solicitação para tentar novamente.'});}
 if(claim.status!=='claimed')return result({status:claim.status,error:claim.error});
 let status='failed',messageId=null;
 try{
 const config=readConfig(env);if(!config.key)throw new Error('Missing configuration');
 // Read connection state before a send. Failures here cannot have delivered a message.
 const state=await fetcher(config.base+'/instance/connectionState/'+encodeURIComponent(config.instance),{headers:{apikey:config.key},signal:AbortSignal.timeout(10000),redirect:'error'});
 const connection=await state.json();if(!state.ok||connection?.instance?.state!=='open')throw new Error('Instance offline');
 status='unknown'; // Once POST starts, an interrupted response is ambiguous: never blindly retry.
 const sent=await fetcher(config.base+'/message/sendText/'+encodeURIComponent(config.instance),{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({number:claim.phone,text:claim.text,linkPreview:false,delay:1000}),signal:AbortSignal.timeout(15000),redirect:'error'});
 if(sent.status>=400&&sent.status<500)status='failed';
 if(sent.ok){const data=await sent.json();const id=data?.key?.id||data?.id;if(!data?.error&&typeof id==='string'&&id.length>0&&id.length<=200){messageId=id;status='accepted';}}
 }catch{/* Persist only sanitized result. Never return upstream credentials or payloads. */}
 try{const saved=await rpc('maintenance_partner_approval_notice','finish',{id:body.id,token:claim.token,status,message_id:messageId});return result(saved);}catch{return result({status:'unknown',error:'Oficina aprovada. Não foi possível confirmar o registro do envio. Confira o WhatsApp antes de repetir.'});}
 }catch(e){return res.status(e.status||500).json({error:e.status?e.message:'Não foi possível concluir a aprovação. Atualize a solicitação.'});}
 };
}
export default createApprovalHandler();
