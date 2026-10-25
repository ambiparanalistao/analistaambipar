import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Fuel,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
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
  ToggleRight,
  Calculator,
  Lock,
  Unlock,
  ExternalLink,
  CalendarDays,
  CalendarCheck,
  RotateCcw,
  CalendarRange
} from 'lucide-react';
import {
  DEFAULT_CYCLE_SETTINGS,
  AUDITED_REAL_FLEET_PROVISION,
  INITIAL_WEEKLY_CYCLES,
  INITIAL_APORTE_DOCUMENTS_HISTORY,
  HISTORICAL_ACTIVE_FLEET_WEIGHTS,
  calculateCycleTotals,
  generateManagerWhatsAppMessage,
  exportCycleToCSV,
  distributeByHistoricalWeight,
  distributeEqually,
  distributeByKm,
  printAporteDossierCleanWindow
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

  // Estado de ciclos salvo localmente (Versão 8 - Quinta a Quarta Fechamento Quarta 17h)
  const [cycles, setCycles] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_weekly_fuel_cycles_v8');
      if (saved) return JSON.parse(saved);
      ['v1','v2','v3','v4','v5','v6','v7'].forEach(v => {
        localStorage.removeItem(`ambipar_weekly_fuel_cycles_${v}`);
        localStorage.removeItem(`ambipar_aporte_documents_history_${v}`);
        localStorage.removeItem(`ambipar_fuel_cycle_settings_${v}`);
        localStorage.removeItem(`ambipar_fuel_is_global_${v}`);
        localStorage.removeItem(`ambipar_fuel_target_total_${v}`);
        localStorage.removeItem(`ambipar_fuel_custom_quotas_${v}`);
      });
      return INITIAL_WEEKLY_CYCLES;
    } catch {
      return INITIAL_WEEKLY_CYCLES;
    }
  });

  // Histórico de Documentos Gerados
  const [documentsHistory, setDocumentsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_aporte_documents_history_v8');
      if (saved) return JSON.parse(saved);
      return INITIAL_APORTE_DOCUMENTS_HISTORY;
    } catch {
      return INITIAL_APORTE_DOCUMENTS_HISTORY;
    }
  });

  // Configurações do ciclo
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_cycle_settings_v8');
      if (saved) return JSON.parse(saved);
      return DEFAULT_CYCLE_SETTINGS;
    } catch {
      return DEFAULT_CYCLE_SETTINGS;
    }
  });

  // OPÇÃO 1: Modalidade de Aporte (Com Divisão por Veículo OU Aporte Global Sem Divisão)
  const [isGlobalAporte, setIsGlobalAporte] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_is_global_v8');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // OPÇÃO 2: Formato de Emissão (COM Motivo Técnico Detalhado OU SEM Motivo Técnico)
  const [withTechnicalMotives, setWithTechnicalMotives] = useState(true);

  // VALOR TOTAL ALVO DO APORTE (R$ 17.000,00 padrão, editável)
  const [targetTotalAporte, setTargetTotalAporte] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_target_total_v8');
      return saved ? Number(saved) : 17000.00;
    } catch {
      return 17000.00;
    }
  });

  // COTAS CUSTOMIZADAS POR VEÍCULO (Edição Manual ou Ajuste Automático)
  const [customVehicleQuotas, setCustomVehicleQuotas] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_fuel_custom_quotas_v8');
      if (saved) return JSON.parse(saved);
      const initial = {};
      AUDITED_REAL_FLEET_PROVISION.forEach(v => {
        initial[v.placa] = v.recebeAporteAmbipar ? v.solicitacaoAporteSugerido : 0;
      });
      return initial;
    } catch {
      const initial = {};
      AUDITED_REAL_FLEET_PROVISION.forEach(v => {
        initial[v.placa] = v.recebeAporteAmbipar ? v.solicitacaoAporteSugerido : 0;
      });
      return initial;
    }
  });

  // Modo de distribuição ativo ('historical' | 'equal' | 'km' | 'manual')
  const [distributionMode, setDistributionMode] = useState('historical');

  // Trava de segurança para veículos da Vale (evita edição acidental)
  const [allowValeOverride, setAllowValeOverride] = useState(false);

  // Persistência no LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_weekly_fuel_cycles_v8', JSON.stringify(cycles));
    } catch (e) {
      console.warn('Erro ao salvar ciclos:', e);
    }
  }, [cycles]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_aporte_documents_history_v8', JSON.stringify(documentsHistory));
    } catch (e) {
      console.warn('Erro ao salvar documentos:', e);
    }
  }, [documentsHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_fuel_cycle_settings_v8', JSON.stringify(settings));
    } catch (e) {
      console.warn('Erro ao salvar configurações do ciclo:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_fuel_is_global_v8', JSON.stringify(isGlobalAporte));
    } catch (e) {
      console.warn('Erro ao salvar modalidade de aporte:', e);
    }
  }, [isGlobalAporte]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_fuel_target_total_v8', String(targetTotalAporte));
    } catch (e) {
      console.warn('Erro ao salvar valor alvo do aporte:', e);
    }
  }, [targetTotalAporte]);

  useEffect(() => {
    try {
      localStorage.setItem('ambipar_fuel_custom_quotas_v8', JSON.stringify(customVehicleQuotas));
    } catch (e) {
      console.warn('Erro ao salvar cotas customizadas:', e);
    }
  }, [customVehicleQuotas]);

  // Ciclo Ativo
  const [selectedCycleId, setSelectedCycleId] = useState(cycles[0]?.id || 'CICLO-2026-W43');
  const activeCycle = useMemo(() => {
    return cycles.find(c => c.id === selectedCycleId) || cycles[0];
  }, [cycles, selectedCycleId]);

  // NOVO: FILTRO AMIGÁVEL POR DIA / PERÍODO
  // Ciclo Operacional CCO: Quinta a Quarta (Quinta 15/10 a Quarta 21/10)
  // 'ALL' = Semana Completa de Quinta a Quarta
  // 'YYYY-MM-DD' = Filtro de dia específico
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [customDateInput, setCustomDateInput] = useState('2026-10-21');

  // REGRA DE OURO SOLICITADA PELO USUÁRIO:
  // "O ideal era aparecer no aporte somente os veículos que foram abastecidos naquele período"
  // Ativado por padrão (true), com toggle para alternar entre "Somente Abastecidos" e "Toda a Frota (21)"
  const [onlyFueledVehicles, setOnlyFueledVehicles] = useState(true);

  // Margem de contingência operacional ajustável (padrão 11.8%)
  const [contingencyPct, setContingencyPct] = useState(activeCycle?.margemSegurancaPct || 11.8);

  // Formatação amigável de datas
  const formatDateFriendly = (dateStr) => {
    if (!dateStr || dateStr === 'ALL') return 'Semana Completa (15 a 21/10/2026 · Qui a Qua)';
    const [ano, mes, dia] = dateStr.split('-');
    const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const nomeDia = diasSemana[d.getDay()] || '';
    return `${nomeDia}, ${dia}/${mes}/${ano}`;
  };

  // Os 7 dias do ciclo operacional CCO: Quinta a Quarta
  const cycleDays = useMemo(() => {
    return [
      { date: '2026-10-15', label: 'Quinta (15/10)', dia: 'Quinta-feira' },
      { date: '2026-10-16', label: 'Sexta (16/10)', dia: 'Sexta-feira' },
      { date: '2026-10-17', label: 'Sábado (17/10)', dia: 'Sábado' },
      { date: '2026-10-18', label: 'Domingo (18/10)', dia: 'Domingo' },
      { date: '2026-10-19', label: 'Segunda (19/10)', dia: 'Segunda-feira' },
      { date: '2026-10-20', label: 'Terça (20/10)', dia: 'Terça-feira' },
      { date: '2026-10-21', label: 'Quarta (21/10)', dia: 'Quarta-feira', isClosing: true }
    ];
  }, []);

  // Contagem de abastecimentos por dia no ciclo ativo
  const dayCounts = useMemo(() => {
    const counts = {};
    if (activeCycle?.veiculosAbastecidos) {
      activeCycle.veiculosAbastecidos.forEach(v => {
        (v.abastecimentosDetalhe || []).forEach(s => {
          counts[s.data] = (counts[s.data] || 0) + 1;
        });
      });
    }
    return counts;
  }, [activeCycle]);

  // Alerta de abastecimento após o corte da quarta-feira 17h
  const isAfterCutoff = selectedDayFilter !== 'ALL' && selectedDayFilter >= '2026-10-22';

  // Processamento dinâmico da frota com base no período e data de abastecimento
  const processedFleet = useMemo(() => {
    if (!activeCycle?.veiculosAbastecidos) return [];

    return activeCycle.veiculosAbastecidos.map(v => {
      const isVale = !v.recebeAporteAmbipar;
      const allSupplies = v.abastecimentosDetalhe || [];

      // Filtra abastecimentos pela data se um dia específico foi selecionado
      let suppliesInPeriod = allSupplies;
      if (selectedDayFilter !== 'ALL') {
        suppliesInPeriod = allSupplies.filter(s => s.data === selectedDayFilter);
      }

      const hasSupplies = suppliesInPeriod.length > 0;
      const periodGasto = suppliesInPeriod.reduce((acc, s) => acc + (Number(s.valorTotal) || 0), 0);
      const periodDiesel = suppliesInPeriod.reduce((acc, s) => acc + (Number(s.dieselLitros) || 0), 0);
      const periodArla = suppliesInPeriod.reduce((acc, s) => acc + (Number(s.arlaLitros) || 0), 0);

      // Tags amigáveis dos dias de abastecimento dentro do filtro
      const periodDias = suppliesInPeriod.map(s => {
        const parts = s.data.split('-');
        const diaNum = parts[2];
        const mesNum = parts[1];
        return `${s.diaSemana.slice(0, 3)} (${diaNum}/${mesNum})`;
      });

      return {
        ...v,
        suppliesInPeriod,
        hasSupplies,
        periodSuppliesCount: suppliesInPeriod.length,
        periodGasto: selectedDayFilter === 'ALL' ? v.valorTotalGasto : periodGasto,
        periodDiesel: selectedDayFilter === 'ALL' ? v.litrosDieselTotal : periodDiesel,
        periodArla: selectedDayFilter === 'ALL' ? v.litrosArlaTotal : periodArla,
        periodKm: selectedDayFilter === 'ALL' ? v.kmRodado : (hasSupplies ? Math.round(v.kmRodado / (allSupplies.length || 1)) : 0),
        periodMargin: selectedDayFilter === 'ALL' ? (v.margemSegurancaRS || 0) : Number((periodGasto * (contingencyPct / 100)).toFixed(2)),
        periodDias: periodDias.length > 0 ? periodDias : v.diasAbastecimento
      };
    });
  }, [activeCycle, selectedDayFilter, contingencyPct]);

  // Contagem de veículos com abastecimento no período ativo
  const countFueledInActivePeriod = useMemo(() => {
    return processedFleet.filter(v => v.hasSupplies).length;
  }, [processedFleet]);

  // Modo de visualização de tela cheia (SEM NENHUM POP-UP!)
  const [viewMode, setViewMode] = useState('dashboard');
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState(null);
  const [activeDossierDocument, setActiveDossierDocument] = useState(null);

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState('Todas as Operações (21)');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showMotivoDetails, setShowMotivoDetails] = useState(true);

  // Soma das cotas atribuídas aos veículos ativos
  const allocatedQuotasSum = useMemo(() => {
    if (!activeCycle?.veiculosAbastecidos) return 0;
    return activeCycle.veiculosAbastecidos.reduce((acc, v) => {
      if (v.recebeAporteAmbipar) {
        const q = customVehicleQuotas[v.placa] !== undefined 
          ? Number(customVehicleQuotas[v.placa]) 
          : Number(v.solicitacaoAporteSugerido);
        return acc + (isNaN(q) ? 0 : q);
      }
      return acc;
    }, 0);
  }, [activeCycle, customVehicleQuotas]);

  // Diferença entre o Total Alvo e a Soma das Cotas
  const balanceDifference = useMemo(() => {
    return Number((targetTotalAporte - allocatedQuotasSum).toFixed(2));
  }, [targetTotalAporte, allocatedQuotasSum]);

  const isBalanced = Math.abs(balanceDifference) < 0.01;

  // Totais consolidados do ciclo ativo (reflete cotas customizadas e modalidade global)
  const totals = useMemo(() => {
    return calculateCycleTotals(
      activeCycle,
      contingencyPct,
      customVehicleQuotas,
      isGlobalAporte,
      targetTotalAporte
    );
  }, [activeCycle, contingencyPct, customVehicleQuotas, isGlobalAporte, targetTotalAporte]);

  // Lista de veículos filtrados considerando:
  // 1. Somente veículos abastecidos no período (quando ativado, padrão)
  // 2. Filtro textual
  // 3. Filtro por operação
  const filteredVehicles = useMemo(() => {
    return processedFleet.filter(v => {
      // Se a opção "Somente Abastecidos no Período" estiver ativa, oculta quem não abasteceu
      if (onlyFueledVehicles && !v.hasSupplies) {
        return false;
      }

      const matchSearch =
        v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.prefixo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.operacao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchOp =
        operationFilter === 'Todas as Operações (21)' ||
        operationFilter === 'Todas' ||
        (operationFilter === 'Ambipar Abank (15)' && v.recebeAporteAmbipar) ||
        (operationFilter === 'Contrato Vale S.A. (6)' && v.isValeOperation) ||
        (operationFilter === 'Amazon Meriti GIG 1/7' && (v.isSporadicGIG || v.operacao.includes('Amazon')));
      return matchSearch && matchOp;
    });
  }, [processedFleet, onlyFueledVehicles, searchTerm, operationFilter]);

  // Totais dinâmicos do período/dia selecionado
  const currentPeriodTotals = useMemo(() => {
    const displayed = filteredVehicles;
    const totalGasto = displayed.reduce((acc, v) => acc + (Number(v.periodGasto) || 0), 0);
    const totalKm = displayed.reduce((acc, v) => acc + (Number(v.periodKm) || 0), 0);
    const totalDiesel = displayed.reduce((acc, v) => acc + (Number(v.periodDiesel) || 0), 0);
    const totalArla = displayed.reduce((acc, v) => acc + (Number(v.periodArla) || 0), 0);
    const totalMargem = displayed.reduce((acc, v) => acc + (Number(v.periodMargin) || 0), 0);

    return {
      totalVeiculosVisiveis: displayed.length,
      totalGasto,
      totalKm,
      totalDiesel,
      totalArla,
      totalMargem
    };
  }, [filteredVehicles]);

  // Operações para filtro rápido
  const availableOperations = [
    'Todas as Operações (21)',
    'Ambipar Abank (15)',
    'Contrato Vale S.A. (6)',
    'Amazon Meriti GIG 1/7'
  ];

  // AÇÕES DO ASSISTENTE AUTOMÁTICO DE DISTRIBUIÇÃO
  const handleApplyHistorical = () => {
    const quotas = distributeByHistoricalWeight(targetTotalAporte, activeCycle.veiculosAbastecidos);
    setCustomVehicleQuotas(quotas);
    setDistributionMode('historical');
  };

  const handleApplyEqual = () => {
    const quotas = distributeEqually(targetTotalAporte, activeCycle.veiculosAbastecidos);
    setCustomVehicleQuotas(quotas);
    setDistributionMode('equal');
  };

  const handleApplyKm = () => {
    const quotas = distributeByKm(targetTotalAporte, activeCycle.veiculosAbastecidos);
    setCustomVehicleQuotas(quotas);
    setDistributionMode('km');
  };

  const handleResetDefault = () => {
    setTargetTotalAporte(17000.00);
    const quotas = distributeByHistoricalWeight(17000.00, activeCycle.veiculosAbastecidos);
    setCustomVehicleQuotas(quotas);
    setDistributionMode('historical');
  };

  const handleVehicleQuotaChange = (placa, val) => {
    const num = Math.max(0, Number(val) || 0);
    setCustomVehicleQuotas(prev => ({
      ...prev,
      [placa]: num
    }));
    setDistributionMode('manual');
  };

  const handleAutoBalanceDifference = () => {
    // Aloca a diferença pendente no cavalo mecânico rodoviário (EWX-0I82), maior consumidor
    setCustomVehicleQuotas(prev => {
      const currentEwx = prev['EWX-0I82'] !== undefined ? Number(prev['EWX-0I82']) : 6200;
      const adjusted = Math.max(0, currentEwx + balanceDifference);
      return {
        ...prev,
        'EWX-0I82': Number(adjusted.toFixed(2))
      };
    });
  };

  const handleSetTargetToAllocatedSum = () => {
    setTargetTotalAporte(allocatedQuotasSum);
  };

  // Copiar resumo formatado para o WhatsApp
  const handleCopyWhatsAppMessage = () => {
    const text = generateManagerWhatsAppMessage(
      activeCycle,
      settings,
      contingencyPct,
      withTechnicalMotives,
      isGlobalAporte,
      customVehicleQuotas
    );
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3500);
    }).catch(err => {
      console.error('Falha ao copiar:', err);
    });
  };

  // Exportar CSV
  const handleExportCSV = () => {
    exportCycleToCSV(activeCycle, contingencyPct, isGlobalAporte, customVehicleQuotas);
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
      isGlobalAporte: isGlobalAporte,
      customQuotas: customVehicleQuotas,
      status: 'PRONTO_ENVIO',
      statusLabel: 'Emitido · Aguardando Liberação Abank pelo Gestor',
      motivoGeral: isGlobalAporte
        ? `Aporte Global Unificado de R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} na Conta Master Abank sem divisão rígida por veículo. Veículos da Vale mantidos em R$ 0,00.`
        : `Aporte Semanal com Divisão de Cotas individuais nos cartões Abank da frota ativa. Veículos da Vale mantidos em R$ 0,00.`,
      veiculos: filteredVehicles
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

  // Abertura de Janela Limpa Independente para PDF Perfeito (Zero bugs)
  const handlePrintCleanStandalone = (docToPrint) => {
    printAporteDossierCleanWindow(
      docToPrint,
      docToPrint.isGlobalAporte !== undefined ? docToPrint.isGlobalAporte : isGlobalAporte,
      docToPrint.withTechnicalMotives !== undefined ? docToPrint.withTechnicalMotives : withTechnicalMotives,
      docToPrint.customQuotas || customVehicleQuotas
    );
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
      isGlobalAporte: isGlobalAporte,
      customQuotas: customVehicleQuotas,
      motivoGeral: activeCycle.motivoGeralSolicitacao,
      veiculos: filteredVehicles
    };

    const isWithMotives = docToDisplay.withTechnicalMotives !== undefined 
      ? docToDisplay.withTechnicalMotives 
      : withTechnicalMotives;

    const isDocGlobal = docToDisplay.isGlobalAporte !== undefined
      ? docToDisplay.isGlobalAporte
      : isGlobalAporte;

    const quotasInDoc = docToDisplay.customQuotas || customVehicleQuotas;

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
            <div className={`dossier-mode-badge ${isDocGlobal ? 'badge-mode-global' : 'badge-mode-division'}`}>
              {isDocGlobal ? '🏢 Aporte Global Master (Sem Divisão)' : '🚛 Aporte com Divisão por Veículo'}
            </div>
            <div className="dossier-mode-badge">
              {isWithMotives ? 'Dossiê Técnico Completo' : 'Dossiê Simplificado'}
            </div>
          </div>
          <div className="dossier-topbar-right">
            <button
              type="button"
              className="btn-print-clean-action"
              onClick={() => handlePrintCleanStandalone(docToDisplay)}
              title="Abre o documento em janela limpa independente, formatado em A4 oficial sem qualquer interferência de layout"
            >
              <ExternalLink size={17} />
              <span>PDF Limpo A4 (Sem Bugs)</span>
            </button>
            <button
              type="button"
              className="btn-print-action"
              onClick={() => window.print()}
              title="Imprimir direto desta página"
            >
              <Printer size={17} />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              className="btn-copy-action"
              onClick={handleCopyWhatsAppMessage}
            >
              <Copy size={17} />
              <span>{copySuccess ? 'Copiado!' : 'Copiar p/ Gestor'}</span>
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
                Demonstrativo corporativo de solicitação de saldo de <strong>R$ {docToDisplay.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
                Modalidade: <strong>{isDocGlobal ? 'Aporte Global Unificado (Saldo Centralizado Master Abank)' : 'Aporte com Divisão por Veículo (Cotas Nominais nos Cartões)'}</strong>.
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
                <strong style={{ color: '#166534', fontSize: '1.18rem' }}>
                  R$ {docToDisplay.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span>{isDocGlobal ? 'Conta Master Central Abank' : '5 Veículos Abank | 2 Vale (R$ 0,00)'}</span>
              </div>
            </div>

            {/* Bloco Executivo de Aporte Global (Se modalidade global) */}
            {isDocGlobal && (
              <div className="doc-global-aporte-box">
                <h3>MODALIDADE EXECUTIVA: APORTE GLOBAL UNIFICADO NA CONTA MASTER ABANK</h3>
                <p>
                  O saldo de <strong>R$ {docToDisplay.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> é solicitado como aporte único e centralizado na <strong>Conta Master Abank Frota Corporativa</strong>, sem divisões rígidas prévias de limites por cartão.
                </p>
                <div className="global-motivos-list">
                  <div>• <strong>Flexibilidade Dinâmica:</strong> Permite à Torre de Controle CCO suprir as demandas diárias dos 5 caminhões ativos da frota Ambipar sem travas rígidas de teto individual por cartão, adaptando-se a itinerários que demandem mais quilometragem na semana.</div>
                  <div>• <strong>Cobertura sob Demanda (Amazon CD Meriti - GIG 1 e GIG 7):</strong> Absorve saídas e viagens esporádicas imediatamente assim que solicitadas, sem necessidade de remanejamento burocrático de saldos entre cartões.</div>
                  <div>• <strong>Isenção da Vale S.A. (Cota R$ 0,00):</strong> Os veículos <strong>RHU-6I87</strong> e <strong>GEB-8C37</strong> NÃO consomem este saldo global, pois são 100% abastecidos nos terminais do cliente Vale.</div>
                </div>
              </div>
            )}

            {/* 1. Bloco de Motivo Técnico (Renderizado se a opção marcada for com motivo) */}
            {isWithMotives && (
              <div className="doc-motivo-box">
                <h3>1. JUSTIFICATIVA TÉCNICA E OPERACIONAL DO VALOR SOLICITADO (R$ {docToDisplay.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</h3>
                <div className="motivo-content">
                  <p>
                    <strong>Fundamentação de Cálculo:</strong> O valor semanal de <strong>R$ {docToDisplay.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> é dimensionado com base no consumo histórico das transferências rodoviárias, coletas industriais e contingências da frota da Ambipar.
                  </p>
                  <div className="motivo-bullets">
                    <div className="bullet-row">
                      <strong>• Veículos da Operação Vale S.A. (Cota R$ 0,00):</strong> Os veículos <strong>RHU-6I87</strong> (Poli Duplo TIG Guaíba) e <strong>GEB-8C37</strong> (Delivery Baú Niterói) <em>NÃO recebem abastecimento da nossa parte e não possuem Cartão Abank</em>. O abastecimento desses veículos é 100% fornecido internamente pela Vale em seus terminais/minas e, por isso, suas cotas estão devidamente zeradas no aporte financeiro da Ambipar.
                    </div>
                    <div className="bullet-row">
                      <strong>• Amazon CD Meriti (GIG 1 / GIG 7 - Solicitação Esporádica):</strong> O atendimento aos CDs da Amazon GIG 1 e GIG 7 ocorre em caráter esporádico e sob demanda (não é rota fixa diária). A provisão alocada contempla saldo de prontidão no Cartão Abank para saídas imediatas quando a solicitação é emitida.
                    </div>
                    <div className="bullet-row">
                      <strong>• Consumo em Tomada de Força (PTO):</strong> Caminhão de Hidrovácuo (FMB-1H09) opera com motor a 1.400 RPM em sucção contínua e basculamento sem rodar odômetro.
                    </div>
                    <div className="bullet-row">
                      <strong>• Margem Significativa de Segurança (+11.8% = R$ {docToDisplay.valorMargemSeguranca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}):</strong> Margem técnica indispensável para cobrir retenções de trânsito intenso na Rodovia Presidente Dutra, Avenida Brasil e Linha Vermelha, garantindo que nenhum caminhão de resíduos perigosos sofra pane seca em trânsito.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Tabela de Matriz Operacional */}
            <div className="doc-table-section" style={{ marginTop: '20px' }}>
              <h3>{isDocGlobal ? '2. MATRIZ DE REFERÊNCIA OPERACIONAL DA FROTA (CONSUMO HISTÓRICO E KM)' : '2. MATRIZ DE ALOCAÇÃO DE COTAS POR VEÍCULO / CARTÃO ABANK'}</h3>
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
                    <th className="highlight-col">{isDocGlobal ? 'Alocação do Saldo' : 'Cota Aporte (R$)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(docToDisplay.veiculos || activeCycle.veiculosAbastecidos).map(v => {
                    const isVale = !v.recebeAporteAmbipar;
                    const quota = quotasInDoc && quotasInDoc[v.placa] !== undefined 
                      ? quotasInDoc[v.placa] 
                      : v.solicitacaoAporteSugerido;

                    return (
                      <tr key={v.placa} className={isVale ? 'tr-vale-zero' : ''}>
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
                          {!isVale ? (
                            <span style={{ color: '#0284c7' }}>{v.cartaoNumero}</span>
                          ) : (
                            <span className="badge-vale-internal">Abastecimento Vale (Sem Cartão)</span>
                          )}
                        </td>
                        <td className="right-cell bold-cell">{v.kmRodado.toLocaleString('pt-BR')} km</td>
                        <td className="right-cell">{!isVale ? `${v.litrosDieselTotal} L` : '-'}</td>
                        <td className="right-cell">
                          {!isVale 
                            ? `R$ ${v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                            : 'R$ 0,00'}
                        </td>
                        <td className="right-cell" style={{ color: !isVale ? '#059669' : '#94a3b8' }}>
                          {!isVale 
                            ? `+ R$ ${(v.margemSegurancaRS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                            : '-'}
                        </td>
                        <td className="right-cell highlight-col bold-cell">
                          {isVale ? (
                            <span className="zero-val">R$ 0,00 (Vale)</span>
                          ) : isDocGlobal ? (
                            <span style={{ color: '#0369a1', fontSize: '0.85rem' }}>Saldo Master Abank</span>
                          ) : (
                            `R$ ${Number(quota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
    const currentQuota = customVehicleQuotas[v.placa] !== undefined
      ? customVehicleQuotas[v.placa]
      : v.solicitacaoAporteSugerido;

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
                ? (isGlobalAporte 
                    ? 'Modalidade: Saldo Global Master Abank' 
                    : `Cota Abank: R$ ${Number(currentQuota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
                : 'Operação Vale · Cota R$ 0,00'}
            </span>
          </div>
        </header>

        <div className="detail-body-container">
          <div className="vehicle-summary-card">
            <div className="v-card-main">
              <div className="v-plate-badge">{v.placa}</div>
              <div>
                <h3>{v.modelo}</h3>
                <p className="v-op-sub">{v.operacao}</p>
                <div style={{ marginTop: '10px', color: '#cbd5e1', fontSize: '0.86rem', background: 'rgba(30, 41, 59, 0.6)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                  <strong>Justificativa Técnica ({v.recebeAporteAmbipar ? (isGlobalAporte ? 'Saldo Global Master' : `Cota R$ ${Number(currentQuota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`) : 'R$ 0,00'}):</strong>
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
                <span>Alocação do Aporte</span>
                <strong style={{ color: v.recebeAporteAmbipar ? '#38bdf8' : '#94a3b8' }}>
                  {v.recebeAporteAmbipar 
                    ? (isGlobalAporte 
                        ? 'Saldo Master' 
                        : `R$ ${Number(currentQuota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
                    : 'R$ 0,00 (Vale)'}
                </strong>
                <small>{v.recebeAporteAmbipar ? `Saldo est. atual: R$ ${v.saldoCartaoAtual.toFixed(2)}` : 'Abastecido na Mina/Terminal'}</small>
              </div>
            </div>
          </div>

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
                    <span>Visualizar no Sistema</span>
                  </button>
                  <button
                    type="button"
                    className="btn-open-doc-clean"
                    onClick={() => handlePrintCleanStandalone(doc)}
                    title="Abre direto em janela limpa A4 para impressão e salvamento em PDF"
                  >
                    <ExternalLink size={16} />
                    <span>Imprimir / PDF Limpo</span>
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
            Consolidação dos gastos reais para solicitação de <strong>R$ {targetTotalAporte.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> no Cartão Abank toda <strong>quinta-feira pela manhã</strong>.
            Matriz completa com os <strong>21 veículos da base</strong> (15 veículos Ambipar + 6 veículos dedicados à Vale S.A. com cota R$ 0,00).
          </p>
        </div>

        <div className="banner-controls-col">
          {/* NOVO: NAVEGADOR INTELIGENTE DE PERÍODO & FILTRO POR DIA */}
          <div className="period-navigator-card">
            <div className="period-header-row">
              <div className="cycle-main-selector">
                <label className="period-nav-label">
                  <Calendar size={14} className="text-emerald" />
                  PERÍODO DO APORTE:
                </label>
                <select
                  value={selectedCycleId}
                  onChange={e => {
                    setSelectedCycleId(e.target.value);
                    setSelectedDayFilter('ALL');
                  }}
                  className="cycle-nav-select"
                >
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome || (c.id === 'CICLO-2026-W43' 
                        ? 'Semana Atual · 15 a 21/Out/2026 (Quinta a Quarta · Fechamento Quarta)' 
                        : 'Semana Anterior · 08 a 14/Out/2026 (Quinta a Quarta)')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="period-routine-tag">
                <Clock size={13} className="text-cyan" />
                <span>Ciclo: Quinta a Quarta · Fechamento Quarta 17:00h ➔ Solicitação Quinta 08:00h</span>
              </div>
            </div>

            {/* ABAS DE SELEÇÃO RÁPIDA DOS 7 DIAS DO CICLO (QUINTA A QUARTA) */}
            <div className="day-filter-tabs">
              <button
                type="button"
                className={`day-tab-btn ${selectedDayFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedDayFilter('ALL')}
                title="Visualizar a semana completa de Quinta a Quarta com todos os veículos abastecidos"
              >
                <CalendarDays size={14} />
                <span>Semana Completa</span>
                <span className="day-count-badge">15 veíc.</span>
              </button>

              {cycleDays.map(cd => {
                const count = dayCounts[cd.date] || 0;
                return (
                  <button
                    key={cd.date}
                    type="button"
                    className={`day-tab-btn ${selectedDayFilter === cd.date ? 'active' : ''}`}
                    onClick={() => setSelectedDayFilter(cd.date)}
                    title={`Filtrar abastecimentos de ${cd.label}${cd.isClosing ? ' (Fechamento do ciclo até 17h00)' : ''}`}
                  >
                    <span>{cd.label}</span>
                    <span className={`day-count-badge ${cd.isClosing ? 'badge-closing' : ''}`}>
                      {count} abastec.
                    </span>
                  </button>
                );
              })}

              {/* Seletor Customizado de Data no Calendário */}
              <div className="custom-date-picker-box">
                <label htmlFor="custom-date-filter" title="Escolha qualquer dia no calendário">
                  <Calendar size={13} />
                  <span>Outro Dia:</span>
                </label>
                <input
                  id="custom-date-filter"
                  type="date"
                  className="custom-date-input"
                  value={selectedDayFilter !== 'ALL' ? selectedDayFilter : customDateInput}
                  onChange={e => {
                    const val = e.target.value;
                    setCustomDateInput(val);
                    setSelectedDayFilter(val);
                  }}
                  min="2026-10-01"
                  max="2026-10-31"
                />
                {selectedDayFilter !== 'ALL' && (
                  <button
                    type="button"
                    className="btn-clear-day-filter"
                    onClick={() => setSelectedDayFilter('ALL')}
                    title="Limpar filtro e voltar para o ciclo completo (Qui a Qua)"
                  >
                    ✕ Limpar
                  </button>
                )}
              </div>
            </div>
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
              className="btn-action-clean-pdf"
              onClick={() => handlePrintCleanStandalone({
                numeroProtocolo: 'AMB-APORTE-2026-W43/PREVIEW',
                valorTotalSolicitado: totals.totalAporteSugerido,
                valorGastoReal: totals.totalGasto,
                valorMargemSeguranca: totals.margemTotalRS,
                totalKm: totals.totalKm,
                totalDiesel: totals.totalDiesel,
                gestorNome: settings.gestorNome,
                gestorCargo: settings.gestorCargo,
                analistaNome: settings.analistaResponsavel,
                analistaCargo: settings.analistaCargo,
                convenio: settings.convenioPadrao,
                isGlobalAporte: isGlobalAporte,
                withTechnicalMotives: withTechnicalMotives,
                veiculos: filteredVehicles
              })}
              title="Abre o documento oficial em janela limpa independente, formatado em folha A4 oficial para salvar em PDF sem bugs visuais"
            >
              <Printer size={16} />
              <span>Imprimir / Salvar PDF Limpo</span>
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
              <span>Histórico ({documentsHistory.length})</span>
            </button>

            <button
              type="button"
              className="btn-action-secondary"
              onClick={handleExportCSV}
              title="Exportar planilha Excel/CSV do Aporte"
            >
              <Download size={16} />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </section>

      {/* Alerta de Abastecimento Após o Fechamento de Quarta */}
      {isAfterCutoff && (
        <section className="cutoff-notice-banner animate-fade-in" role="alert">
          <AlertCircle size={22} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Abastecimento de Quinta-feira ({formatDateFriendly(selectedDayFilter)}) em Diante:</strong>
            <p>
              Conforme a regra do CCO, o fechamento dos abastecimentos para o aporte de quinta-feira encerra na <strong>quarta-feira às 17h00</strong>. 
              Abastecimentos a partir de quinta-feira <strong>já pertencem ao próximo ciclo semanal</strong>. O aporte atual contempla exclusivamente o período de <strong>Quinta (15/10) a Quarta (21/10)</strong>.
            </p>
          </div>
          <button
            type="button"
            className="btn-reset-to-full-week"
            onClick={() => setSelectedDayFilter('ALL')}
            title="Voltar para o ciclo semanal atual (Qui a Qua)"
          >
            <RotateCcw size={15} />
            <span>Ver Ciclo Atual</span>
          </button>
        </section>
      )}

      {/* Banner Informativo quando um Dia Específico do Ciclo está Selecionado */}
      {selectedDayFilter !== 'ALL' && !isAfterCutoff && (
        <section className="active-day-filter-banner animate-fade-in">
          <div className="active-day-banner-content">
            <div className="active-day-icon-circle">
              <CalendarCheck size={20} className="text-emerald" />
            </div>
            <div>
              <div className="active-day-title">
                <strong>FILTRANDO POR DIA ESPECÍFICO: {formatDateFriendly(selectedDayFilter).toUpperCase()}</strong>
                <span className="active-day-chip">{filteredVehicles.length} {filteredVehicles.length === 1 ? 'veículo abastecido' : 'veículos abastecidos'}</span>
              </div>
              <p className="active-day-desc">
                Exibindo somente os caminhões com abastecimentos registrados nesta data. Gasto real do dia: <strong>R$ {currentPeriodTotals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ({currentPeriodTotals.totalDiesel} Litros Diesel S10).
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-reset-to-full-week"
            onClick={() => setSelectedDayFilter('ALL')}
            title="Voltar a exibir o período completo da semana (Quinta a Quarta)"
          >
            <RotateCcw size={15} />
            <span>Ver Semana Completa (Qui a Qua)</span>
          </button>
        </section>
      )}

      {/* Barra Dupla de Configuração Operacional do Aporte */}
      <section className="report-mode-toggle-bar">
        {/* Bloco 1: Escolha entre Com Divisão vs Aporte Global Sem Divisão */}
        <div className="report-toggle-left">
          <div className="toggle-chip-label">
            <Wallet size={16} color="#38bdf8" />
            <span>Modalidade do Aporte:</span>
          </div>
          
          <div className="toggle-buttons-group">
            <button
              type="button"
              className={`btn-toggle-option ${!isGlobalAporte ? 'active' : ''}`}
              onClick={() => setIsGlobalAporte(false)}
              title="Aloca cotas nominais de combustível para cada cartão Abank dos 5 veículos ativos"
            >
              <CheckCircle2 size={14} />
              <span>🚛 Com Divisão por Veículo (Cotas nos Cartões)</span>
            </button>

            <button
              type="button"
              className={`btn-toggle-option ${isGlobalAporte ? 'active' : ''}`}
              onClick={() => setIsGlobalAporte(true)}
              title="Solicita o valor total como saldo único na Conta Master Abank para consumo flexível sem divisões rígidas"
            >
              <CheckCircle2 size={14} />
              <span>🏢 Aporte Global Sem Divisão (Saldo Master Abank)</span>
            </button>
          </div>
        </div>

        {/* Bloco 2: Formato de Justificativa (Com Motivo Técnico vs Sem Motivo Técnico) */}
        <div className="report-toggle-right">
          <div className="toggle-chip-label">
            <Sliders size={16} color="#10b981" />
            <span>Formato do Relatório:</span>
          </div>

          <div className="toggle-buttons-group">
            <button
              type="button"
              className={`btn-toggle-option ${withTechnicalMotives ? 'active' : ''}`}
              onClick={() => setWithTechnicalMotives(true)}
              title="Inclui os 4 pilares técnicos, justificativa de cota R$ 0,00 na Vale e notas da Amazon"
            >
              <CheckCircle2 size={14} />
              <span>COM Motivo Técnico Detalhado</span>
            </button>

            <button
              type="button"
              className={`btn-toggle-option ${!withTechnicalMotives ? 'active' : ''}`}
              onClick={() => setWithTechnicalMotives(false)}
              title="Gera relatório executivo simplificado: apenas valores, cotas e cartões Abank"
            >
              <CheckCircle2 size={14} />
              <span>SEM Motivo (Apenas Valores)</span>
            </button>
          </div>
        </div>
      </section>

      {/* SE MODO APORTE GLOBAL ATIVO: Card Informativo da Conta Master Abank */}
      {isGlobalAporte && (
        <section className="global-aporte-banner-card animate-fade-in">
          <div className="global-banner-header">
            <div className="global-header-left">
              <div className="global-icon-wrap">
                <Building size={22} color="#38bdf8" />
              </div>
              <div>
                <h3>Modalidade Ativa: Aporte Global Unificado na Conta Master Abank (Sem Divisão por Veículo)</h3>
                <p>O saldo total fica centralizado na conta corporativa Master da Abank, permitindo à Torre CCO gerenciar os abastecimentos da frota ativa de forma dinâmica sem bloquear caminhões por travas individuais.</p>
              </div>
            </div>

            <div className="global-amount-edit-box">
              <label>Valor Total do Aporte Global Solicitado:</label>
              <div className="amount-input-row">
                <span className="currency-prefix">R$</span>
                <input
                  type="number"
                  step="100"
                  min="1000"
                  className="global-amount-input"
                  value={targetTotalAporte}
                  onChange={e => setTargetTotalAporte(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>
          </div>

          <div className="global-banner-footer">
            <div className="global-rule-pill">
              <ShieldCheck size={14} color="#f59e0b" />
              <span><strong>Regra Vale S.A.:</strong> Caminhões RHU-6I87 e GEB-8C37 estão excluídos deste aporte (abastecimento 100% pelo cliente na mina/terminal).</span>
            </div>
            <div className="global-rule-pill">
              <Sparkles size={14} color="#38bdf8" />
              <span><strong>Amazon Meriti (GIG 1 / GIG 7):</strong> Viagens esporádicas e sob demanda são atendidas diretamente pelo saldo Master.</span>
            </div>
          </div>
        </section>
      )}

      {/* SE MODO COM DIVISÃO ATIVO: Central de Ajuda Automática e Edição Manual das Cotas */}
      {!isGlobalAporte && (
        <section className="distribution-helper-card animate-fade-in">
          <div className="helper-card-header">
            <div className="helper-header-left">
              <div className="helper-icon-wrap">
                <Calculator size={20} color="#10b981" />
              </div>
              <div>
                <h3>Central de Divisão do Aporte: Ajuda Automática & Edição Manual</h3>
                <p>Ajuste as cotas dos veículos em 1 clique com as bases automáticas abaixo ou digite diretamente o valor na tabela.</p>
              </div>
            </div>

            <div className="helper-target-box">
              <label>Valor Alvo do Aporte a Dividir:</label>
              <div className="helper-input-row">
                <span className="currency-prefix">R$</span>
                <input
                  type="number"
                  step="100"
                  min="1000"
                  className="helper-target-input"
                  value={targetTotalAporte}
                  onChange={e => setTargetTotalAporte(Math.max(0, Number(e.target.value) || 0))}
                  title="Digite o valor total que deseja dividir entre os veículos"
                />
              </div>
            </div>
          </div>

          <div className="helper-card-body">
            <div className="preset-buttons-grid">
              <button
                type="button"
                className={`btn-preset-auto ${distributionMode === 'historical' ? 'active-preset' : ''}`}
                onClick={handleApplyHistorical}
                title="Aplica pesos históricos de consumo da frota ativa: EWX ~36.5%, FVV ~25.3%, FMB ~20.6%, RAW ~8.8%, GBU ~8.8%"
              >
                <Sparkles size={15} />
                <span>⚡ Ajuste Automático por Consumo Histórico (Recomendado CCO)</span>
              </button>

              <button
                type="button"
                className={`btn-preset-auto ${distributionMode === 'equal' ? 'active-preset' : ''}`}
                onClick={handleApplyEqual}
                title="Divide o total igualmente entre os 5 veículos ativos da Ambipar"
              >
                <Sliders size={15} />
                <span>⚖️ Dividir Igualmente entre os 5 Veículos Ativos</span>
              </button>

              <button
                type="button"
                className={`btn-preset-auto ${distributionMode === 'km' ? 'active-preset' : ''}`}
                onClick={handleApplyKm}
                title="Distribui o valor proporcionalmente aos quilômetros rodados na semana"
              >
                <Gauge size={15} />
                <span>🛣️ Dividir Proporcional ao KM Rodado da Semana</span>
              </button>

              <button
                type="button"
                className="btn-preset-reset"
                onClick={handleResetDefault}
                title="Restaura a grade oficial calibrada de R$ 17.000,00 da Ambipar"
              >
                <RefreshCw size={15} />
                <span>🔄 Restaurar Padrão CCO (R$ 17.000,00)</span>
              </button>
            </div>

            {/* Barra de Status do Balanceamento em Tempo Real */}
            <div className={`balance-status-bar ${isBalanced ? 'status-balanced' : 'status-unbalanced'}`}>
              <div className="balance-info-left">
                {isBalanced ? (
                  <>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span><strong>Total 100% Balanceado:</strong> As cotas somam exatamente <strong>R$ {allocatedQuotasSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> (igual ao valor alvo).</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} color="#f59e0b" />
                    <span>
                      <strong>Diferença de Alocação:</strong> Soma das Cotas = <strong>R$ {allocatedQuotasSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> | Valor Alvo = <strong>R$ {targetTotalAporte.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> (Diferença: <strong style={{ color: balanceDifference > 0 ? '#38bdf8' : '#f43f5e' }}>{balanceDifference > 0 ? `+R$ ${balanceDifference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sobrando` : `-R$ ${Math.abs(balanceDifference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} excedido`}</strong>)
                    </span>
                  </>
                )}
              </div>

              {!isBalanced && (
                <div className="balance-actions-right">
                  <button
                    type="button"
                    className="btn-balance-fix"
                    onClick={handleAutoBalanceDifference}
                    title="Aloca o saldo excedente/faltante automaticamente no EWX-0I82 (cavalo mecânico de maior percurso)"
                  >
                    <span>⚡ Ajustar Diferença no EWX-0I82</span>
                  </button>

                  <button
                    type="button"
                    className="btn-balance-update-target"
                    onClick={handleSetTargetToAllocatedSum}
                    title="Atualiza o valor total solicitado do aporte para igualar à soma digitada"
                  >
                    <span>Definir Alvo para R$ {allocatedQuotasSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Card Oficial do Motivo da Solicitação dos R$ 17.000,00 e Margem Técnica */}
      <section className="motivo-solicitacao-card">
        <div className="motivo-card-header" onClick={() => setShowMotivoDetails(!showMotivoDetails)}>
          <div className="motivo-header-left">
            <div className="motivo-icon-wrap">
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <div>
              <h3>Justificativa Operacional do Aporte & Regras de Atendimento</h3>
              <p>Critérios técnicos do valor solicitado no Abank, isenção da Vale e atendimento esporádico da Amazon Meriti.</p>
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
                  <span>A demanda com os CDs GIG 1 e GIG 7 da Amazon é <strong>esporádica / sob demanda</strong> (não é rota fixa diária). A provisão do aporte garante saldo de prontidão no Abank para quando o chamado for aberto.</span>
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
                  <strong>Margem Significativa de Segurança (+11.8% = R$ {totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}):</strong>
                  <span>Provisão mandatória contra retenções severas na Dutra, Av. Brasil e Linha Vermelha para garantir que <strong>nenhum veículo com resíduos perigosos sofra pane seca em trânsito</strong>.</span>
                </div>
              </div>
            </div>

            <div className="motivo-summary-bar">
              <span><strong>Memória de Cálculo:</strong> 5 Veículos Ativos Ambipar (R$ {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gasto previsto + R$ {totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} margem técnica) = <strong>R$ {totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no Abank</strong> | 2 Veículos Vale = <strong>R$ 0,00</strong></span>
            </div>
          </div>
        )}
      </section>

      {/* Grid de KPIs Consolidados */}
      <section className="kpi-cards-grid">
        <div className="kpi-card highlight-card-blue">
          <div className="kpi-card-header">
            <span className="kpi-label">TOTAL SOLICITADO P/ APORTE (ABANK)</span>
            <Wallet size={20} className="kpi-icon-cyan" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-currency">R$</span>
            <span className="kpi-big-value">
              {totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="kpi-subtext">
            <span>{isGlobalAporte ? 'Conta Master Unificada' : '15 Cartões Abank Ativos'}</span>
            <span className="badge-plus">+R$ {totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} margem</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">VEÍCULOS NA VALE S.A. (R$ 0,00)</span>
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

      {/* Tabela Interativa de Veículos e Divisão de Cotas */}
      <section className="vehicles-provision-table-section">
        <div className="table-controls-bar">
          <div className="table-title-group">
            <h3>
              {isGlobalAporte 
                ? 'Matriz de Consumo da Frota (Referência para o Aporte Global Master Abank)' 
                : 'Divisão de Cotas por Veículo / Cartão Abank (Edição Manual e Automática)'}
            </h3>
            <div className="table-badges-row">
              <span className="table-count-pill">
                <strong>{filteredVehicles.length}</strong> {filteredVehicles.length === 1 ? 'veículo exibido' : 'veículos exibidos'} {onlyFueledVehicles ? '(somente abastecidos no período)' : '(frota completa da base)'}
              </span>
              {selectedDayFilter !== 'ALL' && (
                <span className="table-day-active-pill">
                  {formatDateFriendly(selectedDayFilter)}
                </span>
              )}
            </div>
          </div>

          <div className="table-search-group">
            {/* SEGMENTED TOGGLE: SOMENTE ABASTECIDOS NO PERÍODO vs TODA A FROTA (21) */}
            <div className="fueled-toggle-segmented" title="Regra do aporte: alterne para ver somente os veículos abastecidos no período ou toda a frota">
              <button
                type="button"
                className={`btn-seg-toggle ${onlyFueledVehicles ? 'active' : ''}`}
                onClick={() => setOnlyFueledVehicles(true)}
              >
                <Fuel size={14} />
                <span>Somente Abastecidos ({countFueledInActivePeriod})</span>
              </button>

              <button
                type="button"
                className={`btn-seg-toggle ${!onlyFueledVehicles ? 'active' : ''}`}
                onClick={() => setOnlyFueledVehicles(false)}
              >
                <Truck size={14} />
                <span>Toda a Frota (21)</span>
              </button>
            </div>

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
                <th>Dias Abastecimento</th>
                <th>KM no Período</th>
                <th>Diesel S10</th>
                <th>Gasto Real</th>
                <th>Margem Seg.</th>
                <th className="th-aporte">
                  {isGlobalAporte ? 'Alocação Master' : 'Cota do Aporte (R$)'}
                </th>
                <th className="th-action">Auditoria</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(v => {
                const isVale = !v.recebeAporteAmbipar;
                const quota = customVehicleQuotas[v.placa] !== undefined 
                  ? customVehicleQuotas[v.placa] 
                  : v.solicitacaoAporteSugerido;

                return (
                  <tr key={v.placa} className={`tr-vehicle-row ${isVale ? 'tr-row-vale-zero' : ''}`}>
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
                      {!isVale ? (
                        <span className="card-ref" style={{ color: '#38bdf8', fontWeight: 700 }}>
                          {v.cartaoNumero}
                        </span>
                      ) : (
                        <span className="badge-vale-no-card">
                          Sem Cartão (Direto Vale)
                        </span>
                      )}
                    </td>

                    {/* Coluna de Dias / Abastecimentos no Período */}
                    <td>
                      {!isVale ? (
                        <div className="dias-badge-container">
                          {v.periodDias && v.periodDias.length > 0 ? (
                            v.periodDias.map((dia, idx) => (
                              <span key={idx} className="day-chip-tag">
                                {dia}
                              </span>
                            ))
                          ) : (
                            <span className="day-chip-tag-none">Sem abastec.</span>
                          )}
                        </div>
                      ) : (
                        <span className="badge-vale-no-card">Interno Vale S.A.</span>
                      )}
                    </td>

                    <td className="km-val bold-text">
                      {Number(v.periodKm || 0).toLocaleString('pt-BR')} km
                    </td>
                    <td className="liters-val">
                      {!isVale ? `${Number(v.periodDiesel || 0).toLocaleString('pt-BR')} L` : '-'}
                    </td>

                    <td className="cost-val">
                      {!isVale 
                        ? `R$ ${Number(v.periodGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : 'R$ 0,00'}
                    </td>

                    <td className="cost-val" style={{ color: !isVale ? '#10b981' : '#64748b' }}>
                      {!isVale 
                        ? `+ R$ ${Number(v.periodMargin || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : '-'}
                    </td>

                    <td className="td-aporte-val">
                      {isVale ? (
                        <div className="vale-zero-box">
                          <strong style={{ color: '#94a3b8' }}>R$ 0,00</strong>
                          <small style={{ color: '#f59e0b' }}>Abastecido pela Vale</small>
                        </div>
                      ) : isGlobalAporte ? (
                        <div className="global-allocation-box">
                          <strong style={{ color: '#38bdf8' }}>Saldo Master</strong>
                          <small>Estimado: R$ {v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</small>
                        </div>
                      ) : (
                        <div className="quota-edit-cell">
                          <div className="quota-input-wrapper">
                            <span className="quota-prefix">R$</span>
                            <input
                              type="number"
                              step="50"
                              min="0"
                              className="quota-num-input"
                              value={quota}
                              onChange={e => handleVehicleQuotaChange(v.placa, e.target.value)}
                              title="Edite o valor da cota deste caminhão manualmente"
                            />
                          </div>
                          <small className="quota-card-balance">Saldo est.: R$ {(v.saldoCartaoAtual || 0).toFixed(2)}</small>
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
                <td colSpan="5">
                  <strong>
                    {isGlobalAporte 
                      ? `TOTAL CONSOLIDADO NO PERÍODO (${currentPeriodTotals.totalVeiculosVisiveis} VEÍCULOS EXIBIDOS):`
                      : `TOTAL CONSOLIDADO NO PERÍODO (${currentPeriodTotals.totalVeiculosVisiveis} VEÍCULOS EXIBIDOS):`}
                  </strong>
                </td>
                <td className="km-val">
                  <strong>{currentPeriodTotals.totalKm.toLocaleString('pt-BR')} km</strong>
                </td>
                <td className="liters-val">
                  <strong>{currentPeriodTotals.totalDiesel.toLocaleString('pt-BR')} L</strong>
                </td>
                <td className="cost-val">
                  <strong>R$ {currentPeriodTotals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className="cost-val" style={{ color: '#10b981' }}>
                  <strong>+ R$ {currentPeriodTotals.totalMargem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td className="td-aporte-val">
                  <strong className="grand-total" style={{ color: '#10b981', fontSize: '1.2rem' }}>
                    R$ {totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
            <p>O analista confere os cupons da semana. Escolha entre <strong>Aporte com Divisão por Veículo</strong> ou <strong>Aporte Global Sem Divisão</strong>. Os carros da Vale constam com R$ 0,00 e o FVV-0E16 cobre a prontidão da Amazon GIG 1/7.</p>
          </div>
        </div>

        <div className="proc-col">
          <div className="proc-step-num">2</div>
          <div>
            <h4>Quinta-feira (08:00h da Manhã)</h4>
            <p>Escolha se deseja o relatório <strong>com</strong> ou <strong>sem</strong> motivo técnico e clique em <strong>"Gerar Documento de Aporte"</strong>, <strong>"Imprimir / Salvar PDF Limpo"</strong> ou <strong>"Copiar p/ WhatsApp"</strong>.</p>
          </div>
        </div>

        <div className="proc-col">
          <div className="proc-step-num">3</div>
          <div>
            <h4>Liberação do Saldo Abank</h4>
            <p>O gestor aprova a solicitação e o financeiro credita o saldo solicitado no Cartão Abank Corporativo sem erros ou divergências operacionais.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
