import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck,
  Plus
} from 'lucide-react';

export default function OcorrenciasModule() {
  const [incidents, setIncidents] = useState([
    {
      id: 'OC-2026-081',
      type: 'Parada Preventiva / Superaquecimento de Freio',
      severity: 'moderada',
      vehiclePlate: 'AMB-2X11',
      driver: 'Juliano Ferreira',
      location: 'BR-376 km 612 - Tijucas do Sul / PR',
      cargo: 'Solventes Residuais Clorados (ONU 1993)',
      time: 'Há 45 min',
      status: 'Em Atendimento',
      notes: 'Equipe de apoio mecânico a caminho. Veículo isolado no acostamento com cones e sinalização regulamentar.'
    },
    {
      id: 'OC-2026-079',
      type: 'Vistoria Preventiva Concluída',
      severity: 'leve',
      vehiclePlate: 'AMB-4K89',
      driver: 'Carlos Eduardo Mendes',
      location: 'Posto Fiscal SP-330 km 110',
      cargo: 'Borra Oleosa Classe I',
      time: 'Há 3 horas',
      status: 'Resolvido',
      notes: 'Documentação MTR e licenças conferidas pelo fiscal da CETESB sem nenhuma ressalva.'
    }
  ]);

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
            Plano de Atendimento a Emergências (PAE), registro de paradas não programadas e monitoramento em tempo real de produtos perigosos.
          </p>
        </div>

        <div className="emergency-callbox">
          <PhoneCall size={20} className="phone-beacon" />
          <div>
            <span className="emergency-title">Plantão de Emergência Ambipar Response</span>
            <strong>0800 123 4567 • 24 Horas</strong>
          </div>
        </div>
      </div>

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
              <p><strong>Parecer Operacional do CCO:</strong> {item.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
