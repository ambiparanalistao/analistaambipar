let pending;
export function loadGoogleMaps(){
 if(!import.meta.env.VITE_GOOGLE_MAPS_API_KEY)return Promise.reject(new Error('Google Maps ainda não configurado. Preencha o endereço manualmente.'));
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(pending)return pending;
 pending=new Promise((resolve,reject)=>{
 const script=document.createElement('script');let timer;
 const clean=()=>{clearTimeout(timer);delete window.__maintenanceMapsReady;};
 window.__maintenanceMapsReady=()=>{clean();resolve(window.google.maps);};
 script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)+'&v=quarterly&loading=async&language=pt-BR&region=BR&callback=__maintenanceMapsReady';
 script.async=true;script.onerror=()=>{clean();script.remove();pending=null;reject(new Error('Falha ao carregar o Google Maps.'));};
 timer=setTimeout(()=>{clean();script.remove();pending=null;reject(new Error('Google Maps não respondeu.'));},15000);document.head.appendChild(script);
 });return pending;
}
export function placeAddress(place){
 const parts=place.addressComponents||[],component=type=>parts.find(c=>c.types.includes(type)),value=type=>component(type)?.longText||'';
 return {logradouro:value('route'),numero:value('street_number'),bairro:value('sublocality_level_1')||value('sublocality'),cidade:value('administrative_area_level_2')||value('locality'),estado:component('administrative_area_level_1')?.shortText||'',cep:value('postal_code'),latitude:place.location?.lat()??'',longitude:place.location?.lng()??''};
}
