import { presentCentralText } from '../utils/centralBranding';
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
  calculateCycleTotals,
  generateManagerWhatsAppMessage,
  exportCycleToCSV,
  distributeByHistoricalWeight,
  distributeEqually,
  distributeByKm,
  printAporteDossierCleanWindow
} from '../data/weeklyFuelProvisionData';
import { supabase } from '../lib/supabaseClient';
import './WeeklyFuelProvisionModule.css';

export default function WeeklyFuelProvisionModule({ user, companyId, onNavigateModule }) {
  // Sincronização com o extrato real de abastecimentos do sistema
  const [realFuelRecords, setRealFuelRecords] = useState([]);

  // Estado de ciclos salvo localmente (Versão 8 - Quinta a Quarta Fechamento Quarta 17h)
  const [cycles, setCycles] = useState([]);

  // Histórico de Documentos Gerados
  const [documentsHistory, setDocumentsHistory] = useState([]);

  // Configurações do ciclo
  const [settings, setSettings] = useState(DEFAULT_CYCLE_SETTINGS);

  // OPÇÃO 1: Modalidade de Aporte (Com Divisão por Veículo OU Aporte Global Sem Divisão)
  const [isGlobalAporte, setIsGlobalAporte] = useState(false);

  // OPÇÃO 2: Formato de Emissão (COM Motivo Técnico Detalhado OU SEM Motivo Técnico)
  const [withTechnicalMotives, setWithTechnicalMotives] = useState(true);

  // Valor total alvo configurado pela empresa ou salvo neste navegador.
  const [targetTotalAporte, setTargetTotalAporte] = useState(0);

  // COTAS CUSTOMIZADAS POR VEÍCULO (Edição Manual ou Ajuste Automático)
  const [customVehicleQuotas, setCustomVehicleQuotas] = useState({});
  const [databaseLoading, setDatabaseLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState('');
  const [databaseReady, setDatabaseReady] = useState(false);
  const [settingsCompanyId, setSettingsCompanyId] = useState('');
  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      if (!supabase || !companyId) {
        setDatabaseReady(false); setSettingsCompanyId(''); setCycles([]); setDocumentsHistory([]); setRealFuelRecords([]);
        setSettings(DEFAULT_CYCLE_SETTINGS); setIsGlobalAporte(false); setTargetTotalAporte(0); setCustomVehicleQuotas({});
        setDatabaseLoading(false); return;
      }
      setDatabaseLoading(true); setDatabaseError('');
      setDatabaseReady(false); setSettingsCompanyId(''); setCycles([]); setDocumentsHistory([]); setRealFuelRecords([]);
      setSettings(DEFAULT_CYCLE_SETTINGS); setIsGlobalAporte(false); setTargetTotalAporte(0); setCustomVehicleQuotas({});
      const [cycleResult, documentResult, settingsResult, fuelResult] = await Promise.all([
        supabase.from('fuel_provision_cycles').select('*').eq('company_id', companyId).order('periodo_inicio', { ascending: false }),
        supabase.from('fuel_provision_documents').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
        supabase.from('fuel_provision_settings').select('settings').eq('company_id', companyId).maybeSingle(),
        supabase.from('fuel_transactions').select('*').eq('company_id', companyId).order('occurred_at', { ascending: false }),
      ]);
      if (cancelled) return;
      if (cycleResult.error || documentResult.error || settingsResult.error || fuelResult.error) {
        setDatabaseError(cycleResult.error?.message || documentResult.error?.message || settingsResult.error?.message || fuelResult.error?.message || 'Não foi possível carregar o histórico financeiro.');
        setDatabaseLoading(false); return;
      }
      const importedCycles = (cycleResult.data || []).map(row => {
        const source = row.source_payload || {};
        return { ...source, id: source.id || row.id, databaseId: row.id, nome: row.nome || source.nome || '',
          periodoInicio: source.periodoInicio || row.periodo_inicio, periodoFim: source.periodoFim || row.periodo_fim,
          dataCorteQuarta: source.dataCorteQuarta || row.data_corte, dataEnvioQuinta: source.dataEnvioQuinta || row.data_envio,
          margemSegurancaPct: Number(row.margem_seguranca_pct) || 0, valorTotalAporteAlvo: Number(row.valor_total_aporte_alvo) || 0,
          motivoGeralSolicitacao: row.motivo_geral || source.motivoGeralSolicitacao || '', veiculosAbastecidos: source.veiculosAbastecidos || [] };
      });
      setCycles(importedCycles);
      const importedDocuments = (documentResult.data || []).map(row => ({ ...(row.snapshot || {}), id: row.snapshot?.id || row.id, databaseId: row.id,
        numeroProtocolo: row.numero_protocolo || row.snapshot?.numeroProtocolo || '' }));
      setDocumentsHistory(importedDocuments);
      const savedSettings = settingsResult.data?.settings || {};
      setSettings(savedSettings.profile || DEFAULT_CYCLE_SETTINGS);
      setIsGlobalAporte(typeof savedSettings.isGlobalAporte === 'boolean' ? savedSettings.isGlobalAporte : false);
      setTargetTotalAporte(Number(savedSettings.targetTotalAporte) || 0);
      setCustomVehicleQuotas(savedSettings.customVehicleQuotas || {});
      setRealFuelRecords((fuelResult.data || []).map(row => ({ ...(row.source_payload || {}), id: row.source_payload?.id || row.source_key || row.id,
        placa: row.source_payload?.placa || row.placa_snapshot || '', data_abastecimento: row.source_payload?.data_abastecimento || row.occurred_at?.slice(0,10) || '',
        tipo_combustivel: row.source_payload?.tipo_combustivel || row.combustivel || '', litros: row.source_payload?.litros ?? row.litros ?? 0,
        valor_total: row.source_payload?.valor_total ?? row.valor_total ?? 0 })));
      setSettingsCompanyId(companyId);
      setDatabaseReady(true);
      setDatabaseLoading(false);
    };
    loadHistory().catch(error => { if (!cancelled) { setDatabaseError(error.message || 'Falha ao carregar o histórico.'); setDatabaseLoading(false); } });
    return () => { cancelled = true; };
  }, [companyId]);

  useEffect(() => {
    if (!databaseReady || settingsCompanyId !== companyId || !supabase || !companyId) return;
    supabase.from('fuel_provision_settings').upsert({ company_id: companyId, updated_by: user?.id || null,
      settings: { profile: settings, isGlobalAporte, targetTotalAporte, customVehicleQuotas } }, { onConflict: 'company_id' })
      .then(({ error }) => { if (error) setDatabaseError(error.message); });
  }, [databaseReady, settingsCompanyId, companyId, user?.id, settings, isGlobalAporte, targetTotalAporte, customVehicleQuotas]);
  // Modo de distribuição ativo ('historical' | 'equal' | 'km' | 'manual')
  const [distributionMode, setDistributionMode] = useState('historical');

  // Trava de segurança para veículos da Vale (evita edição acidental)
  const [allowValeOverride, setAllowValeOverride] = useState(false);

  // Ciclo Ativo
  const [selectedCycleId, setSelectedCycleId] = useState(cycles[0]?.id || '');
  useEffect(() => { if (!selectedCycleId && cycles[0]?.id) setSelectedCycleId(cycles[0].id); }, [cycles, selectedCycleId]);
  const activeCycle = useMemo(() => {
    return cycles.find(c => c.id === selectedCycleId) || cycles[0] || { id: '', nome: '', veiculosAbastecidos: [] };
  }, [cycles, selectedCycleId]);

  // NOVO: FILTRO AMIGÁVEL POR DIA / PERÍODO
  // O período é lido do ciclo selecionado.
  // 'ALL' = Semana Completa de Quinta a Quarta
  // 'YYYY-MM-DD' = Filtro de dia específico
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [customDateInput, setCustomDateInput] = useState(() => new Date().toISOString().slice(0, 10));

  // REGRA DE OURO SOLICITADA PELO USUÁRIO:
  // "O ideal era aparecer no aporte somente os veículos que foram abastecidos naquele período"
  // Ativado por padrão (true), com toggle para alternar entre "Somente Abastecidos" e "Toda a Frota (21)"
  const [onlyFueledVehicles, setOnlyFueledVehicles] = useState(true);

  // Margem de contingência operacional ajustável (padrão 11.8%)
  const [contingencyPct, setContingencyPct] = useState(activeCycle?.margemSegurancaPct || 0);

  // Formatação amigável de datas
  const formatDateFriendly = (dateStr) => {
    if (!dateStr || dateStr === 'ALL') return 'Período completo';
    const [ano, mes, dia] = dateStr.split('-');
    const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const nomeDia = diasSemana[d.getDay()] || '';
    return `${nomeDia}, ${dia}/${mes}/${ano}`;
  };

  const cycleDays = useMemo(() => {
    const start = new Date(`${activeCycle.periodoInicio || activeCycle.dataCorteQuarta || ''}T00:00:00`);
    const end = new Date(`${activeCycle.periodoFim || activeCycle.dataCorteQuarta || ''}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
    const days = [];
    for (const date = new Date(start); date <= end && days.length < 31; date.setDate(date.getDate() + 1)) {
      const iso = date.toISOString().slice(0, 10);
      days.push({ date: iso, label: date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }), dia: date.toLocaleDateString('pt-BR', { weekday: 'long' }), isClosing: iso === String(activeCycle.dataCorteQuarta || '').slice(0, 10) });
    }
    return days;
  }, [activeCycle]);

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
  const cutoffDay = String(activeCycle.dataCorteQuarta || activeCycle.periodoFim || '').slice(0, 10);
  const isAfterCutoff = Boolean(cutoffDay && selectedDayFilter !== 'ALL' && selectedDayFilter > cutoffDay);

  // Processamento dinâmico da frota com base no período e data de abastecimento
  const processedFleet = useMemo(() => {
    if (!activeCycle?.veiculosAbastecidos) return [];

    return activeCycle.veiculosAbastecidos.map(v => {
      const isVale = v.recebeAporteAmbipar === false || v.isValeOperation === true;
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
        periodGasto: selectedDayFilter === 'ALL' ? Number(v.valorTotalGasto) || 0 : periodGasto,
        periodDiesel: selectedDayFilter === 'ALL' ? Number(v.litrosDieselTotal) || 0 : periodDiesel,
        periodArla: selectedDayFilter === 'ALL' ? Number(v.litrosArlaTotal) || 0 : periodArla,
        periodKm: selectedDayFilter === 'ALL' ? Number(v.kmRodado) || 0 : (hasSupplies ? Math.round((Number(v.kmRodado) || 0) / (allSupplies.length || 1)) : 0),
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
  const [operationFilter, setOperationFilter] = useState('Todas');
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
        String(v.placa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(v.modelo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(v.prefixo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(v.operacao || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchOp =
        operationFilter === 'Todas' ||
        operationFilter === v.operacao;
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
  const availableOperations = ['Todas', ...new Set(processedFleet.map(v => v.operacao).filter(Boolean))];

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
    const defaultTarget = Number(activeCycle.valorTotalAporteAlvo) || 0;
    setTargetTotalAporte(defaultTarget);
    const quotas = distributeByHistoricalWeight(defaultTarget, activeCycle.veiculosAbastecidos);
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
    const vehicle = activeCycle.veiculosAbastecidos.find(v => v.recebeAporteAmbipar !== false);
    if (!vehicle) return;
    setCustomVehicleQuotas(prev => {
      const current = Number(prev[vehicle.placa] ?? vehicle.solicitacaoAporteSugerido) || 0;
      const adjusted = Math.max(0, current + balanceDifference);
      return {
        ...prev,
        [vehicle.placa]: Number(adjusted.toFixed(2))
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
  const handleGenerateOfficialDocument = async () => {
    if (!activeCycle.id || !companyId || !supabase) { setDatabaseError('Selecione uma empresa e um ciclo antes de emitir o documento.'); return; }
    const nextSeq = documentsHistory.length + 1;
    const protocolCode = `APORTE-${String(activeCycle.periodoInicio || new Date().toISOString().slice(0,10)).replaceAll('-', '')}-${String(nextSeq).padStart(3, '0')}`;
    
    const newDoc = {
      id: crypto.randomUUID(),
      numeroProtocolo: protocolCode,
      cicloId: activeCycle.id,
      cicloNome: activeCycle.nome,
      dataFechamento: activeCycle.dataCorteQuarta,
      dataSolicitacao: new Date().toISOString(),
      gestorNome: settings.gestorNome,
      gestorCargo: settings.gestorCargo,
      analistaNome: settings.analistaResponsavel,
      analistaCargo: presentCentralText(settings.analistaCargo),
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
      motivoGeral: activeCycle.motivoGeralSolicitacao || '',
      veiculos: filteredVehicles
    };
    const { error } = await supabase.from('fuel_provision_documents').insert({ company_id: companyId,
      source_key: newDoc.id, cycle_id: activeCycle.databaseId || null, numero_protocolo: protocolCode,
      data_fechamento: String(activeCycle.dataCorteQuarta || '').slice(0,10) || null,
      data_solicitacao: new Date().toISOString().slice(0,10), snapshot: newDoc, created_by: user?.id || null });
    if (error) { setDatabaseError(error.message || 'Não foi possível salvar o relatório no Supabase.'); return; }
    setDatabaseError('');
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
  if (databaseLoading && !cycles.length) return <section className="weekly-fuel-provision-module" role="status">Carregando histórico financeiro da empresa…</section>;
  if (!activeCycle.id && viewMode !== 'dossier') return <section className="weekly-fuel-provision-module"><h1>Aporte semanal</h1>{databaseError && <p role="alert">{databaseError}</p>}<p>Nenhum ciclo de aporte está cadastrado para esta empresa.</p></section>;
  if (viewMode === 'dossier') {
    const docToDisplay = activeDossierDocument || {
      numeroProtocolo: '',
      dataFechamento: activeCycle.dataCorteQuarta,
      dataSolicitacao: activeCycle.dataEnvioQuinta,
      gestorNome: settings.gestorNome,
      gestorCargo: settings.gestorCargo,
      analistaNome: settings.analistaResponsavel,
      analistaCargo: presentCentralText(settings.analistaCargo),
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
                  <p>Gestão Integrada de Frotas & Torre de Controle Central de Gestão · Base Duque de Caxias / RJ</p>
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
                <label>ANALISTA Central de Gestão SOLICITANTE:</label>
                <strong>{docToDisplay.analistaNome}</strong>
                <span>{presentCentralText(docToDisplay.analistaCargo)}</span>
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
                <span>{isDocGlobal ? 'Aporte global' : `${docToDisplay.totalVeiculos || 0} veículos no ciclo`}</span>
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
                  <div>• <strong>Alocação centralizada:</strong> O valor fica disponível para distribuição conforme os abastecimentos registrados no ciclo.</div>
                  <div>• <strong>Referência do período:</strong> {activeCycle.periodoInicio || 'Não informado'} a {activeCycle.periodoFim || 'Não informado'}.</div>
                  <div>• <strong>Veículos incluídos:</strong> {(docToDisplay.veiculos || activeCycle.veiculosAbastecidos || []).length} registros associados ao ciclo.</div>
                </div>
              </div>
            )}

            {/* 1. Bloco de Motivo Técnico (Renderizado se a opção marcada for com motivo) */}
            {isWithMotives && (
              <div className="doc-motivo-box">
                <h3>1. JUSTIFICATIVA TÉCNICA E OPERACIONAL DO VALOR SOLICITADO (R$ {docToDisplay.valorTotalSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</h3>
                <div className="motivo-content">
                  <p>
                    <strong>Justificativa informada:</strong> {docToDisplay.motivoGeral || 'Nenhuma justificativa foi informada para este ciclo.'}
                  </p>
                  <div className="motivo-bullets">
                    <div className="bullet-row">
                      <strong>• Registros sem aporte:</strong> {(docToDisplay.veiculos || activeCycle.veiculosAbastecidos || []).filter(v => v.recebeAporteAmbipar === false || v.isValeOperation === true).length} veículos estão marcados no ciclo como não elegíveis ao aporte.
                    </div>
                    <div className="bullet-row">
                      <strong>• Operações especiais:</strong> {docToDisplay.motivoGeral || 'Nenhuma regra operacional especial foi registrada para este ciclo.'}
                    </div>
                    <div className="bullet-row">
                      <strong>• Consumo com veículo parado:</strong> Registre essa condição na justificativa do ciclo quando aplicável.
                    </div>
                    <div className="bullet-row">
                      <strong>• Margem de segurança:</strong> R$ {docToDisplay.valorMargemSeguranca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, conforme a taxa configurada para este ciclo.
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
                    const isVale = v.recebeAporteAmbipar === false || v.isValeOperation === true;
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
                <span>{presentCentralText(docToDisplay.analistaCargo)} (Solicitante Central de Gestão)</span>
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
                    : 'Sem registro de cartão/aporte neste ciclo'}
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
                      Este veículo está marcado como não elegível ao aporte neste ciclo. Confira o cadastro e a justificativa operacional antes de emitir o relatório.
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
            <span>{activeCycle.dataCorteQuarta ? `Fechamento: ${new Date(activeCycle.dataCorteQuarta).toLocaleString('pt-BR')}` : 'Ciclo de aporte da empresa'}</span>
          </div>
          <h1>Aporte Semanal & Solicitação de Saldo de Combustível</h1>
          <p>
            Consolidação dos dados do ciclo selecionado para preparar a solicitação de aporte. Convênio: <strong>{settings.convenioPadrao || 'não informado'}</strong>.
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
                      {c.nome || `${c.periodoInicio || 'Início não informado'} a ${c.periodoFim || 'fim não informado'}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="period-routine-tag">
                <Clock size={13} className="text-cyan" />
                <span>Período: {activeCycle.periodoInicio || '—'} a {activeCycle.periodoFim || '—'} · Envio: {activeCycle.dataEnvioQuinta ? new Date(activeCycle.dataEnvioQuinta).toLocaleString('pt-BR') : 'não informado'}</span>
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
                <span className="day-count-badge">{activeCycle.veiculosAbastecidos.length} veículos</span>
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
                  min={activeCycle.periodoInicio || undefined}
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
                numeroProtocolo: 'PRÉVIA',
                valorTotalSolicitado: totals.totalAporteSugerido,
                valorGastoReal: totals.totalGasto,
                valorMargemSeguranca: totals.margemTotalRS,
                totalKm: totals.totalKm,
                totalDiesel: totals.totalDiesel,
                gestorNome: settings.gestorNome,
                gestorCargo: settings.gestorCargo,
                analistaNome: settings.analistaResponsavel,
                analistaCargo: presentCentralText(settings.analistaCargo),
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
              Conforme a regra do Central de Gestão, o fechamento dos abastecimentos para o aporte de quinta-feira encerra na <strong>quarta-feira às 17h00</strong>. 
              O período considerado é o intervalo cadastrado no ciclo selecionado. Registros fora desse intervalo pertencem a outro ciclo.
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
              title="Inclui a justificativa e as observações cadastradas no ciclo"
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
                <p>O saldo total fica centralizado na conta corporativa Master da Abank, permitindo à Torre Central de Gestão gerenciar os abastecimentos da frota ativa de forma dinâmica sem bloquear caminhões por travas individuais.</p>
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
              <span><strong>Veículos não elegíveis:</strong> os marcados no cadastro como fora do aporte serão excluídos da divisão.</span>
            </div>
            <div className="global-rule-pill">
              <Sparkles size={14} color="#38bdf8" />
              <span><strong>Aporte global:</strong> o valor permanece centralizado quando essa modalidade estiver selecionada.</span>
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
                <span>⚡ Ajuste Automático por Consumo Histórico (Recomendado Central de Gestão)</span>
              </button>

              <button
                type="button"
                className={`btn-preset-auto ${distributionMode === 'equal' ? 'active-preset' : ''}`}
                onClick={handleApplyEqual}
                title="Divide o total igualmente entre os 5 veículos ativos da Ambipar"
              >
                <Sliders size={15} />
                <span>⚖️ Dividir igualmente entre os veículos elegíveis</span>
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
                title="Restaura o valor alvo cadastrado para o ciclo selecionado"
              >
                <RefreshCw size={15} />
                <span>🔄 Restaurar valor do ciclo</span>
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
                    title="Aloca o saldo excedente ou faltante no primeiro veículo elegível"
                  >
                    <span>⚡ Ajustar diferença automaticamente</span>
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

      {/* Justificativa registrada para o ciclo ativo */}
      <section className="motivo-solicitacao-card">
        <div className="motivo-card-header" onClick={() => setShowMotivoDetails(!showMotivoDetails)}>
          <div className="motivo-header-left">
            <div className="motivo-icon-wrap">
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <div>
              <h3>Justificativa Operacional do Aporte & Regras de Atendimento</h3>
              <p>Justificativa e critérios operacionais informados para este ciclo.</p>
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
                  <strong style={{ color: '#fbbf24' }}>Veículos sem aporte:</strong>
                  <span>{totals.veiculosValeZero} veículo(s) estão marcados como não elegíveis neste ciclo.</span>
                </div>
              </div>

              <div className="pillar-item pillar-amazon">
                <div className="pillar-num" style={{ background: '#0284c7' }}>2</div>
                <div>
                  <strong style={{ color: '#38bdf8' }}>Observações do ciclo:</strong>
                  <span>{activeCycle.motivoGeralSolicitacao || 'Nenhuma observação adicional foi cadastrada.'}</span>
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
              <span><strong>Memória de cálculo:</strong> gasto do período R$ {totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + margem R$ {totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = <strong>R$ {totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.</span>
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
                const isVale = v.recebeAporteAmbipar === false || v.isValeOperation === true;
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
                        <span className="badge-vale-no-card">Não elegível ao aporte</span>
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
            <p>Confira os abastecimentos do período e escolha entre aporte global ou divisão por veículo. A elegibilidade e os valores vêm dos dados cadastrados no ciclo.</p>
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
