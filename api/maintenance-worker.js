import {timingSafeEqual} from 'node:crypto';
import {rpcClient,sendEvolution} from '../src/server/driverPortalTransport.js';
import {buildOrderWorkbook,orderDocumentName,orderMessage} from '../src/utils/orderWorkbook.js';
import {buildDriverReportWorkbook} from '../src/utils/driverReportWorkbook.js';
import {reportDocumentName,reportMessage} from '../src/utils/driverReports.js';
export const config={maxDuration:300};
export function createMaintenanceWorker({env=process.env,fetcher=fetch,orderWorkbook=buildOrderWorkbook,reportWorkbook=buildDriverReportWorkbook}={}){return async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
 const expected=env.MAINTENANCE_WORKER_SECRET||'',received=req.headers.authorization?.replace(/^Bearer /,'')||'';
 if(expected.length<40||Buffer.byteLength(expected)!==Buffer.byteLength(received)||!timingSafeEqual(Buffer.from(expected),Buffer.from(received)))return res.status(401).json({error:'Não autorizado.'});
 try{const client=rpcClient(env,fetcher);const rpc=(command,body={})=>client.rpc('maintenance_delivery_worker',{server_key:expected,command,body});const results=[];
 for(let n=0;n<4;n++){const job=await rpc('claim');if(job.status==='idle')break;if(job.status!=='claimed'){results.push({status:job.status});continue;}
 let outcome={status:'failed',message_id:null};try{const isOrder=job.job_kind==='order';if(job.job_kind==='message'){outcome=await sendEvolution(env,fetcher,{phone:job.phone,text:job.text});}else{const buffer=await(isOrder?orderWorkbook(job.snapshot):reportWorkbook(job.snapshot));outcome=await sendEvolution(env,fetcher,{phone:job.phone,buffer,fileName:isOrder?orderDocumentName(job.snapshot):reportDocumentName(job.snapshot),text:isOrder?orderMessage(job.snapshot,job.dispatch_kind):reportMessage(job.snapshot)});}}catch{/* No credentials or provider response in logs. */}
 try{const result=await rpc('finish',{job_id:job.job_id,job_token:job.job_token,token:job.token,...outcome});results.push({status:result.status});}catch{results.push({status:'unknown'});}
 }
 return res.status(200).json({processed:results.length,results});
 }catch{return res.status(503).json({error:'Não foi possível confirmar o processamento.'});}
 };}
export default createMaintenanceWorker();
