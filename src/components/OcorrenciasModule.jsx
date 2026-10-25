import useFleetDirectory from '../hooks/useFleetDirectory';
import {driverForVehicle} from '../utils/registryMatching';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { vehicleCommand } from '../services/vehicleMaintenance';
import { 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Truck,
  Plus,
  ShieldCheck
} from 'lucide-react';

export default function OcorrenciasModule({companyId}) {
 const directory=useFleetDirectory(companyId);
  const [databaseLoading,setDatabaseLoading]=useState(true);
  const [databaseError,setDatabaseError]=useState('');
  const [saving,setSaving]=useState(false);
  // Ocorrências antigas do navegador são preservadas para backup/revisão,
  // mas não são exibidas no painel até terem vínculo confirmado com a empresa.
  const [incidents, setIncidents] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    type: '',
    severity: 'leve',
    vehiclePlate: '',
    driver: '',
    location: '',
    cargo: '',
    notes: ''
  });

  useEffect(() => {
    let cancelled=false;
    async function loadOccurrences(){
      if(!supabase||!companyId){setDatabaseLoading(false);setDatabaseError('Selecione uma empresa para consultar ocorrências.');return;}
      setIncidents([]);setDatabaseLoading(true);setDatabaseError('');
      const {data,error}=await supabase.from('vehicle_occurrences').select('*').eq('company_id',companyId).order('ocorreu_em',{ascending:false});
      if(cancelled)return;
      if(error){setDatabaseError(error.message);setDatabaseLoading(false);return;}
      const persisted=(data||[]).map(row=>{
        const vehicle=directory.vehicles.find(v=>v.id===row.vehicle_id),driver=directory.drivers.find(d=>d.id===row.driver_id);
        return {id:row.id,type:row.tipo,severity:row.gravidade,vehiclePlate:vehicle?.placa||'',driver:driver?.nome||'',location:row.local||'',cargo:'',notes:row.descricao,time:new Date(row.ocorreu_em).toLocaleString('pt-BR'),status:'Registrada',createdAt:row.ocorreu_em};
      });
      setIncidents(persisted);
      setDatabaseLoading(false);
    }
    loadOccurrences().catch(error=>{if(!cancelled){setDatabaseError(error.message||'Não foi possível carregar ocorrências.');setDatabaseLoading(false);}});
    return()=>{cancelled=true;};
  },[companyId,directory.vehicles,directory.drivers]);

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    const vehicle=directory.vehicles.find(v=>v.placa===newIncident.vehiclePlate),driver=directory.drivers.find(d=>d.nome===newIncident.driver);
    if(!vehicle){setDatabaseError('Selecione um veículo cadastrado nesta empresa.');return;}
    if(!driver){setDatabaseError('Selecione um motorista cadastrado nesta empresa.');return;}
    setSaving(true);setDatabaseError('');
    const normalizedType=String(newIncident.type).toLowerCase();
    const type=normalizedType.includes('acidente')?'acidente':normalizedType.includes('pneu')?'pneu':normalizedType.includes('elétrica')||normalizedType.includes('eletrica')?'pane_eletrica':normalizedType.includes('sinistro')?'sinistro':normalizedType.includes('quebra')?'quebra':'outros';
    const description=[`Tipo informado: ${newIncident.type}`,`Carga transportada: ${newIncident.cargo}`,`Relato e providências: ${newIncident.notes}`].join('\n');
    let row;
    try{row=await vehicleCommand(companyId,'report',{vehicle_id:vehicle.id,driver_id:driver.id,tipo:type,gravidade:newIncident.severity,descricao:description,local:newIncident.location});}
    catch(error){setDatabaseError(error.message||'Não foi possível gravar a ocorrência no Supabase.');setSaving(false);return;}
    const created={...newIncident,id:row.id,time:new Date(row.ocorreu_em).toLocaleString('pt-BR'),createdAt:row.ocorreu_em,status:'Registrada'};
    setIncidents(current=>[created,...current.filter(item=>String(item.id)!==String(created.id))]);
    setSaving(false);
    setShowModal(false);
    setNewIncident({
      type: '',
      severity: 'leve',
      vehiclePlate: '',
      driver: '',
      location: '',
      cargo: '',
      notes: ''
    });
  };

  return (
    <div className="module-view animate-fade-in" id="ocorrencias-module-root">
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <AlertTriangle size={16} />
            <span>CENTRAL DE EMERGÊNCIAS & CONTROLE PREVENTIVO</span>
          </div>
          <h2>Gestão de Ocorrências & Ambipar Response</h2>
          <p>
            Plano de Atendimento a Emergências (PAE) e registro de paradas ou ocorrências rodoviárias.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-primary btn-icon-text"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            <span>Registrar Nova Ocorrência</span>
          </button>

        </div>
      </div>

      {databaseLoading&&<p role="status">Carregando ocorrências da empresa…</p>}
      {databaseError&&<p role="alert" className="card-panel">{databaseError}</p>}

      {incidents.length === 0 ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <ShieldCheck size={48} style={{ color: 'var(--accent-emerald-light)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Nenhuma ocorrência registrada</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto' }}>
            Não há ocorrências registradas nesta lista.
          </p>
        </div>
      ) : (
        <div className="incidents-list-container">
          {incidents.map((item) => (
            <div key={item.id} className={`incident-card severity-${item.severity}`}>
              <div className="incident-header">
                <div className="incident-title-block">
                  <span className={`severity-badge ${item.severity}`}>
                    {item.severity.toUpperCase()}
                  </span>
                  <h3>{item.type}</h3>
                  <span className="incident-code">{item.id}</span>
                </div>
                <span className={`status-pill ${item.status === 'Resolvido' ? 'online' : 'checking'}`}>
                  {item.status}
                </span>
              </div>

              <div className="incident-body-grid">
                <div>
                  <small>Veículo & Condutor</small>
                  <strong>{item.vehiclePlate} • {item.driver}</strong>
                </div>
                <div>
                  <small>Localização do Incidente</small>
                  <strong>{item.location}</strong>
                </div>
                <div>
                  <small>Carga Transportada</small>
                  <strong>{item.cargo}</strong>
                </div>
                <div>
                  <small>Registro</small>
                  <strong>{item.time}</strong>
                </div>
              </div>

              <div className="incident-notes-box">
                <p><strong>Parecer Operacional da Central de Gestão:</strong> {item.notes}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-container">
            <div className="modal-header">
              <div className="header-icon-label">
                <AlertTriangle size={20} className="icon-amber" />
                <h3>Registrar Ocorrência Operacional</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="modal-form">
              <div className="input-group-custom">
                <label>Tipo de Ocorrência</label>
                <input
                  type="text"
                  required
                  placeholder="Informe o tipo de ocorrência"
                  value={newIncident.type}
                  onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                />
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Severidade</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                    className="select-custom"
                  >
                    <option value="leve">Leve (Sem risco de vazamento)</option>
                    <option value="moderada">Moderada (Parada não programada)</option>
                    <option value="critica">Crítica (Emergência Ambipar Response)</option>
                  </select>
                </div>

                <div className="input-group-custom">
                  <label>Placa do Veículo</label>
                  <select required aria-label="Veículo da ocorrência" value={newIncident.vehiclePlate} onChange={e=>{const v=directory.vehicles.find(v=>v.placa===e.target.value);setNewIncident({...newIncident,vehiclePlate:e.target.value,driver:driverForVehicle(v,directory.drivers)?.nome||''});}}><option value="">Selecione um veículo cadastrado</option>{directory.vehicles.map(v=><option key={v.id} value={v.placa}>{v.placa} · {v.marca_modelo}</option>)}</select>
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Nome do Condutor</label>
                  <select required aria-label="Motorista da ocorrência" value={newIncident.driver} onChange={e=>setNewIncident({...newIncident,driver:e.target.value})}><option value="">Selecione um motorista cadastrado</option>{directory.drivers.map(d=><option key={d.id} value={d.nome}>{d.nome}</option>)}</select>
                </div>

                <div className="input-group-custom">
                  <label>Localização / Rodovia</label>
                  <input
                    type="text"
                    required
                  placeholder="Informe o local ou referência"
                    value={newIncident.location}
                    onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group-custom">
                <label>Carga Transportada</label>
                <input
                  type="text"
                  required
                  placeholder="Informe a carga transportada, se aplicável"
                  value={newIncident.cargo}
                  onChange={(e) => setNewIncident({ ...newIncident, cargo: e.target.value })}
                />
              </div>

              <div className="input-group-custom">
                <label>Descrição e Ações Imediatas</label>
                <textarea
                  required
                  rows={3}
                  className="select-custom"
                  style={{ resize: 'vertical' }}
                  placeholder="Relato da situação e providências tomadas..."
                  value={newIncident.notes}
                  onChange={(e) => setNewIncident({ ...newIncident, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving?'Salvando…':'Registrar Ocorrência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
