export function driverValidityRequest(driver){
 const input=String(driver.telefone||'').trim();if(input.startsWith('+')&&!input.replace(/\D/g,'').startsWith('55'))return null;const raw=input.replace(/\D/g,'');const phone=raw.length===10||raw.length===11?'55'+raw:raw;
 if(!/^55[1-9][0-9][2-9][0-9]{7,8}$/.test(phone))return null;
 const name=String(driver.nome||'').trim();return{phone,text:[name?'Olá, '+name+'!':'Olá!','Para atualizar seu cadastro de motorista, por favor informe a data de validade do seu exame toxicológico (dia/mês/ano).','Obrigado!'].join('\n')};
}
