import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Fuel,
  Truck,
  User,
  Calendar,
  MapPin,
  Clock,
  Search,
  Filter,
  FileText,
  Printer,
  Share2,
  ExternalLink,
  MessageCircle,
  Eye,
  Check,
  X,
  RefreshCw,
  Zap,
  Info,
  Sliders,
  ChevronRight,
  Flame,
  PieChart
} from 'lucide-react';
import { exportFuelRecordsToExcel } from '../utils/excelFuelIntegration';

// Classificação de Severidade de Anomalias
export const ANOMALY_SEVERITY = {
  CRITICAL: {
    key: 'CRITICAL',
    label: 'Crítico / Imediato',
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    icon: Flame
  },
  HIGH: {
    key: 'HIGH',
    label: 'Alto Risco',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    icon: AlertTriangle
  },
  MEDIUM: {
    key: 'MEDIUM',
    label: 'Atenção Operacional',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    icon: AlertCircle
  },
  LOW: {
    key: 'LOW',
    label: 'Informativo',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    icon: Info
  }
};

// Tipos de Anomalias Central de Gestão
export const ANOMALY_TYPES = {
  CONSUMO_EXCESSIVO: {
    key: 'CONSUMO_EXCESSIVO',
    label: 'Consumo Excessivo (Pé Pesado)',
    desc: 'Veículo com rendimento KM/L significativamente abaixo da meta esperada para a frota/rota.'
  },
  VOLUME_MAIOR_QUE_TANQUE: {
    key: 'VOLUME_MAIOR_QUE_TANQUE',
    label: 'Volume Excedente ao Tanque (Risco de Fraude)',
    desc: 'Litragem inserida no cupom é maior do que a capacidade física homologada do tanque do caminhão.'
  },
  ABASTECIMENTO_DUPLICADO: {
    key: 'ABASTECIMENTO_DUPLICADO',
    label: 'Abastecimento Múltiplo no Mesmo Dia',
    desc: 'Dois ou mais abastecimentos para a mesma placa em curto intervalo de tempo sem percurso compatível.'
  },
  ODOMETRO_INCONSISTENTE: {
    key: 'ODOMETRO_INCONSISTENTE',
    label: 'Hodômetro Inconsistente / KM Negativo',
    desc: 'Hodômetro informado é menor do que o registro anterior ou a distância calculada é incoerente.'
  },
  PRECO_ABUSIVO: {
    key: 'PRECO_ABUSIVO',
    label: 'Preço por Litro Fora da Tabela Convênio',
    desc: 'Valor cobrado por litro está acima da média contratual homologada nos postos credenciados da Ambipar.'
  },
  DESVIO_MATRIZ_MENSAL: {
    key: 'DESVIO_MATRIZ_MENSAL',
    label: 'Pico Anômalo no Relatório Mensal',
    desc: 'Despesa mensal de combustível na matriz apresenta salto desproporcional sem aumento de frota.'
  },
  DESVIO_ARLA32: {
    key: 'DESVIO_ARLA32',
    label: 'Desvio Crítico de ARLA 32 (< 3% ou Ausente)',
    desc: 'Veículo Euro 5/6 consumindo Diesel S10 sem reposição proporcional de ARLA 32 (3% a 5%), com risco de falha catalítica e corte de potência.'
  },
  DESVIO_MEDIA_CATEGORIA: {
    key: 'DESVIO_MEDIA_CATEGORIA',
    label: 'Consumo Excessivo vs Meta da Categoria RJ',
    desc: 'Rendimento KM/L abaixo da meta técnica esperada para a tipologia do caminhão nas rotas do Rio de Janeiro.'
  }
};

// Motor de Análise Preditiva
export function runPredictiveAudit(records = [], availablePlates = []) {
  const anomalies = [];
  const plateMap = new Map();

  // Mapeia veículos e capacidade do tanque
  availablePlates.forEach(p => {
    plateMap.set(p.placa, p);
  });

  // Média de referência esperada para pesados




  // Agrupa por placa para analisar histórico sequencial
  const sortedRecords = [...records].sort((a, b) => {
    return new Date(b.data_abastecimento || '2026-01-01') - new Date(a.data_abastecimento || '2026-01-01');
  });

  // 1. ANÁLISE POR REGISTRO INDIVIDUAL
  sortedRecords.forEach(rec => {
    if (!rec) return;

    const litros = Number(rec.litros) || 0;
    const kmPorLitro = Number(rec.km_por_litro) || 0;
    const precoLitro = Number(rec.preco_litro) || 0;
    const valorTotal = Number(rec.valor_total) || 0;
    const distKm = Number(rec.distancia_percorrida_km) || 0;
    const placa = rec.placa || 'FROTA-AMBIPAR';
    const motorista = rec.motorista || 'Motorista Não Identificado';
    const data = rec.data_abastecimento || 'Data Indefinida';
    const posto = rec.posto_nome || 'Posto Convênio';

    const vehicleInfo = plateMap.get(placa);
    const tankCapacity=Number(vehicleInfo?.capacidadeTanque)||0;const EXPECTED_KM_L_DEFAULT=Number(vehicleInfo?.meta_consumo_kml)||0;const EXPECTED_PRICE_L_DEFAULT=Number(rec.preco_referencia_litro)||0;

    // Regra 1: VOLUME EXCEDENTE AO TANQUE (FRAUDE OU ERRO DE DIGITAÇÃO)
    if (tankCapacity>0 && litros > tankCapacity * 1.05 && rec.tipo_combustivel !== 'ARLA 32') {
      const excessVolume = litros - tankCapacity;
      const wastedR$ = excessVolume * (precoLitro || EXPECTED_PRICE_L_DEFAULT);
      anomalies.push({
        id: `ANOM_TANK_${rec.id || Math.random()}`,
        recordId: rec.id,
        type: 'VOLUME_MAIOR_QUE_TANQUE',
        severity: 'CRITICAL',
        title: `Volume (${litros.toLocaleString('pt-BR')} L) Excede Tanque Máximo (${tankCapacity} L)`,
        diagnostico: `O abastecimento registrado de ${litros} litros é superior à capacidade física do tanque homologado deste veículo (${tankCapacity} L). Risco grave de abastecimento de terceiro, tanque clandestino ou erro grave de nota fiscal.`,
        placa,
        modelo: rec.modelo_veiculo || vehicleInfo?.modelo || 'Caminhão Pesado',
        motorista,
        data,
        posto,
        valorTotal,
        litros,
        impactoFinanceiro: wastedR$,
        metricLabel: 'Litragem Excedente',
        metricValue: `+${excessVolume.toFixed(1)} L`,
        status: 'PENDENTE'
      });
    }

    // Regra 2: CONSUMO EXCESSIVO (KM/L MUITO ABAIXO DA META)
    if (EXPECTED_KM_L_DEFAULT>0 && kmPorLitro > 0 && kmPorLitro < EXPECTED_KM_L_DEFAULT*.8 && rec.tipo_combustivel !== 'ARLA 32' && distKm > 30) {
      const desvioPct = ((EXPECTED_KM_L_DEFAULT - kmPorLitro) / EXPECTED_KM_L_DEFAULT) * 100;
      const litrosIdeais = distKm / EXPECTED_KM_L_DEFAULT;
      const litrosDesperdicados = Math.max(0, litros - litrosIdeais);
      const prejuizoR$ = litrosDesperdicados * (precoLitro || EXPECTED_PRICE_L_DEFAULT);

      const isSevero = kmPorLitro < 1.5;

      anomalies.push({
        id: `ANOM_KML_${rec.id || Math.random()}`,
        recordId: rec.id,
        type: 'CONSUMO_EXCESSIVO',
        severity: isSevero ? 'CRITICAL' : 'HIGH',
        title: `Rendimento Crítico de ${kmPorLitro.toFixed(2)} km/l (${desvioPct.toFixed(0)}% pior que a meta Central de Gestão)`,
        diagnostico: `O veículo atingiu apenas ${kmPorLitro.toFixed(2)} km/l na rota rodoviária (meta Central de Gestão: ${EXPECTED_KM_L_DEFAULT.toFixed(2)} km/l). Consumo excessivo de diesel resultou no desperdício de ${litrosDesperdicados.toFixed(1)} litros adicionais.`,
        placa,
        modelo: rec.modelo_veiculo || vehicleInfo?.modelo || 'Cavalo Mecânico',
        motorista,
        data,
        posto,
        valorTotal,
        litros,
        impactoFinanceiro: prejuizoR$,
        metricLabel: 'Média Apurada',
        metricValue: `${kmPorLitro.toFixed(2)} km/l`,
        benchmark: `${EXPECTED_KM_L_DEFAULT.toFixed(2)} km/l`,
        status: 'PENDENTE'
      });
    }

    // Regra 3: HODÔMETRO INCONSISTENTE
    const hodAtual = Number(rec.hodometro_atual);
    const hodAnt = Number(rec.hodometro_anterior);
    if (hodAtual > 0 && hodAnt > 0 && hodAtual < hodAnt) {
      anomalies.push({
        id: `ANOM_ODO_${rec.id || Math.random()}`,
        recordId: rec.id,
        type: 'ODOMETRO_INCONSISTENTE',
        severity: 'HIGH',
        title: `Hodômetro Regressivo: Atual (${hodAtual} km) < Anterior (${hodAnt} km)`,
        diagnostico: `Hodômetro final lançado é inferior ao hodômetro inicial. Inconsistência nos apontamentos da viagem ou falha de leitura no painel do veículo.`,
        placa,
        modelo: rec.modelo_veiculo || 'Caminhão',
        motorista,
        data,
        posto,
        valorTotal,
        litros,
        impactoFinanceiro: 0,
        metricLabel: 'Diferença de KM',
        metricValue: `${hodAtual - hodAnt} km`,
        status: 'PENDENTE'
      });
    }

    // Regra 4: PREÇO POR LITRO FORA DA CURVA CONVENIADA
    if (EXPECTED_PRICE_L_DEFAULT>0 && precoLitro > EXPECTED_PRICE_L_DEFAULT * 1.18 && rec.tipo_combustivel?.toLowerCase().includes('diesel')) {
      const sobrepreco = (precoLitro - EXPECTED_PRICE_L_DEFAULT) * litros;
      anomalies.push({
        id: `ANOM_PRICE_${rec.id || Math.random()}`,
        recordId: rec.id,
        type: 'PRECO_ABUSIVO',
        severity: 'MEDIUM',
        title: `Diesel S10 a R$ ${precoLitro.toFixed(2)}/L (+${(((precoLitro / EXPECTED_PRICE_L_DEFAULT) - 1) * 100).toFixed(0)}% da Tabela Convênio)`,
        diagnostico: `Abastecimento realizado com preço por litro de R$ ${precoLitro.toFixed(2)}, superior à média dos postos conveniados da Ambipar (R$ ${EXPECTED_PRICE_L_DEFAULT.toFixed(2)}). Recomendada renegociação ou priorização de paradas homologadas.`,
        placa,
        modelo: rec.modelo_veiculo || 'Cavalo Mecânico',
        motorista,
        data,
        posto,
        valorTotal,
        litros,
        impactoFinanceiro: sobrepreco,
        metricLabel: 'Sobrepreço Total',
        metricValue: `+R$ ${sobrepreco.toFixed(2)}`,
        status: 'PENDENTE'
      });
    }
  });

  // Regra 5: ABASTECIMENTOS MÚLTIPLOS NO MESMO DIA (PLACA + DATA)
  const plateDateCounts = {};
  sortedRecords.forEach(r => {
    if (!r.placa || !r.data_abastecimento) return;
    const key = `${r.placa}_${r.data_abastecimento}`;
    plateDateCounts[key] = (plateDateCounts[key] || 0) + 1;
  });

  Object.entries(plateDateCounts).forEach(([key, count]) => {
    if (count > 1) {
      const [placa, data] = key.split('_');
      const matches = sortedRecords.filter(r => r.placa === placa && r.data_abastecimento === data);
      const totalVolume = matches.reduce((acc, curr) => acc + (Number(curr.litros) || 0), 0);
      const totalCost = matches.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);

      anomalies.push({
        id: `ANOM_DUP_${key}`,
        type: 'ABASTECIMENTO_DUPLICADO',
        severity: 'HIGH',
        title: `${count} Abastecimentos no Mesmo Dia (${data}) - Total ${totalVolume.toFixed(1)} L`,
        diagnostico: `O veículo ${placa} registrou ${count} abastecimentos na mesma data fiscal (${data}), somando R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Verifique se foram comprovantes lançados duas vezes ou paradas não previstas na rota.`,
        placa,
        modelo: matches[0]?.modelo_veiculo || 'Conjunto Frota',
        motorista: matches.map(m => m.motorista).filter(Boolean).join(' / ') || 'Motorista',
        data,
        posto: matches.map(m => m.posto_nome).filter(Boolean).join(' & '),
        valorTotal: totalCost,
        litros: totalVolume,
        impactoFinanceiro: totalCost * 0.4, // estimativa de risco de duplicata
        metricLabel: 'Lançamentos no Dia',
        metricValue: `${count} tickets`,
        status: 'PENDENTE'
      });
    }
  });


  // Regra 6: AUDITORIA DE PROPORÇÃO DIESEL X ARLA 32 (EURO 5 & EURO 6)
  const plateFuelStats = {};
  sortedRecords.forEach(r => {
    if (!r.placa) return;
    const p = r.placa;
    if (!plateFuelStats[p]) {
      plateFuelStats[p] = {
        placa: p,
        modelo: r.modelo_veiculo || 'Caminhão',
        motorista: r.motorista,
        dieselLitros: 0,
        arlaLitros: 0,
        totalKm: 0
      };
    }
    const combustivel = (r.tipo_combustivel || '').toLowerCase();
    const l = Number(r.litros) || 0;
    const km = Number(r.distancia_percorrida_km) || 0;

    if (combustivel.includes('diesel')) {
      plateFuelStats[p].dieselLitros += l;
    } else if (combustivel.includes('arla')) {
      plateFuelStats[p].arlaLitros += l;
    }
    plateFuelStats[p].totalKm += km;
  });

  Object.values(plateFuelStats).forEach(stat => {
    if (stat.dieselLitros >= 150) {
      const propArla = (stat.arlaLitros / stat.dieselLitros) * 100;
      // Proporção ideal de Arla no Proconve P7/P8 é de 3% a 5%
      if (propArla < 2.5) {
        anomalies.push({
          id: `ANOM_ARLA_DEFICIT_${stat.placa}`,
          type: 'DESVIO_ARLA32',
          severity: 'CRITICAL',
          title: `Alerta ARLA 32: Proporção de apenas ${propArla.toFixed(1)}% (Mínimo exigido: 3% a 5%)`,
          diagnostico: `O veículo ${stat.placa} consumiu ${stat.dieselLitros.toFixed(0)} L de Diesel S10 e apenas ${stat.arlaLitros.toFixed(0)} L de ARLA 32 (${propArla.toFixed(1)}% de taxa de reposição). Motores Euro 5 e Euro 6 exigem entre 3% e 5% de ARLA 32. Risco iminente de cristalização, falha na bomba dosadora SCR ou corte de 40% do torque do motor pela central eletrônica (modo de segurança ambiental Proconve P7/P8).`,
          placa: stat.placa,
          modelo: stat.modelo,
          motorista: stat.motorista || 'Escala Operacional',
          data: 'Últimos Abastecimentos',
          posto: 'Rede Convênio Ticket Log',
          valorTotal: stat.dieselLitros * 5.95,
          litros: stat.dieselLitros,
          impactoFinanceiro: 1200.00, // custo estimado de limpeza de bico SCR
          metricLabel: 'Proporção ARLA/Diesel',
          metricValue: `${propArla.toFixed(1)}% (Ideal: 3-5%)`,
          status: 'PENDENTE'
        });
      } else if (propArla > 7.0) {
        anomalies.push({
          id: `ANOM_ARLA_EXCESS_${stat.placa}`,
          type: 'DESVIO_ARLA32',
          severity: 'HIGH',
          title: `Consumo Elevado de ARLA 32: ${propArla.toFixed(1)}% (Acima da média de 5%)`,
          diagnostico: `O veículo ${stat.placa} registrou consumo desproporcional de ARLA 32 (${stat.arlaLitros.toFixed(0)} L para ${stat.dieselLitros.toFixed(0)} L de Diesel). Possível vazamento na linha de injeção ou falha no bico dosador do catalisador.`,
          placa: stat.placa,
          modelo: stat.modelo,
          motorista: stat.motorista || 'Escala Operacional',
          data: 'Últimos Abastecimentos',
          posto: 'Rede Convênio',
          valorTotal: stat.arlaLitros * 3.80,
          litros: stat.arlaLitros,
          impactoFinanceiro: 450.00,
          metricLabel: 'Proporção ARLA/Diesel',
          metricValue: `${propArla.toFixed(1)}% (Máx: 5%)`,
          status: 'PENDENTE'
        });
      }

      // Regra 7: DESVIO DE CONSUMO POR CATEGORIA DE VEÍCULO NAS ROTAS RJ
      if (stat.totalKm > 0) {
        const mediaKmL = stat.totalKm / stat.dieselLitros;
        let metaCategoria = 2.6; // padrão para pesado
        const mod = (stat.modelo || '').toLowerCase();
        if (mod.includes('accelo') || mod.includes('baú 3/4') || mod.includes('delivery')) metaCategoria = 3.8;
        else if (mod.includes('poli') || mod.includes('26.280')) metaCategoria = 2.6;
        else if (mod.includes('roll-on') || mod.includes('2629') || mod.includes('6x4')) metaCategoria = 2.4;
        else if (mod.includes('cavalo') || mod.includes('carreta')) metaCategoria = 2.1;

        if (mediaKmL < metaCategoria * 0.78) {
          const desvioPct = Math.round(((metaCategoria - mediaKmL) / metaCategoria) * 100);
          anomalies.push({
            id: `ANOM_KM_L_DESVIO_${stat.placa}`,
            type: 'DESVIO_MEDIA_CATEGORIA',
            severity: 'HIGH',
            title: `Consumo Excessivo: Média ${mediaKmL.toFixed(2)} km/l (${desvioPct}% abaixo da meta)`,
            diagnostico: `O veículo ${stat.placa} está operando a ${mediaKmL.toFixed(2)} km/l, enquanto a meta técnica homologada para esta categoria nas rotas do RJ é de ${metaCategoria.toFixed(1)} km/l. Recomendada vistoria técnica: conferência de bicos injetores, filtro de ar, calibragem de pneus e avaliação do estilo de condução do motorista.`,
            placa: stat.placa,
            modelo: stat.modelo,
            motorista: stat.motorista || 'Escala Operacional',
            data: 'Período Consolidado',
            posto: 'Rede de Abastecimento',
            valorTotal: stat.dieselLitros * 5.95,
            litros: stat.dieselLitros,
            impactoFinanceiro: (stat.dieselLitros * 0.2) * 5.95,
            metricLabel: 'Média Real vs Meta',
            metricValue: `${mediaKmL.toFixed(2)} km/l (Meta: ${metaCategoria.toFixed(1)})`,
            status: 'PENDENTE'
          });
        }
      }
    }
  });

  return anomalies;
}

export default function FuelAuditWorkspace({
  records = [],
  availablePlates = [],
  availableDrivers = [],
  onOpenTicketDetails,
  onNavigateModule
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [justifiedAnomalies, setJustifiedAnomalies] = useState(() => {
    try {
      const saved = localStorage.getItem('ambipar_audit_justified');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedAnomalyForModal, setSelectedAnomalyForModal] = useState(null);
  const [justificationText, setJustificationText] = useState('');
  const [notificationSentMap, setNotificationSentMap] = useState({});

  // Executa o motor analítico preditivo
  const rawAnomalies = useMemo(() => {
    return runPredictiveAudit(records, availablePlates);
  }, [records, availablePlates]);

  // Aplica justificativas salvas
  const anomalies = useMemo(() => {
    return rawAnomalies.map(anom => {
      const just = justifiedAnomalies[anom.id];
      if (just) {
        return {
          ...anom,
          status: 'JUSTIFICADO',
          justificativa: just.text,
          justificadoPor: just.user,
          justificadoEm: just.date
        };
      }
      return anom;
    });
  }, [rawAnomalies, justifiedAnomalies]);

  // Salva justificativas
  useEffect(() => {
    try {
      localStorage.setItem('ambipar_audit_justified', JSON.stringify(justifiedAnomalies));
    } catch (e) {
      console.warn('Erro ao salvar justificativas:', e);
    }
  }, [justifiedAnomalies]);

  // Filtros combinados
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(anom => {
      if (filterSeverity !== 'ALL' && anom.severity !== filterSeverity) return false;
      if (filterType !== 'ALL' && anom.type !== filterType) return false;
      if (filterStatus !== 'ALL' && anom.status !== filterStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesPlate = anom.placa?.toLowerCase().includes(q);
        const matchesDriver = anom.motorista?.toLowerCase().includes(q);
        const matchesTitle = anom.title?.toLowerCase().includes(q);
        const matchesPosto = anom.posto?.toLowerCase().includes(q);
        if (!matchesPlate && !matchesDriver && !matchesTitle && !matchesPosto) return false;
      }
      return true;
    });
  }, [anomalies, filterSeverity, filterType, filterStatus, searchTerm]);

  // Métricas Consolidadas
  const stats = useMemo(() => {
    const total = anomalies.length;
    const critical = anomalies.filter(a => a.severity === 'CRITICAL' && a.status !== 'JUSTIFICADO').length;
    const high = anomalies.filter(a => a.severity === 'HIGH' && a.status !== 'JUSTIFICADO').length;
    const pending = anomalies.filter(a => a.status === 'PENDENTE').length;
    const totalWastedR$ = anomalies
      .filter(a => a.status !== 'JUSTIFICADO')
      .reduce((acc, curr) => acc + (curr.impactoFinanceiro || 0), 0);

    // Score de Conformidade da Frota (100 - penalizações por anomalias não justificadas)
    const penalty = (critical * 12) + (high * 6) + ((total - critical - high) * 2);
    const score = Math.max(35, Math.min(100, Math.round(100 - penalty)));

    return {
      total,
      critical,
      high,
      pending,
      totalWastedR$,
      score
    };
  }, [anomalies]);

  // Ação: Notificar Motorista (WhatsApp)
  const handleNotifyDriver = (anomaly) => {
    const text = encodeURIComponent(
      `🚨 *AMBIPAR LOGISTICS - ALERTA DE CONDUÇÃO Central de Gestão*\n\n` +
      `Olá, *${anomaly.motorista}*!\n` +
      `Identificamos uma inconsistência no abastecimento do veículo *${anomaly.placa}* em *${anomaly.data}*:\n\n` +
      `📌 *Ocorrência:* ${anomaly.title}\n` +
      `📍 *Posto:* ${anomaly.posto}\n` +
      `📊 *Detalhe:* ${anomaly.diagnostico}\n\n` +
      `Por favor, entre em contato com o Central de Gestão ou envie a justificativa operacional para regularização no sistema. Obrigado!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    setNotificationSentMap(prev => ({ ...prev, [anomaly.id]: true }));
  };

  // Ação: Salvar Justificativa
  const handleSaveJustification = () => {
    if (!selectedAnomalyForModal || !justificationText.trim()) return;

    setJustifiedAnomalies(prev => ({
      ...prev,
      [selectedAnomalyForModal.id]: {
        text: justificationText.trim(),
        user: 'Carlos Eduardo (Analista de Transporte)',
        date: new Date().toLocaleDateString('pt-BR')
      }
    }));

    setSelectedAnomalyForModal(null);
    setJustificationText('');
  };

  return (
    <div className="fuel-audit-workspace animate-fade-in" id="fuel-audit-workspace-root">
      {/* 1. Header do Painel de Auditoria */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: '16px',
        padding: '1.5rem 1.75rem',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(244, 63, 94, 0.2)',
            border: '1px solid rgba(244, 63, 94, 0.5)',
            boxShadow: '0 0 30px rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f43f5e',
            flexShrink: 0
          }}>
            <ShieldAlert size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                Auditoria Preditiva & Inteligência Forense Central de Gestão
              </h3>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '6px',
                background: stats.critical > 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: stats.critical > 0 ? '#f43f5e' : '#10b981',
                border: `1px solid ${stats.critical > 0 ? '#f43f5e' : '#10b981'}`
              }}>
                {stats.critical > 0 ? `${stats.critical} Alertas Críticos` : 'Operação Estável'}
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.86rem', maxWidth: '750px', lineHeight: 1.5 }}>
              Monitoramento em tempo real de anomalias em abastecimentos: desvios severos de consumo (km/l), litragem excedente à capacidade física do tanque, apontamentos duplicados e despesas anômalas na frota Ambipar.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="fuel-btn fuel-btn-secondary"
            onClick={() => window.print()}
            style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}
          >
            <Printer size={15} />
            <span>Imprimir Lauda Central de Gestão</span>
          </button>
        </div>
      </div>

      {/* 2. Grid de KPIs Executivos da Auditoria */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        {/* KPI 1: Score de Conformidade */}
        <div className="fuel-kpi-card" style={{ borderLeft: `4px solid ${stats.score >= 85 ? '#10b981' : stats.score >= 70 ? '#eab308' : '#f43f5e'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Score de Saúde Central de Gestão</span>
            <ShieldAlert size={18} color={stats.score >= 85 ? '#10b981' : stats.score >= 70 ? '#eab308' : '#f43f5e'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff' }}>{stats.score}%</span>
            <span style={{ fontSize: '0.75rem', color: stats.score >= 85 ? '#34d399' : '#f87171', fontWeight: 600 }}>
              {stats.score >= 85 ? 'Excelente' : stats.score >= 70 ? 'Atenção' : 'Ação Necessária'}
            </span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '0.65rem', overflow: 'hidden' }}>
            <div style={{
              width: `${stats.score}%`,
              height: '100%',
              background: stats.score >= 85 ? '#10b981' : stats.score >= 70 ? '#eab308' : '#f43f5e',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* KPI 2: Desperdício Financeiro Evitável */}
        <div className="fuel-kpi-card" style={{ borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Desperdício Evitável</span>
            <DollarSign size={18} color="#f43f5e" />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f43f5e' }}>
              R$ {stats.totalWastedR$.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
            Combustível consumido além da meta técnica
          </span>
        </div>

        {/* KPI 3: Anomalias Críticas / Alta Gravidade */}
        <div className="fuel-kpi-card" style={{ borderLeft: '4px solid #f97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Desvios Severos</span>
            <Flame size={18} color="#f97316" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff' }}>
              {stats.critical + stats.high}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#f97316', fontWeight: 600 }}>
              ({stats.critical} Críticos + {stats.high} Altos)
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
            Exigem justificativa do condutor/posto
          </span>
        </div>

        {/* KPI 4: Casos Pendentes de Resolução */}
        <div className="fuel-kpi-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Pendentes de Resolução</span>
            <Clock size={18} color="#06b6d4" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff' }}>
              {stats.pending}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
              de {stats.total} incidentes
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
            {anomalies.filter(a => a.status === 'JUSTIFICADO').length} já auditados e justificados
          </span>
        </div>
      </div>

      {/* 3. Barra de Filtros e Busca */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.25rem',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por placa, motorista, posto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Filtro de Gravidade */}
          <select
            className="styled-native-select"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
          >
            <option value="ALL">Todas as Gravidades</option>
            <option value="CRITICAL">🔴 Apenas Críticos</option>
            <option value="HIGH">🟠 Risco Alto</option>
            <option value="MEDIUM">🟡 Atenção Operacional</option>
            <option value="LOW">🔵 Informativo</option>
          </select>

          {/* Filtro de Tipo */}
          <select
            className="styled-native-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
          >
            <option value="ALL">Todos os Tipos de Desvio</option>
            <option value="DESVIO_ARLA32">🚨 Desvio de ARLA 32 (Proporção &lt; 3% ou Sem ARLA)</option>
            <option value="DESVIO_MEDIA_CATEGORIA">📉 Consumo Abaixo da Meta da Categoria RJ</option>
            <option value="CONSUMO_EXCESSIVO">Consumo Excessivo (KM/L)</option>
            <option value="VOLUME_MAIOR_QUE_TANQUE">Volume Acima do Tanque</option>
            <option value="ABASTECIMENTO_DUPLICADO">Abastecimento Duplicado</option>
            <option value="ODOMETRO_INCONSISTENTE">Hodômetro Inconsistente</option>
            <option value="PRECO_ABUSIVO">Preço Fora da Tabela</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status:</span>
          <button
            type="button"
            className={`fuel-btn ${filterStatus === 'ALL' ? 'fuel-btn-primary' : 'fuel-btn-secondary'}`}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
            onClick={() => setFilterStatus('ALL')}
          >
            Todos ({anomalies.length})
          </button>
          <button
            type="button"
            className={`fuel-btn ${filterStatus === 'PENDENTE' ? 'fuel-btn-primary' : 'fuel-btn-secondary'}`}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
            onClick={() => setFilterStatus('PENDENTE')}
          >
            Pendentes ({anomalies.filter(a => a.status === 'PENDENTE').length})
          </button>
          <button
            type="button"
            className={`fuel-btn ${filterStatus === 'JUSTIFICADO' ? 'fuel-btn-primary' : 'fuel-btn-secondary'}`}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
            onClick={() => setFilterStatus('JUSTIFICADO')}
          >
            Justificados ({anomalies.filter(a => a.status === 'JUSTIFICADO').length})
          </button>
        </div>
      </div>

      {/* 4. Lista Interativa de Anomalias Forenses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredAnomalies.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            color: '#94a3b8'
          }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ color: '#ffffff', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
              Nenhuma Anomalia Encontrada com os Filtros Selecionados
            </h4>
            <p style={{ margin: 0, fontSize: '0.86rem', maxWidth: '480px', marginInline: 'auto' }}>
              Todos os lançamentos analisados estão em conformidade com as regras de consumo, capacidade de tanque e preços de convênio.
            </p>
          </div>
        ) : (
          filteredAnomalies.map((anom) => {
            const sevConfig = ANOMALY_SEVERITY[anom.severity] || ANOMALY_SEVERITY.MEDIUM;
            const SevIcon = sevConfig.icon;
            const isJustified = anom.status === 'JUSTIFICADO';

            return (
              <div
                key={anom.id}
                style={{
                  background: isJustified ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.7)',
                  border: `1px solid ${isJustified ? 'rgba(16, 185, 129, 0.25)' : sevConfig.borderColor}`,
                  borderRadius: '14px',
                  padding: '1.25rem 1.5rem',
                  boxShadow: isJustified ? 'none' : '0 8px 24px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.2s ease',
                  opacity: isJustified ? 0.8 : 1
                }}
              >
                {/* Linha 1: Badges, Placa, Motorista, Data e Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: isJustified ? 'rgba(16, 185, 129, 0.15)' : sevConfig.bgColor,
                      color: isJustified ? '#34d399' : sevConfig.color,
                      border: `1px solid ${isJustified ? '#10b981' : sevConfig.color}`
                    }}>
                      <SevIcon size={14} />
                      {isJustified ? 'Justificado / Auditado' : sevConfig.label}
                    </span>

                    <span className="fuel-plate-badge" style={{ fontSize: '0.76rem', padding: '3px 8px' }}>
                      {anom.placa}
                    </span>

                    <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
                      {anom.modelo}
                    </span>

                    <span style={{ color: '#64748b' }}>•</span>

                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} />
                      {anom.motorista}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} />
                      {anom.data}
                    </span>

                    {anom.impactoFinanceiro > 0 && (
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#f43f5e',
                        background: 'rgba(244, 63, 94, 0.12)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: '1px solid rgba(244, 63, 94, 0.3)'
                      }}>
                        Prejuízo Estimado: R$ {anom.impactoFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Linha 2: Título do Incidente & Diagnóstico Forense */}
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.05rem', color: '#ffffff', fontWeight: 700 }}>
                    {anom.title}
                  </h4>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderLeft: `3px solid ${isJustified ? '#10b981' : sevConfig.color}`,
                    borderRadius: '6px',
                    fontSize: '0.84rem',
                    color: '#cbd5e1',
                    lineHeight: 1.5
                  }}>
                    {anom.diagnostico}
                  </div>
                </div>

                {/* Justificativa existente */}
                {isJustified && anom.justificativa && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.65rem 0.95rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#a7f3d0'
                  }}>
                    <strong style={{ color: '#34d399' }}>✓ Parecer do Analista:</strong> {anom.justificativa}
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                      Auditado por {anom.justificadoPor} em {anom.justificadoEm}
                    </div>
                  </div>
                )}

                {/* Linha 3: Métricas Chave do Abastecimento & Botões de Ação */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '0.85rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Posto / Local: <strong style={{ color: '#ffffff' }}>{anom.posto}</strong>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Litragem: <strong style={{ color: '#ffffff' }}>{anom.litros} L</strong>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Valor Total: <strong style={{ color: '#10b981' }}>R$ {anom.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>

                    {anom.metricValue && (
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {anom.metricLabel}: <strong style={{ color: sevConfig.color }}>{anom.metricValue}</strong>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="fuel-btn fuel-btn-secondary"
                      style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => handleNotifyDriver(anom)}
                      title="Enviar alerta pré-formatado no WhatsApp para o motorista"
                    >
                      <MessageCircle size={14} color="#25D366" />
                      <span>{notificationSentMap[anom.id] ? 'Alerta Enviado' : 'Notificar Motorista'}</span>
                    </button>

                    <button
                      type="button"
                      className="fuel-btn fuel-btn-secondary"
                      style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => {
                        setSelectedAnomalyForModal(anom);
                        setJustificationText(anom.justificativa || '');
                      }}
                      title="Registrar parecer ou justificativa operacional da ocorrência"
                    >
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>{isJustified ? 'Editar Parecer' : 'Inserir Justificativa'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Inserção de Justificativa Operacional */}
      {selectedAnomalyForModal && (
        <div className="fuel-modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="fuel-modal-dialog animate-scale-in" style={{ maxWidth: '580px' }}>
            <div className="fuel-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <ShieldAlert size={20} color="#10b981" />
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem' }}>
                  Parecer Técnico Central de Gestão & Justificativa Operacional
                </h4>
              </div>
              <button
                type="button"
                className="fuel-modal-close-btn"
                onClick={() => setSelectedAnomalyForModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 0' }}>
              <div style={{
                padding: '0.85rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.82rem'
              }}>
                <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: '4px' }}>
                  {selectedAnomalyForModal.placa} • {selectedAnomalyForModal.title}
                </div>
                <div style={{ color: '#94a3b8' }}>
                  Condutor: <strong>{selectedAnomalyForModal.motorista}</strong> | Data: {selectedAnomalyForModal.data}
                </div>
              </div>

              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: '0.5rem' }}>
                Justificativa Operacional / Parecer da Supervisão:
              </label>

              <textarea
                rows={4}
                value={justificationText}
                onChange={(e) => setJustificationText(e.target.value)}
                placeholder="Exemplo: Veículo operou em fila de descarga química com compressor PTO ligado durante 4 horas; ou tráfego severo em serra com ar condicionado contínuo. Alinhamento de rota realizado com o motorista."
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />

              {/* Botões de Justificativas Rápidas */}
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  Modelos de Justificativa Rápida Central de Gestão:
                </span>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {[
                    'Uso contínuo de PTO/Compressor em descarga química',
                    'Congestionamento severo em serra / rodovia com baixa marcha',
                    'Erro de digitação do frentista (NF confirmada)',
                    'Reabastecimento emergencial por desvio de trânsito'
                  ].map(quick => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setJustificationText(quick)}
                      style={{
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        cursor: 'pointer'
                      }}
                    >
                      + {quick}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="fuel-modal-footer">
              <button
                type="button"
                className="fuel-btn fuel-btn-secondary"
                onClick={() => setSelectedAnomalyForModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="fuel-btn fuel-btn-primary"
                disabled={!justificationText.trim()}
                onClick={handleSaveJustification}
              >
                <Check size={16} />
                <span>Registrar e Aprovar Parecer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
