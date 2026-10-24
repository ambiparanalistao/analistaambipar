import {prepareLinkDelivery} from '../services/communicationTransport.js';
export function driverValidityRequest(driver){
 const input=String(driver.telefone||'').trim();if(input.startsWith('+')&&!input.replace(/\D/g,'').startsWith('55'))return null;const raw=input.replace(/\D/g,'');const phone=raw.length===10||raw.length===11?'55'+raw:raw;
 if(!/^55[1-9][0-9][2-9][0-9]{7,8}$/.test(phone))return null;
 const name=String(driver.nome||'').trim();const content=[name?'Olá, '+name+'!':'Olá!','Para atualizar seu cadastro de motorista, por favor informe as datas de validade (dia/mês/ano) dos seguintes documentos:','• Exame toxicológico;','• Cursos NR-20, NR-35 e NR-33, quando aplicáveis;','• Direção defensiva, cargas especiais e Hazmat/PAE, quando aplicáveis.','Se não possuir algum dos cursos, informe qual. Obrigado!'].join('\n');
 return prepareLinkDelivery({canal:'whatsapp',destinatario:phone,conteudo:content});
}
