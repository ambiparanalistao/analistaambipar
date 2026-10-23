export const PARTNER_TYPES = {
  oficina_mecanica:'Oficina mecânica', eletrica:'Auto elétrica', funilaria_pintura:'Funilaria e pintura',
  borracharia:'Borracharia', concessionaria:'Concessionária', auto_center:'Auto center',
  guincho_socorro:'Guincho e socorro', lavagem:'Lavagem', tacografo_rastreador:'Tacógrafo e rastreador', outros:'Outros',
};
export const SPECIALTIES=['Motor','Câmbio','Freios','Suspensão','Elétrica','Injeção eletrônica','Pneus','Alinhamento','Funilaria','Pintura','Ar-condicionado','Hidráulica','Tacógrafo','Rastreamento','Socorro rodoviário','Lavagem'];
export const VEHICLE_TYPES=['Caminhão','Cavalo mecânico','Carreta','Bitrem','Rodotrem','Truck','Toco','VUC','Van','Utilitário','Automóvel','Ônibus','Máquina'];
export const WEEKDAYS={seg:'Segunda-feira',ter:'Terça-feira',qua:'Quarta-feira',qui:'Quinta-feira',sex:'Sexta-feira',sab:'Sábado',dom:'Domingo'};
export const STATUS_LABELS={ativo:'Ativo',inativo:'Inativo',bloqueado:'Bloqueado'};
export const DOCUMENT_CATEGORIES={contrato:'Contrato',certidao:'Certidão',tabela_precos:'Tabela de preços'};
export const FILE_TYPES={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',xls:'application/vnd.ms-excel'};
export const normalizedDocument = value => String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
export const digits = value => String(value||'').replace(/\D/g,'');
export function validDocument(value) {
  const doc=normalizedDocument(value);
  if (/^(.)\1+$/.test(doc)) return false;
  if (/^\d{11}$/.test(doc)) {
    for(let length=9;length<=10;length++) {
      const sum=doc.slice(0,length).split('').reduce((s,n,i)=>s+Number(n)*(length+1-i),0);
      const check=(sum*10)%11%10;
      if(check!==Number(doc[length])) return false;
    }
    return true;
  }
  if (!/^[A-Z0-9]{12}\d{2}$/.test(doc)) return false;
  for(let length=12;length<=13;length++) {
    const weights=length===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2];
    const sum=doc.slice(0,length).split('').reduce((s,n,i)=>s+(n.charCodeAt(0)-48)*weights[i],0);
    const rest=sum%11;
    if(Number(doc[length])!==(rest<2?0:11-rest)) return false;
  }
  return true;
}
export function maskDocument(value) {
  const d=normalizedDocument(value).slice(0,14);
  if(d.length<=11&&!/[A-Z]/.test(d)) return d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\.\d{3})(\d{1,2})$/,'$1-$2');
  return d.replace(/^(.{2})(.)/,'$1.$2').replace(/^(.{2})\.(.{3})(.)/,'$1.$2.$3').replace(/^(..\....\....)(.)/,'$1/$2').replace(/(\/.{4})(.{1,2})$/,'$1-$2');
}
export function maskPhone(value) {
  let n=digits(value).slice(0,13);
  if(n.startsWith('55')&&n.length>11)n=n.slice(2);
  n=n.slice(0,11);
  if(n.length<=2)return n;
  return '('+n.slice(0,2)+') '+n.slice(2).replace(n.length===11?/^(\d{5})(\d)/:/^(\d{4})(\d)/,'$1-$2');
}
export function validPhone(value) {
  let n=digits(value);
  if(n.startsWith('55')&&n.length>11)n=n.slice(2);
  return /^[1-9]\d[2-9]\d{7,8}$/.test(n);
}
export const maskCep=value=>digits(value).slice(0,8).replace(/^(\d{5})(\d)/,'$1-$2');
export function emptyPartner() {
 return {onboarding_profile:{},razao_social:'',nome_fantasia:'',cnpj_cpf:'',tipo:'oficina_mecanica',especialidades:[],tipos_veiculo_atendidos:[],
 contato_nome:'',telefone:'',whatsapp:'',email:'',cep:'',logradouro:'',numero:'',complemento:'',bairro:'',cidade:'',estado:'',pais:'BR',
 latitude:'',longitude:'',horario_funcionamento:Object.fromEntries(Object.keys(WEEKDAYS).map(d=>[d,{aberto:!['sab','dom'].includes(d),inicio:'08:00',fim:'18:00'}])),
 atende_24h:false,possui_guincho:false,valor_hora_mao_obra:'',prazo_pagamento_dias:'',desconto_percentual:'',status:'ativo',motivo_bloqueio:'',avaliacao_interna:''};
}
export function partnerForm(row) {
 const result=emptyPartner();
 for(const key of Object.keys(result)) if(row?.[key]!==undefined&&row[key]!==null) result[key]=row[key];
 result.cnpj_cpf=maskDocument(result.cnpj_cpf);result.telefone=maskPhone(result.telefone);result.whatsapp=maskPhone(result.whatsapp);result.cep=maskCep(result.cep);
 result.horario_funcionamento={...emptyPartner().horario_funcionamento,...result.horario_funcionamento};
 return result;
}
export function validatePartner(form) {
 const errors={};
 if(!String(form.razao_social).trim())errors.razao_social='Informe a razão social.';
 if(!validDocument(form.cnpj_cpf))errors.cnpj_cpf='Informe um CPF ou CNPJ com dígitos verificadores válidos.';
 if(!PARTNER_TYPES[form.tipo])errors.tipo='Selecione o tipo de prestador.';
 if(!form.telefone&&!form.whatsapp)errors.telefone='Informe um telefone ou WhatsApp.';
 for(const key of ['telefone','whatsapp'])if(form[key]&&!validPhone(form[key]))errors[key]='Informe DDD e número válido.';
 if(form.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))errors.email='Informe um e-mail válido.';
 for(const key of ['logradouro','numero','bairro','cidade'])if(!String(form[key]||'').trim())errors[key]='Preencha este campo.';
 if(digits(form.cep).length!==8)errors.cep='Informe um CEP com 8 dígitos.';
 if(!/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(form.estado))errors.estado='Informe uma UF válida.';
 const lat=form.latitude!==''&&form.latitude!==null, lng=form.longitude!==''&&form.longitude!==null;
 if(lat!==lng)errors.latitude='Preencha latitude e longitude juntas.';
 if(lat&&(!Number.isFinite(Number(form.latitude))||Math.abs(Number(form.latitude))>90))errors.latitude='Latitude inválida.';
 if(lng&&(!Number.isFinite(Number(form.longitude))||Math.abs(Number(form.longitude))>180))errors.longitude='Longitude inválida.';
 for(const [key,max]of [['valor_hora_mao_obra',1e10],['prazo_pagamento_dias',3650],['desconto_percentual',100]]) {
  const n=Number(form[key]||0);if(!Number.isFinite(n)||n<0||n>max||(key==='prazo_pagamento_dias'&&!Number.isInteger(n)))errors[key]='Informe um valor válido'+(key==='desconto_percentual'?' entre 0 e 100.':'.');
 }
 if(form.avaliacao_interna!==''&&(!Number.isInteger(Number(form.avaliacao_interna))||Number(form.avaliacao_interna)<1||Number(form.avaliacao_interna)>5))errors.avaliacao_interna='A avaliação deve ser de 1 a 5.';
 if(!STATUS_LABELS[form.status])errors.status='Selecione um status válido.';
 if(form.status==='bloqueado'&&!form.motivo_bloqueio.trim())errors.motivo_bloqueio='Explique o motivo do bloqueio.';
 if(!form.atende_24h)for(const [day,h]of Object.entries(form.horario_funcionamento)) {
  if(h?.aberto&&(!/^\d{2}:\d{2}$/.test(h.inicio||'')||!/^\d{2}:\d{2}$/.test(h.fim||'')||h.fim<=h.inicio))errors.horario_funcionamento='Revise os horários de '+(WEEKDAYS[day]||day)+'. Use fechamento após abertura.';
 }
 return errors;
}
export function partnerPayload(form) {
 const data=partnerForm(form);
 for(const key of Object.keys(data))if(typeof data[key]==='string')data[key]=data[key].trim()||null;
 data.cnpj_cpf=normalizedDocument(form.cnpj_cpf);data.telefone=digits(form.telefone)||null;data.whatsapp=digits(form.whatsapp)||null;data.cep=digits(form.cep);
 for(const key of ['latitude','longitude','avaliacao_interna'])data[key]=form[key]===''||form[key]===null?null:Number(form[key]);
 for(const key of ['valor_hora_mao_obra','prazo_pagamento_dias','desconto_percentual'])data[key]=Number(form[key]||0);
 if(data.status!=='bloqueado')data.motivo_bloqueio=null;
 return data;
}
export function validateAttachment(file) {
 const ext=String(file.name||'').split('.').pop().toLowerCase(), mime=FILE_TYPES[ext];
 if(!mime)return 'Use PDF, PNG, JPEG, WebP, XLS ou XLSX.';
 if(!file.size||file.size>20*1024*1024)return 'Cada arquivo deve ter entre 1 byte e 20 MB.';
 if(file.type&&file.type!==mime&&file.type!=='application/octet-stream')return 'O conteúdo informado não corresponde à extensão do arquivo.';
 return null;
}
export const maintenanceRole=m=>m.maintenance_role||({administrador:'admin_empresa',analista:'analista_transporte',gestor:'supervisor',auditor:'operador_logistico'}[m.role])||'sem_acesso';
export const readableRole=role=>['admin_geral','admin_empresa','analista_transporte','supervisor','operador_logistico'].includes(role);
export const writableRole=role=>['admin_geral','admin_empresa','analista_transporte'].includes(role);
export const ROLE_LABELS={admin_geral:'Admin Geral',admin_empresa:'Admin da Empresa',analista_transporte:'Analista de Transporte',supervisor:'Supervisor',operador_logistico:'Operador Logístico',motorista:'Motorista',cliente:'Cliente'};
