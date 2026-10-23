// Transport contract: prepare(message) -> DeliveryResult or Promise<DeliveryResult>.
// DeliveryResult: {requiresConfirmation:true,href,label} or {requiresConfirmation:false,statusLabel,providerId}.
// A future official API transport can return a provider-confirmed delivery instead.
export function prepareLinkDelivery(message){
 const channel=message.canal,to=String(message.destinatario||'');
 if(channel==='whatsapp'){if(!/^[0-9]{10,15}$/.test(to))throw new Error('Telefone da oficina inválido.');return{href:'https://wa.me/'+to+'?text='+encodeURIComponent(message.conteudo),label:'Abrir WhatsApp',requiresConfirmation:true};}
 if(channel==='email'){if(!/^[^\s@,;<>]+@[^\s@,;<>]+[.][A-Za-z]{2,}$/.test(to)||/[\r\n]/.test(to))throw new Error('E-mail da oficina inválido.');return{href:'mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(message.assunto||'')+'&body='+encodeURIComponent(message.conteudo),label:'Abrir e-mail',requiresConfirmation:true};}
 throw new Error('Este canal não utiliza um aplicativo externo.');
}
export const communicationTransport={prepare:prepareLinkDelivery};
