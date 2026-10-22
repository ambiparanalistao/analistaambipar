import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Leaf, 
  Droplet, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function EsgModule() {
  const [esgData, setEsgData] = useState([
    { mes: 'Jan/26', emissoes_co2: 52.4, compensacao_carbono: 18.0, reciclagem: 78.5 },
    { mes: 'Fev/26', emissoes_co2: 49.1, compensacao_carbono: 20.2, reciclagem: 81.2 },
    { mes: 'Mar/26', emissoes_co2: 46.8, compensacao_carbono: 22.0, reciclagem: 83.0 },
    { mes: 'Abr/26', emissoes_co2: 44.5, compensacao_carbono: 25.0, reciclagem: 85.4 }
  ]);

  return (
    <div className="module-view animate-fade-in" id="esg-module-root">
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <BarChart3 size={16} />
            <span>SUSTENTABILIDADE CORPORATIVA & CRÉDITOS VERDES</span>
          </div>
          <h2>Indicadores ESG & Descarbonização da Frota</h2>
          <p>
            Métricas de emissões de CO₂e no transporte, taxa de reciclagem/coprocessamento e compensação ambiental Ambipar.
          </p>
        </div>
      </div>

      <div className="mtr-summary-cards">
        <div className="summary-stat-box forest">
          <span className="stat-label">CO₂ Evitado no Ano</span>
          <span className="stat-number">192.8 ton</span>
          <span className="stat-sub">Via coprocessamento & reciclagem</span>
        </div>

        <div className="summary-stat-box cyan">
          <span className="stat-label">Taxa Média de Reciclagem</span>
          <span className="stat-number">82.1%</span>
          <span className="stat-sub">Resíduos reaproveitados</span>
        </div>

        <div className="summary-stat-box emerald">
          <span className="stat-label">Créditos Verdes Ambipar</span>
          <span className="stat-number">85.2 tCO₂e</span>
          <span className="stat-sub">Neutralização ativa</span>
        </div>
      </div>

      <div className="card-panel">
        <div className="panel-header">
          <h3>Evolução Mensal das Metas de Sustentabilidade</h3>
          <span className="badge-highlight">Série Histórica 2026</span>
        </div>

        <div className="table-responsive-wrapper">
          <table className="operational-table">
            <thead>
              <tr>
                <th>Mês / Exercício</th>
                <th>Emissões CO₂ (tCO₂e)</th>
                <th>Compensação Carbono</th>
                <th>Taxa de Reciclagem (%)</th>
                <th>Status da Meta</th>
              </tr>
            </thead>
            <tbody>
              {esgData.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.mes}</strong></td>
                  <td>{row.emissoes_co2} t</td>
                  <td><span className="text-emerald">{row.compensacao_carbono} t</span></td>
                  <td><strong>{row.reciclagem}%</strong></td>
                  <td>
                    <span className="badge badge-emerald">
                      <CheckCircle2 size={13} /> Meta Atingida
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
