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
  FileCheck,
  ToggleLeft,
  ToggleRight
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

  // Estado de ciclos salvo localmente (Versão 4 - Vale Zero, GIG Esporádico, 17k Abank)
  const [cycles, setCycles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_weekly_fuel_cycles_v4');
      if (saved) return JSON.parse(saved);
      // Limpa chaves legadas se existirem
      localStorage.removeItem('ambipar_weekly_fuel_cycles_v1');
      localStorage.removeItem('ambipar_weekly_fuel_cycles_v2');
      localStorage.removeItem('ambipar_weekly_fuel_cycles_v3');
      return INITIAL_WEEKLY_CYCLES;
    } catch {
      return INITIAL_WEEKLY_CYCLES;
    }
  });

  // Histórico de Documentos Gerados
  const [documentsHistory, setDocumentsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_aporte_documents_history_v3');
      if (saved) return JSON.parse(saved);
      return INITIAL_APORTE_DOCUMENTS_HISTORY;
    } catch {
      return INITIAL_APORTE_DOCUMENTS_HISTORY;
    }
  });

  // Configurações do ciclo
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_cycle_settings_v4');
      if (saved) return JSON.parse(saved);
      return DEFAULT_CYCLE_SETTINGS;
    } catch {
      return DEFAULT_CYCLE_SETTINGS;
    }
  });

  // Opção solicitada pelo usuário: Gerar relatório COM motivo técnico OU SEM motivo técnico
  const [withTechnicalMotives, setWithTechnicalMotives] = useState(true);

  // Salva no localStorage quando alterado
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_weekly_fuel_cycles_v4', JSON.stringify(cycles));
    } catch (e) {
      console.warn('Erro ao salvar ciclos:', e);
    }
  }, [cycles]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_aporte_documents_history_v3', JSON.stringify(documentsHistory));
    } catch (e) {
      console.warn('Erro ao salvar documentos:', e);
    }
  }, [documentsHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_fuel_cycle_settings_v4', JSON.stringify(settings));
    } catch (e) {
      console.warn('Erro ao salvar configurações do ciclo:', e);
    }
  }, [settings]);

  // Ciclo Ativo
  const [selectedCycleId, setSelectedCycleId] = useState(cycles[0]?.id || 'CICLO-2026-W43');
  const activeCycle = useMemo(() => {
    return cycles.find(c => c.id === selectedCycleId) || cycles[0];
  }, [cycles, selectedCycleId]);

  // Margem de contingência operacional ajustável (padrão 11.8%)
  const [contingencyPct, setContingencyPct] = useState(activeCycle?.margemSegurancaPct || 11.8);

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
      
      const matchOp = operationFilter === 'Todas' || 
        (operationFilter === 'Vale' && v.isValeOperation) ||
        (operationFilter === 'Ambipar Abank' && v.recebeAporteAmbipar) ||
        (operationFilter === 'Amazon Meriti' && v.isSporadicGIG);
      return matchSearch && matchOp;
    });
  }, [activeCycle, searchTerm, operationFilter]);

  // Operações para filtro rápido
  const availableOperations = ['Todas', 'Ambipar Abank', 'Vale', 'Amazon Meriti'];

  // Copiar resumo formatado para o WhatsApp (respeita a opção com/sem motivo técnico)
  const handleCopyWhatsAppMessage = () => {
    const text = generateManagerWhatsAppMessage(activeCycle, settings, contingencyPct, withTechnicalMotives);
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
      veiculosComCota: totals.veiculosComCota,
      veiculosValeZero: totals.veiculosValeZero,
      withTechnicalMotives: withTechnicalMotives,
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
      withTechnicalMotives: withTechnicalMotives,
      motivoGeral: activeCycle.motivoGeralSolicitacao,
      veiculos: activeCycle.veiculosAbastecidos
    };

    const isWithMotives = docToDisplay.withTechnicalMotives !== undefined 
      ? docToDisplay.withTechnicalMotives 
      : withTechnicalMotives;

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
              Protocolo: <strong>{docToDisplay.numeroProtocolo}</strong>
            </div>
            <div className="dossier-mode-badge">
              {isWithMotives ? 'Dossiê Completo (com Motivo Técnico)' : 'Dossiê Simplificado (Apenas Valores/Cotas)'}
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
                Demonstrativo de solicitação de saldo de <strong>R$ 17.000,00</strong> para os veículos da frota ativa atendidos pela Ambipar.
                Veículos dedicados à Vale S.A. constam com cota <strong>R$ 0,00</strong> por receberem abastecimento fornecido diretamente pelo cliente.
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
                <span>Recargas Corporativas Abank</span>
              </div>
              <div className="doc-info-item">
                <label>VALOR TOTAL DO APORTE:</label>
                <strong style={{ color: '#166534', fontSize: '1.15rem' }}>
                  R$ {docToDisplay.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span>5 Veículos Abank | 2 Veículos Vale (R$ 0,00)</span>
              </div>
            </div>

            {/* 1. Bloco de Motivo Técnico (Renderizado se a opção marcada for com motivo) */}
            {isWithMotives && (
              <div className="doc-motivo-box">
                <h3>1. JUSTIFICATIVA TÉCNICA E OPERACIONAL DO VALOR SOLICITADO (R$ 17.000,00)</h3>
                <div className="motivo-content">
                  <p>
                    <strong>Fundamentação de Cálculo:</strong> O valor semanal de <strong>R$ 17.000,00</strong> é dimensionado com base no consumo histórico das transferências rodoviárias, coletas industriais e contingências da frota da Ambipar.
                  </p>
                  <div className="motivo-bullets">
                    <div className="bullet-row">
                      <strong>• Veículos da Operação Vale S.A. (Cota R$ 0,00):</strong> Os veículos <strong>RHU-6I87</strong> (Poli Duplo TIG Guaíba) e <strong>GEB-8C37</strong> (Delivery Baú Niterói) <em>NÃO recebem abastecimento da nossa parte e não possuem Cartão Abank</em>. O abastecimento desses veículos é 100% fornecido internamente pela Vale em seus terminais/minas e, por isso, suas cotas estão devidamente zeradas no aporte financeiro da Ambipar.
                    </div>
                    <div className="bullet-row">
                      <strong>• Amazon CD Meriti (GIG 1 / GIG 7 - Solicitação Esporádica):</strong> O atendimento aos CDs da Amazon GIG 1 e GIG 7 ocorre em caráter esporádico e sob demanda (não é rota fixa diária). A cota do veículo Roll-On FVV-0E16 (R$ 4.300,00) contempla saldo de prontidão no Cartão Abank para saídas imediatas quando a solicitação é emitida.
                    </div>
                    <div className="bullet-row">
                      <strong>• Consumo em Tomada de Força (PTO):</strong> Caminhão de Hidrovácuo (FMB-1H09) opera com motor a 1.400 RPM em sucção contínua e basculamento sem rodar odômetro.
                    </div>
                    <div className="bullet-row">
                      <strong>• Margem Significativa de Segurança (+11.8% = R$ 1.866,02):</strong> Margem técnica indispensável para cobrir retenções de trânsito intenso na Rodovia Presidente Dutra, Avenida Brasil e Linha Vermelha, garantindo que nenhum caminhão de resíduos perigosos sofra pane seca em trânsito.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Tabela de Divisão dos R$ 17.000,00 por Veículo */}
            <div className="doc-table-section" style={{ marginTop: '20px' }}>
              <h3>2. MATRIZ DE ALOCAÇÃO DOS R$ 17.000,00 POR VEÍCULO / CARTÃO ABANK</h3>
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Placa / Prefixo</th>
                    <th>Modelo & Operação</th>
                    <th>Status / Cartão Abank</th>
                    <th>KM Rodado</th>
                    <th>Diesel (L)</th>
                    <th>Gasto Real (R$)</th>
                    <th>Margem (+11.8%)</th>
                    <th className="highlight-col">Cota Aporte (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {(docToDisplay.veiculos || activeCycle.veiculosAbastecidos).map(v => (
                    <tr key={v.placa} className={!v.recebeAporteAmbipar ? 'tr-vale-zero' : ''}>
                      <td className="bold-cell">
                        <div>{v.placa}</div>
                        <small className="sub-tag">{v.prefixo}</small>
                      </td>
                      <td>
                        <div className="model-name">{v.modelo}</div>
                        <div className="op-tag">
                          {v.operacao}
                          {v.isSporadicGIG && <span className="badge-esporadico"> · ESPORÁDICO</span>}
                        </div>
                      </td>
                      <td className="center-cell bold-cell">
                        {v.recebeAporteAmbipar ? (
                          <span style={{ color: '#0284c7' }}>{v.cartaoNumero}</span>
                        ) : (
                          <span className="badge-vale-internal">Abastecimento Vale (Sem Cartão)</span>
                        )}
                      </td>
                      <td className="right-cell bold-cell">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                      <td className="right-cell">{v.recebeAporteAmbipar ? `${v.litrosDieselTotal} L` : '-'}</td>
                      <td className="right-cell">
                        {v.recebeAporteAmbipar 
                          ? `R$ ${v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                          : 'R$ 0,00'}
                      </td>
                      <td className="right-cell" style={{ color: v.recebeAporteAmbipar ? '#059669' : '#94a3b8' }}>
                        {v.recebeAporteAmbipar 
                          ? `+ R$ ${(v.margemSegurancaRS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                          : '-'}
                      </td>
                      <td className="right-cell highlight-col bold-cell">
                        {v.recebeAporteAmbipar 
                          ? `R$ ${v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                          : <span className="zero-val">R$ 0,00 (Vale)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="tfoot-totals">
                    <td colSpan="3"><strong>TOTAL CONSOLIDADO (5 VEÍCULOS ABANK + 2 VEÍCULOS VALE)</strong></td>
                    <td className="right-cell"><strong>{totals.totalKm.toLocaleString('pt-BR')} km</strong></td>
                    <td className="right-cell"><strong>{totals.totalDiesel.toLocaleString('pt-BR')} L</strong></td>
                    <td className="right-cell"><strong>R$ {docToDisplay.valorGastoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                    <td className="right-cell" style={{ color: '#059669' }}>
                      <strong>+ R$ {docToDisplay.valorMargemSeguranca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td className="right-cell highlight-col" style={{ fontSize: '1.05rem' }}>
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
            <span className="badge-cycle">
              {v.recebeAporteAmbipar 
                ? `Cota Abank: R$ ${v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                : 'Operação Vale · Cota R$ 0,00'}
            </span>
          </div>
        </header>

        <div className="detail-body-container">
          {/* Header Card do Veículo */}
          <div className="vehicle-summary-card">
            <div className="v-card-main">
              <div className="v-plate-badge">{v.placa}</div>
              <div>
                <h3>{v.modelo}</h3>
                <p className="v-op-sub">{v.operacao}</p>
                <div style={{ marginTop: '10px', color: '#cbd5e1', fontSize: '0.86rem', background: 'rgba(30, 41, 59, 0.6)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                  <strong>Justificativa Técnica da Cota ({v.recebeAporteAmbipar ? `R$ ${v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}):</strong>
                  <div style={{ marginTop: '4px', color: '#94a3b8' }}>{v.motivoTecnico}</div>
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
                <span>Cartão de Combustível</span>
                <strong>{v.recebeAporteAmbipar ? v.cartaoNumero : 'Sem Cartão'}</strong>
                <small>{v.recebeAporteAmbipar ? 'Abank Frota' : 'Abastecimento Direto Vale'}</small>
              </div>
              <div className="v-kpi highlight-kpi">
                <span>Cota Aporte Semanal</span>
                <strong style={{ color: v.recebeAporteAmbipar ? '#38bdf8' : '#94a3b8' }}>
                  {v.recebeAporteAmbipar 
                    ? `R$ ${v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                    : 'R$ 0,00 (Vale)'}
                </strong>
                <small>{v.recebeAporteAmbipar ? `Saldo est. atual: R$ ${v.saldoCartaoAtual.toFixed(2)}` : 'Abastecido na Mina/Terminal'}</small>
              </div>
            </div>
          </div>

          {/* Cupons e Comprovantes */}
          <div className="tickets-section">
            <div className="tickets-header">
              <h3>
                <Fuel size={20} className="icon-emerald" />
                <span>
                  {v.recebeAporteAmbipar 
                    ? 'Comprovantes de Abastecimento Realizados na Semana (Corte Quarta 17h)' 
                    : 'Registro de Abastecimento Interno pelo Cliente Vale S.A.'}
                </span>
              </h3>
              <span className="count-badge">
                {v.recebeAporteAmbipar 
                  ? `${v.abastecimentosDetalhe?.length || 0} comprovantes Abank` 
                  : 'Abastecimento Externo à Conta Ambipar'}
              </span>
            </div>

            <div className="tickets-list">
              {v.recebeAporteAmbipar && v.abastecimentosDetalhe && v.abastecimentosDetalhe.length > 0 ? (
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
                  <Info size={24} color="#06b6d4" />
                  <div>
                    <h4 style={{ color: '#ffffff', margin: '0 0 4px 0' }}>Veículo com Abastecimento Fornecido pela Vale</h4>
                    <p style={{ margin: 0, color: '#94a3b8' }}>
                      Este caminhão opera dedicado ao contrato da Vale S.A. Os abastecimentos ocorrem diretamente na estrutura do cliente e não geram transações no Cartão Abank da Ambipar, justificando a cota R$ 0,00 no aporte semanal.
                    </p>
                  </div>
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
            Consolidação dos gastos reais para solicitação de <strong>R$ 17.000,00</strong> no Cartão Abank toda <strong>quinta-feira pela manhã</strong>.
            Veículos da Vale constam com cota <strong>R$ 0,00</strong> (abastecimento pelo cliente).
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
              title="Copiar mensagem formatada para WhatsApp ou E-mail do Gestor"
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

      {/* Barra de Opção do Relatório (Com Motivo Técnico vs Sem Motivo Técnico) */}
      <section className="report-mode-toggle-bar">
        <div className="report-toggle-left">
          <div className="toggle-chip-label">
            <Sliders size={16} color="#38bdf8" />
            <span>Formato de Emissão do Aporte:</span>
          </div>
          
          <div className="toggle-buttons-group">
            <button
              type="button"
              className={`btn-toggle-option ${withTechnicalMotives ? 'active' : ''}`}
              onClick={() => setWithTechnicalMotives(true)}
              title="Inclui os 4 pilares técnicos, justificativa de cota R$ 0,00 na Vale e notas da Amazon"
            >
              <CheckCircle2 size={14} />
              <span>Gerar Relatório COM Motivo Técnico Detalhado</span>
            </button>

            <button
              type="button"
              className={`btn-toggle-option ${!withTechnicalMotives ? 'active' : ''}`}
              onClick={() => setWithTechnicalMotives(false)}
              title="Gera relatório executivo simplificado: apenas valores, cotas e cartões Abank"
            >
              <CheckCircle2 size={14} />
              <span>Gerar Relatório SEM Motivo (Apenas Valores e Cartões)</span>
            </button>
          </div>
        </div>

        <div className="report-toggle-right">
          <span className="mode-indicator-tag">
            {withTechnicalMotives ? '✓ Inclui Justificativa da Vale & Amazon GIG 1/7' : '⚡ Modo Resumo Rápido'}
          </span>
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
              <h3>Justificativa Operacional do Aporte (R$ 17.000,00) & Regras de Atendimento</h3>
              <p>Critérios técnicos de divisão dos 17k no Abank, isenção da Vale e atendimento esporádico da Amazon Meriti.</p>
            </div>
          </div>
          <button type="button" className="btn-toggle-motivo">
            {showMotivoDetails ? 'Ocultar Detalhes' : 'Ver Justificativa Completa'}
          </button>
        </div>

        {showMotivoDetails && (
          <div className="motivo-card-body animate-fade-in">
            <div className="motivo-pillars-grid">
              <div className="pillar-item pillar-vale">
                <div className="pillar-num" style={{ background: '#f59e0b' }}>1</div>
                <div>
                  <strong style={{ color: '#fbbf24' }}>Veículos da Vale S.A. (Cota R$ 0,00):</strong>
                  <span>Os caminhões dedicados à Vale (RHU-6I87 e GEB-8C37) <strong>não recebem abastecimento da nossa parte e não têm Cartão Abank</strong>. O diesel é 100% fornecido internamente pelo cliente em seus terminais.</span>
                </div>
              </div>

              <div className="pillar-item pillar-amazon">
                <div className="pillar-num" style={{ background: '#0284c7' }}>2</div>
                <div>
                  <strong style={{ color: '#38bdf8' }}>Amazon CD Meriti (GIG 1 / GIG 7 - Esporádico):</strong>
                  <span>A demanda com os CDs GIG 1 e GIG 7 da Amazon é <strong>esporádica / sob demanda</strong> (não é rota fixa diária). A cota do FVV-0E16 (R$ 4.300) garante saldo de prontidão no Abank para quando o chamado for aberto.</span>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-num">3</div>
                <div>
                  <strong>Tomada de Força (PTO) em Basculamento e Sucção:</strong>
                  <span>Caminhões de hidrovácuo e roll-on operam com o motor acelerado parados executando o serviço por horas consecutivas sem rodar odômetro, consumindo diesel estacionado.</span>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-num">4</div>
                <div>
                  <strong>Margem Significativa de Segurança (+11.8% = R$ 1.866,02):</strong>
                  <span>Provisão mandatória contra retenções severas na Dutra, Av. Brasil e Linha Vermelha para garantir que <strong>nenhum veículo com resíduos perigosos sofra pane seca em trânsito</strong>.</span>
                </div>
              </div>
            </div>

            <div className="motivo-summary-bar">
              <span><strong>Memória de Cálculo:</strong> 5 Veículos Ativos Ambipar (R$ 15.133,98 gasto previsto + R$ 1.866,02 margem técnica) = <strong>R$ 17.000,00 no Abank</strong> | 2 Veículos Vale = <strong>R$ 0,00</strong></span>
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
            <span>5 Cartões Abank Ativos</span>
            <span className="badge-plus">+R$ 1.866,02 margem (+11.8%)</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">VEÍCULOS NA VALE (COTA R$ 0,00)</span>
            <Building size={20} className="kpi-icon-yellow" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-value">{totals.veiculosValeZero}</span>
            <span className="kpi-unit">caminhões</span>
          </div>
          <div className="kpi-subtext">
            <span>Abastecidos diretamente pelo cliente</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">GASTO REAL PREVISTO (AMBIPAR)</span>
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
            <span className="kpi-label">KM RODADO PELA FROTA ATIVA</span>
            <Gauge size={20} className="kpi-icon-yellow" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-value">{totals.totalKm.toLocaleString('pt-BR')}</span>
            <span className="kpi-unit">km</span>
          </div>
          <div className="kpi-subtext">
            <span>Média da Frota Ativa: <strong>{totals.mediaFrotaKmL} km/l</strong></span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">COMBUSTÍVEL CONSUMIDO (ABANK)</span>
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

      {/* Tabela Interativa de Veículos e Divisão dos 17k */}
      <section className="vehicles-provision-table-section">
        <div className="table-controls-bar">
          <div className="table-title-group">
            <h3>Divisão Real dos R$ 17.000,00 no Cartão Abank (Fechamento Quarta 17h)</h3>
            <span className="table-count-pill">{filteredVehicles.length} veículos na matriz</span>
          </div>

          <div className="table-search-group">
            <div className="search-input-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar placa, modelo, operação..."
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
                <th>Operação / Regime</th>
                <th>Cartão Abank</th>
                <th>KM Rodado</th>
                <th>Diesel S10</th>
                <th>Gasto Real</th>
                <th>Margem Seg.</th>
                <th className="th-aporte">Cota do Aporte (R$)</th>
                <th className="th-action">Auditoria</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(v => {
                return (
                  <tr key={v.placa} className={`tr-vehicle-row ${!v.recebeAporteAmbipar ? 'tr-row-vale-zero' : ''}`}>
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
                      <div className="op-tag-badge">
                        {v.operacao}
                        {v.isSporadicGIG && (
                          <span className="badge-esporadico-inline"> · Esporádico</span>
                        )}
                      </div>
                    </td>

                    <td>
                      {v.recebeAporteAmbipar ? (
                        <span className="card-ref" style={{ color: '#38bdf8', fontWeight: 700 }}>
                          {v.cartaoNumero}
                        </span>
                      ) : (
                        <span className="badge-vale-no-card">
                          Sem Cartão (Direto Vale)
                        </span>
                      )}
                    </td>

                    <td className="km-val bold-text">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                    <td className="liters-val">
                      {v.recebeAporteAmbipar ? `${v.litrosDieselTotal} L` : '-'}
                    </td>

                    <td className="cost-val">
                      {v.recebeAporteAmbipar 
                        ? `R$ ${v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : 'R$ 0,00'}
                    </td>

                    <td className="cost-val" style={{ color: v.recebeAporteAmbipar ? '#10b981' : '#64748b' }}>
                      {v.recebeAporteAmbipar 
                        ? `+ R$ ${(v.margemSegurancaRS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : '-'}
                    </td>

                    <td className="td-aporte-val">
                      {v.recebeAporteAmbipar ? (
                        <>
                          <strong style={{ color: '#38bdf8' }}>
                            R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                          <small>Saldo est.: R$ {(v.saldoCartaoAtual || 0).toFixed(2)}</small>
                        </>
                      ) : (
                        <div className="vale-zero-box">
                          <strong style={{ color: '#94a3b8' }}>R$ 0,00</strong>
                          <small style={{ color: '#f59e0b' }}>Abastecido pela Vale</small>
                        </div>
                      )}
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
                        Auditar
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="tr-totals-footer">
                <td colSpan="4">
                  <strong>TOTAL DO APORTE (5 VEÍCULOS ABANK: R$ 17.000,00 | 2 VEÍCULOS VALE: R$ 0,00)</strong>
                </td>
                <td className="km-val">
                  <strong>{totals.totalKm.toLocaleString('pt-BR')} km</strong>
                </td>
                <td className="liters-val">
                  <strong>{totals.totalDiesel.toLocaleString('pt-BR')} L</strong>
                </td>
                <td className="cost-val">
                  <strong>R$ {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className="cost-val" style={{ color: '#10b981' }}>
                  <strong>+ R$ {totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className="td-aporte-val">
                  <strong className="grand-total" style={{ color: '#10b981', fontSize: '1.2rem' }}>
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
            <p>O analista confere os cupons da semana. Os carros da Vale constam com R$ 0,00 e o FVV-0E16 cobre a prontidão para Amazon GIG 1/7.</p>
          </div>
        </div>

        <div className="proc-col">
          <div className="proc-step-num">2</div>
          <div>
            <h4>Quinta-feira (08:00h da Manhã)</h4>
            <p>Escolha se deseja o relatório <strong>com</strong> ou <strong>sem</strong> motivo técnico e clique em <strong>"Gerar Documento de Aporte"</strong> ou <strong>"Copiar p/ WhatsApp"</strong>.</p>
          </div>
        </div>

        <div className="proc-col">
          <div className="proc-step-num">3</div>
          <div>
            <h4>Liberação do Saldo Abank</h4>
            <p>O gestor aprova a solicitação e o financeiro credita exatamente os R$ 17.000,00 divididos nos 5 cartões da frota ativa.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
