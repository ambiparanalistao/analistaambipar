import {readConfig} from '../../api/evolution.js';
export const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const fail=(status,message)=>Object.assign(new Error(message),{status});

export function requestBody(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.setHeader('Allow','POST');throw fail(405,'Método não permitido.');}
  if(req.headers.origin){
    let u;
    try{u=new URL(req.headers.origin);}catch{throw fail(403,'Origem inválida.');}
    if(u.host!==req.headers.host||!['http:','https:'].includes(u.protocol))throw fail(403,'Origem não permitida.');
  }
  let b=req.body;
  try{if(typeof b==='string'){if(b.length>16000)throw Error();b=JSON.parse(b);}}catch{throw fail(400,'Solicitação inválida.');}
  if(!b||Array.isArray(b)||typeof b!=='object')throw fail(400,'Solicitação inválida.');
  return b;
}

export function rpcClient(env,fetcher,bearer){
  const url=env.SUPABASE_URL||env.VITE_SUPABASE_URL;
  const key=env.SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_ANON_KEY;
  if(!url||!key)throw fail(503,'Servidor não configurado.');
  return {
    url,
    key,
    async rpc(name,body){
      let r;
      try{
        r=await fetcher(new URL('/rest/v1/rpc/'+name,url),{
          method:'POST',
          headers:{apikey:key,Authorization:'Bearer '+(bearer||key),'Content-Type':'application/json'},
          body:JSON.stringify(body),
          signal:AbortSignal.timeout(10000),
          redirect:'error'
        });
      }catch{
        throw fail(503,'Não foi possível confirmar o registro. Atualize antes de repetir.');
      }
      let data;
      try{data=await r.json();}catch{throw fail(503,'Resposta inválida do banco.');}
      if(!r.ok)throw fail(data.code==='42501'?403:data.code==='40001'?409:400,data.message||'Operação não permitida.');
      return data;
    }
  };
}

export async function sendEvolution(env,fetcher,{phone,text,buffer,fileName}){
  let status='failed',messageId=null;
  try{
    const c=readConfig(env);
    if(!c.key)throw Error();
    const r=await fetcher(c.base+'/instance/connectionState/'+encodeURIComponent(c.instance),{
      headers:{apikey:c.key},
      signal:AbortSignal.timeout(10000),
      redirect:'error'
    });
    const state=await r.json();
    if(!r.ok||state?.instance?.state!=='open')throw Error();
    status='unknown';
    const response=await fetcher(c.base+'/message/'+(buffer?'sendMedia/':'sendText/')+encodeURIComponent(c.instance),{
      method:'POST',
      headers:{apikey:c.key,'Content-Type':'application/json'},
      body:JSON.stringify(buffer?{
        number:phone,
        mediatype:'document',
        mimetype:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName,
        caption:text.slice(0,1000),
        media:Buffer.from(buffer).toString('base64'),
        delay:1000
      }:{
        number:phone,
        text,
        linkPreview:false,
        delay:1000
      }),
      signal:AbortSignal.timeout(30000),
      redirect:'error'
    });
    if(response.status>=400&&response.status<500)status='failed';
    if(response.ok){
      const d=await response.json();
      const id=d?.key?.id||d?.id;
      if(!d.error&&typeof id==='string'&&id.length>0&&id.length<=200){
        status='accepted';
        messageId=id;
      }
    }
  }catch{/* Never expose provider responses or credentials. */}
  return {status,message_id:messageId};
}

export function normalizeGroupName(name){
  return String(name||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]/g,' ')
    .trim()
    .replace(/\s+/g,' ');
}

export function formatGroupReportNotification({
  protocol,
  driver_name,
  vehicle_plate,
  km,
  severity,
  defects
}){
  const sevMap={
    urgente:'🔴 Urgente',
    media:'🟡 Média',
    leve:'🟢 Leve'
  };
  const sevLabel=sevMap[String(severity||'').toLowerCase()]||String(severity||'Não informada');
  const formattedKm=Number.isInteger(Number(km))&&Number(km)>0
    ?Number(km).toLocaleString('pt-BR')+' km'
    :(km?String(km)+' km':'Não informado');

  return [
    '🔧 *Nova Solicitação de Manutenção Recebida*',
    '',
    `📋 *Protocolo:* ${protocol||'Não gerado'}`,
    `👤 *Motorista:* ${driver_name||'Motorista'}`,
    `🚛 *Veículo:* ${vehicle_plate||'Não informado'}`,
    `📍 *KM Atual:* ${formattedKm}`,
    `⚠️ *Gravidade:* ${sevLabel}`,
    '',
    '📝 *Defeitos Relatados:*',
    String(defects||'Sem descrição').trim(),
    '',
    'ℹ️ *Status:* Recebido pelo Portal do Motorista.',
    'A solicitação foi registrada no sistema e será enviada para análise da equipe em breve.'
  ].join('\n');
}

let cachedGroupJid=null;
let lastGroupCheck=0;

export async function findEvolutionGroupJid(env,fetcher,groupName='Grupo Manutenção Ambipar'){
  const explicitJid=env.EVOLUTION_MAINTENANCE_GROUP_JID||env.MAINTENANCE_GROUP_JID||env.EVOLUTION_GROUP_JID;
  if(explicitJid&&explicitJid.includes('@g.us')){
    return explicitJid;
  }
  const now=Date.now();
  if(cachedGroupJid&&now-lastGroupCheck<10*60*1000){
    return cachedGroupJid;
  }
  try{
    const c=readConfig(env);
    if(!c.key)return null;
    const instance=encodeURIComponent(c.instance);

    let res=await fetcher(c.base+'/group/fetchAllGroups/'+instance+'?getParticipants=false',{
      method:'GET',
      headers:{apikey:c.key},
      signal:AbortSignal.timeout(10000),
      redirect:'error'
    }).catch(()=>null);

    if(!res||!res.ok){
      res=await fetcher(c.base+'/group/fetchAllGroups/'+instance,{
        method:'POST',
        headers:{apikey:c.key,'Content-Type':'application/json'},
        body:JSON.stringify({getParticipants:false}),
        signal:AbortSignal.timeout(10000),
        redirect:'error'
      }).catch(()=>null);
    }

    if(!res||!res.ok)return null;

    const data=await res.json().catch(()=>null);
    let list=[];
    if(Array.isArray(data))list=data;
    else if(Array.isArray(data?.data))list=data.data;
    else if(Array.isArray(data?.groups))list=data.groups;
    else if(Array.isArray(data?.response))list=data.response;

    const targetNorm=normalizeGroupName(groupName);

    const exact=list.find(g=>normalizeGroupName(g.subject||g.name||g.id)===targetNorm);
    if(exact?.id||exact?.jid){
      cachedGroupJid=exact.id||exact.jid;
      lastGroupCheck=now;
      return cachedGroupJid;
    }

    const partial=list.find(g=>{
      const gNorm=normalizeGroupName(g.subject||g.name||g.id);
      return gNorm.includes(targetNorm)||targetNorm.includes(gNorm);
    });

    if(partial?.id||partial?.jid){
      cachedGroupJid=partial.id||partial.jid;
      lastGroupCheck=now;
      return cachedGroupJid;
    }
  }catch{
    /* Silently return null on group resolution error */
  }
  return null;
}

export async function notifyMaintenanceGroup(env,fetcher,report){
  try{
    const targetGroup=env.EVOLUTION_MAINTENANCE_GROUP_NAME||env.MAINTENANCE_GROUP_NAME||'Grupo Manutenção Ambipar';
    const groupJid=await findEvolutionGroupJid(env,fetcher,targetGroup);
    if(!groupJid){
      return {status:'group_not_found',group:targetGroup};
    }
    const text=formatGroupReportNotification(report);
    const result=await sendEvolution(env,fetcher,{
      phone:groupJid,
      text
    });
    return {
      status:result.status,
      message_id:result.message_id,
      groupJid,
      groupName:targetGroup
    };
  }catch(err){
    return {status:'failed',error:err?.message};
  }
}
