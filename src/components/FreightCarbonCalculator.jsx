import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Fuel, 
  Leaf, 
  Truck, 
  MapPin, 
  ShieldAlert, 
  Save, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Layers, 
  FileText, 
  Sparkles,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function FreightCarbonCalculator({ onNavigateMtr }) {
  // Parâmetros da Rota
  const [origin, setOrigin] = useState('Paulínia - SP (Polo Petroquímico)');
  const [destination, setDestination] = useState('Nova Odessa - SP (Unidade Ambipar)');
  const [distanceKm, setDistanceKm] = useState(450);
  const [roadType, setRoadType] = useState('dupla'); // 'dupla' | 'simples' | 'mista' | 'serra'
  const [tollCost, setTollCost] = useState(240); // Pedágio total em R$

  // Parâmetros da Carga e Equipamento
  const [cargoWeightTon, setCargoWeightTon] = useState(25.0);
  const [wasteClass, setWasteClass] = useState('Classe I - Perigosos');
  const [vehicleType, setVehicleType] = useState('carreta_tanque');
  const [fuelType, setFuelType] = useState('diesel_s10'); // 'diesel_s10' | 'diesel_b20' | 'hvo_verde' | 'gnv'
  const [dieselPrice, setDieselPrice] = useState(6.19);
  const [customKmL, setCustomKmL] = useState(2.3);

  // Parâmetros Financeiros e Operacionais
  const [driverDaily, setDriverDaily] = useState(280); // Diária motorista MOPP + alimentação
  const [maintenancePerKm, setMaintenancePerKm] = useState(0.85); // Pneus + manutenção por km
  const [insuranceCost, setInsuranceCost] = useState(150); // Seguro ambiental e de carga
  const [marginPct, setMarginPct] = useState(22); // Margem de lucro desejada (%)

  // Histórico de Simulações Salvas (Persistência real no localStorage)
  const [savedSimulations, setSavedSimulations] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_freight_simulations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_freight_simulations', JSON.stringify(savedSimulations));
    } catch (e) {
      console.warn('Erro ao salvar simulações:', e);
    }
  }, [savedSimulations]);

  // Perfis técnicos de veículos
  const vehicleOptions = {
    carreta_tanque: { label: 'Carreta Tanque Inox Químico (Resíduos Perigosos)', baseKmL: 2.3, axles: 6 },
    bitrem_articulado: { label: 'Bitrem Articulado 9 Eixos (Carga Granel/Sólidos)', baseKmL: 2.1, axles: 9 },
    truck_sider: { label: 'Truck Sider 6x2 (Tambores / IBCs)', baseKmL: 3.1, axles: 3 },
    vacuo_quimico: { label: 'Vácuo Químico Pesado (Lodos e ETE)', baseKmL: 2.0, axles: 4 },
    vuc_coleta: { label: 'VUC Urbano (Fracionado / Laboratorial)', baseKmL: 5.5, axles: 2 }
  };

  // Coeficientes de emissão (kg CO2e por unidade de combustível)
  const fuelEmissionFactors = {
    diesel_s10: { label: 'Diesel S10 Fóssil (com B14)', factor: 2.671, unit: 'L' },
    diesel_b20: { label: 'Diesel B20 (20% Biodiesel)', factor: 2.410, unit: 'L' },
    hvo_verde: { label: 'Diesel Verde Renovável (HVO)', factor: 0.534, unit: 'L' }, // ~80% redução
    gnv: { label: 'Gás Natural Veicular (GNV)', factor: 1.980, unit: 'm³' }
  };

  // Atualiza consumo base quando veículo muda
  const handleVehicleChange = (vType) => {
    setVehicleType(vType);
    setCustomKmL(vehicleOptions[vType].baseKmL);
  };

  // --- CÁLCULOS TÉCNICOS OPERACIONAIS ---
  const validDistance = Math.max(1, Number(distanceKm) || 1);
  const validKmL = Math.max(0.5, Number(customKmL) || 1);

  // Fator de correção de relevo/topografia
  const roadFactor = roadType === 'serra' ? 1.25 : roadType === 'ondulada' ? 1.10 : roadType === 'simples' ? 1.05 : 1.0;
  const adjustedKmL = Math.max(0.5, validKmL / roadFactor);

  // Combustível e Arla 32
  const fuelLiters = validDistance / adjustedKmL;
  const fuelTotalCost = fuelLiters * (Number(dieselPrice) || 6.19);
  // Consumo Arla 32 é aprox 5% do consumo de diesel @ R$ 3,80/L
  const arla32Liters = fuelLiters * 0.05;
  const arla32Cost = arla32Liters * 3.80;

  // Custos Diretos
  const maintenanceTotal = validDistance * (Number(maintenancePerKm) || 0.85);
  const tollsTotal = Number(tollCost) || 0;
  const driverTotal = Number(driverDaily) || 0;
  const insuranceTotal = Number(insuranceCost) || 0;

  const directOperationalCost = fuelTotalCost + arla32Cost + maintenanceTotal + tollsTotal + driverTotal + insuranceTotal;
  const cpkOperational = directOperationalCost / validDistance;

  // Margem e Preço Sugerido de Venda
  const profitMarginAmount = directOperationalCost * ((Number(marginPct) || 0) / 100);
  const suggestedSellingPrice = directOperationalCost + profitMarginAmount;
  const freightTariffPerKm = suggestedSellingPrice / validDistance;
  const pricePerTon = cargoWeightTon > 0 ? suggestedSellingPrice / Number(cargoWeightTon) : 0;

  // --- CÁLCULOS ESG & DESCARBONIZAÇÃO (GHG PROTOCOL) ---
  const currentFuelFactor = fuelEmissionFactors[fuelType].factor;
  const totalCarbonKg = fuelLiters * currentFuelFactor;
  const totalCarbonTons = totalCarbonKg / 1000;
  // Intensidade de carbono por tonelada-quilômetro (TKU)
  const tku = validDistance * (Number(cargoWeightTon) || 1);
  const carbonIntensityGramPerTku = tku > 0 ? (totalCarbonKg * 1000) / tku : 0;
  // Mudas de árvores nativas para neutralizar (1 muda compensa ~140 kg CO2 ao longo de 20 anos -> ~7 mudas por ton CO2)
  const treesNeeded = Math.ceil(totalCarbonTons * 7);

  // Comparativo com HVO / Diesel Verde
  const carbonWithHvoKg = fuelLiters * fuelEmissionFactors.hvo_verde.factor;
  const carbonSavedWithHvoTon = Math.max(0, (totalCarbonKg - carbonWithHvoKg) / 1000);

  // Salvar Simulação
  const handleSaveSimulation = () => {
    const sim = {
      id: `SIM-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('pt-BR'),
      origin,
      destination,
      distanceKm: validDistance,
      cargoWeightTon,
      wasteClass,
      vehicleTypeLabel: vehicleOptions[vehicleType].label,
      fuelTypeLabel: fuelEmissionFactors[fuelType].label,
      directCost: directOperationalCost.toFixed(2),
      sellingPrice: suggestedSellingPrice.toFixed(2),
      cpk: cpkOperational.toFixed(2),
      carbonTons: totalCarbonTons.toFixed(3),
      treesNeeded
    };

    setSavedSimulations([sim, ...savedSimulations]);
    setNotification({ type: 'success', text: `Simulação ${sim.id} salva com sucesso no histórico!` });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLoadSimulation = (sim) => {
    setOrigin(sim.origin);
    setDestination(sim.destination);
    setDistanceKm(sim.distanceKm);
    setCargoWeightTon(sim.cargoWeightTon);
    setWasteClass(sim.wasteClass);
    setNotification({ type: 'info', text: `Parâmetros da simulação ${sim.id} recarregados nos campos!` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja limpar todo o histórico de simulações salvas?')) {
      setSavedSimulations([]);
      localStorage.removeItem('ambipar_freight_simulations');
    }
  };

  return (
    <div className="module-view animate-fade-in" id="freight-calculator-module">
      {/* Cabeçalho do Módulo */}
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <Calculator size={16} />
            <span>ENGENHARIA OPERACIONAL & SIMULAÇÃO TÉCNICA</span>
          </div>
          <h2>Calculadora Avançada de Frete & Carbono</h2>
          <p>
            Cotação analítica de viagens, decomposição completa de custos (DRE), formação de preço de frete e balanço de emissões GEE (GHG Protocol).
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={() => window.print()}
            title="Imprimir ou gerar PDF da cotação técnica"
          >
            <Printer size={16} />
            <span>Exportar Proposta / PDF</span>
          </button>

          <button
            type="button"
            className="btn-primary btn-icon-text"
            onClick={handleSaveSimulation}
            id="save-simulation-btn"
          >
            <Save size={16} />
            <span>Salvar no Histórico</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type} animate-fade-in`} style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={18} />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Grid de Configuração: 3 Colunas com Parâmetros Profissionais */}
      <div className="calculator-parameters-grid">
        {/* Card 1: Rota e Trajeto */}
        <div className="card-panel">
          <div className="panel-header">
            <div className="header-icon-label">
              <MapPin size={18} className="icon-emerald" />
              <h4>1. Rota & Trajeto Rodoviário</h4>
            </div>
          </div>

          <div className="input-group-custom" style={{ marginBottom: '0.85rem' }}>
            <label>Ponto de Origem (Coleta)</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ex: Polo Petroquímico Paulínia"
            />
          </div>

          <div className="input-group-custom" style={{ marginBottom: '0.85rem' }}>
            <label>Destino (Destinação / Pátio Ambipar)</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ex: Forno Coprocessamento Cimento"
            />
          </div>

          <div className="grid-2-cols" style={{ marginBottom: '0.85rem' }}>
            <div className="input-group-custom">
              <label>Distância Total (Ida/Volta km)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                />
                <span className="unit-tag">km</span>
              </div>
            </div>

            <div className="input-group-custom">
              <label>Pedágios Totais da Rota</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  value={tollCost}
                  onChange={(e) => setTollCost(Number(e.target.value))}
                />
                <span className="unit-tag">R$</span>
              </div>
            </div>
          </div>

          <div className="input-group-custom">
            <label>Topografia / Tipo de Via</label>
            <select
              value={roadType}
              onChange={(e) => setRoadType(e.target.value)}
              className="select-custom"
            >
              <option value="plana">Pista Dupla / Relevo Plano (Consumo Padrão)</option>
              <option value="dupla">Pista Dupla Rodovias Concedidas (+0% impacto)</option>
              <option value="ondulada">Pista Ondulada / Tráfego Intenso (+10% consumo)</option>
              <option value="serra">Trecho de Serra / Aclives Fortes (+25% consumo)</option>
            </select>
          </div>
        </div>

        {/* Card 2: Equipamento, Carga e Combustível */}
        <div className="card-panel">
          <div className="panel-header">
            <div className="header-icon-label">
              <Truck size={18} className="icon-cyan" />
              <h4>2. Veículo, Carga & Combustível</h4>
            </div>
          </div>

          <div className="input-group-custom" style={{ marginBottom: '0.85rem' }}>
            <label>Tipo de Equipamento / Frota</label>
            <select
              value={vehicleType}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="select-custom"
            >
              {Object.entries(vehicleOptions).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2-cols" style={{ marginBottom: '0.85rem' }}>
            <div className="input-group-custom">
              <label>Carga Transportada</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={cargoWeightTon}
                  onChange={(e) => setCargoWeightTon(Number(e.target.value))}
                />
                <span className="unit-tag">ton</span>
              </div>
            </div>

            <div className="input-group-custom">
              <label>Classificação do Resíduo</label>
              <select
                value={wasteClass}
                onChange={(e) => setWasteClass(e.target.value)}
                className="select-custom"
              >
                <option value="Classe I - Perigosos">Classe I (Perigoso)</option>
                <option value="Classe II A - Não Inertes">Classe II A (Não Inerte)</option>
                <option value="Classe II B - Inertes">Classe II B (Inerte)</option>
                <option value="Químico Puro / Granel">Químico Puro (Matéria-prima)</option>
              </select>
            </div>
          </div>

          <div className="grid-2-cols">
            <div className="input-group-custom">
              <label>Matriz de Combustível</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="select-custom"
              >
                {Object.entries(fuelEmissionFactors).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group-custom">
              <label>Preço Combustível (R$/L)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={dieselPrice}
                  onChange={(e) => setDieselPrice(Number(e.target.value))}
                />
                <span className="unit-tag">R$/L</span>
              </div>
            </div>
          </div>

          <div className="input-group-custom" style={{ marginTop: '0.85rem' }}>
            <label>Consumo Base Homologado do Cavalo (km/L)</label>
            <div className="input-with-unit">
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={customKmL}
                onChange={(e) => setCustomKmL(Number(e.target.value))}
              />
              <span className="unit-tag">km/L</span>
            </div>
          </div>
        </div>

        {/* Card 3: Custos Diretos e Margem */}
        <div className="card-panel">
          <div className="panel-header">
            <div className="header-icon-label">
              <DollarSign size={18} className="icon-emerald" />
              <h4>3. Custos Fixos & Margem Comercial</h4>
            </div>
          </div>

          <div className="grid-2-cols" style={{ marginBottom: '0.85rem' }}>
            <div className="input-group-custom">
              <label>Diária Motorista MOPP</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  value={driverDaily}
                  onChange={(e) => setDriverDaily(Number(e.target.value))}
                />
                <span className="unit-tag">R$</span>
              </div>
            </div>

            <div className="input-group-custom">
              <label>Pneus & Manutenção (R$/km)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={maintenancePerKm}
                  onChange={(e) => setMaintenancePerKm(Number(e.target.value))}
                />
                <span className="unit-tag">R$/km</span>
              </div>
            </div>
          </div>

          <div className="input-group-custom" style={{ marginBottom: '0.85rem' }}>
            <label>Seguro Ambiental Ambipar / RCTR-C (R$)</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="0"
                value={insuranceCost}
                onChange={(e) => setInsuranceCost(Number(e.target.value))}
              />
              <span className="unit-tag">R$</span>
            </div>
          </div>

          <div className="input-group-custom">
            <label>Margem Operacional de Lucro (%)</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="0"
                max="100"
                value={marginPct}
                onChange={(e) => setMarginPct(Number(e.target.value))}
              />
              <span className="unit-tag">%</span>
            </div>
            <small style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
              Lucro líquido operacional sobre os custos da viagem
            </small>
          </div>
        </div>
      </div>

      {/* Seção Principal de Resultados: DRE de Cotação + Painel ESG */}
      <div className="analytics-dual-section" style={{ marginTop: '1.5rem' }}>
        {/* Lado Esquerdo: Decomposição Financeira (DRE) */}
        <div className="card-panel financial-breakdown-card">
          <div className="panel-header">
            <div>
              <h3>Demonstrativo de Resultado da Viagem (DRE)</h3>
              <p>Formação do Custo por KM (CPK) e Preço de Venda do Frete</p>
            </div>
            <span className="badge-emerald-soft">Cotação Operacional</span>
          </div>

          <div className="dre-lines-list">
            <div className="dre-line">
              <span>Combustível ({fuelLiters.toFixed(1)} L a R$ {dieselPrice}):</span>
              <strong>R$ {fuelTotalCost.toFixed(2)}</strong>
            </div>

            <div className="dre-line">
              <span>Arla 32 ({arla32Liters.toFixed(1)} L para controle de emissões):</span>
              <strong>R$ {arla32Cost.toFixed(2)}</strong>
            </div>

            <div className="dre-line">
              <span>Manutenção & Desgaste de Pneus (R$ {maintenancePerKm}/km):</span>
              <strong>R$ {maintenanceTotal.toFixed(2)}</strong>
            </div>

            <div className="dre-line">
              <span>Praças de Pedágio Rodoviário:</span>
              <strong>R$ {tollsTotal.toFixed(2)}</strong>
            </div>

            <div className="dre-line">
              <span>Remuneração, Diária e Alimentação do Motorista:</span>
              <strong>R$ {driverTotal.toFixed(2)}</strong>
            </div>

            <div className="dre-line">
              <span>Seguro de Carga Perigosa & PAE Ambipar Response:</span>
              <strong>R$ {insuranceTotal.toFixed(2)}</strong>
            </div>

            <div className="dre-line subtotal">
              <span>CUSTO OPERACIONAL TOTAL DA VIAGEM:</span>
              <span className="highlight-val">R$ {directOperationalCost.toFixed(2)}</span>
            </div>

            <div className="dre-line">
              <span>Margem de Lucro Comercial ({marginPct}%):</span>
              <strong className="text-emerald">+ R$ {profitMarginAmount.toFixed(2)}</strong>
            </div>

            <div className="dre-line total-box">
              <div>
                <span className="total-label">Preço Sugerido de Venda da Viagem:</span>
                <span className="total-val">R$ {suggestedSellingPrice.toFixed(2)}</span>
              </div>
              <div className="metric-chips">
                <span className="chip">CPK: R$ {cpkOperational.toFixed(2)}/km</span>
                <span className="chip emerald">Tarifa: R$ {freightTariffPerKm.toFixed(2)}/km</span>
                <span className="chip">R$ {pricePerTon.toFixed(2)} / ton</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Balanço de Carbono & Sustentabilidade ESG */}
        <div className="card-panel esg-carbon-report-card">
          <div className="panel-header">
            <div>
              <h3>Balanço de Carbono & ESG (GHG Protocol)</h3>
              <p>Inventário de emissões Escopo 1 e certificação Ambipar</p>
            </div>
            <span className="badge-highlight">Sustentabilidade</span>
          </div>

          <div className="carbon-kpi-highlight-box">
            <div className="carbon-kpi-item">
              <span className="carbon-label">Emissão Total Estimada:</span>
              <span className="carbon-value cyan">{totalCarbonTons.toFixed(3)} tCO₂e</span>
              <small className="carbon-sub">({totalCarbonKg.toFixed(1)} kg de CO₂ equivalente)</small>
            </div>

            <div className="carbon-kpi-item">
              <span className="carbon-label">Intensidade Carbônica:</span>
              <span className="carbon-value highlight">{carbonIntensityGramPerTku.toFixed(1)} g CO₂ / t.km</span>
              <small className="carbon-sub">TKU: {tku.toLocaleString('pt-BR')} ton.km</small>
            </div>
          </div>

          <div className="offset-solution-card">
            <div className="offset-icon-wrap">
              <Leaf size={28} />
            </div>
            <div>
              <h4>Neutralização com Créditos Verdes Ambipar</h4>
              <p>
                Para neutralizar esta viagem de resíduos, são recomendadas <strong>{treesNeeded} mudas de árvores nativas</strong> em projetos de reflorestamento e restauração ecológica Ambipar.
              </p>
            </div>
          </div>

          {fuelType !== 'hvo_verde' && (
            <div className="eco-fuel-advantage-box">
              <Sparkles size={20} className="text-emerald" />
              <div>
                <strong>Oportunidade de Descarbonização:</strong>
                <p>
                  Ao adotar <strong>Diesel Verde Renovável (HVO)</strong> nesta rota, sua empresa deixará de emitir <strong>{carbonSavedWithHvoTon.toFixed(2)} toneladas de CO₂</strong> (redução imediata de até 80%).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Simulações Salvas */}
      <div className="card-panel" style={{ marginTop: '2rem' }}>
        <div className="panel-header">
          <div>
            <h3>Histórico de Simulações de Frete Realizadas</h3>
            <p>Cotações salvas pela sua equipe técnica para consulta e reutilização rápida</p>
          </div>
          {savedSimulations.length > 0 && (
            <button
              type="button"
              className="btn-danger btn-icon-text"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
              onClick={handleClearHistory}
            >
              Limpar Histórico
            </button>
          )}
        </div>

        <div className="table-responsive-wrapper">
          <table className="operational-table">
            <thead>
              <tr>
                <th>Código / Data</th>
                <th>Trajeto (Origem ➔ Destino)</th>
                <th>Distância / Carga</th>
                <th>Equipamento</th>
                <th>Custo Total</th>
                <th>Preço Venda (Frete)</th>
                <th>Emissão GEE</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {savedSimulations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-state">
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                      Nenhuma simulação salva no histórico ainda.
                    </p>
                    <span style={{ fontSize: '0.85rem' }}>
                      Ajuste os parâmetros nos campos acima e clique em <strong>"Salvar no Histórico"</strong> para arquivar suas cotações.
                    </span>
                  </td>
                </tr>
              ) : (
                savedSimulations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.id}</strong>
                      <small style={{ display: 'block', color: 'var(--text-dim)' }}>{item.date}</small>
                    </td>
                    <td>
                      <div className="route-cell">
                        <span className="route-point origin">{item.origin}</span>
                        <ArrowRight size={13} className="route-arrow" />
                        <span className="route-point destination">{item.destination}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{item.distanceKm} km</strong>
                      <small style={{ display: 'block', color: 'var(--text-muted)' }}>{item.cargoWeightTon} ton ({item.wasteClass})</small>
                    </td>
                    <td>
                      <small>{item.vehicleTypeLabel}</small>
                    </td>
                    <td>
                      <span>R$ {item.directCost}</span>
                      <small style={{ display: 'block', color: 'var(--text-dim)' }}>CPK: R$ {item.cpk}/km</small>
                    </td>
                    <td>
                      <strong className="text-emerald" style={{ fontSize: '1rem' }}>R$ {item.sellingPrice}</strong>
                    </td>
                    <td>
                      <span className="text-cyan">{item.carbonTons} tCO₂e</span>
                      <small style={{ display: 'block', color: '#4ade80' }}>{item.treesNeeded} mudas</small>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        onClick={() => handleLoadSimulation(item)}
                      >
                        Carregar
                      </button>
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
