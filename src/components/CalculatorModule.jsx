import React, { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Fuel, 
  Leaf, 
  ShieldAlert, 
  Layers, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function CalculatorModule() {
  const [activeTab, setActiveTab] = useState('frete');

  // Estado da Calculadora de Custo de Frete
  const [freightDistance, setFreightDistance] = useState(650);
  const [freightWeight, setFreightWeight] = useState(30);
  const [dieselPrice, setDieselPrice] = useState(6.19);
  const [kmPerLiter, setKmPerLiter] = useState(2.2);
  const [tollCost, setTollCost] = useState(380); // Pedágio
  const [driverDaily, setDriverDaily] = useState(250); // Diária do motorista
  const [maintenancePerKm, setMaintenancePerKm] = useState(0.85); // Pneus + manutenção por km
  const [marginPct, setMarginPct] = useState(20); // Margem de lucro (%)

  // Cálculos de Custo de Frete
  const fuelLiters = freightDistance > 0 && kmPerLiter > 0 ? freightDistance / kmPerLiter : 0;
  const fuelCost = fuelLiters * dieselPrice;
  const maintenanceCost = freightDistance * maintenancePerKm;
  const directOperationalCost = fuelCost + maintenanceCost + tollCost + driverDaily;
  const cpkOperational = freightDistance > 0 ? directOperationalCost / freightDistance : 0;
  const profitMarginAmount = directOperationalCost * (marginPct / 100);
  const suggestedFreightPrice = directOperationalCost + profitMarginAmount;
  const revenuePerKm = freightDistance > 0 ? suggestedFreightPrice / freightDistance : 0;

  // Estado da Verificação de Compatibilidade de Cargas Perigosas (ANTT 5998)
  const [hazardClassA, setHazardClassA] = useState('3');
  const [hazardClassB, setHazardClassB] = useState('8');

  // Matriz de segregação e incompatibilidade (ANTT)
  const hazardClasses = [
    { code: '2.1', label: 'Classe 2.1 - Gases Inflamáveis' },
    { code: '3', label: 'Classe 3 - Líquidos Inflamáveis' },
    { code: '4.1', label: 'Classe 4.1 - Sólidos Inflamáveis' },
    { code: '5.1', label: 'Classe 5.1 - Substâncias Oxidantes' },
    { code: '6.1', label: 'Classe 6.1 - Substâncias Tóxicas' },
    { code: '8', label: 'Classe 8 - Substâncias Corrosivas' },
    { code: '9', label: 'Classe 9 - Substâncias Perigosas Diversas' }
  ];

  const checkCompatibility = (a, b) => {
    if (a === b) return { allowed: true, text: 'Mesma classe de risco. Transporte conjunto permitido observando embalagens homologadas.' };
    // Regras de incompatibilidade crítica
    if ((a === '3' && b === '5.1') || (a === '5.1' && b === '3')) {
      return { allowed: false, text: 'PROIBIDO: Líquidos Inflamáveis e Substâncias Oxidantes reagem violentamente gerando risco de combustão espontânea!' };
    }
    if ((a === '2.1' && b === '5.1') || (a === '5.1' && b === '2.1')) {
      return { allowed: false, text: 'PROIBIDO: Gases inflamáveis e substâncias oxidantes não podem ser transportados no mesmo compartimento.' };
    }
    if ((a === '6.1' && b === '8') || (a === '8' && b === '6.1')) {
      return { allowed: 'warning', text: 'PERMITIDO COM RESTRIÇÃO: Requer separação física e embalagens estanques com retenção anti-vazamento.' };
    }
    return { allowed: true, text: 'PERMITIDO: Cargas compatíveis para transporte rodoviário conjunto conforme NBR 14619.' };
  };

  const compatibilityResult = checkCompatibility(hazardClassA, hazardClassB);

  return (
    <div className="module-view animate-fade-in" id="calculator-module-root">
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <Calculator size={16} />
            <span>ENGENHARIA LOGÍSTICA & FÓRMULAS</span>
          </div>
          <h2>Calculadoras Operacionais Avançadas</h2>
          <p>
            Formulação de preços de frete, decomposição de custos por quilômetro (CPK) e verificação de compatibilidade de cargas perigosas (ANTT).
          </p>
        </div>

        <div className="tab-pill-switcher">
          <button
            type="button"
            className={`switcher-btn ${activeTab === 'frete' ? 'active' : ''}`}
            onClick={() => setActiveTab('frete')}
          >
            Custos de Frete & CPK
          </button>
          <button
            type="button"
            className={`switcher-btn ${activeTab === 'antt' ? 'active' : ''}`}
            onClick={() => setActiveTab('antt')}
          >
            Compatibilidade ANTT (Hazmat)
          </button>
        </div>
      </div>

      {activeTab === 'frete' && (
        <div className="freight-calculator-grid animate-fade-in">
          {/* Parâmetros de Entrada */}
          <div className="card-panel">
            <div className="panel-header">
              <h3>Parâmetros da Operação</h3>
              <span className="badge-highlight">Dados da Rota</span>
            </div>

            <div className="calculator-inputs-grid">
              <div className="input-group-custom">
                <label>Distância Total Ida e Volta (km)</label>
                <input
                  type="number"
                  value={freightDistance}
                  onChange={(e) => setFreightDistance(Number(e.target.value))}
                  min="1"
                />
              </div>

              <div className="input-group-custom">
                <label>Peso da Carga (toneladas)</label>
                <input
                  type="number"
                  value={freightWeight}
                  onChange={(e) => setFreightWeight(Number(e.target.value))}
                  step="0.5"
                  min="0.5"
                />
              </div>

              <div className="input-group-custom">
                <label>Consumo Médio do Veículo (km/l)</label>
                <input
                  type="number"
                  value={kmPerLiter}
                  onChange={(e) => setKmPerLiter(Number(e.target.value))}
                  step="0.1"
                  min="0.5"
                />
              </div>

              <div className="input-group-custom">
                <label>Preço do Diesel S10 (R$/litro)</label>
                <input
                  type="number"
                  value={dieselPrice}
                  onChange={(e) => setDieselPrice(Number(e.target.value))}
                  step="0.05"
                  min="1"
                />
              </div>

              <div className="input-group-custom">
                <label>Pedágio Total Previsto (R$)</label>
                <input
                  type="number"
                  value={tollCost}
                  onChange={(e) => setTollCost(Number(e.target.value))}
                  min="0"
                />
              </div>

              <div className="input-group-custom">
                <label>Diária / Despesas Motorista (R$)</label>
                <input
                  type="number"
                  value={driverDaily}
                  onChange={(e) => setDriverDaily(Number(e.target.value))}
                  min="0"
                />
              </div>

              <div className="input-group-custom">
                <label>Manutenção + Pneus (R$/km)</label>
                <input
                  type="number"
                  value={maintenancePerKm}
                  onChange={(e) => setMaintenancePerKm(Number(e.target.value))}
                  step="0.05"
                  min="0"
                />
              </div>

              <div className="input-group-custom">
                <label>Margem Operacional Desejada (%)</label>
                <input
                  type="number"
                  value={marginPct}
                  onChange={(e) => setMarginPct(Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* DRE Operacional da Viagem / Cotação */}
          <div className="card-panel financial-breakdown-card">
            <div className="panel-header">
              <h3>Decomposição Financeira da Viagem</h3>
              <span className="badge-emerald-soft">Resultado em Tempo Real</span>
            </div>

            <div className="dre-lines-list">
              <div className="dre-line">
                <span>Combustível ({fuelLiters.toFixed(1)} L × R$ {dieselPrice}):</span>
                <strong>R$ {fuelCost.toFixed(2)}</strong>
              </div>
              <div className="dre-line">
                <span>Manutenção & Desgaste de Pneus:</span>
                <strong>R$ {maintenanceCost.toFixed(2)}</strong>
              </div>
              <div className="dre-line">
                <span>Pedágio (Eixos / Balança):</span>
                <strong>R$ {Number(tollCost).toFixed(2)}</strong>
              </div>
              <div className="dre-line">
                <span>Diária do Motorista & Alimentação:</span>
                <strong>R$ {Number(driverDaily).toFixed(2)}</strong>
              </div>

              <div className="dre-line subtotal">
                <span>Custo Operacional Direto (Custo Base):</span>
                <span className="highlight-val">R$ {directOperationalCost.toFixed(2)}</span>
              </div>

              <div className="dre-line">
                <span>Margem de Lucro da Operação ({marginPct}%):</span>
                <strong className="text-emerald">+ R$ {profitMarginAmount.toFixed(2)}</strong>
              </div>

              <div className="dre-line total-box">
                <div>
                  <span className="total-label">Preço Sugerido de Venda do Frete:</span>
                  <span className="total-val">R$ {suggestedFreightPrice.toFixed(2)}</span>
                </div>
                <div className="metric-chips">
                  <span className="chip">CPK: R$ {cpkOperational.toFixed(2)}/km</span>
                  <span className="chip emerald">Tarifa: R$ {revenuePerKm.toFixed(2)}/km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'antt' && (
        <div className="antt-compatibility-view animate-fade-in">
          <div className="card-panel">
            <div className="panel-header">
              <div className="header-icon-label">
                <ShieldAlert size={20} className="icon-amber" />
                <div>
                  <h3>Verificador de Incompatibilidade Química (Resolução ANTT 5998)</h3>
                  <p>Consulte antes de planejar o carregamento conjunto de resíduos ou cargas perigosas no mesmo caminhão</p>
                </div>
              </div>
            </div>

            <div className="grid-2-cols" style={{ marginTop: '1.5rem' }}>
              <div className="input-group-custom">
                <label>Produto / Resíduo A (Classe Primária)</label>
                <select
                  value={hazardClassA}
                  onChange={(e) => setHazardClassA(e.target.value)}
                  className="select-custom"
                >
                  {hazardClasses.map((h) => (
                    <option key={h.code} value={h.code}>{h.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group-custom">
                <label>Produto / Resíduo B (Carga Secundária)</label>
                <select
                  value={hazardClassB}
                  onChange={(e) => setHazardClassB(e.target.value)}
                  className="select-custom"
                >
                  {hazardClasses.map((h) => (
                    <option key={h.code} value={h.code}>{h.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`compatibility-result-banner ${compatibilityResult.allowed === false ? 'danger' : compatibilityResult.allowed === 'warning' ? 'warning' : 'success'}`}>
              <div className="result-icon">
                {compatibilityResult.allowed === false ? (
                  <AlertTriangle size={32} />
                ) : compatibilityResult.allowed === 'warning' ? (
                  <Info size={32} />
                ) : (
                  <CheckCircle2 size={32} />
                )}
              </div>
              <div>
                <h4>
                  {compatibilityResult.allowed === false 
                    ? 'INCOMPATIBILIDADE QUÍMICA DETECTADA' 
                    : compatibilityResult.allowed === 'warning'
                    ? 'TRANSPORTE REQUER ATENÇÃO E SEGREGAÇÃO'
                    : 'CARGAS COMPATÍVEIS PARA TRANSPORTE CONJUNTO'}
                </h4>
                <p>{compatibilityResult.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
