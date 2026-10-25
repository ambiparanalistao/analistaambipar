import React,{useEffect,useState} from 'react';
import {reportOrder} from '../../../services/driverReports';
import OrderForm from '../orders/OrderForm';
export default function DriverReportOrderForm({company,id,options,onSave,...props}){
 const [state,setState]=useState({loading:true,error:'',data:null}),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;setState({loading:true,error:'',data:null});reportOrder(company,'context',{report_id:id}).then(data=>{if(active)setState({loading:false,error:'',data});}).catch(e=>{if(active)setState({loading:false,error:e.message,data:null});});return()=>{active=false;};},[company,id,revision]);
 if(state.loading)return <p role="status">Carregando relato…</p>;
 if(state.error)return <div role="alert">{state.error}<button onClick={()=>setRevision(x=>x+1)}>Tentar novamente</button><button onClick={props.onBack}>Voltar</button></div>;
 const r=state.data.report,linked=state.data.orders.find(o=>o.active);
 if(linked)return <div className="mp-card"><p>Esta solicitação já possui uma S.D.O em andamento.</p><a href={'/manutencao/ordens-de-servico?os='+linked.id}>Abrir {linked.numero}</a></div>;
 return <><aside className="mp-card"><strong>Relato {r.protocol} · {r.driver_name}</strong><p>{r.defects}</p><p>O veículo, o relator e os defeitos originais serão preservados no histórico.</p></aside><OrderForm key={r.id} company={company} options={options} sourceLocked initialValues={{vehicle_id:r.vehicle_id,driver_id:r.driver_id||'',descricao_problema:r.defects,km_abertura:Math.max(r.km,options.vehicles.find(v=>v.id===r.vehicle_id)?.km_atual||0),prioridade:r.severity==='urgente'?'alta':r.severity==='leve'?'baixa':'media'}} onSave={onSave} {...props}/></>;
}
