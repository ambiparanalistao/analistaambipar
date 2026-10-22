import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Filter,
  UserCheck
} from 'lucide-react';

export default function TripsModule({ user }) {
  const [trips, setTrips] = useState([
    {
      id: 'AMB-TRIP-9041',
      vehiclePlate: 'AMB-4K89',
      vehicleType: 'Carreta Tanque Químico',
      driver: 'Carlos Eduardo Mendes',
      wasteType: 'Borra Oleosa (Classe I - Perigoso)',
      onuCode: 'ONU 3082',
      origin: 'Refinaria Paulínia - SP',
      destination: 'Unidade Ambipar Nova Odessa - SP',
      distanceKm: 145,
      weightTon: 28.4,
      status: 'transito',
      statusLabel: 'Em Trânsito',
      departureTime: '2026-10-21 08:30',
      slaEta: '14:30'
    },
    {
      id: 'AMB-TRIP-9038',
      vehiclePlate: 'AMB-7L20',
      vehicleType: 'Truck Sider 6x2',
      driver: 'Marcos Vinicius Silva',
      wasteType: 'Lodos de ETE Tratados (Classe II A)',
      onuCode: 'Não Perigoso',
      origin: 'Complexo Químico Duque de Caxias - RJ',
      destination: 'Aterro Industrial Resende - RJ',
      distanceKm: 180,
      weightTon: 18.2,
      status: 'descarga',
      statusLabel: 'Descarregando',
      departureTime: '2026-10-21 06:15',
      slaEta: '11:15'
    },
    {
      id: 'AMB-TRIP-9035',
      vehiclePlate: 'AMB-9T54',
      vehicleType: 'Bitrem Articulado',
      driver: 'Roberto Almeida Jr',
      wasteType: 'Cinzas e Escória de Caldeira (Classe II B)',
      onuCode: 'Não Perigoso',
      origin: 'Siderúrgica Betim - MG',
      destination: 'Cimenteira Pedro Leopoldo - MG',
      distanceKm: 92,
      weightTon: 34.0,
      status: 'concluido',
      statusLabel: 'Concluído',
      departureTime: '2026-10-21 05:00',
      slaEta: '09:40'
    }
  ]);

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

  const handleCreateTrip = (e) => {
    e.preventDefault();
    const created = {
      ...newTrip,
      id: `AMB-TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'transito',
      statusLabel: 'Em Trânsito',
      departureTime: new Date().toLocaleString('pt-BR'),
      distanceKm: Number(newTrip.distanceKm),
      weightTon: Number(newTrip.weightTon)
    };
    setTrips([created, ...trips]);
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

  const handleUpdateStatus = (id, newStatus, newLabel) => {
    setTrips(trips.map(t => t.id === id ? { ...t, status: newStatus, statusLabel: newLabel } : t));
  };

  return (
    <div className="module-view animate-fade-in" id="trips-module-root">
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <Truck size={16} />
            <span>OPERAÇÕES DE TRANSPORTE & LOGÍSTICA</span>
          </div>
          <h2>Monitoramento de Frotas & Viagens</h2>
          <p>
            Rastreamento de veículos em trânsito, controle de tempo de ciclo de carga/descarga e gestão de motoristas.
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
              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Placa do Veículo (Cavalo/Carreta)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AMB-4K89"
                    value={newTrip.vehiclePlate}
                    onChange={(e) => setNewTrip({ ...newTrip, vehiclePlate: e.target.value.toUpperCase() })}
                  />
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
                <input
                  type="text"
                  required
                  placeholder="Nome completo do condutor"
                  value={newTrip.driver}
                  onChange={(e) => setNewTrip({ ...newTrip, driver: e.target.value })}
                />
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
                  className="btn-primary"
                >
                  Registrar e Iniciar Viagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
