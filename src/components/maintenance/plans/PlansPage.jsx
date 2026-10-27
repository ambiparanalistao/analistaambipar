import React,{useState,useEffect} from 'react';import useMaintenancePlans from '../../../hooks/useMaintenancePlans';import {planCommand} from '../../../services/maintenancePlans';import PlanForm from './PlanForm';import PreventiveAlerts from './PreventiveAlerts';import './Plans.css';
function AlertSettings({company,settings,onSaved}){const [dias,setDias]=useState(settings.antecedencia_alerta_dias),[km,setKm]=useState(settings.antecedencia_alerta_km),[busy,setBusy]=useState(false),[error,setError]=useState('');async function submit(e){e.preventDefault();setBusy(true);setError('');try{await planCommand(company,'settings',{dias,km,version:settings.version});onSaved();}catch(e){setError(e.message);}finally{setBusy(false);}}return <form onSubmit={submit} className="mp-card pp-settings"><h3>Antecedência dos alertas</h3><p className="mp-muted">O primeiro limite atingido ativa o alerta. A rotina diária notifica Analistas e Operadores; o painel usa o KM e a data atuais.</p>{error&&<p role="alert">{error}</p>}<div className="mp-grid"><label>Dias<input aria-label="Dias" type="number" min="0" max="365" required value={dias} onChange={e=>setDias(e.target.value)}/></label><label>KM<input aria-label="KM" type="number" min="0" max="1000000" required value={km} onChange={e=>setKm(e.target.value)}/></label></div><button disabled={busy}>{busy?'Salvando…':'Salvar antecedência'}</button></form>;}
export default function PlansPage({access,setLocked}){const context=useMaintenancePlans(access.companyId,'context'),alerts=useMaintenancePlans(access.companyId),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');useEffect(()=>()=>setLocked(false),[setLocked]);function edit(plan){setEditing(plan);setError('');setLocked(!!plan);}async function save(form){setBusy(true);setError('');try{await planCommand(access.companyId,'save',form);edit(null);setNotice('Plano salvo com auditoria.');context.reload();alerts.reload();}catch(e){setError(e.message);}finally{setBusy(false);}}
  if(context.loading&&!context.data)return <p role="status">Carregando planos preventivos…</p>;if(context.error)return <div role="alert">{context.error}<button onClick={context.reload}>Tentar novamente</button></div>;if(editing)return <PlanForm key={editing.id||'new'} initial={editing.id?editing:undefined} vehicles={context.data?.vehicles||[]} onSave={save} onBack={()=>edit(null)} busy={busy} error={error}/>;
  return <div>
    <div className="mp-row mp-between">
      <h2>Planos Preventivos</h2>
      {access.canWrite&&<button className="mp-primary" onClick={()=>edit({})}>Novo plano personalizado</button>}
    </div>
    <div className="mp-card" style={{ borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.08)', marginBottom: '16px' }}>
      <h3 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>⚡ Planos Periódicos Automáticos Ativos para Toda a Frota</span>
      </h3>
      <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#334155' }}>
        Os planos preventivos de <strong>Óleo de Motor (10.000 km)</strong>, <strong>Filtros (10.000 km)</strong>, <strong>Freios (20.000 km)</strong>, <strong>Pneus (10.000 km)</strong>, <strong>Correias (40.000 km)</strong> e <strong>Revisão Geral (30.000 km)</strong> são gerados e calculados automaticamente conforme o KM de cada veículo é atualizado.
      </p>
      <span className="mp-muted" style={{ fontSize: '0.82rem' }}>
        Não é necessário cadastrar planos manualmente veículo por veículo: os alertas são disparados pelo odômetro e você pode abrir a S.D.O preventiva com 1 clique direto no painel de alertas.
      </span>
    </div>
    {notice&&<p role="status">{notice}</p>}
    {alerts.loading?<p role="status">Calculando alertas…</p>:alerts.error?<div role="alert">{alerts.error}<button onClick={alerts.reload}>Tentar novamente</button></div>:<PreventiveAlerts rows={alerts.data?.rows||[]} canGenerate={access.orderPermissions.create}/>}
    <section className="mp-card">
      <h3>Planos periódicos monitorados</h3>
      {!context.data?.plans.length?<p>Nenhum plano cadastrado.</p>:<ul className="pp-list">{context.data.plans.map(p=>{
        const scopeLabel = p.vehicle_id ? context.data.vehicles.find(v=>v.id===p.vehicle_id)?.placa : (p.categoria_veiculo || 'Todos os veículos (Frota Geral)');
        return <li key={p.id} className="mp-row mp-between"><span><strong>{p.nome}</strong> · {scopeLabel} · {p.intervalo_km?Number(p.intervalo_km).toLocaleString('pt-BR')+' km':''}{p.intervalo_km&&p.intervalo_dias?' ou ':''}{p.intervalo_dias?p.intervalo_dias+' dias':''} · {p.ativo?'Ativo':'Inativo'}</span>{access.canWrite&&<button onClick={()=>edit(p)}>Editar {p.nome}</button>}</li>;
      })}</ul>}
    </section>
    {access.canWrite&&context.data?.settings&&<AlertSettings key={context.data.settings.version} company={access.companyId} settings={context.data.settings} onSaved={()=>{context.reload();alerts.reload();setNotice('Antecedência salva.');}}/>}
  </div>;
}
