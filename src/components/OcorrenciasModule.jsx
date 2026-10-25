import useFleetDirectory from '../hooks/useFleetDirectory';
import {driverForVehicle} from '../utils/registryMatching';
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  CheckCircle2, 
  MapPin, 
  Truck,
  Plus,
  ShieldCheck
} from 'lucide-react';

export default function OcorrenciasModule({companyId}) {
 const directory=useFleetDirectory(companyId);
  const [incidents, setIncidents] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_incidents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
    try {
      localStorage.setItem('ambipar_real_incidents', JSON.stringify(incidents));
    } catch (err) {
      console.warn('Erro ao salvar ocorrências:', err);
    }
  }, [incidents]);

  const handleCreateIncident = (e) => {
    e.preventDefault();
    const created = {
      ...newIncident,
      id: `OC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      time: 'Agora mesmo',
      status: 'Em Atendimento'
    };
    setIncidents([created, ...incidents]);
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

          <div className="emergency-callbox">
            <PhoneCall size={20} className="phone-beacon" />
            <div>
              <span className="emergency-title">Plantão de Emergência Ambipar Response</span>
              <strong>0800 123 4567 • 24 Horas</strong>
            </div>
          </div>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <ShieldCheck size={48} style={{ color: 'var(--accent-emerald-light)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Nenhuma ocorrência registrada</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto' }}>
            Todas as frotas e operações de transporte estão operando normalmente e sem incidentes pendentes de atendimento.
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
                  placeholder="Ex: Parada Preventiva de Freio, Vistoria Fiscal, Atraso..."
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
                    placeholder="Ex: Rod. Anhanguera km 120"
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
                  placeholder="Ex: Borra Oleosa Classe I"
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
                >
                  Registrar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
