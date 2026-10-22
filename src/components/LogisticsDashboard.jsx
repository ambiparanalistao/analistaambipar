import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Fuel, 
  Leaf, 
  Clock, 
  Truck, 
  FileCheck2, 
  AlertCircle, 
  Calculator, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Info, 
  Filter, 
  Search, 
  ArrowRight, 
  ShieldAlert,
  Flame,
  Gauge
} from 'lucide-react';

export default function LogisticsDashboard({ user }) {
  const [period, setPeriod] = useState('mes');
  const [activeFormulaTab, setActiveFormulaTab] = useState('cpk');

  // Estado da Calculadora Rápida do Analista
  const [calcDistance, setCalcDistance] = useState(480);
  const [calcWeight, setCalcWeight] = useState(26.5);
  const [calcVehicleType, setCalcVehicleType] = useState('carreta_tanque');
  const [calcDieselPrice, setCalcDieselPrice] = useState(6.19);

  // Filtro da tabela de viagens
  const [tripFilter, setTripFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Coeficientes dos veículos para cálculos
  const vehicleSpecs = {
    carreta_tanque: { label: 'Carreta Tanque Químico (Resíduos Perigosos)', avgKmL: 2.3, costMultiplier: 1.35 },
    bitrem: { label: 'Bitrem Articulado 9 Eixos', avgKmL: 2.1, costMultiplier: 1.45 },
    truck_pesado: { label: 'Truck Pesado 6x2 (Baú / Sider)', avgKmL: 3.1, costMultiplier: 1.15 },
    vuc: { label: 'VUC Urbano (Coleta Fracionada)', avgKmL: 5.5, costMultiplier: 0.85 }
  };

  // Cálculos dinâmicos da calculadora rápida
  const selectedVehicle = vehicleSpecs[calcVehicleType];
  const estimatedLiters = calcDistance > 0 && selectedVehicle.avgKmL > 0 
    ? (calcDistance / selectedVehicle.avgKmL).toFixed(1) 
    : 0;
  const estimatedFuelCost = (estimatedLiters * calcDieselPrice).toFixed(2);
  const estimatedFreightCost = (calcDistance * (calcDieselPrice / selectedVehicle.avgKmL) * selectedVehicle.costMultiplier).toFixed(2);
  const costPerKm = calcDistance > 0 ? (estimatedFreightCost / calcDistance).toFixed(2) : 0;
  // Fator oficial GHG Protocol para Diesel Comercial: ~2.671 kg CO2e / Litro
  const carbonEmissionsKg = (estimatedLiters * 2.671).toFixed(1);
  const carbonTons = (carbonEmissionsKg / 1000).toFixed(3);
  // Estimativa de mudas da Mata Atlântica para neutralizar (~7 mudas por ton CO2)
  const treesNeeded = Math.ceil(carbonTons * 7);

  // Lista mockada representativa de viagens para a Torre de Controle da Ambipar
  const tripsData = [
    {
      id: 'AMB-TRIP-9041',
      mtrNumber: 'MTR-2026/0491-SP',
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
      slaEta: '14:30 (No Horário)'
    },
    {
      id: 'AMB-TRIP-9038',
      mtrNumber: 'MTR-2026/0488-RJ',
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
      slaEta: '11:15 (Finalizando)'
    },
    {
      id: 'AMB-TRIP-9035',
      mtrNumber: 'MTR-2026/0484-MG',
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
      statusLabel: 'Concluído & CDF Emitido',
      slaEta: 'Concluído às 09:40'
    },
    {
      id: 'AMB-TRIP-9031',
      mtrNumber: 'MTR-2026/0479-PR',
      vehiclePlate: 'AMB-2X11',
      vehicleType: 'Carreta Vácuo Químico',
      driver: 'Juliano Ferreira',
      wasteType: 'Solventes Residuais Clorados (Classe I)',
      onuCode: 'ONU 1993',
      origin: 'Polo Industrial Curitiba - PR',
      destination: 'Incinerador Especializado Araucária - PR',
      distanceKm: 65,
      weightTon: 22.0,
      status: 'alerta',
      statusLabel: 'Parada Preventiva',
      slaEta: 'Atraso de 40 min (Inspeção)'
    }
  ];

  const filteredTrips = tripsData.filter(trip => {
    const matchesFilter = tripFilter === 'all' || trip.status === tripFilter;
    const matchesSearch = 
      trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.wasteType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.mtrNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="logistics-dashboard animate-fade-in" id="logistics-dashboard-container">
      {/* Top Banner de Boas-Vindas e Indicadores Globais */}
      <div className="control-tower-banner">
        <div className="tower-header-text">
          <div className="tower-badge-live">
            <span className="live-dot"></span>
            <span>TORRE DE CONTROLE DE LOGÍSTICA & TRANSPORTE</span>
          </div>
          <h2>Painel Geral de Operações Ambipar</h2>
          <p>
            Monitoramento de frotas, movimentação de resíduos industriais perigosos (Classe I e II), controle de MTR e eficiência energética.
          </p>
        </div>

        <div className="period-selector-group">
          <span className="period-label">Período de Análise:</span>
          <div className="period-buttons">
            <button 
              type="button" 
              className={`period-btn ${period === 'hoje' ? 'active' : ''}`}
              onClick={() => setPeriod('hoje')}
            >
              Hoje
            </button>
            <button 
              type="button" 
              className={`period-btn ${period === 'semana' ? 'active' : ''}`}
              onClick={() => setPeriod('semana')}
            >
              Últimos 7d
            </button>
            <button 
              type="button" 
              className={`period-btn ${period === 'mes' ? 'active' : ''}`}
              onClick={() => setPeriod('mes')}
            >
              Mês Vigente
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal de KPIs Estratégicos com Fórmulas Integradas */}
      <div className="kpi-metrics-grid">
        {/* KPI 1: Custo por KM */}
        <div className="kpi-card" id="kpi-card-cpk">
          <div className="kpi-top">
            <span className="kpi-title">Custo Médio Operacional</span>
            <div className="kpi-icon-wrap emerald">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="currency-prefix">R$</span>
            <span className="val-number">6,85</span>
            <span className="unit-suffix">/ km</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Fórmula: Custo Total (R$) ÷ KM Rodados</code>
          </div>
          <div className="kpi-footer-status positive">
            <TrendingDown size={15} />
            <span>-3.4% vs meta prevista (R$ 7,10/km)</span>
          </div>
        </div>

        {/* KPI 2: Consumo Médio da Frota */}
        <div className="kpi-card" id="kpi-card-fuel">
          <div className="kpi-top">
            <span className="kpi-title">Eficiência de Combustível</span>
            <div className="kpi-icon-wrap cyan">
              <Fuel size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">2,84</span>
            <span className="unit-suffix">km / Litro</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Fórmula: KM Total ÷ Litros Diesel Consumidos</code>
          </div>
          <div className="kpi-footer-status positive">
            <TrendingUp size={15} />
            <span>+4.8% melhor que a média histórica</span>
          </div>
        </div>

        {/* KPI 3: Emissões de Carbono */}
        <div className="kpi-card" id="kpi-card-co2">
          <div className="kpi-top">
            <span className="kpi-title">Intensidade de Emissão GEE</span>
            <div className="kpi-icon-wrap forest">
              <Leaf size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">48,2</span>
            <span className="unit-suffix">tCO₂e</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Fórmula: (L Diesel × 2,671 kg CO₂) ÷ 1.000</code>
          </div>
          <div className="kpi-footer-status neutral">
            <Sparkles size={15} />
            <span>34% neutralizado com créditos Ambipar</span>
          </div>
        </div>

        {/* KPI 4: Pontualidade OTIF */}
        <div className="kpi-card" id="kpi-card-otif">
          <div className="kpi-top">
            <span className="kpi-title">Pontualidade nas Entregas (OTIF)</span>
            <div className="kpi-icon-wrap purple">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">96,8%</span>
            <span className="unit-suffix">SLA</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Fórmula: (Coletas no Prazo ÷ Total) × 100</code>
          </div>
          <div className="kpi-footer-status positive">
            <CheckCircle2 size={15} />
            <span>Meta corporativa batida (&gt; 95,0%)</span>
          </div>
        </div>
      </div>

      {/* Seção Dupla: Calculadora Rápida do Analista & Fórmulas Explicadas */}
      <div className="analytics-dual-section">
        {/* Lado Esquerdo: Simulador de Rotas & Fórmulas Operacionais */}
        <div className="card-panel quick-calculator-panel">
          <div className="panel-header">
            <div className="header-icon-label">
              <Calculator size={20} className="icon-emerald" />
              <div>
                <h3>Calculadora Operacional de Frete & Carbono</h3>
                <p>Simulação instantânea para cotação, consumo de diesel e pegada ambiental da rota</p>
              </div>
            </div>
          </div>

          <div className="calculator-inputs-grid">
            <div className="input-group-custom">
              <label htmlFor="calc-distance">Distância da Rota (KM Ida/Volta)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  id="calc-distance"
                  value={calcDistance}
                  onChange={(e) => setCalcDistance(Number(e.target.value))}
                  min="1"
                />
                <span className="unit-tag">km</span>
              </div>
            </div>

            <div className="input-group-custom">
              <label htmlFor="calc-weight">Carga Transportada (Toneladas)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  id="calc-weight"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(Number(e.target.value))}
                  step="0.5"
                  min="0.5"
                />
                <span className="unit-tag">ton</span>
              </div>
            </div>

            <div className="input-group-custom">
              <label htmlFor="calc-vehicle">Tipo de Equipamento / Veículo</label>
              <select
                id="calc-vehicle"
                value={calcVehicleType}
                onChange={(e) => setCalcVehicleType(e.target.value)}
                className="select-custom"
              >
                {Object.entries(vehicleSpecs).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label} (~{item.avgKmL} km/l)
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group-custom">
              <label htmlFor="calc-diesel">Preço Médio Diesel S10 (R$/L)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  id="calc-diesel"
                  value={calcDieselPrice}
                  onChange={(e) => setCalcDieselPrice(Number(e.target.value))}
                  step="0.05"
                  min="1"
                />
                <span className="unit-tag">R$/L</span>
              </div>
            </div>
          </div>

          {/* Resultados Calculados em Tempo Real */}
          <div className="calculator-results-box">
            <div className="result-stat-item">
              <span className="stat-label">Combustível Estimado:</span>
              <span className="stat-val highlight">{estimatedLiters} Litros</span>
              <small className="stat-sub">R$ {estimatedFuelCost} em Diesel</small>
            </div>

            <div className="result-stat-item">
              <span className="stat-label">Custo Base Sugerido:</span>
              <span className="stat-val emerald">R$ {estimatedFreightCost}</span>
              <small className="stat-sub">Média R$ {costPerKm} por KM</small>
            </div>

            <div className="result-stat-item">
              <span className="stat-label">Emissões de CO₂:</span>
              <span className="stat-val cyan">{carbonTons} tCO₂e</span>
              <small className="stat-sub">({carbonEmissionsKg} kg CO₂ emitidos)</small>
            </div>

            <div className="result-stat-item">
              <span className="stat-label">Neutralização ESG:</span>
              <span className="stat-val forest">{treesNeeded} mudas</span>
              <small className="stat-sub">para neutralizar a rota</small>
            </div>
          </div>
        </div>

        {/* Lado Direito: Glossário das Fórmulas de Transporte Utilizadas */}
        <div className="card-panel formulas-guide-panel">
          <div className="panel-header">
            <div className="header-icon-label">
              <Layers size={20} className="icon-cyan" />
              <div>
                <h3>Fórmulas & Métricas do Analista</h3>
                <p>Metodologias aplicadas na gestão de transporte e resíduos perigosos</p>
              </div>
            </div>
          </div>

          <div className="formula-tabs-nav">
            <button
              type="button"
              className={`formula-tab-btn ${activeFormulaTab === 'cpk' ? 'active' : ''}`}
              onClick={() => setActiveFormulaTab('cpk')}
            >
              CPK (Custo/km)
            </button>
            <button
              type="button"
              className={`formula-tab-btn ${activeFormulaTab === 'co2' ? 'active' : ''}`}
              onClick={() => setActiveFormulaTab('co2')}
            >
              Emissão GEE (CO₂)
            </button>
            <button
              type="button"
              className={`formula-tab-btn ${activeFormulaTab === 'tku' ? 'active' : ''}`}
              onClick={() => setActiveFormulaTab('tku')}
            >
              TKU (Ton × Km)
            </button>
            <button
              type="button"
              className={`formula-tab-btn ${activeFormulaTab === 'otif' ? 'active' : ''}`}
              onClick={() => setActiveFormulaTab('otif')}
            >
              OTIF (SLA)
            </button>
          </div>

          <div className="formula-content-display">
            {activeFormulaTab === 'cpk' && (
              <div className="formula-detail-card animate-fade-in">
                <h4>Custo por Quilômetro Rodado (CPK)</h4>
                <div className="math-formula-box">
                  <code>CPK = (Custos Fixos + Custos Variáveis) / KM Total Rodado</code>
                </div>
                <p className="formula-explanation">
                  O CPK avalia o impacto real da rota considerando combustível, pedágio, pneus, manutenção, seguro de carga perigosa e remuneração do motorista.
                </p>
                <div className="formula-variables-list">
                  <div className="variable-pill"><strong>Custo Fixo:</strong> IPVA, Salários, Seguro de Frota</div>
                  <div className="variable-pill"><strong>Custo Variável:</strong> Diesel S10, Pedágio, Desgaste de Pneus</div>
                </div>
              </div>
            )}

            {activeFormulaTab === 'co2' && (
              <div className="formula-detail-card animate-fade-in">
                <h4>Emissões de Gases de Efeito Estufa (Escopo 1 - GHG Protocol)</h4>
                <div className="math-formula-box">
                  <code>tCO₂e = (Litros Diesel × 2,671 kg CO₂/L) ÷ 1.000</code>
                </div>
                <p className="formula-explanation">
                  Fator referencial do Programa Brasileiro GHG Protocol para óleo diesel comercial com adição obrigatória de biodiesel. Permite a emissão do selo verde e certificação de destinação sustentável para o cliente da Ambipar.
                </p>
              </div>
            )}

            {activeFormulaTab === 'tku' && (
              <div className="formula-detail-card animate-fade-in">
                <h4>Tonelada-Quilômetro Útil (TKU)</h4>
                <div className="math-formula-box">
                  <code>TKU = Peso da Carga Líquida (t) × Distância Percorrida (km)</code>
                </div>
                <p className="formula-explanation">
                  Mede a produtividade real do transporte de resíduos industriais. Evita caminhões rodando com peso ocioso ou voltando vazios (otimização de rotas e logística reversa).
                </p>
              </div>
            )}

            {activeFormulaTab === 'otif' && (
              <div className="formula-detail-card animate-fade-in">
                <h4>On-Time In-Full (OTIF)</h4>
                <div className="math-formula-box">
                  <code>OTIF (%) = (Viagens 100% no Prazo e Sem Avarias / Total) × 100</code>
                </div>
                <p className="formula-explanation">
                  Garante a conformidade de coleta para que os clientes industriais não acumulem resíduos além da capacidade de armazenamento licenciada em seus pátios.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Board: Tabela de Viagens & Monitoramento Operacional */}
      <div className="card-panel live-board-panel">
        <div className="live-board-header">
          <div>
            <h3>Monitoramento Operacional de Cargas e Viagens</h3>
            <p>Acompanhamento de veículos em rota, status de MTRs e SLA de entrega</p>
          </div>

          <div className="table-controls-bar">
            {/* Campo de Busca Rápida */}
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por placa, MTR, resíduo, motorista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros de Status */}
            <div className="filter-pill-buttons">
              <button
                type="button"
                className={`filter-btn ${tripFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTripFilter('all')}
              >
                Todas ({tripsData.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${tripFilter === 'transito' ? 'active' : ''}`}
                onClick={() => setTripFilter('transito')}
              >
                Em Trânsito
              </button>
              <button
                type="button"
                className={`filter-btn ${tripFilter === 'descarga' ? 'active' : ''}`}
                onClick={() => setTripFilter('descarga')}
              >
                Descarregando
              </button>
              <button
                type="button"
                className={`filter-btn ${tripFilter === 'concluido' ? 'active' : ''}`}
                onClick={() => setTripFilter('concluido')}
              >
                Concluídas
              </button>
              <button
                type="button"
                className={`filter-btn ${tripFilter === 'alerta' ? 'active' : ''}`}
                onClick={() => setTripFilter('alerta')}
              >
                Alertas
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Viagens */}
        <div className="table-responsive-wrapper">
          <table className="operational-table" id="trips-monitoring-table">
            <thead>
              <tr>
                <th>Viagem / MTR</th>
                <th>Veículo & Placa</th>
                <th>Resíduo / Classe</th>
                <th>Origem & Destino</th>
                <th>Carga / KM</th>
                <th>Status Operacional</th>
                <th>SLA / Previsão</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-state">
                    Nenhuma viagem encontrada com os critérios informados.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className={`trip-row status-${trip.status}`}>
                    <td>
                      <div className="trip-id-block">
                        <strong>{trip.id}</strong>
                        <span className="mtr-tag">{trip.mtrNumber}</span>
                      </div>
                    </td>
                    <td>
                      <div className="vehicle-cell">
                        <span className="plate-badge">{trip.vehiclePlate}</span>
                        <span className="vehicle-type-label">{trip.vehicleType}</span>
                        <small className="driver-name">{trip.driver}</small>
                      </div>
                    </td>
                    <td>
                      <div className="waste-cell">
                        <span className="waste-name">{trip.wasteType}</span>
                        {trip.onuCode.includes('ONU') ? (
                          <span className="badge-onu">
                            <Flame size={12} /> {trip.onuCode}
                          </span>
                        ) : (
                          <span className="badge-non-hazard">Não Perigoso</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="route-cell">
                        <span className="route-point origin">{trip.origin}</span>
                        <ArrowRight size={14} className="route-arrow" />
                        <span className="route-point destination">{trip.destination}</span>
                      </div>
                    </td>
                    <td>
                      <div className="weight-km-cell">
                        <strong>{trip.weightTon} ton</strong>
                        <span className="km-text">{trip.distanceKm} km</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge-chip ${trip.status}`}>
                        {trip.status === 'transito' && <Truck size={14} />}
                        {trip.status === 'descarga' && <Layers size={14} />}
                        {trip.status === 'concluido' && <CheckCircle2 size={14} />}
                        {trip.status === 'alerta' && <AlertCircle size={14} />}
                        <span>{trip.statusLabel}</span>
                      </span>
                    </td>
                    <td>
                      <span className="sla-time-label">{trip.slaEta}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
