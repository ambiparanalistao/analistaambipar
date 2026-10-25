import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Fuel,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Copy,
  Download,
  Share2,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Info,
  ShieldCheck,
  Building,
  User,
  Sliders,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  Send,
  Droplets,
  Gauge,
  Wallet,
  Settings,
  History,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import {
  DEFAULT_CYCLE_SETTINGS,
  AUDITED_REAL_FLEET_PROVISION,
  INITIAL_WEEKLY_CYCLES,
  INITIAL_APORTE_DOCUMENTS_HISTORY,
  calculateCycleTotals,
  generateManagerWhatsAppMessage,
  exportCycleToCSV
} from '../data/weeklyFuelProvisionData';
import './WeeklyFuelProvisionModule.css';

export default function WeeklyFuelProvisionModule({ user, onNavigateModule }) {
  // Sincronização com o extrato real de abastecimentos do sistema
  const [realFuelRecords, setRealFuelRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_records_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Estado de ciclos salvo localmente (Versão 3 - Real 17k Abank)
  const [cycles, setCycles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_weekly_fuel_cycles_v3');
      if (saved) return JSON.parse(saved);
      return INITIAL_WEEKLY_CYCLES;
    } catch {
      return INITIAL_WEEKLY_CYCLES;
    }
  });

  // Histórico de Documentos Gerados
  const [documentsHistory, setDocumentsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_aporte_documents_history_v2');
      if (saved) return JSON.parse(saved);
      return INITIAL_APORTE_DOCUMENTS_HISTORY;
    } catch {
      return INITIAL_APORTE_DOCUMENTS_HISTORY;
    }
  });

  // Configurações do ciclo
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_cycle_settings_v3');
      if (saved) return JSON.parse(saved);
      return DEFAULT_CYCLE_SETTINGS;
    } catch {
      return DEFAULT_CYCLE_SETTINGS;
    }
  });

  // Salva no localStorage quando alterado
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_weekly_fuel_cycles_v3', JSON.stringify(cycles));
    } catch (e) {
      console.warn('Erro ao salvar ciclos:', e);
    }
  }, [cycles]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_aporte_documents_history_v2', JSON.stringify(documentsHistory));
    } catch (e) {
      console.warn('Erro ao salvar documentos:', e);
    }
  }, [documentsHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_fuel_cycle_settings_v3', JSON.stringify(settings));
    } catch (e) {
      console.warn('Erro ao salvar configurações do ciclo:', e);
    }
  }, [settings]);

  // Ciclo Ativo
  const [selectedCycleId, setSelectedCycleId] = useState(cycles[0]?.id || 'CICLO-2026-W43');
  const activeCycle = useMemo(() => {
    return cycles.find(c => c.id === selectedCycleId) || cycles[0];
  }, [cycles, selectedCycleId]);

  // Margem de contingência operacional ajustável (padrão 11.2%)
  const [contingencyPct, setContingencyPct] = useState(activeCycle?.margemSegurancaPct || 11.2);

  // Valor Alvo do Aporte Semanal (padrão R$ 17.000,00)
  const [aporteTargetValue, setAporteTargetValue] = useState(activeCycle?.valorTotalAporteAlvo || 17000.00);

  // Modo de visualização de tela cheia (SEM NENHUM POP-UP!)
  // viewMode: 'dashboard' | 'dossier' | 'vehicle_detail' | 'documents_history' | 'new_entry' | 'settings'
  const [viewMode, setViewMode] = useState('dashboard');
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState(null);
  const [activeDossierDocument, setActiveDossierDocument] = useState(null);

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState('Todas');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showMotivoDetails, setShowMotivoDetails] = useState(true);

  // Totais consolidados do ciclo ativo
  const totals = useMemo(() => {
    return calculateCycleTotals(activeCycle, contingencyPct);
  }, [activeCycle, contingencyPct]);

  // Lista de veículos filtrados
  const filteredVehicles = useMemo(() => {
    if (!activeCycle?.veiculosAbastecidos) return [];
    return activeCycle.veiculosAbastecidos.filter(v => {
      const matchSearch =
        v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.prefixo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.operacao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchOp = operationFilter === 'Todas' || v.operacao.includes(operationFilter);
      return matchSearch && matchOp;
    });
  }, [activeCycle, searchTerm, operationFilter]);

  // Operações únicas para filtro
  const availableOperations = useMemo(() => {
    if (!activeCycle?.veiculosAbastecidos) return [];
    const ops = new Set();
    activeCycle.veiculosAbastecidos.forEach(v => {
      if (v.operacao.includes('Vale')) ops.add('Vale');
      else if (v.operacao.includes('Amazon')) ops.add('Amazon');
      else if (v.operacao.includes('Jogue Limpo')) ops.add('Jogue Limpo');
      else ops.add('Base Duque de Caxias');
    });
    return ['Todas', ...Array.from(ops)];
  }, [activeCycle]);

  // Copiar resumo formatado para o WhatsApp
  const handleCopyWhatsAppMessage = () => {
    const text = generateManagerWhatsAppMessage(activeCycle, settings, contingencyPct);
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3500);
    }).catch(err => {
      console.error('Falha ao copiar:', err);
    });
  };

  // Exportar CSV
  const handleExportCSV = () => {
    exportCycleToCSV(activeCycle, contingencyPct);
  };

  // GERAR DOCUMENTO OFICIAL DE APORTE (Abre em tela cheia com protocolo oficial salvo)
  const handleGenerateOfficialDocument = () => {
    const nextSeq = documentsHistory.length + 1;
    const protocolCode = `AMB-APORTE-${activeCycle.id.replace('CICLO-', '')}/${String(nextSeq).padStart(3, '0')}`;
    
    const newDoc = {
      id: `DOC-APORTE-ABK-${Date.now()}`,
      numeroProtocolo: protocolCode,
      cicloId: activeCycle.id,
      cicloNome: activeCycle.nome,
      dataFechamento: activeCycle.dataCorteQuarta,
      dataSolicitacao: new Date().toISOString(),
      gestorNome: settings.gestorNome,
      gestorCargo: settings.gestorCargo,
      analistaNome: settings.analistaResponsavel,
      analistaCargo: settings.analistaCargo,
      convenio: settings.convenioPadrao,
      valorTotalSolicitado: totals.totalAporteSugerido,
      valorGastoReal: totals.totalGasto,
      valorMargemSeguranca: totals.margemTotalRS,
      margemPct: contingencyPct,
      totalVeiculos: totals.totalVeiculos,
      status: 'PRONTO_ENVIO',
      statusLabel: 'Emitido · Aguardando Liberação Abank pelo Gestor',
      motivoGeral: activeCycle.motivoGeralSolicitacao,
      veiculos: activeCycle.veiculosAbastecidos
    };

    setDocumentsHistory(prev => [newDoc, ...prev]);
    setActiveDossierDocument(newDoc);
    setViewMode('dossier');
  };

  // Reabrir documento existente do histórico
  const handleOpenExistingDocument = (doc) => {
    setActiveDossierDocument(doc);
    setViewMode('dossier');
  };

  // Formulário de Novo Abastecimento no Ciclo
  const [newEntryData, setNewEntryData] = useState({
    placa: 'RHU-6I87',
    data: new Date().toISOString().split('T')[0],
    hora: '10:00',
    posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
    cidade: 'Duque de Caxias / RJ',
    dieselLitros: 150,
    precoDiesel: 6.29,
    arlaLitros: 7,
    precoArla: 3.80,
    kmNoAto: 142400,
    nfNumero: 'NF-e 88921',
    comprovante: 'ABK-985100'
  });

  const handleSaveNewEntry = (e) => {
    e.preventDefault();
    const updatedCycles = cycles.map(c => {
      if (c.id !== activeCycle.id) return c;
      const veiculos = c.veiculosAbastecidos.map(v => {
        if (v.placa !== newEntryData.placa) return v;
        const totalEntry = (Number(newEntryData.dieselLitros) * Number(newEntryData.precoDiesel)) +
                           (Number(newEntryData.arlaLitros) * Number(newEntryData.precoArla));
        
        const novoDiaLabel = `${new Date(newEntryData.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}`;
        const diasAtualizados = v.diasAbastecimento.includes(novoDiaLabel) ? v.diasAbastecimento : [...v.diasAbastecimento, novoDiaLabel];
        
        const novosDetalhes = [
          ...(v.abastecimentosDetalhe || []),
          {
            data: newEntryData.data,
            diaSemana: new Date(newEntryData.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }),
            hora: newEntryData.hora,
            posto: newEntryData.posto,
            cidade: newEntryData.cidade,
            dieselLitros: Number(newEntryData.dieselLitros),
            precoDiesel: Number(newEntryData.precoDiesel),
            arlaLitros: Number(newEntryData.arlaLitros),
            precoArla: Number(newEntryData.precoArla),
            valorTotal: totalEntry,
            kmNoAto: Number(newEntryData.kmNoAto),
            nfNumero: newEntryData.nfNumero,
            comprovante: newEntryData.comprovante
          }
        ];

        const novoDieselTotal = v.litrosDieselTotal + Number(newEntryData.dieselLitros);
        const novoArlaTotal = v.litrosArlaTotal + Number(newEntryData.arlaLitros);
        const novoGastoTotal = v.valorTotalGasto + totalEntry;
        const novoKmFinal = Math.max(v.kmFinal, Number(newEntryData.kmNoAto));
        const novoKmRodado = novoKmFinal - v.kmInicial;

        return {
          ...v,
          diasAbastecimento: diasAtualizados,
          abastecimentosDetalhe: novosDetalhes,
          litrosDieselTotal: novoDieselTotal,
          litrosArlaTotal: novoArlaTotal,
          valorTotalGasto: novoGastoTotal,
          kmFinal: novoKmFinal,
          kmRodado: novoKmRodado
        };
      });
      return { ...c, veiculosAbastecidos: veiculos };
    });

    setCycles(updatedCycles);
    setViewMode('dashboard');
  };

  // SE ESTIVER EM MODO DOSSIÊ TIMBRADO PARA IMPRESSÃO / PDF (TELA CHEIA, ZERO POP-UP)
  if (viewMode === 'dossier') {
    const docToDisplay = activeDossierDocument || {
      numeroProtocolo: 'AMB-APORTE-2026-W43/001',
      dataFechamento: activeCycle.dataCorteQuarta,
      dataSolicitacao: activeCycle.dataEnvioQuinta,
      gestorNome: settings.gestorNome,
      gestorCargo: settings.gestorCargo,
      analistaNome: settings.analistaResponsavel,
      analistaCargo: settings.analistaCargo,
      convenio: settings.convenioPadrao,
      valorTotalSolicitado: totals.totalAporteSugerido,
      valorGastoReal: totals.totalGasto,
      valorMargemSeguranca: totals.margemTotalRS,
      margemPct: contingencyPct,
      motivoGeral: activeCycle.motivoGeralSolicitacao,
      veiculos: activeCycle.veiculosAbastecidos
    };

    return (
      <div className="dossier-fullscreen-workspace animate-fade-in" id="dossier-fullscreen-workspace">
        <header className="dossier-topbar no-print">
          <div className="dossier-topbar-left">
            <button
              type="button"
              className="btn-back-dossier"
              onClick={() => setViewMode('dashboard')}
            >
              <ArrowLeft size={18} />
              <span>Voltar ao Painel de Aporte</span>
            </button>
            <div className="dossier-tag">
              Documento Oficial: <strong>{docToDisplay.numeroProtocolo}</strong>
            </div>
          </div>
          <div className="dossier-topbar-right">
            <button
              type="button"
              className="btn-print-action"
              onClick={() => window.print()}
            >
              <Printer size={18} />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              className="btn-copy-action"
              onClick={handleCopyWhatsAppMessage}
            >
              <Copy size={18} />
              <span>{copySuccess ? 'Copiado!' : 'Copiar Texto p/ Gestor'}</span>
            </button>
          </div>
        </header>

        <div className="dossier-paper-container">
          <div className="dossier-document">
            {/* Cabeçalho Oficial Ambipar */}
            <div className="doc-header">
              <div className="doc-brand">
                <div className="doc-logo-pill">AMBIPAR</div>
                <div className="doc-brand-text">
                  <h2>AMBIPAR LOGISTICS & ENVIRONMENTAL SOLUTIONS</h2>
                  <p>Gestão Integrada de Frotas & Torre de Controle CCO · Base Duque de Caxias / RJ</p>
                </div>
              </div>
              <div className="doc-meta-box">
                <span className="doc-code">PROTOCOLO: {docToDisplay.numeroProtocolo}</span>
                <span className="doc-date">Fechamento: Quarta-feira 17:00h</span>
                <span className="doc-report-date">Aporte Solicitado: Quinta-feira 08:00h</span>
              </div>
            </div>

            <div className="doc-title-banner">
              <h1>SOLICITAÇÃO OFICIAL DE APORTE SEMANAL · CARTÃO ABANK FROTA</h1>
              <p>
                Demonstrativo auditado dos abastecimentos realizados no ciclo, memória de cálculo da divisão da cota de <strong>R$ 17.000,00</strong> entre os veículos ativos e justificativa técnica da margem de segurança.
              </p>
            </div>

            {/* Informações de Gestão */}
            <div className="doc-info-grid">
              <div className="doc-info-item">
                <label>GESTOR RESPONSÁVEL / APROVADOR:</label>
                <strong>{docToDisplay.gestorNome}</strong>
                <span>{docToDisplay.gestorCargo}</span>
              </div>
              <div className="doc-info-item">
                <label>ANALISTA CCO SOLICITANTE:</label>
                <strong>{docToDisplay.analistaNome}</strong>
                <span>{docToDisplay.analistaCargo}</span>
              </div>
              <div className="doc-info-item">
                <label>CARTÃO / MEIO DE PAGAMENTO:</label>
                <strong>{docToDisplay.convenio}</strong>
                <span>Recarga Programada nas Contas Abank</span>
              </div>
              <div className="doc-info-item">
                <label>VALOR TOTAL DO APORTE:</label>
                <strong style={{ color: '#166534', fontSize: '1.1rem' }}>
                  R$ {docToDisplay.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span>Margem de Segurança: +{docToDisplay.margemPct}%</span>
              </div>
            </div>

            {/* 1. Motivo Técnico Fundamentado da Solicitação */}
            <div className="doc-motivo-box">
              <h3>1. JUSTIFICATIVA TÉCNICA E OPERACIONAL DO VALOR SOLICITADO (R$ 17.000,00)</h3>
              <div className="motivo-content">
                <p>
                  <strong>Objetivo Operacional:</strong> A solicitação semanal de <strong>R$ 17.000,00</strong> no Cartão Abank Frota é dimensionada para suprir o ciclo ininterrupto de 7 dias da frota pesada alocada nos contratos estratégicos da <strong>Vale S.A. (TIG Guaíba / CPBS)</strong>, <strong>Amazon CD Meriti (GIG 1 / GIG 7)</strong> e contratos municipais de logística reversa.
                </p>
                <div className="motivo-bullets">
                  <div className="bullet-row">
                    <strong>• Consumo em Tomada de Força (PTO):</strong> Caminhões como o Poliguindaste Duplo (RHU-6I87) e Tanque Hidrovácuo (FMB-1H09) mantêm motores operando a rotações elevadas durante operações de carga, içamento e sucção com o veículo estacionado, gerando queima de combustível necessária à execução do contrato sem progressão de hodômetro.
                  </div>
                  <div className="bullet-row">
                    <strong>• Margem Significativa de Segurança (+{docToDisplay.margemPct}% = R$ {docToDisplay.valorMargemSeguranca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}):</strong> Provisão técnica mandatória para absorver congestionamentos crônicos nas principais artérias logísticas fluminenses (Avenida Brasil, Rodovia Presidente Dutra e Arco Metropolitano) e variações de preço do Diesel S10 entre postos de rota.
                  </div>
                  <div className="bullet-row">
                    <strong>• Proteção Anti-Desabastecimento:</strong> Veículos transportando resíduos perigosos Classe I e efluentes industriais são proibidos por regulamento da ANTT/IBAMA e SLA de clientes de sofrerem qualquer interrupção por pane seca em trânsito rodoviário.
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Tabela de Divisão dos R$ 17.000,00 por Veículo */}
            <div className="doc-table-section" style={{ marginTop: '24px' }}>
              <h3>2. MATRIZ DE ALOCAÇÃO DOS R$ 17.000,00 POR VEÍCULO / CARTÃO ABANK</h3>
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Placa / Prefixo</th>
                    <th>Modelo & Operação</th>
                    <th>Cartão Abank</th>
                    <th>Dias Abastecidos</th>
                    <th>KM Rodado</th>
                    <th>Diesel (L)</th>
                    <th>Média</th>
                    <th>Gasto Real (R$)</th>
                    <th>Margem (+11%)</th>
                    <th className="highlight-col">Cota Aporte (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {(docToDisplay.veiculos || activeCycle.veiculosAbastecidos).map(v => (
                    <tr key={v.placa}>
                      <td className="bold-cell">
                        <div>{v.placa}</div>
                        <small className="sub-tag">{v.prefixo}</small>
                      </td>
                      <td>
                        <div className="model-name">{v.modelo}</div>
                        <div className="op-tag">{v.operacao}</div>
                      </td>
                      <td className="center-cell bold-cell" style={{ color: '#0284c7' }}>
                        {v.cartaoNumero}
                      </td>
                      <td className="center-cell">
                        {v.diasAbastecimento.map(d => (
                          <span key={d} className="day-badge">{d}</span>
                        ))}
                      </td>
                      <td className="right-cell bold-cell">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                      <td className="right-cell">{v.litrosDieselTotal} L</td>
                      <td className="center-cell">
                        {v.litrosDieselTotal > 0 ? (v.kmRodado / v.litrosDieselTotal).toFixed(2) : '-'} km/l
                      </td>
                      <td className="right-cell">
                        R$ {v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="right-cell" style={{ color: '#059669' }}>
                        + R$ {(v.margemSegurancaRS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="right-cell highlight-col bold-cell">
                        R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="tfoot-totals">
                    <td colSpan="4"><strong>TOTAL CONSOLIDADO DA FROTA (ALOCAÇÃO EXATA)</strong></td>
                    <td className="right-cell"><strong>{totals.totalKm.toLocaleString('pt-BR')} km</strong></td>
                    <td className="right-cell"><strong>{totals.totalDiesel.toLocaleString('pt-BR')} L</strong></td>
                    <td className="center-cell"><strong>{totals.mediaFrotaKmL} km/l</strong></td>
                    <td className="right-cell"><strong>R$ {docToDisplay.valorGastoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                    <td className="right-cell" style={{ color: '#059669' }}>
                      <strong>+ R$ {docToDisplay.valorMargemSeguranca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td className="right-cell highlight-col" style={{ fontSize: '1rem' }}>
                      <strong>R$ {docToDisplay.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Assinaturas Formais */}
            <div className="doc-signatures">
              <div className="sig-block">
                <div className="sig-line"></div>
                <strong>{docToDisplay.analistaNome}</strong>
                <span>{docToDisplay.analistaCargo} (Solicitante CCO)</span>
                <small>Protocolo emitido em: {new Date(docToDisplay.dataSolicitacao).toLocaleDateString('pt-BR')} · Sistema Ambipar</small>
              </div>

              <div className="sig-block">
                <div className="sig-line"></div>
                <strong>{docToDisplay.gestorNome}</strong>
                <span>{docToDisplay.gestorCargo} (Aprovador)</span>
                <small>Status: Aguardando Liberação do Saldo Abank</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SE ESTIVER EM MODO AUDITORIA DE CUPONS DO VEÍCULO (TELA CHEIA, ZERO POP-UP)
  if (viewMode === 'vehicle_detail' && selectedVehicleForDetail) {
    const v = selectedVehicleForDetail;
    return (
      <div className="vehicle-detail-fullscreen animate-fade-in" id="vehicle-detail-fullscreen">
        <header className="detail-topbar">
          <button
            type="button"
            className="btn-back-action"
            onClick={() => setViewMode('dashboard')}
          >
            <ArrowLeft size={18} />
            <span>Voltar ao Painel do Aporte</span>
          </button>
          <div className="detail-title-box">
            <h2>Auditoria de Abastecimento & Motivo · {v.placa} ({v.prefixo})</h2>
            <span className="badge-cycle">{activeCycle.nome} · Cota Abank: R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </header>

        <div className="detail-body-container">
          {/* Header Card do Veículo */}
          <div className="vehicle-summary-card">
            <div className="v-card-main">
              <div className="v-plate-badge">{v.placa}</div>
              <div>
                <h3>{v.modelo}</h3>
                <p className="v-op-sub">{v.operacao} · Cartão Abank ({v.cartaoNumero})</p>
                <div style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <strong>Justificativa da Cota de R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}:</strong> {v.motivoTecnico}
                </div>
              </div>
            </div>

            <div className="v-kpi-group">
              <div className="v-kpi">
                <span>KM Rodado no Ciclo</span>
                <strong>{v.kmRodado.toLocaleString('pt-BR')} km</strong>
                <small>{v.kmInicial.toLocaleString('pt-BR')} ➔ {v.kmFinal.toLocaleString('pt-BR')}</small>
              </div>
              <div className="v-kpi">
                <span>Diesel S10 Total</span>
                <strong>{v.litrosDieselTotal} L</strong>
                <small>Média: {(v.kmRodado / v.litrosDieselTotal).toFixed(2)} km/l (Meta: {v.metaKmL})</small>
              </div>
              <div className="v-kpi">
                <span>Gasto Real + Margem</span>
                <strong>R$ {v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                <small>+ R$ {v.margemSegurancaRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} reserva</small>
              </div>
              <div className="v-kpi highlight-kpi">
                <span>Cota Aporte Abank</span>
                <strong>R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                <small>Saldo est. atual: R$ {v.saldoCartaoAtual.toFixed(2)}</small>
              </div>
            </div>
          </div>

          {/* Cupons e Comprovantes */}
          <div className="tickets-section">
            <div className="tickets-header">
              <h3>
                <Fuel size={20} className="icon-emerald" />
                <span>Comprovantes de Abastecimento Realizados na Semana (Corte Quarta-feira 17h)</span>
              </h3>
              <span className="count-badge">{v.abastecimentosDetalhe?.length || 0} comprovantes Abank registrados</span>
            </div>

            <div className="tickets-list">
              {v.abastecimentosDetalhe && v.abastecimentosDetalhe.length > 0 ? (
                v.abastecimentosDetalhe.map((ticket, idx) => (
                  <div key={idx} className="ticket-card">
                    <div className="ticket-badge-day">
                      <Calendar size={14} />
                      <span>{ticket.diaSemana} · {ticket.data} às {ticket.hora}</span>
                    </div>

                    <div className="ticket-details-grid">
                      <div className="ticket-station">
                        <label>Posto Credenciado / Localização:</label>
                        <strong>{ticket.posto}</strong>
                        <span>{ticket.cidade}</span>
                      </div>

                      <div className="ticket-odometer">
                        <label>Hodômetro no Ato:</label>
                        <strong>{ticket.kmNoAto.toLocaleString('pt-BR')} km</strong>
                        <span>Nota Fiscal: {ticket.nfNumero}</span>
                      </div>

                      <div className="ticket-fuel">
                        <label>Volumes & Preços:</label>
                        <div className="fuel-pill-row">
                          <span className="pill-diesel">{ticket.dieselLitros} L Diesel S10 (R$ {ticket.precoDiesel.toFixed(2)}/L)</span>
                          {ticket.arlaLitros > 0 && (
                            <span className="pill-arla">{ticket.arlaLitros} L ARLA 32 (R$ {ticket.precoArla.toFixed(2)}/L)</span>
                          )}
                        </div>
                      </div>

                      <div className="ticket-cost">
                        <label>Valor Total do Cupom:</label>
                        <strong className="cost-val">R$ {ticket.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        <span className="auth-code">Aut Abank: {ticket.comprovante}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-tickets">
                  <Info size={24} />
                  <p>Nenhum detalhamento de cupom registrado individualmente para este veículo no ciclo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SE ESTIVER EM MODO HISTÓRICO DE DOCUMENTOS EMITIDOS (TELA CHEIA, ZERO POP-UP)
  if (viewMode === 'documents_history') {
    return (
      <div className="documents-history-fullscreen animate-fade-in" id="documents-history-fullscreen">
        <header className="entry-topbar">
          <button
            type="button"
            className="btn-back-action"
            onClick={() => setViewMode('dashboard')}
          >
            <ArrowLeft size={18} />
            <span>Voltar ao Painel do Aporte</span>
          </button>
          <h2>Histórico de Documentos & Solicitações de Aporte Emitidas</h2>
        </header>

        <div className="history-container">
          <div className="history-cards-grid">
            {documentsHistory.map((doc, idx) => (
              <div key={doc.id || idx} className="doc-history-card">
                <div className="doc-history-header">
                  <div className="doc-protocol-pill">{doc.numeroProtocolo}</div>
                  <span className={`doc-status-badge ${doc.status === 'APROVADO_CREDITADO' ? 'approved' : 'pending'}`}>
                    {doc.statusLabel}
                  </span>
                </div>

                <div className="doc-history-body">
                  <h4>{doc.cicloNome || doc.cicloId}</h4>
                  <div className="doc-history-vals">
                    <div>
                      <span>Valor Solicitado:</span>
                      <strong>R$ {doc.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div>
                      <span>Margem Técnica:</span>
                      <strong style={{ color: '#059669' }}>+{doc.margemPct}%</strong>
                    </div>
                  </div>
                  <p className="doc-history-motivo">
                    <strong>Motivo:</strong> {doc.motivoResumido || doc.motivoGeral?.slice(0, 120)}...
                  </p>
                  <div className="doc-history-meta">
                    <span>Fechamento: Quarta 17h</span>
                    <span>Envio: Quinta Manhã</span>
                  </div>
                </div>

                <div className="doc-history-actions">
                  <button
                    type="button"
                    className="btn-open-doc"
                    onClick={() => handleOpenExistingDocument(doc)}
                  >
                    <FileText size={16} />
                    <span>Visualizar / Imprimir Dossiê</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL (DASHBOARD EXECUTIVO DO APORTE SEMANAL)
  return (
    <div className="weekly-fuel-provision-module animate-fade-in" id="weekly-fuel-provision-module">
      {/* Top Banner de Rotina Operacional Quarta ➔ Quinta */}
      <section className="cycle-routine-banner">
        <div className="banner-badge-col">
          <div className="status-pulse-pill">
            <span className="pulse-dot"></span>
            <span>FECHAMENTO QUARTA-FEIRA À TARDE (17:00H) · CARTÃO ABANK FROTA</span>
          </div>
          <h1>Aporte Semanal & Solicitação de Saldo de Combustível</h1>
          <p>
            Consolidação dos gastos reais de combustível para solicitação formal de <strong>R$ 17.000,00</strong> ao gestor toda <strong>quinta-feira pela manhã</strong>.
          </p>
        </div>

        <div className="banner-controls-col">
          <div className="cycle-selector-box">
            <label>Ciclo Semanal Selecionado:</label>
            <select
              value={selectedCycleId}
              onChange={e => setSelectedCycleId(e.target.value)}
              className="cycle-select"
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.id === 'CICLO-2026-W43' ? '· (Vigente)' : ''}
                </option>
              ))}
            </select>
            <span className="cycle-status-text">
              <CheckCircle2 size={13} className="icon-emerald" />
              <span>{activeCycle.statusLabel}</span>
            </span>
          </div>

          <div className="quick-action-buttons">
            <button
              type="button"
              className="btn-action-primary"
              onClick={handleGenerateOfficialDocument}
              title="Gerar documento oficial timbrado numerado com protocolo para assinatura e envio ao gestor"
            >
              <FileCheck size={16} />
              <span>Gerar Documento de Aporte</span>
            </button>

            <button
              type="button"
              className="btn-action-dossier"
              onClick={handleCopyWhatsAppMessage}
              title="Copiar mensagem completa formatada para enviar no WhatsApp ou E-mail do Gestor"
            >
              <Send size={16} />
              <span>{copySuccess ? 'Copiado com Sucesso!' : 'Copiar p/ WhatsApp'}</span>
            </button>

            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => setViewMode('documents_history')}
              title="Ver histórico de solicitações e documentos emitidos anteriormente"
            >
              <History size={16} />
              <span>Histórico de Documentos</span>
            </button>

            <button
              type="button"
              className="btn-action-secondary"
              onClick={handleExportCSV}
              title="Exportar planilha Excel/CSV do Aporte"
            >
              <Download size={16} />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>
      </section>

      {/* Card Oficial do Motivo da Solicitação dos R$ 17.000,00 e Margem Técnica */}
      <section className="motivo-solicitacao-card">
        <div className="motivo-card-header" onClick={() => setShowMotivoDetails(!showMotivoDetails)}>
          <div className="motivo-header-left">
            <div className="motivo-icon-wrap">
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <div>
              <h3>Motivo Oficial da Solicitação do Aporte (R$ 17.000,00) & Margem Técnica</h3>
              <p>Justificativa fundamentada para aprovação da diretoria e liberação do saldo nos cartões Abank.</p>
            </div>
          </div>
          <button type="button" className="btn-toggle-motivo">
            {showMotivoDetails ? 'Ocultar Detalhes' : 'Ver Justificativa Completa'}
          </button>
        </div>

        {showMotivoDetails && (
          <div className="motivo-card-body animate-fade-in">
            <div className="motivo-pillars-grid">
              <div className="pillar-item">
                <div className="pillar-num">1</div>
                <div>
                  <strong>Operação Ininterrupta Vale S.A. & Amazon:</strong>
                  <span>7 caminhões ativos em rotas prioritárias no RJ (CPBS Guaíba, CD Meriti GIG 1/7 e Jogue Limpo). Nenhum veículo pode sofrer desabastecimento em trânsito.</span>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-num">2</div>
                <div>
                  <strong>Tomada de Força (PTO) em Poliguindaste e Hidrovácuo:</strong>
                  <span>O caminhão bascula caçambas e faz sucção de efluentes com o motor acelerado no cliente por horas sem rodar KM de odômetro, consumindo diesel estacionado.</span>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-num">3</div>
                <div>
                  <strong>Margem Significativa de Segurança (+11.2% = R$ 1.720,00):</strong>
                  <span>Reserva técnica mandatória para cobrir congestionamentos severos na Av. Brasil, Via Dutra e Linha Vermelha, além de oscilações no preço do diesel da rede Abank.</span>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-num">4</div>
                <div>
                  <strong>Conformidade Regulamentar ANTT & IBAMA:</strong>
                  <span>O transporte de resíduos perigosos e químicos Classe I exige autonomia garantida, evitando multas gravíssimas por parada em rodovias federais.</span>
                </div>
              </div>
            </div>

            <div className="motivo-summary-bar">
              <span><strong>Fórmula Aplicada:</strong> Gasto Real Previsto (R$ 15.280,00) + Margem Técnica de Segurança (R$ 1.720,00) = <strong>R$ 17.000,00 (Total Homologado)</strong></span>
            </div>
          </div>
        )}
      </section>

      {/* Grid de KPIs Consolidados */}
      <section className="kpi-cards-grid">
        <div className="kpi-card highlight-card-blue">
          <div className="kpi-card-header">
            <span className="kpi-label">TOTAL SOLICITADO P/ APORTE (ABANK FROTA)</span>
            <Wallet size={20} className="kpi-icon-cyan" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-currency">R$</span>
            <span className="kpi-big-value">17.000,00</span>
          </div>
          <div className="kpi-subtext">
            <span>Gasto Real: R$ 15.280,00</span>
            <span className="badge-plus">+R$ 1.720,00 margem (+11.2%)</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">GASTO REALIZADO NO PERÍODO</span>
            <DollarSign size={20} className="kpi-icon-emerald" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-currency">R$</span>
            <span className="kpi-big-value">
              {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="kpi-subtext">
            <span>Preço Médio Diesel S10: R$ {totals.precoMedioDiesel} / Litro</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">VEÍCULOS ATIVOS NO APORTE</span>
            <Truck size={20} className="kpi-icon-emerald" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-value">{totals.totalVeiculos}</span>
            <span className="kpi-unit">caminhões</span>
          </div>
          <div className="kpi-subtext">
            <span>100% com Cartão Abank e cotas individualizadas</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">KM TOTAL RODADO NO PERÍODO</span>
            <Gauge size={20} className="kpi-icon-yellow" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-value">{totals.totalKm.toLocaleString('pt-BR')}</span>
            <span className="kpi-unit">km</span>
          </div>
          <div className="kpi-subtext">
            <span>Média Geral da Frota: <strong>{totals.mediaFrotaKmL} km/l</strong></span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">COMBUSTÍVEL TOTAL CONSUMIDO</span>
            <Droplets size={20} className="kpi-icon-purple" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-value">
              {totals.totalDiesel.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
            <span className="kpi-unit">L Diesel S10</span>
          </div>
          <div className="kpi-subtext">
            <span>+ {totals.totalArla.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} L ARLA 32</span>
          </div>
        </div>
      </section>

      {/* Tabela Interativa de Veículos Abastecidos e Divisão dos 17k */}
      <section className="vehicles-provision-table-section">
        <div className="table-controls-bar">
          <div className="table-title-group">
            <h3>Divisão Real dos R$ 17.000,00 entre os Veículos (Ciclo Quarta 17h)</h3>
            <span className="table-count-pill">{filteredVehicles.length} veículos ativos</span>
          </div>

          <div className="table-search-group">
            <div className="search-input-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar placa, modelo, contrato..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-select-box">
              <Filter size={14} />
              <select
                value={operationFilter}
                onChange={e => setOperationFilter(e.target.value)}
              >
                {availableOperations.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="provision-table-wrapper">
          <table className="provision-table">
            <thead>
              <tr>
                <th>Placa & Prefixo</th>
                <th>Modelo & Implemento</th>
                <th>Operação / Contrato</th>
                <th>Cartão Abank</th>
                <th>Dias Abastecidos</th>
                <th>KM Rodado</th>
                <th>Diesel S10</th>
                <th>Média km/l</th>
                <th>Gasto Real</th>
                <th>Margem Seg.</th>
                <th className="th-aporte">Cota do Aporte (R$)</th>
                <th className="th-action">Auditoria</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(v => {
                const media = v.litrosDieselTotal > 0 ? (v.kmRodado / v.litrosDieselTotal).toFixed(2) : '-';
                return (
                  <tr key={v.placa} className="tr-vehicle-row">
                    <td>
                      <div className="plate-badge-row">
                        <strong>{v.placa}</strong>
                        <span className="prefix-badge">{v.prefixo}</span>
                      </div>
                    </td>

                    <td>
                      <div className="model-cell-title">{v.modelo}</div>
                      <small className="model-cell-type">{v.tipo}</small>
                    </td>

                    <td>
                      <span className="op-tag-badge">{v.operacao}</span>
                    </td>

                    <td>
                      <span className="card-ref" style={{ color: '#38bdf8', fontWeight: 700 }}>
                        {v.cartaoNumero}
                      </span>
                    </td>

                    <td>
                      <div className="days-badge-container">
                        {v.diasAbastecimento.map(d => (
                          <span key={d} className="badge-day">{d}</span>
                        ))}
                      </div>
                    </td>

                    <td className="km-val bold-text">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                    <td className="liters-val">{v.litrosDieselTotal} L</td>

                    <td>
                      <span className="efficiency-badge">
                        {media} km/l
                      </span>
                    </td>

                    <td className="cost-val">
                      R$ {v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="cost-val" style={{ color: '#10b981' }}>
                      + R$ {(v.margemSegurancaRS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="td-aporte-val">
                      <strong>R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      <small>Saldo est.: R$ {(v.saldoCartaoAtual || 0).toFixed(2)}</small>
                    </td>

                    <td className="td-action-cell">
                      <button
                        type="button"
                        className="btn-view-details"
                        onClick={() => {
                          setSelectedVehicleForDetail(v);
                          setViewMode('vehicle_detail');
                        }}
                        title="Ver cupons, postos e motivo técnico deste caminhão"
                      >
                        Auditar Cupons
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="tr-totals-footer">
                <td colSpan="5">
                  <strong>TOTAL GERAL DO APORTE (DIVISÃO EXATA DOS R$ 17.000,00)</strong>
                </td>
                <td className="km-val">
                  <strong>{totals.totalKm.toLocaleString('pt-BR')} km</strong>
                </td>
                <td className="liters-val">
                  <strong>{totals.totalDiesel.toLocaleString('pt-BR')} L</strong>
                </td>
                <td>
                  <strong>{totals.mediaFrotaKmL} km/l</strong>
                </td>
                <td className="cost-val">
                  <strong>R$ {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className="cost-val" style={{ color: '#10b981' }}>
                  <strong>+ R$ {totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className="td-aporte-val">
                  <strong className="grand-total" style={{ color: '#10b981', fontSize: '1.15rem' }}>
                    R$ 17.000,00
                  </strong>
                </td>
                <td>-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Procedimento Semanal */}
      <section className="weekly-procedure-footer">
        <div className="proc-col">
          <div className="proc-step-num">1</div>
          <div>
            <h4>Quarta-feira (até 17:00h)</h4>
            <p>O analista CCO confere os abastecimentos da semana no sistema e valida os gastos reais da frota de R$ 15.280,00.</p>
          </div>
        </div>

        <div className="proc-col">
          <div className="proc-step-num">2</div>
          <div>
            <h4>Quinta-feira (08:00h da Manhã)</h4>
            <p>O analista clica em <strong>"Gerar Documento de Aporte"</strong> ou <strong>"Copiar p/ WhatsApp"</strong> solicitando a liberação dos R$ 17.000,00 com motivo fundamentado.</p>
          </div>
        </div>

        <div className="proc-col">
          <div className="proc-step-num">3</div>
          <div>
            <h4>Recarga na Plataforma Abank</h4>
            <p>O gestor aprova e o financeiro credita a cota de cada caminhão no Cartão Abank com margem suficiente para não faltar diesel.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
