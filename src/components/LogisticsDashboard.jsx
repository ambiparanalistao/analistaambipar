import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  FileCheck2, 
  Flame, 
  Leaf, 
  RefreshCw, 
  Search, 
  Calculator, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Fuel
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function LogisticsDashboard({ user, onNavigateModule }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
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
            Painel executivo com métricas consolidadas de transportes, movimentação de resíduos e conformidade CCO.
          </p>
        </div>

        <button 
          type="button" 
          className="btn-secondary btn-icon-text"
          onClick={loadRealData}
          disabled={loading}
          title="Recarregar dados operacionais"
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Atualizar Indicadores</span>
        </button>
      </div>

      {/* Grid Principal de KPIs Consolidados */}
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
            <span className="kpi-indicator-desc">Volume Operacional Homologado</span>
          </div>
          <div className="kpi-footer-status positive">
            <span>{totalKgReal > 0 ? `${totalKgReal.toLocaleString('pt-BR')} kg transportados` : 'Operação Ativa CCO'}</span>
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
            <span className="kpi-indicator-desc">Manifestos de Transporte de Resíduos</span>
          </div>
          <div className="kpi-footer-status neutral">
            <span>{totalMtrsReal > 0 ? 'Conformidade ativa com SINIR' : 'Sem pendências regulatórias'}</span>
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
            <span className="kpi-indicator-desc">Produtos Perigosos Homologados</span>
          </div>
          <div className="kpi-footer-status neutral">
            <span>Tratamento e transporte prioritário</span>
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
            <span className="kpi-indicator-desc">Reaproveitamento & Coprocessamento</span>
          </div>
          <div className="kpi-footer-status positive">
            <span>Destinação sustentável certificada</span>
          </div>
        </div>
      </div>

      {/* Banner de Acesso Rápido aos Módulos Operacionais Especializados */}
      <div className="dashboard-quick-modules-row">
        <div className="quick-access-banner-card highlight">
          <div className="banner-icon-circle emerald">
            <Calculator size={26} />
          </div>
          <div className="banner-text-content">
            <h4>Módulo Avançado: Calculadora de Frete & Carbono</h4>
            <p>
              Faça a simulação analítica completa de rotas, DRE de custos (diesel, Arla 32, pedágios, manutenção, margem) e balanço de emissões GEE (GHG Protocol).
            </p>
          </div>
          <button
            type="button"
            className="btn-primary btn-icon-text"
            onClick={() => onNavigateModule && onNavigateModule('calculadora_frete')}
            id="go-to-freight-calculator-btn"
          >
            <span>Abrir Calculadora Completa</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="quick-access-banner-card">
          <div className="banner-icon-circle cyan">
            <FileCheck2 size={26} />
          </div>
          <div className="banner-text-content">
            <h4>Gestão de MTRs & Destinação</h4>
            <p>
              Emita novos manifestos de resíduos, controle o certificado de destinação final (CDF) e mantenha a conformidade com o SINIR.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={() => onNavigateModule && onNavigateModule('mtr')}
            id="go-to-mtr-module-btn"
          >
            <span>Gerenciar MTRs</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="quick-access-banner-card">
          <div className="banner-icon-circle amber">
            <Fuel size={26} />
          </div>
          <div className="banner-text-content">
            <h4>Controle de Combustível & ARLA 32</h4>
            <p>
              Audite abastecimentos da frota, controle o rendimento médio (km/l), custo por km (CPK) e notas fiscais.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={() => onNavigateModule && onNavigateModule('combustivel')}
            id="go-to-fuel-module-btn"
          >
            <span>Gerenciar Combustível</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Painel de Registros Operacionais */}
      <div className="card-panel live-board-panel" style={{ marginTop: '1.75rem' }}>
        <div className="live-board-header">
          <div>
            <h3>Histórico de Manifestos & Destinações Operacionais</h3>
            <p>Acompanhamento de coletas, volumes movimentados e certificados de destinação em tempo real</p>
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <span className="spinner"></span>
                    <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Sincronizando registros operacionais...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-state">
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      Nenhum manifesto de transporte emitido no período.
                    </p>
                    <span style={{ fontSize: '0.85rem' }}>
                      Acesse o módulo <strong>"MTR & Destinação Resíduos"</strong> para emitir novos manifestos e certificados.
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
