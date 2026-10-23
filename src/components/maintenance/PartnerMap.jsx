import React,{useEffect,useRef,useState} from 'react';
import {loadGoogleMaps,placeAddress} from '../../lib/googleMaps';
export function GoogleAddress({onAddress}){
 const host=useRef(null),callback=useRef(onAddress),[error,setError]=useState('');callback.current=onAddress;
 useEffect(()=>{let cancelled=false,widget;async function mount(){try{
 const api=await loadGoogleMaps(),{PlaceAutocompleteElement}=await api.importLibrary('places');if(cancelled)return;
 widget=new PlaceAutocompleteElement({includedRegionCodes:['br']});widget.setAttribute('aria-label','Buscar endereço no Google Places');
 widget.addEventListener('gmp-select',async event=>{try{const place=event.placePrediction.toPlace();await place.fetchFields({fields:['addressComponents','location']});if(!cancelled)callback.current(placeAddress(place));}catch{if(!cancelled)setError('Não foi possível preencher o endereço. Use os campos abaixo.');}});
 host.current?.appendChild(widget);
 }catch(e){if(!cancelled)setError(e.message);}}mount();return()=>{cancelled=true;widget?.remove();};},[]);
 return <div><div ref={host}/>{error&&<p className="mp-muted">{error}</p>}</div>;
}
export default function PartnerMap({partners,onSelect,theme}){
 const host=useRef(null),callback=useRef(onSelect),[error,setError]=useState('');callback.current=onSelect;
 useEffect(()=>{let cancelled=false,markers=[],map;setError('');async function mount(){try{
 const api=await loadGoogleMaps();const [{Map},{AdvancedMarkerElement},{ColorScheme,LatLngBounds}]=await Promise.all([api.importLibrary('maps'),api.importLibrary('marker'),api.importLibrary('core')]);if(cancelled)return;
 const points=partners.filter(p=>p.latitude!==null&&p.longitude!==null);
 map=new Map(host.current,{center:{lat:-14.235,lng:-51.9253},zoom:4,mapId:import.meta.env.VITE_GOOGLE_MAP_ID||'DEMO_MAP_ID',colorScheme:theme==='light'?ColorScheme.LIGHT:ColorScheme.DARK});
 const bounds=new LatLngBounds();for(const p of points){const position={lat:Number(p.latitude),lng:Number(p.longitude)};bounds.extend(position);const marker=new AdvancedMarkerElement({map,position,title:p.nome_fantasia||p.razao_social});marker.addListener('click',()=>callback.current(p.id));markers.push(marker);}if(points.length){map.fitBounds(bounds);if(points.length===1)api.event.addListenerOnce(map,'idle',()=>map.setZoom(14));}
 }catch(e){if(!cancelled)setError(e.message);}}mount();return()=>{cancelled=true;markers.forEach(m=>m.map=null);map=null;};},[partners,theme]);
 return <section aria-label="Mapa de oficinas"><div className="mp-map" ref={host}/>{error&&<div className="mp-map-message" role="status"><h3>Mapa indisponível</h3><p>{error}</p></div>}<p className="mp-muted">{partners.filter(p=>p.latitude!==null&&p.longitude!==null).length} parceiros com coordenadas. Os demais continuam disponíveis na lista.</p></section>;
}
