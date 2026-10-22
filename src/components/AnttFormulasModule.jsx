import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Flame,
  FileText
} from 'lucide-react';

export default function AnttFormulasModule() {
  const [activeFormulaTab, setActiveFormulaTab] = useState('cpk');
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
    <div className="module-view animate-fade-in" id="antt-formulas-module">
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <ShieldAlert size={16} />
            <span>REGULATÓRIO HAZMAT & METODOLOGIAS</span>
          </div>
          <h2>Compatibilidade ANTT & Fórmulas Operacionais</h2>
          <p>
            Matriz de segregação química (Resolução ANTT 5998 / NBR 14619) e documentação de fórmulas matemáticas do transporte.
          </p>
        </div>
      </div>

      {/* Matriz de Compatibilidade Química */}
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

      {/* Fórmulas Explicadas */}
      <div className="card-panel" style={{ marginTop: '2rem' }}>
        <div className="panel-header">
          <div className="header-icon-label">
            <Layers size={20} className="icon-cyan" />
            <div>
              <h3>Glossário & Fórmulas Matemáticas da Logística</h3>
              <p>Metodologias e normas técnicas de cálculo aplicadas na Ambipar</p>
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
                O CPK é a métrica padrão para precificação de fretes e controle orçamentário. Permite apurar o custo exato de cada quilômetro rodado pela frota própria ou agregada, incluindo diesel, Arla 32, pedágio, pneus, manutenção, seguro de carga perigosa e remuneração do motorista.
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
  );
}
