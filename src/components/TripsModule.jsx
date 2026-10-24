import useFleetDirectory from '../hooks/useFleetDirectory';
import {driverForVehicle} from '../utils/registryMatching';
import AvailableVehicleSelect from './maintenance/AvailableVehicleSelect';
import {allocateVehicle,vehicleCommand} from '../services/vehicleMaintenance';
import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Filter
} from 'lucide-react';

export default function TripsModule({ user, companyId }) {
  const directory=useFleetDirectory(companyId);
  // Inicializa a partir de dados salvos localmente ou vazio (sem dados fictícios)
  const [trips, setTrips] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_real_trips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tripError,setTripError]=useState(''),[tripBusy,setTripBusy]=useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTrip, setNewTrip] = useState({
    vehiclePlate: '',
    vehicleType: 'Carreta Tanque Químico',
    driver: '',
    wasteType: '',
    onuCode: 'ONU 3082',
    origin: '',
    destination: '',
    distanceKm: '',
    weightTon: '',
    slaEta: ''
  });

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_real_trips', JSON.stringify(trips));
    } catch (err) {
      console.warn('Erro ao salvar viagens localmente:', err);
    }
  }, [trips]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if(tripBusy)return;setTripBusy(true);setTripError('');
    const reference=crypto.randomUUID();let selected;try{selected=await allocateVehicle(companyId,newTrip.vehiclePlate,'trip',reference);}catch(e){setTripError(e.message);setTripBusy(false);return;}
    const created = {
      ...newTrip,
      id: reference,
      vehicle_id:selected.id,
      company_id:companyId,
      status: 'transito',
      statusLabel: 'Em Trânsito',
      departureTime: new Date().toLocaleString('pt-BR'),
      distanceKm: Number(newTrip.distanceKm),
      weightTon: Number(newTrip.weightTon)
    };
    setTrips([created, ...trips]);
    setTripBusy(false);
    setShowModal(false);
    setNewTrip({
      vehiclePlate: '',
      vehicleType: 'Carreta Tanque Químico',
      driver: '',
      wasteType: '',
      onuCode: 'ONU 3082',
      origin: '',
      destination: '',
      distanceKm: '',
      weightTon: '',
      slaEta: ''
    });
  };

  const handleUpdateStatus = async (id, newStatus, newLabel) => {
    if(tripBusy)return;setTripBusy(true);setTripError('');try{const trip=trips.find(t=>t.id===id);if(trip.company_id&&trip.company_id!==companyId)throw new Error('Selecione a empresa desta viagem.');
    if(newStatus==='transito')await allocateVehicle(companyId,trip.vehiclePlate,'trip',trip.id);
    else if(newStatus==='concluido'&&trip.vehicle_id)await vehicleCommand(companyId,'release',{vehicle_id:trip.vehicle_id,kind:'trip',reference:trip.id});

    setTrips(trips.map(t => t.id === id ? { ...t, status: newStatus, statusLabel: newLabel } : t));
    }catch(e){setTripError(e.message);}finally{setTripBusy(false);}
  };

  return (
    <div className="module-view animate-fade-in" id="trips-module-root">
      {tripError&&<p role="alert">{tripError}</p>}
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <Truck size={16} />
            <span>OPERAÇÕES DE TRANSPORTE & LOGÍSTICA</span>
          </div>
          <h2>Monitoramento de Frotas & Viagens</h2>
          <p>
            Rastreamento de veículos em trânsito, controle de tempo de ciclo e gestão de motoristas.
          </p>
        </div>

        <div className="header-actions">
          <button 
            type="button" 
            className="btn-primary btn-icon-text"
            onClick={() => setShowModal(true)}
            id="new-trip-dispatch-btn"
          >
            <Plus size={18} />
            <span>Despachar Nova Viagem</span>
          </button>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Truck size={42} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Nenhuma viagem despachada no momento</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            Cadastre as viagens reais da sua operação clicando no botão abaixo para iniciar o acompanhamento operacional da frota.
          </p>
          <button 
            type="button" 
            className="btn-primary btn-icon-text" 
            style={{ margin: '0 auto' }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            <span>Despachar Primeira Viagem</span>
          </button>
        </div>
      ) : (
        <div className="trips-cards-grid">
          {trips.map((trip) => (
            <div key={trip.id} className={`trip-card-box status-${trip.status}`}>
              <div className="trip-card-header">
                <div>
                  <span className="trip-code">{trip.id}</span>
                  <span className="plate-badge">{trip.vehiclePlate}</span>
                </div>
                <span className={`status-badge-chip ${trip.status}`}>
                  {trip.statusLabel}
                </span>
              </div>

              <div className="trip-card-body">
                <div className="route-flow">
                  <div className="route-node">
                    <MapPin size={15} className="node-icon origin" />
                    <div>
                      <small>Origem</small>
                      <p>{trip.origin}</p>
                    </div>
                  </div>
                  <div className="route-node">
                    <MapPin size={15} className="node-icon destination" />
                    <div>
                      <small>Destino Licenciado</small>
                      <p>{trip.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="trip-meta-grid">
                  <div>
                    <small>Carga Transportada</small>
                    <strong>{trip.wasteType}</strong>
                  </div>
                  <div>
                    <small>Peso / Distância</small>
                    <strong>{trip.weightTon} ton • {trip.distanceKm} km</strong>
                  </div>
                  <div>
                    <small>Motorista</small>
                    <strong>{trip.driver}</strong>
                  </div>
                  <div>
                    <small>Previsão SLA</small>
                    <strong className="text-emerald">{trip.slaEta}</strong>
                  </div>
                </div>
              </div>

              <div className="trip-card-footer">
                <span className="status-label-small">Alterar Status:</span>
                <div className="quick-status-buttons">
                  <button
                    type="button"
                    className={`quick-st-btn ${trip.status === 'transito' ? 'active' : ''}`}
                    onClick={() => handleUpdateStatus(trip.id, 'transito', 'Em Trânsito')}
                  >
                    Trânsito
                  </button>
                  <button
                    type="button"
                    className={`quick-st-btn ${trip.status === 'descarga' ? 'active' : ''}`}
                    onClick={() => handleUpdateStatus(trip.id, 'descarga', 'Descarregando')}
                  >
                    Descarga
                  </button>
                  <button
                    type="button"
                    className={`quick-st-btn ${trip.status === 'concluido' ? 'active' : ''}`}
                    onClick={() => handleUpdateStatus(trip.id, 'concluido', 'Concluído')}
                  >
                    Concluir
                  </button>
                </div>
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
                <Truck size={20} className="icon-emerald" />
                <h3>Despachar Nova Viagem</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="modal-form">
              {tripError&&<p role="alert">{tripError}</p>}
              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <AvailableVehicleSelect company={companyId} required value={newTrip.vehiclePlate} onChange={plate=>{const v=directory.vehicles.find(v=>v.placa===plate);const d=driverForVehicle(v,directory.drivers);setNewTrip(t=>({...t,vehiclePlate:plate,vehicleType:v?.tipo||'',driver:d?.nome||''}));}} label="Placa do veículo disponível"/>
                </div>

                <div className="input-group-custom">
                  <label>Tipo de Equipamento</label>
                  <select
                    value={newTrip.vehicleType}
                    onChange={(e) => setNewTrip({ ...newTrip, vehicleType: e.target.value })}
                    className="select-custom"
                  >
                    <option value="Carreta Tanque Químico">Carreta Tanque Químico</option>
                    <option value="Truck Sider 6x2">Truck Sider 6x2</option>
                    <option value="Bitrem Articulado">Bitrem Articulado</option>
                    <option value="Vácuo Químico Pesado">Vácuo Químico Pesado</option>
                  </select>
                </div>
              </div>

              <div className="input-group-custom">
                <label>Nome do Motorista Homologado (MOPP)</label>
                <select required aria-label="Motorista da viagem" value={newTrip.driver} onChange={e=>setNewTrip({...newTrip,driver:e.target.value})}><option value="">Selecione um motorista cadastrado</option>{directory.drivers.map(d=><option key={d.id} value={d.nome}>{d.nome}</option>)}</select>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Descrição do Resíduo / Carga</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Óleo lubrificante usado, solvente..."
                    value={newTrip.wasteType}
                    onChange={(e) => setNewTrip({ ...newTrip, wasteType: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Código ONU (se aplicável)</label>
                  <input
                    type="text"
                    placeholder="Ex: ONU 3082 ou Não Perigoso"
                    value={newTrip.onuCode}
                    onChange={(e) => setNewTrip({ ...newTrip, onuCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Ponto de Origem</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paulínia - SP"
                    value={newTrip.origin}
                    onChange={(e) => setNewTrip({ ...newTrip, origin: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Ponto de Destino</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nova Odessa - SP"
                    value={newTrip.destination}
                    onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Distância Prevista (km)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 150"
                    value={newTrip.distanceKm}
                    onChange={(e) => setNewTrip({ ...newTrip, distanceKm: e.target.value })}
                  />
                </div>

                <div className="input-group-custom">
                  <label>Peso da Carga (toneladas)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ex: 25.4"
                    value={newTrip.weightTon}
                    onChange={(e) => setNewTrip({ ...newTrip, weightTon: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group-custom">
                <label>Previsão de Entrega (Horário / SLA)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 16:30 (Hoje)"
                  value={newTrip.slaEta}
                  onChange={(e) => setNewTrip({ ...newTrip, slaEta: e.target.value })}
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
                  disabled={tripBusy}
                  className="btn-primary"
                >
                  {tripBusy?'Validando disponibilidade…':'Registrar e Iniciar Viagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
