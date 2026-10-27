import AmbiparConfirmDialog from '../../common/AmbiparConfirmDialog';
import FleetPreventiveOrderForm from '../plans/FleetPreventiveOrderForm';
import DriverReportOrderForm from '../driver-requests/DriverReportOrderForm';
import {reportOrder} from '../../../services/driverReports';
import PreventiveOrderForm from '../plans/PreventiveOrderForm';
import {planCommand} from '../../../services/maintenancePlans';
import OccurrenceOrderForm from '../occurrences/OccurrenceOrderForm';
import {vehicleCommand} from '../../../services/vehicleMaintenance';
import React,{useEffect,useMemo,useState} from 'react';
import useMaintenanceOrders from '../../../hooks/useMaintenanceOrders';
import {commandOrder,uploadOrderObject,removeOrderObject,sendOrderDispatch,ensureDefaultUnassignedPartner,updateOrderData,deleteOrder} from '../../../services/maintenanceOrders';
import {ORDER_STATUS,ORDER_TYPES,PRIORITIES,CLOSED,isLate,nextStatuses,orderPermissions} from '../../../utils/orderValidation';
import OrderForm from './OrderForm';
import OrderDetail from './OrderDetail';
import OrderActionModal from './OrderActionModal';
import OrderDocumentModal from './OrderDocumentModal';
import OrderEditModal from './OrderEditModal';
import OrdersVehicleFilterView from './OrdersVehicleFilterView';
import {money,date} from '../PartnerDetail';
import {Filter, LayoutGrid, Table} from 'lucide-react';
import './Orders.css';

const emptyFilters={search:'',status:'',tipo:'',prioridade:'',vehicle_id:'',partner_id:'',start:'',end:'',late:false};

function route(){
  const q=new URLSearchParams(window.location.search);
  return{
    id:q.get('os'),
    mode:q.get('acao')==='nova'?'new':q.has('os')?'detail':'list',
    reportId:q.get('relato'),
    partnerId:q.get('oficina'),
    occurrenceId:q.get('ocorrencia'),
    planVehicleId:q.get('preventiva'),
    vehicleId:q.get('veiculo'),
    fleetPreventiveId:q.get('preventiva_frota')
  };
}

export default function OrdersPage({access,setLocked}){
  const [view,setView]=useState(route);
  const [viewMode,setViewMode]=useState(()=>new URLSearchParams(window.location.search).get('visualizacao')||'filter'); // 'filter' | 'board' | 'table'
  const [filters,setFilters]=useState(emptyFilters);
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(1);
  const [board,setBoard]=useState(true);
  const [busy,setBusy]=useState(false);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [modal,setModal]=useState(null);
  const [docModalOrder,setDocModalOrder]=useState(null);
  const [editModalOrder,setEditModalOrder]=useState(null);
  const [detailTab,setDetailTab]=useState(()=>new URLSearchParams(window.location.search).get('aba')==='comunicacao'?'comunicacao':'resumo');
  const [communicationDirty,setCommunicationDirty]=useState(false);

  const permissions=useMemo(()=>orderPermissions(access.role),[access.role]);
  const isFetchingAll = viewMode === 'filter' || viewMode === 'board';
  const data=useMaintenanceOrders(access.companyId,filters,page,isFetchingAll,view.id);

  useEffect(()=>{
    const fn=()=>{
      setView(route());
      setError('');
      setModal(null);
      setDocModalOrder(null);
      setEditModalOrder(null);
      setDetailTab(new URLSearchParams(window.location.search).get('aba')==='comunicacao'?'comunicacao':'resumo');
    };
    window.addEventListener('popstate',fn);
    return()=>window.removeEventListener('popstate',fn);
  },[]);

  useEffect(()=>{
    setLocked(view.mode!=='list'||!!modal||!!docModalOrder||!!editModalOrder);
    return()=>setLocked(false);
  },[view.mode,modal,docModalOrder,editModalOrder,setLocked]);

  useEffect(()=>{
    const t=setTimeout(()=>{
      setFilters(f=>({...f,search}));
      setPage(1);
    },300);
    return()=>clearTimeout(t);
  },[search]);

  const options=data.options.data;

  function changeTab(tab){
    setDetailTab(tab);
    if(tab!=='comunicacao'&&communicationDirty){
      setCommunicationDirty(false);
      data.reload();
    }
  }

  function go(mode,id){
    setCommunicationDirty(false);
    setDetailTab('resumo');
    const q=mode==='new'?'?acao=nova':id?'?os='+id:'';
    window.history.pushState({},'',window.location.pathname+q);
    setView({mode,id});
    setModal(null);
    setDocModalOrder(null);
    setEditModalOrder(null);
    setError('');
  }

  async function deliver(id,kind){
    try{
      const n=await sendOrderDispatch(access.companyId,id,kind);
      setNotice(n.counts?.total?'Solicitação aceita para envio WhatsApp em '+(n.counts.accepted||0)+' de '+n.counts.total+' oficinas. Pendentes: '+(n.remaining||0)+'. Confira os resultados por oficina.':n.status==='accepted'?'Excel e mensagem aceitos para envio WhatsApp à oficina.':n.error||'Envio: '+n.status+'. Consulte o registro abaixo.');
    }catch(e){
      setNotice('S.D.O salva. '+e.message);
    }
  }

  async function retryDispatch(kind,uncertain,dispatchId){
    setBusy(true);
    setError('');
    try{
      const n=await sendOrderDispatch(access.companyId,view.id,kind,uncertain,dispatchId);
      setNotice(n.status==='accepted'?'Excel e mensagem aceitos para envio WhatsApp.':n.error||'Envio: '+n.status);
    }catch(e){
      setError(e.message);
    }finally{
      data.reload();
      setBusy(false);
    }
  }

  async function perform(command,body,target=data.detail.data?.order){
    setBusy(true);
    setError('');
    try{
      const row=await commandOrder(access.companyId,command,{...body,id:target?.id,version:target?.version});
      setNotice('Operação registrada com sucesso.');
      setModal(null);
      if(command==='budget'&&body.decisao==='aprovado')await deliver(row.id,'aprovacao');
      if(command==='select_quote_types'){
        if(row.orcamento_status!=='aprovado'&&row.quote_partner_types?.length)await deliver(row.id,'abertura');
        else if(!row.quote_partner_types?.length)setNotice('Filtros salvos sem disparo. Nenhum tipo selecionado.');
      }
      data.reload();
      return row;
    }catch(e){
      setError(e.message);
      throw e;
    }finally{
      setBusy(false);
    }
  }

  async function handleSaveEditedOrder(form) {
    if (!editModalOrder) return;
    setBusy(true);
    setError('');
    try {
      const updated = await updateOrderData(access.companyId, editModalOrder.id, form, editModalOrder);
      setNotice(`S.D.O ${updated.numero || editModalOrder.numero} atualizada com sucesso.`);
      setEditModalOrder(null);
      data.reload();
    } catch (err) {
      setError(err.message || 'Falha ao salvar edição da S.D.O.');
    } finally {
      setBusy(false);
    }
  }

  function handleDeleteOrder(order) {
    if (!order) return;
    setDeleteConfirmOrder(order);
  }

  async function handleConfirmDeleteOrder() {
    if (!deleteConfirmOrder) return;
    const order = deleteConfirmOrder;
    setBusy(true);
    setError('');
    try {
      await deleteOrder(access.companyId, order.id);
      setNotice(`S.D.O ${order.numero || ''} excluída com sucesso.`);
      setDeleteConfirmOrder(null);
      if (view.id === order.id) {
        go('list');
      }
      data.reload();
    } catch (err) {
      setError(err.message || 'Falha ao excluir a S.D.O.');
    } finally {
      setBusy(false);
    }
  }

  async function create(form){
    setBusy(true);
    setError('');
    try{
      let payload={...form};
      if(!payload.partner_id){
        const placeholder=await ensureDefaultUnassignedPartner(access.companyId,options?.partners);
        if(placeholder?.id){
          payload.partner_id=placeholder.id;
        }else{
          throw new Error('Não foi possível definir uma oficina para esta empresa. Por favor, cadastre uma oficina parceira em "Oficinas Parceiras" ou contate o administrador.');
        }
      }
      const row=view.reportId?await reportOrder(access.companyId,'create',{...payload,report_id:view.reportId}):view.planVehicleId?await planCommand(access.companyId,'create_order',{...payload,plan_vehicle_id:view.planVehicleId}):view.occurrenceId?await vehicleCommand(access.companyId,'from_occurrence',{id:view.occurrenceId,order:payload}):await commandOrder(access.companyId,'create',payload);
      go('detail',row.id);
      setNotice((view.fleetPreventiveId||view.planVehicleId?'SDO ':'S.D.O ')+row.numero+' aberta com sucesso.');
      if(payload.selected_partner_ids?.length&&payload.quote_partner_types?.length)await deliver(row.id,'abertura');
      else setNotice((view.fleetPreventiveId||view.planVehicleId?'SDO ':'S.D.O ')+row.numero+' salva com sucesso. Documento pronto para download e envio.');
      data.reload();
    }catch(e){
      console.error('Erro na abertura da S.D.O:', e);
      setError(e.message||'Falha ao processar abertura da S.D.O.');
      setTimeout(()=>{
        const errElem=document.querySelector('.os-submit-error-banner, [role="alert"]');
        if(errElem)errElem.scrollIntoView({behavior:'smooth',block:'center'});
      },50);
    }finally{
      setBusy(false);
    }
  }

  async function confirm(form,file){
    let object;
    setBusy(true);
    setError('');
    try{
      if(file)object=await uploadOrderObject(access.companyId,modal.order.id,file,true);
      await perform(modal.command,{...form,foto:object?.url},modal.order);
    }catch(e){
      if(object)await removeOrderObject(object.url).catch(()=>{});
      setError(e.message);
    }finally{
      setBusy(false);
    }
  }

  async function upload(file,tipo){
    let object;
    setBusy(true);
    setError('');
    try{
      if(tipo==='orcamento'&&file.type!=='application/pdf')throw new Error('Orçamento deve ser PDF.');
      if(['foto_antes','foto_depois'].includes(tipo)&&!file.type.startsWith('image/'))throw new Error('Selecione uma imagem.');
      object=await uploadOrderObject(access.companyId,view.id,file);
      await perform('attachment_add',{...object,tipo});
    }catch(e){
      if(object)await removeOrderObject(object.url).catch(()=>{});
      setError(e.message);
      throw e;
    }finally{
      setBusy(false);
    }
  }

  async function remove(file){
    await perform('attachment_delete',{attachment_id:file.id});
    await removeOrderObject(file.url);
  }

  const action=(order,details)=>{
    setError('');
    setModal({...details,order});
  };

  const filter=(k,value)=>{
    setFilters(f=>({...f,[k]:value}));
    setPage(1);
  };

  const vehicle=id=>options?.vehicles?.find(v=>v.id===id);
  const partner=id=>{
    const p=options?.partners?.find(p=>p.id===id);
    return p?.nome_fantasia||p?.razao_social||'Oficina indisponível';
  };

  if(data.options.loading&&!data.options.data)return <p role="status">Carregando veículos e oficinas…</p>;
  if(data.options.error&&!data.options.data)return <div className="mp-card" role="alert"><p>{data.options.error}</p><button onClick={data.reload}>Tentar novamente</button></div>;
  if(view.mode==='new'&&!permissions.create)return <p role="alert">Sem permissão para abrir S.D.O.</p>;
  if(view.mode==='new'&&view.fleetPreventiveId)return <FleetPreventiveOrderForm key={view.fleetPreventiveId} company={access.companyId} vehicleId={view.fleetPreventiveId} options={options} onSave={create} onBack={()=>go('list')} busy={busy} error={error}/>;
  if(view.mode==='new'&&view.reportId)return <DriverReportOrderForm company={access.companyId} id={view.reportId} options={options} onSave={create} onBack={()=>go('list')} busy={busy} error={error}/>;
  if(view.mode==='new'&&view.planVehicleId)return <PreventiveOrderForm company={access.companyId} id={view.planVehicleId} vehicleId={view.vehicleId} options={options} onSave={create} onBack={()=>go('list')} busy={busy} error={error}/>;
  if(view.mode==='new'&&view.occurrenceId)return <OccurrenceOrderForm company={access.companyId} id={view.occurrenceId} options={options} onSave={create} onBack={()=>go('list')} busy={busy} error={error}/>;
  if(view.mode==='new')return <OrderForm company={access.companyId} options={options} partnerId={view.partnerId} onSave={create} onBack={()=>go('list')} busy={busy} error={error}/>;

  const content=view.mode==='detail'?(
    data.detail.loading ? (
      <p role="status">Carregando S.D.O…</p>
    ) : data.detail.error ? (
      <div role="alert">
        <p>{data.detail.error}</p>
        <button onClick={data.reload}>Tentar novamente</button>
        <button onClick={()=>go('list')}>Voltar</button>
      </div>
    ) : data.detail.data ? (
      <OrderDetail 
        tab={detailTab} 
        setTab={changeTab} 
        onCommunicationChanged={()=>setCommunicationDirty(true)} 
        key={data.detail.data.order.version} 
        data={data.detail.data} 
        company={access.companyId} 
        options={options} 
        permissions={permissions} 
        busy={busy} 
        error={error} 
        onCommand={perform} 
        onDispatch={retryDispatch} 
        onAction={details=>action(data.detail.data.order,details)} 
        onUpload={upload} 
        onDelete={remove} 
        onDeleteOrder={handleDeleteOrder}
        onBack={()=>go('list')}
      />
    ) : null
  ) : (
    <div>
      {/* CABEÇALHO DA LISTAGEM DE S.D.O */}
      <div className="mp-row mp-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>S.D.O — Solicitações de Orçamento</h2>
          <p className="mp-muted" style={{ margin: 0 }}>
            Gestão integrada das manutenções da frota · {data.list.count} solicitações cadastradas.
          </p>
        </div>
        {permissions.create && (
          <button className="mp-primary" onClick={()=>go('new')}>
            + Nova S.D.O
          </button>
        )}
      </div>

      {/* SELETOR DE MODO DE VISUALIZAÇÃO: CONSULTA (PLACAS, DATAS, MÊS) / KANBAN / TABELA */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '8px', 
          background: 'var(--mp-panel, #ffffff)', 
          border: '1px solid var(--mp-border, #cbd5e1)', 
          borderRadius: '10px', 
          padding: '6px 12px', 
          marginBottom: '16px' 
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="mp-button"
            onClick={() => setViewMode('filter')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: viewMode === 'filter' ? '#0284c7' : 'transparent',
              color: viewMode === 'filter' ? '#ffffff' : 'var(--mp-text, #1e293b)',
              borderColor: viewMode === 'filter' ? '#0284c7' : 'transparent'
            }}
          >
            <Filter size={15} /> Consulta Completa (Placas, Datas, Mês)
          </button>

          <button
            type="button"
            className="mp-button"
            onClick={() => setViewMode('board')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: viewMode === 'board' ? '#0284c7' : 'transparent',
              color: viewMode === 'board' ? '#ffffff' : 'var(--mp-text, #1e293b)',
              borderColor: viewMode === 'board' ? '#0284c7' : 'transparent'
            }}
          >
            <LayoutGrid size={15} /> Quadro Kanban por Status
          </button>

          <button
            type="button"
            className="mp-button"
            onClick={() => setViewMode('table')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: viewMode === 'table' ? '#0284c7' : 'transparent',
              color: viewMode === 'table' ? '#ffffff' : 'var(--mp-text, #1e293b)',
              borderColor: viewMode === 'table' ? '#0284c7' : 'transparent'
            }}
          >
            <Table size={15} /> Tabela Simples
          </button>
        </div>

        <span className="mp-muted" style={{ fontSize: '0.8rem' }}>
          {viewMode === 'filter' ? '✓ Modo avançado ativo' : 'Modo clássico'}
        </span>
      </div>

      {/* RENDERIZAÇÃO DO MODO SELECIONADO */}
      {viewMode === 'filter' ? (
        <OrdersVehicleFilterView
          orders={data.list.rows}
          options={options}
          loading={data.list.loading}
          error={data.list.error}
          companyId={access.companyId}
          canManage={permissions.manage}
          onSelectOrder={id => go('detail', id)}
          onPrintOrder={ord => setDocModalOrder(ord)}
          onEditOrder={ord => setEditModalOrder(ord)}
          onDeleteOrder={handleDeleteOrder}
          onRefresh={data.reload}
        />
      ) : viewMode === 'board' ? (
        <div>
          {/* BARRA DE FILTROS DO KANBAN */}
          <div className="mp-filters os-filters">
            <label>
              Buscar S.D.O
              <input aria-label="Buscar S.D.O" placeholder="Número ou problema" value={search} onChange={e=>setSearch(e.target.value)}/>
            </label>
            {[['status','Status',ORDER_STATUS],['tipo','Tipo da S.D.O',ORDER_TYPES],['prioridade','Prioridade',PRIORITIES]].map(([key,label,choices])=>(
              <label key={key}>
                {label}
                <select aria-label={label} value={filters[key]} onChange={e=>filter(key,e.target.value)}>
                  <option value="">Todos</option>
                  {Object.entries(choices).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            ))}
            <label>
              Veículo
              <select aria-label="Filtrar veículo" value={filters.vehicle_id} onChange={e=>filter('vehicle_id',e.target.value)}>
                <option value="">Todos</option>
                {options.vehicles.map(v=><option key={v.id} value={v.id}>{v.placa}</option>)}
              </select>
            </label>
            <label>
              Oficina
              <select aria-label="Filtrar oficina" value={filters.partner_id} onChange={e=>filter('partner_id',e.target.value)}>
                <option value="">Todas</option>
                {options.partners.map(p=><option key={p.id} value={p.id}>{p.nome_fantasia||p.razao_social}</option>)}
              </select>
            </label>
            <label>Desde<input type="date" value={filters.start} onChange={e=>filter('start',e.target.value)}/></label>
            <label>Até<input type="date" min={filters.start} value={filters.end} onChange={e=>filter('end',e.target.value)}/></label>
          </div>

          <div className="mp-row mp-between" style={{ margin: '10px 0 16px 0' }}>
            <div className="mp-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={filters.late} onChange={e=>filter('late',e.target.checked)}/>
                Somente atrasadas
              </label>
              <button onClick={()=>{setFilters(emptyFilters);setSearch('');setPage(1);}}>
                Limpar filtros
              </button>
            </div>
          </div>

          {data.list.loading ? (
            <p role="status">Carregando solicitações…</p>
          ) : data.list.error ? (
            <div role="alert"><p>{data.list.error}</p><button onClick={data.reload}>Tentar novamente</button></div>
          ) : !data.list.rows.length ? (
            <div className="mp-card mp-empty">Nenhuma S.D.O encontrada para este filtro.</div>
          ) : (
            <div className="os-board" aria-label="Kanban de solicitações">
              {Object.entries(ORDER_STATUS).filter(([s])=>s!=='cancelada').map(([status,label])=>(
                <section 
                  className="os-column" 
                  key={status} 
                  aria-label={label} 
                  onDragOver={e=>{if(permissions.manage)e.preventDefault();}} 
                  onDrop={e=>{
                    e.preventDefault();
                    const id=e.dataTransfer.getData('text/plain'),order=data.list.rows.find(o=>o.id===id);
                    if(order&&permissions.manage&&nextStatuses(order).includes(status))action(order,{command:'transition',status});
                    else setError('Use um próximo status permitido ou a decisão de orçamento no detalhe da S.D.O.');
                  }}
                >
                  <h3>{label} <small>{data.list.rows.filter(o=>o.status===status).length}</small></h3>
                  {data.list.rows.filter(o=>o.status===status).map(o=>(
                    <article 
                      className={'os-card '+(isLate(o)?'late':'')} 
                      key={o.id} 
                      draggable={permissions.manage&&!CLOSED.includes(o.status)} 
                      onDragStart={e=>e.dataTransfer.setData('text/plain',o.id)}
                    >
                      <button className="os-card-title" onClick={()=>go('detail',o.id)}>{o.numero}</button>
                      <strong>{vehicle(o.vehicle_id)?.placa||'Veículo'}</strong>
                      <p>{partner(o.partner_id)}</p>
                      <small>{PRIORITIES[o.prioridade]} · {money(o.valor_total)}</small>
                      <p>Previsão: {date(o.previsao_entrega)}</p>
                      {isLate(o)&&<span className="os-late">ATRASADA</span>}
                      {permissions.manage&&nextStatuses(o).length>0&&(
                        <select aria-label={'Mover '+o.numero} value="" onChange={e=>action(o,{command:'transition',status:e.target.value})}>
                          <option value="">Mover para…</option>
                          {nextStatuses(o).map(s=><option key={s} value={s}>{ORDER_STATUS[s]}</option>)}
                        </select>
                      )}
                    </article>
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VISUALIZAÇÃO TABELA SIMPLES */
        <div>
          <div className="mp-filters os-filters">
            <label>
              Buscar S.D.O
              <input aria-label="Buscar S.D.O" placeholder="Número ou problema" value={search} onChange={e=>setSearch(e.target.value)}/>
            </label>
            {[['status','Status',ORDER_STATUS],['tipo','Tipo da S.D.O',ORDER_TYPES],['prioridade','Prioridade',PRIORITIES]].map(([key,label,choices])=>(
              <label key={key}>
                {label}
                <select aria-label={label} value={filters[key]} onChange={e=>filter(key,e.target.value)}>
                  <option value="">Todos</option>
                  {Object.entries(choices).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            ))}
            <label>
              Veículo
              <select aria-label="Filtrar veículo" value={filters.vehicle_id} onChange={e=>filter('vehicle_id',e.target.value)}>
                <option value="">Todos</option>
                {options.vehicles.map(v=><option key={v.id} value={v.id}>{v.placa}</option>)}
              </select>
            </label>
            <label>
              Oficina
              <select aria-label="Filtrar oficina" value={filters.partner_id} onChange={e=>filter('partner_id',e.target.value)}>
                <option value="">Todas</option>
                {options.partners.map(p=><option key={p.id} value={p.id}>{p.nome_fantasia||p.razao_social}</option>)}
              </select>
            </label>
            <label>Desde<input type="date" value={filters.start} onChange={e=>filter('start',e.target.value)}/></label>
            <label>Até<input type="date" min={filters.start} value={filters.end} onChange={e=>filter('end',e.target.value)}/></label>
          </div>

          <div className="mp-row mp-between" style={{ margin: '10px 0 16px 0' }}>
            <div className="mp-row">
              <label><input type="checkbox" checked={filters.late} onChange={e=>filter('late',e.target.checked)}/>Somente atrasadas</label>
              <button onClick={()=>{setFilters(emptyFilters);setSearch('');setPage(1);}}>Limpar filtros</button>
            </div>
          </div>

          {data.list.loading ? (
            <p role="status">Carregando solicitações…</p>
          ) : data.list.error ? (
            <div role="alert"><p>{data.list.error}</p><button onClick={data.reload}>Tentar novamente</button></div>
          ) : !data.list.rows.length ? (
            <div className="mp-card mp-empty">Nenhuma S.D.O encontrada.</div>
          ) : (
            <div className="mp-table-wrap">
              <table>
                <thead>
                  <tr>
                    {['S.D.O','Veículo','Oficina','Status','Tipo','Prioridade','Previsão','Total','Ações'].map(c=><th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.list.rows.map(o=>(
                    <tr key={o.id}>
                      <td>{o.numero}{isLate(o)&&<span className="os-late">ATRASADA</span>}</td>
                      <td>{vehicle(o.vehicle_id)?.placa||'—'}</td>
                      <td>{partner(o.partner_id)}</td>
                      <td>{ORDER_STATUS[o.status]}</td>
                      <td>{ORDER_TYPES[o.tipo]}</td>
                      <td>{PRIORITIES[o.prioridade]}</td>
                      <td>{date(o.previsao_entrega)}</td>
                      <td>{money(o.valor_total)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          <button onClick={()=>go('detail',o.id)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>Ver S.D.O</button>
                          {permissions.manage && <button onClick={()=>setEditModalOrder(o)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>Editar</button>}
                          {permissions.manage && <button className="mp-error" onClick={()=>handleDeleteOrder(o)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>Excluir</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mp-row mp-between mp-pagination">
            <span>Página {page} de {Math.max(1,Math.ceil(data.list.count/20))}</span>
            <div className="mp-row">
              <button disabled={page<=1||data.list.loading} onClick={()=>setPage(v=>v-1)}>Anterior</button>
              <button disabled={page*20>=data.list.count||data.list.loading} onClick={()=>setPage(v=>v+1)}>Próxima</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="os-module">
      {notice && <p className="mp-notice" role="status">{notice}</p>}
      {view.mode==='list' && error && <p role="alert" className="mp-error">{error}</p>}
      {content}

      {/* MODAL DE TRANSIÇÃO E AÇÃO */}
      {modal && (
        <OrderActionModal 
          action={modal} 
          order={modal.order} 
          vehicle={vehicle(modal.order.vehicle_id)} 
          busy={busy} 
          error={error} 
          onConfirm={confirm} 
          onClose={()=>{setModal(null);setError('');}}
        />
      )}

      {/* MODAL DE IMPRESSÃO A4 (PRETO E BRANCO) */}
      {docModalOrder && (
        <OrderDocumentModal
          order={docModalOrder}
          vehicle={vehicle(docModalOrder.vehicle_id)}
          partner={options?.partners?.find(p=>p.id===docModalOrder.partner_id)}
          company={{ id: access.companyId, nome: access.membership?.nome || 'Ambipar Group' }}
          onEdit={() => {
            const ord = docModalOrder;
            setDocModalOrder(null);
            setEditModalOrder(ord);
          }}
          onClose={() => setDocModalOrder(null)}
        />
      )}

      {/* MODAL DE EDIÇÃO DA SDO */}
      {editModalOrder && (
        <OrderEditModal
          order={editModalOrder}
          vehicle={vehicle(editModalOrder.vehicle_id)}
          options={options}
          busy={busy}
          error={error}
          onSave={handleSaveEditedOrder}
          onClose={() => { setEditModalOrder(null); setError(''); }}
        />
      )}
      <AmbiparConfirmDialog
        isOpen={!!deleteConfirmOrder}
        title="Excluir Ordem de Serviço (S.D.O)"
        message="Tem certeza que deseja excluir esta Ordem de Serviço permanentemente do sistema?"
        subtitle="Esta ação removerá a solicitação e os registros vinculados de forma definitiva e segura."
        itemLabel="S.D.O"
        itemBadge={deleteConfirmOrder?.numero}
        confirmText="Sim, Excluir S.D.O"
        cancelText="Cancelar"
        isDanger={true}
        loading={busy}
        onConfirm={handleConfirmDeleteOrder}
        onCancel={() => !busy && setDeleteConfirmOrder(null)}
      />
    </div>
  );
}