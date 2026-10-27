import React,{useState} from 'react';import {PLAN_STATES} from '../../../utils/planValidation';
export default function PreventiveAlerts({rows,canGenerate}){const [filters,setFilters]=useState({vehicle:'',category:'',item:'',state:''}),[page,setPage]=useState(1);const filtered=rows.filter(a=>(!filters.vehicle||a.vehicle_id===filters.vehicle)&&(!filters.category||a.categoria===filters.category)&&(!filters.item||a.nome===filters.item)&&(!filters.state||a.estado===filters.state));const filter=(k,v)=>{setFilters(f=>({...f,[k]:v}));setPage(1);};
  return <section><h3>Painel de alertas preventivos</h3><div className="mp-stats">{Object.entries(PLAN_STATES).map(([k,label])=><button key={k} className={'mp-card pp-state '+k} onClick={()=>filter('state',filters.state===k?'':k)} aria-pressed={filters.state===k}>{label} · {rows.filter(a=>a.estado===k).length}</button>)}</div><div className="mp-filters">{[['vehicle','Veículo',[...new Map(rows.map(a=>[a.vehicle_id,a.placa])).entries()]],['category','Categoria',[...new Set(rows.map(a=>a.categoria))].map(t=>[t,t])],['item','Item',[...new Set(rows.map(a=>a.nome))].map(t=>[t,t])],['state','Situação',Object.entries(PLAN_STATES)]].map(([k,label,choices])=><label key={k}>{label}<select aria-label={label} value={filters[k]} onChange={e=>filter(k,e.target.value)}><option value="">Todos</option>{choices.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>)}</div>{!filtered.length?<p className="mp-card">Nenhum alerta encontrado para estes filtros.</p>:<div className="mp-table-wrap"><table><thead><tr>{['Veículo','Item preventivo','Última execução','Próximo vencimento','Situação','Ação'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{filtered.slice((page-1)*20,page*20).map(a=>{
    const diff = a.proxima_km != null ? (Number(a.proxima_km) - Number(a.km_atual || 0)) : null;
    return <tr key={a.id}>
      <td><strong>{a.placa}</strong><br/><small className="mp-muted">{a.categoria} · {Number(a.km_atual||0).toLocaleString('pt-BR')} km atuais</small></td>
      <td><strong>{a.nome}</strong></td>
      <td>{Number(a.ultima_execucao_km||0).toLocaleString('pt-BR')} km<br/><small className="mp-muted">{a.ultima_execucao_data}</small></td>
      <td>
        <strong>{a.proxima_km != null ? `${Number(a.proxima_km).toLocaleString('pt-BR')} km` : '—'}</strong>
        {diff != null && <span style={{ fontSize: '0.75rem', display: 'block', color: diff < 0 ? '#ef4444' : diff <= 1500 ? '#f59e0b' : '#10b981', fontWeight: diff <= 1500 ? 600 : 'normal' }}>
          {diff < 0 ? `(${Math.abs(diff).toLocaleString('pt-BR')} km em atraso)` : diff <= 1500 ? `(⚠️ restam ${diff.toLocaleString('pt-BR')} km — próximo do vencimento)` : `(restam ${diff.toLocaleString('pt-BR')} km)`}
        </span>}
        <small className="mp-muted">Até {a.proxima_data || '—'}</small>
      </td>
      <td><span className={'pp-state '+a.estado}>{PLAN_STATES[a.estado]}</span></td>
      <td>{a.order_id?<a href={'/manutencao/ordens-de-servico?os='+a.order_id} className="mp-button">Abrir S.D.O vinculada</a>:canGenerate&&<a className="mp-primary" href={'/manutencao/ordens-de-servico?acao=nova&preventiva='+a.id+'&veiculo='+a.vehicle_id}>Gerar S.D.O preventiva</a>}</td>
    </tr>;
  })}</tbody></table></div>}<div className="mp-row mp-between"><span>{filtered.length} itens · Página {page}</span><div><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button><button disabled={page*20>=filtered.length} onClick={()=>setPage(p=>p+1)}>Próxima</button></div></div></section>;}

