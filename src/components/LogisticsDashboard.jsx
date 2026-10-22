import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Fuel, 
  Leaf, 
  Clock, 
  FileCheck2, 
  Calculator, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Search, 
  ArrowRight, 
  Flame,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function LogisticsDashboard({ user }) {
  const [activeFormulaTab, setActiveFormulaTab] = useState('cpk');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado da Calculadora Operacional do Analista (Ferramenta de cálculo de rota)
  const [calcDistance, setCalcDistance] = useState(450);
  const [calcWeight, setCalcWeight] = useState(25.0);
  const [calcVehicleType, setCalcVehicleType] = useState('carreta_tanque');
  const [calcDieselPrice, setCalcDieselPrice] = useState(6.19);
  const [searchTerm, setSearchTerm] = useState('');

  // Busca dados reais gravados no Supabase
  const loadRealData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('registros_residuos')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setRecords(data);
        } else {
          setRecords([]);
        }
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  // Coeficientes dos veículos para cálculos operacionais
  const vehicleSpecs = {
    carreta_tanque: { label: 'Carreta Tanque Químico (Resíduos Perigosos)', avgKmL: 2.3, costMultiplier: 1.35 },
    bitrem: { label: 'Bitrem Articulado 9 Eixos', avgKmL: 2.1, costMultiplier: 1.45 },
    truck_pesado: { label: 'Truck Pesado 6x2 (Baú / Sider)', avgKmL: 3.1, costMultiplier: 1.15 },
    vuc: { label: 'VUC Urbano (Coleta Fracionada)', avgKmL: 5.5, costMultiplier: 0.85 }
  };

  // Cálculos dinâmicos da calculadora
  const selectedVehicle = vehicleSpecs[calcVehicleType];
  const estimatedLiters = calcDistance > 0 && selectedVehicle.avgKmL > 0 
    ? (calcDistance / selectedVehicle.avgKmL).toFixed(1) 
    : 0;
  const estimatedFuelCost = (estimatedLiters * calcDieselPrice).toFixed(2);
  const estimatedFreightCost = (calcDistance * (calcDieselPrice / selectedVehicle.avgKmL) * selectedVehicle.costMultiplier).toFixed(2);
  const costPerKm = calcDistance > 0 ? (estimatedFreightCost / calcDistance).toFixed(2) : 0;
  const carbonEmissionsKg = (estimatedLiters * 2.671).toFixed(1);
  const carbonTons = (carbonEmissionsKg / 1000).toFixed(3);
  const treesNeeded = Math.ceil(carbonTons * 7);

  // Métricas apuradas a partir dos dados reais do banco
  const totalKgReal = records.reduce((acc, curr) => acc + (Number(curr.quantidade_kg) || 0), 0);
  const totalTonReal = (totalKgReal / 1000).toFixed(2);
  const totalMtrsReal = records.length;
  const totalClasseI = records.filter(r => r.classe?.includes('Classe I')).length;
  const totalClasseII = records.filter(r => !r.classe?.includes('Classe I')).length;

  // Filtragem da tabela com dados reais
  const filteredRecords = records.filter(r => {
    const s = searchTerm.toLowerCase();
    return (
      (r.empresa_origem && r.empresa_origem.toLowerCase().includes(s)) ||
      (r.tipo_residuo && r.tipo_residuo.toLowerCase().includes(s)) ||
      (r.classe && r.classe.toLowerCase().includes(s)) ||
      (r.destinacao_final && r.destinacao_final.toLowerCase().includes(s))
    );
  });

  return (
    <div className="logistics-dashboard animate-fade-in" id="logistics-dashboard-container">
      {/* Top Banner de Boas-Vindas */}
      <div className="control-tower-banner">
        <div className="tower-header-text">
          <div className="tower-badge-live">
            <span className="live-dot"></span>
            <span>TORRE DE CONTROLE DE LOGÍSTICA & TRANSPORTE</span>
          </div>
          <h2>Painel Geral de Operações Ambipar</h2>
          <p>
            Métricas reais apuradas a partir do banco de dados PostgreSQL do Supabase e simuladores de rotas e custos.
          </p>
        </div>

        <button 
          type="button" 
          className="btn-secondary btn-icon-text"
          onClick={loadRealData}
          disabled={loading}
          title="Recarregar dados do banco"
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Sincronizar Banco</span>
        </button>
      </div>

      {/* Grid Principal de KPIs com dados REAIS do Banco */}
      <div className="kpi-metrics-grid">
        {/* KPI 1: Volume Real */}
        <div className="kpi-card" id="kpi-card-volume">
          <div className="kpi-top">
            <span className="kpi-title">Volume Total Movimentado</span>
            <div className="kpi-icon-wrap emerald">
              <Layers size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalTonReal}</span>
            <span className="unit-suffix">toneladas</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Fonte: Soma real da tabela registros_residuos</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>{totalKgReal.toLocaleString('pt-BR')} kg apurados no Supabase</span>
          </div>
        </div>

        {/* KPI 2: Total de MTRs */}
        <div className="kpi-card" id="kpi-card-mtrs">
          <div className="kpi-top">
            <span className="kpi-title">Manifestos Registrados</span>
            <div className="kpi-icon-wrap cyan">
              <FileCheck2 size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalMtrsReal}</span>
            <span className="unit-suffix">MTRs</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Fonte: Total de registros_residuos cadastrados</code>
          </div>
          <div className="kpi-footer-status neutral">
            <span>{totalMtrsReal > 0 ? 'Conformidade ativa com SINIR' : 'Aguardando cadastro no banco'}</span>
          </div>
        </div>

        {/* KPI 3: Resíduos Classe I Perigosos */}
        <div className="kpi-card" id="kpi-card-classe1">
          <div className="kpi-top">
            <span className="kpi-title">Resíduos Classe I (Perigosos)</span>
            <div className="kpi-icon-wrap forest">
              <Flame size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalClasseI}</span>
            <span className="unit-suffix">cargas</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Filtro: classe = 'Classe I - Perigosos'</code>
          </div>
          <div className="kpi-footer-status neutral">
            <span>Tratamento e transporte prioritário homologado</span>
          </div>
        </div>

        {/* KPI 4: Resíduos Classe II */}
        <div className="kpi-card" id="kpi-card-classe2">
          <div className="kpi-top">
            <span className="kpi-title">Resíduos Classe II (Não Perigosos)</span>
            <div className="kpi-icon-wrap purple">
              <Leaf size={20} />
            </div>
          </div>
          <div className="kpi-main-val">
            <span className="val-number">{totalClasseII}</span>
            <span className="unit-suffix">cargas</span>
          </div>
          <div className="kpi-formula-tag">
            <code>Filtro: classe = 'Classe II A / II B'</code>
          </div>
          <div className="kpi-footer-status positive">
            <span>Reaproveitamento & Coprocessamento</span>
          </div>
        </div>
      </div>

      {/* Seção Dupla: Calculadora Operacional & Fórmulas Explicadas */}
      <div className="analytics-dual-section">
        {/* Calculadora Operacional */}
        <div className="card-panel quick-calculator-panel">
          <div className="panel-header">
            <div className="header-icon-label">
              <Calculator size={20} className="icon-emerald" />
              <div>
                <h3>Calculadora Operacional de Frete & Carbono</h3>
                <p>Simulação técnica por rota: calcule consumo de diesel, custo sugerido e emissões de CO₂</p>
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
              <label htmlFor="calc-weight">Carga a Transportar (Toneladas)</label>
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
              <label htmlFor="calc-diesel">Preço Diesel S10 (R$/L)</label>
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

          {/* Resultados Calculados */}
          <div className="calculator-results-box">
            <div className="result-stat-item">
              <span className="stat-label">Diesel Estimado:</span>
              <span className="stat-val highlight">{estimatedLiters} L</span>
              <small className="stat-sub">R$ {estimatedFuelCost}</small>
            </div>

            <div className="result-stat-item">
              <span className="stat-label">Custo Base Sugerido:</span>
              <span className="stat-val emerald">R$ {estimatedFreightCost}</span>
              <small className="stat-sub">R$ {costPerKm}/km</small>
            </div>

            <div className="result-stat-item">
              <span className="stat-label">Emissão CO₂:</span>
              <span className="stat-val cyan">{carbonTons} tCO₂e</span>
              <small className="stat-sub">{carbonEmissionsKg} kg CO₂</small>
            </div>

            <div className="result-stat-item">
              <span className="stat-label">Compensação:</span>
              <span className="stat-val forest">{treesNeeded} mudas</span>
              <small className="stat-sub">para neutralizar</small>
            </div>
          </div>
        </div>

        {/* Fórmulas Explicadas */}
        <div className="card-panel formulas-guide-panel">
          <div className="panel-header">
            <div className="header-icon-label">
              <Layers size={20} className="icon-cyan" />
              <div>
                <h3>Fórmulas do Analista de Logística</h3>
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
              </div>
            )}

            {activeFormulaTab === 'co2' && (
              <div className="formula-detail-card animate-fade-in">
                <h4>Emissões de Gases de Efeito Estufa (Escopo 1 - GHG Protocol)</h4>
                <div className="math-formula-box">
                  <code>tCO₂e = (Litros Diesel × 2,671 kg CO₂/L) ÷ 1.000</code>
                </div>
                <p className="formula-explanation">
                  Fator oficial do Programa Brasileiro GHG Protocol para óleo diesel comercial com adição obrigatória de biodiesel.
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
                  Mede a produtividade real do transporte de resíduos industriais. Evita caminhões rodando com peso ocioso ou voltando vazios.
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
                  Garante a conformidade de coleta para que os clientes industriais não acumulem resíduos além da capacidade permitida em suas licenças ambientais.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Dados Reais do Banco de Dados */}
      <div className="card-panel live-board-panel">
        <div className="live-board-header">
          <div>
            <h3>Registros Reais de Resíduos e Transportes</h3>
            <p>Consultados em tempo real na tabela <code>registros_residuos</code> do Supabase</p>
          </div>

          <div className="table-controls-bar">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Filtrar por gerador, resíduo, destinação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="operational-table" id="trips-monitoring-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Gerador (Origem)</th>
                <th>Tipo de Resíduo</th>
                <th>Classificação</th>
                <th>Quantidade (KG / Ton)</th>
                <th>Destinação Final</th>
                <th>Transportador</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    <span className="spinner"></span>
                    <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Consultando banco PostgreSQL...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-state">
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      Nenhum registro de resíduo cadastrado no banco de dados.
                    </p>
                    <span style={{ fontSize: '0.85rem' }}>
                      Acesse a aba <strong>"MTR & Destinação Resíduos"</strong> no menu lateral para registrar os primeiros dados reais da sua operação.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="date-tag">
                        {r.data_descarte ? new Date(r.data_descarte).toLocaleDateString('pt-BR') : 'Hoje'}
                      </span>
                    </td>
                    <td>
                      <strong>{r.empresa_origem}</strong>
                    </td>
                    <td>{r.tipo_residuo}</td>
                    <td>
                      <span className={`badge-class ${r.classe?.includes('Classe I') ? 'hazard' : 'inert'}`}>
                        {r.classe}
                      </span>
                    </td>
                    <td>
                      <strong>{(Number(r.quantidade_kg) || 0).toLocaleString('pt-BR')} kg</strong>
                      <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                        {((Number(r.quantidade_kg) || 0) / 1000).toFixed(2)} t
                      </small>
                    </td>
                    <td>{r.destinacao_final}</td>
                    <td>
                      <small>{r.transportador || 'Ambipar'}</small>
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
