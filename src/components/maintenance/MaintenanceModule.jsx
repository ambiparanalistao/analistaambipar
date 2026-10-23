import OccurrencesPage from './occurrences/OccurrencesPage';
import OrdersPage from './orders/OrdersPage';
import React,{useEffect,useState} from 'react';
import {PARTNER_TYPES,STATUS_LABELS,ROLE_LABELS,readableRole,maskPhone} from '../../utils/partnerValidation';
import {listPartners,partnerCities,partnerDetail,savePartner,uploadPartnerFile,removePartnerFile} from '../../services/maintenancePartners';
import PartnerForm from './PartnerForm';
import PartnerDetail from './PartnerDetail';
import PartnerMap from './PartnerMap';
import {MAINTENANCE_PAGES} from './maintenanceRoutes';
import './MaintenanceModule.css';
const initialFilters={search:'',tipo:'',cidade:'',status:'',nota:''};
function locationView(){const q=new URLSearchParams(window.location.search),id=q.get('oficina');if(id&&!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))return{mode:'invalid'};return{mode:q.get('acao')==='nova'?'new':id?q.get('acao')==='editar'?'edit':'detail':'list',id};}
function PartnersPage({access,theme,setLocked}){
 const {companyId,canWrite}=access;
 const [view,setView]=useState(locationView),[filters,setFilters]=useState(initialFilters),[search,setSearch]=useState(''),[page,setPage]=useState(1),[map,setMap]=useState(false),[listing,setListing]=useState({loading:true,rows:[],count:0,error:''}),[cities,setCities]=useState([]),[detail,setDetail]=useState({loading:false,data:null,error:''}),[revision,setRevision]=useState(0),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState(''),[notice,setNotice]=useState('');
 const reload=()=>setRevision(v=>v+1);
 useEffect(()=>{const handler=()=>{setView(locationView());setSaveError('');};window.addEventListener('popstate',handler);return()=>window.removeEventListener('popstate',handler);},[]);
 useEffect(()=>{setLocked(view.mode!=='list');return()=>setLocked(false);},[view.mode,setLocked]);
 useEffect(()=>{const timer=setTimeout(()=>{setFilters(f=>({...f,search}));setPage(1);},300);return()=>clearTimeout(timer);},[search]);
 useEffect(()=>{setPage(1);setFilters(initialFilters);setSearch('');setCities([]);},[companyId]);
 useEffect(()=>{let active=true;const controller=new AbortController();setListing({loading:true,rows:[],count:0,error:''});
 listPartners(companyId,filters,map?1:page,map?500:20,controller.signal).then(result=>{if(active)setListing({loading:false,rows:result.data,count:result.count,error:''});}).catch(e=>{if(active)setListing({loading:false,rows:[],count:0,error:e.message});});
 return()=>{active=false;controller.abort();};},[companyId,filters,page,map,revision]);
 useEffect(()=>{let active=true;partnerCities(companyId).then(rows=>{if(active)setCities(rows);}).catch(()=>{if(active)setCities([]);});return()=>{active=false;};},[companyId,revision]);
 useEffect(()=>{let active=true;setDetail({loading:!!view.id,data:null,error:''});if(view.id)partnerDetail(companyId,view.id).then(data=>{if(active)setDetail({loading:false,data,error:''});}).catch(e=>{if(active)setDetail({loading:false,data:null,error:e.message});});return()=>{active=false;};},[companyId,view.id,revision]);
 function go(mode,id){const query=mode==='new'?'?acao=nova':id?'?oficina='+id+(mode==='edit'?'&acao=editar':''):'';window.history.pushState({},'',window.location.pathname+query);setView({mode,id});setSaveError('');}
 async function save(form,files){if(!canWrite)return;setSaving(true);setSaveError('');try{
 const partner=await savePartner(companyId,form,view.mode==='edit'?detail.data.partner:null);let failed=[];
 for(const entry of files)try{await uploadPartnerFile(companyId,partner.id,entry.file,entry.category);}catch(e){failed.push(entry.file.name+': '+e.message);}
 setNotice(failed.length?'Cadastro salvo. Falha nos anexos: '+failed.join('; '):'Parceiro salvo com sucesso.');go('detail',partner.id);reload();
 }catch(e){setSaveError(e.message);}finally{setSaving(false);}}
 async function upload(file,category){if(!canWrite)return;setSaving(true);try{await uploadPartnerFile(companyId,view.id,file,category);reload();}finally{setSaving(false);}}
 async function remove(file){if(!canWrite)return;setSaving(true);try{await removePartnerFile(companyId,view.id,file);reload();}finally{setSaving(false);}}
 const filter=(key,value)=>{setFilters(f=>({...f,[key]:value}));setPage(1);};
 if(view.mode==='invalid')return <div className="mp-card" role="alert">Endereço do parceiro inválido.<button onClick={()=>go('list')}>Voltar à lista</button></div>;
 if((view.mode==='new'||view.mode==='edit')&&!canWrite)return <div className="mp-card" role="alert">Seu perfil tem acesso somente leitura.<button onClick={()=>go('list')}>Voltar à lista</button></div>;
 if(view.id&&detail.loading)return <p role="status">Carregando parceiro…</p>;
 if(view.id&&detail.error)return <div role="alert" className="mp-card"><p>{detail.error}</p><button onClick={reload}>Tentar novamente</button><button onClick={()=>go('list')}>Voltar</button></div>;
 if(view.mode==='new'||(view.mode==='edit'&&detail.data))return <PartnerForm key={view.id||'new'} partner={view.mode==='edit'?detail.data.partner:null} onSave={save} onCancel={()=>go(view.id?'detail':'list',view.id)} saving={saving} error={saveError}/>;
 if(view.mode==='detail'&&detail.data)return <>{notice&&<p className="mp-notice" role="status">{notice}</p>}<PartnerDetail data={detail.data} company={companyId} canWrite={canWrite} canCreateOrder={access.canRead} onBack={()=>go('list')} onEdit={()=>go('edit',view.id)} onUpload={upload} onRemove={remove} saving={saving}/></>;
 return <div>
 <div className="mp-row mp-between"><div><h2>Oficinas Parceiras</h2><p className="mp-muted">Prestadores, contatos e condições da empresa selecionada.</p></div>{canWrite&&<button className="mp-primary" onClick={()=>go('new')}>Novo parceiro</button>}</div>
 {notice&&<p className="mp-notice" role="status">{notice}</p>}
 <div className="mp-filters"><label>Buscar<input aria-label="Buscar parceiros" placeholder="Nome ou CPF/CNPJ" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <label>Tipo<select aria-label="Tipo" value={filters.tipo} onChange={e=>filter('tipo',e.target.value)}><option value="">Todos</option>{Object.entries(PARTNER_TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 <label>Cidade<select aria-label="Cidade" value={filters.cidade} onChange={e=>filter('cidade',e.target.value)}><option value="">Todas</option>{cities.map(c=><option key={c.cidade}>{c.cidade}</option>)}</select></label>
 <label>Status<select aria-label="Status" value={filters.status} onChange={e=>filter('status',e.target.value)}><option value="">Todos</option>{Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 <label>Nota mínima<select aria-label="Nota mínima" value={filters.nota} onChange={e=>filter('nota',e.target.value)}><option value="">Todas</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} ★</option>)}</select></label></div>
 <div className="mp-row mp-between"><button onClick={()=>{setFilters(initialFilters);setSearch('');setPage(1);}}>Limpar filtros</button><div className="mp-row" role="group" aria-label="Visualização"><button aria-pressed={!map} onClick={()=>setMap(false)}>Lista</button><button aria-pressed={map} onClick={()=>setMap(true)}>Mapa</button></div></div>
 {listing.loading?<p role="status">Carregando oficinas…</p>:listing.error?<div className="mp-card" role="alert"><p>{listing.error}</p><button onClick={reload}>Tentar novamente</button></div>:!listing.rows.length?<div className="mp-card mp-empty">Nenhum parceiro encontrado. {canWrite?'Cadastre uma oficina ou ajuste os filtros.':'Ajuste os filtros ou consulte o administrador.'}</div>:map?<><PartnerMap partners={listing.rows} onSelect={id=>go('detail',id)} theme={theme}/>{listing.count>500&&<p role="status">Mostrando os primeiros 500 de {listing.count} parceiros. Use os filtros para refinar.</p>}</>:<div className="mp-table-wrap"><table><thead><tr>{['Parceiro','Tipo','Cidade','Telefone','Nota','SLA médio','Status','Ações'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{listing.rows.map(p=><tr key={p.id}><td><strong>{p.nome_fantasia||p.razao_social}</strong>{p.nome_fantasia&&<small>{p.razao_social}</small>}</td><td>{PARTNER_TYPES[p.tipo]}</td><td>{p.cidade||'—'}{p.estado?' / '+p.estado:''}</td><td>{maskPhone(p.telefone||p.whatsapp)||'—'}</td><td>{p.avaliacao_interna?p.avaliacao_interna+' ★':'Sem nota'}</td><td>{p.sla_medio_dias===null?'Sem histórico':p.sla_medio_dias+' dias'}</td><td><span className={'mp-badge '+p.status}>{STATUS_LABELS[p.status]}</span></td><td><div className="mp-row"><button onClick={()=>go('detail',p.id)}>Ver</button>{canWrite&&<button onClick={()=>go('edit',p.id)}>Editar</button>}</div></td></tr>)}</tbody></table></div>}
 {!map&&<div className="mp-row mp-between mp-pagination"><span>{listing.count} parceiros · Página {page} de {Math.max(1,Math.ceil(listing.count/20))}</span><div className="mp-row"><button disabled={page<=1||listing.loading} onClick={()=>setPage(v=>v-1)}>Anterior</button><button disabled={page*20>=listing.count||listing.loading} onClick={()=>setPage(v=>v+1)}>Próxima</button></div></div>}</div>;
}
export default function MaintenanceModule({access,page}){
 const [theme,setTheme]=useState(()=>{try{return localStorage.getItem('maintenance_theme')||'dark';}catch{return'dark';}}),[locked,setLocked]=useState(false);
 const toggle=()=>setTheme(t=>{const next=t==='dark'?'light':'dark';try{localStorage.setItem('maintenance_theme',next);}catch{/* Optional preference. */}return next;});
 return <div className="mp-module" data-mp-theme={theme}>
 <div className="mp-row mp-between mp-context"><div><strong>Manutenção</strong>{access.canRead&&<span> · {ROLE_LABELS[access.role]}{page!=='maintenance_orders'&&!access.canWrite?' · Somente leitura':''}</span>}</div><button onClick={toggle}>Modo {theme==='dark'?'claro':'escuro'}</button></div>
 {access.loading?<p role="status">Verificando acesso…</p>:access.error?<div role="alert" className="mp-card"><p>{access.error}</p><button onClick={access.reload}>Tentar novamente</button></div>:!access.canRead?<div className="mp-card" role="alert"><h2>Acesso restrito</h2><p>Este módulo exige um usuário autenticado e um perfil autorizado na empresa.</p></div>:<>
 <label className="mp-field mp-company">Empresa<select aria-label="Empresa" value={access.companyId} disabled={locked} onChange={e=>access.selectCompany(e.target.value)}>{access.memberships.filter(m=>readableRole(m.roleName)).map(m=><option key={m.company_id} value={m.company_id}>{m.nome}</option>)}</select></label>
 {page==='maintenance_occurrences'?<OccurrencesPage key={access.companyId} access={access} setLocked={setLocked}/>:page==='maintenance_orders'?<OrdersPage key={access.companyId} access={access} setLocked={setLocked}/>:page==='maintenance_partners'?<PartnersPage key={access.companyId} access={access} theme={theme} setLocked={setLocked}/>:<section className="mp-card mp-empty"><h2>{MAINTENANCE_PAGES.find(p=>p.id===page)?.label||'Manutenção'}</h2><p>Em breve</p><p className="mp-muted">Disponível em uma próxima etapa do módulo.</p></section>}</>}
 </div>;
}
