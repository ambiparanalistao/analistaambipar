/**
 * Base de Dados e Lógica de Aporte Semanal de Combustível · Cartão Abank Frota
 * Fechamento Programado: Quarta-feira à tarde (17:00h)
 * Envio da Solicitação ao Gestor: Toda Quinta-feira pela manhã (08:00h)
 * 
 * DIRETRIZES OPERACIONAIS OFICIAIS:
 * 1. VEÍCULOS NA OPERAÇÃO DA VALE: NÃO recebem abastecimento da Ambipar, NÃO recebem cartão Abank e NÃO entram na divisão (Cota = R$ 0,00 com motivo explícito).
 * 2. AMAZON CD MERITI (GIG 1 / GIG 7): Solicitação esporádica / sob demanda, com cota provisionada de prontidão.
 * 3. VALOR TOTAL DO APORTE SEMANAL: R$ 17.000,00 divididos entre os veículos atendidos pela Ambipar.
 * 4. OPÇÃO DE GERAR RELATÓRIO: Com Motivo Técnico Detalhado OU Sem Motivo (Apenas Valores e Cartões).
 */

export const DEFAULT_CYCLE_SETTINGS = {
  cutoffDay: 'Quarta-feira',
  cutoffHour: '17:00',
  reportDay: 'Quinta-feira',
  reportHour: '08:00',
  valorBaseAporteSemanal: 17000.00, // R$ 17k semanais
  defaultContingencyPct: 11.8,     // Margem de segurança operacional
  gestorNome: 'Eng. Roberto Albuquerque',
  gestorCargo: 'Gerente Geral de Logística & Operações RJ',
  analistaResponsavel: 'Carlos dos Santos',
  analistaCargo: 'Analista de Logística & Operações CCO',
  convenioPadrao: 'Cartão Abank Frota Corporativa'
};

/**
 * Matriz Real de Distribuição dos R$ 17.000,00
 * Carros da Vale: R$ 0,00 (Abastecimento direto Vale)
 * Carros Ambipar Ativos: R$ 17.000,00 (Abank)
 */
export const AUDITED_REAL_FLEET_PROVISION = [
  // 1. CARROS QUE RECEBEM O APORTE AMBIPAR (TOTAL: R$ 17.000,00)
  {
    placa: 'EWX-0I82',
    prefixo: 'AMB-106',
    modelo: 'VW Constellation 25.390 (Cavalo 6x2)',
    tipo: 'Cavalo Mecânico Carreta',
    operacao: 'Transferências Rodoviárias Intermunicipais / Interestaduais',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 9940',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 310650,
    kmFinal: 312450,
    kmRodado: 1800,
    metaKmL: 2.60,
    diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '05:50',
        posto: 'Rede Graal Resende (Via Dutra km 304)',
        cidade: 'Resende / RJ',
        dieselLitros: 430.0,
        precoDiesel: 6.35,
        arlaLitros: 20.0,
        precoArla: 3.85,
        valorTotal: 2807.50,
        kmNoAto: 311550,
        nfNumero: 'NF-e 88190',
        comprovante: 'ABK-981105'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '13:10',
        posto: 'Posto Presidente Dutra (BR-116 km 178)',
        cidade: 'Nova Iguaçu / RJ',
        dieselLitros: 420.0,
        precoDiesel: 6.29,
        arlaLitros: 20.0,
        precoArla: 3.80,
        valorTotal: 2717.80,
        kmNoAto: 312450,
        nfNumero: 'NF-e 88470',
        comprovante: 'ABK-983890'
      }
    ],
    litrosDieselTotal: 850.0,
    litrosArlaTotal: 40.0,
    valorTotalGasto: 5525.30,
    margemSegurancaRS: 674.70,
    solicitacaoAporteSugerido: 6200.00, // Cota dos 17k
    saldoCartaoAtual: 180.00,
    statusMedia: 'Na Meta (2.65 km/l)',
    motivoTecnico: 'Cavalo mecânico rodoviário tracionando conjuntos pesados de 45 toneladas PBT (Via Dutra, Resende, Barra Mansa e SP). Principal consumidor da frota ativa da Ambipar em percurso rodoviário longo.'
  },
  {
    placa: 'FVV-0E16',
    prefixo: 'AMB-105',
    modelo: 'Ford Cargo 2629 6x4 Roll-On',
    tipo: 'Roll-On / Roll-Off 25t',
    operacao: 'Base Duque de Caxias / Destinações & Amazon Meriti (GIG 1 / GIG 7 - Esporádico)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 8820',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    isSporadicGIG: true,
    kmInicial: 187120,
    kmFinal: 188420,
    kmRodado: 1300,
    metaKmL: 2.20,
    diasAbastecimento: ['Seg (19/10)', 'Ter (20/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '07:15',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 200.0,
        precoDiesel: 6.28,
        arlaLitros: 10.0,
        precoArla: 3.79,
        valorTotal: 1293.90,
        kmNoAto: 187550,
        nfNumero: 'NF-e 66104',
        comprovante: 'ABK-981502'
      },
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '14:20',
        posto: 'Posto Shell Trevo São João de Meriti',
        cidade: 'São João de Meriti / RJ',
        dieselLitros: 200.0,
        precoDiesel: 6.30,
        arlaLitros: 10.0,
        precoArla: 3.80,
        valorTotal: 1298.00,
        kmNoAto: 187980,
        nfNumero: 'NF-e 66320',
        comprovante: 'ABK-982991'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '16:10',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 190.0,
        precoDiesel: 6.29,
        arlaLitros: 9.0,
        precoArla: 3.80,
        valorTotal: 1229.30,
        kmNoAto: 188420,
        nfNumero: 'NF-e 66590',
        comprovante: 'ABK-984400'
      }
    ],
    litrosDieselTotal: 590.0,
    litrosArlaTotal: 29.0,
    valorTotalGasto: 3821.20,
    margemSegurancaRS: 478.80,
    solicitacaoAporteSugerido: 4300.00, // Cota dos 17k
    saldoCartaoAtual: 110.00,
    statusMedia: 'Dentro da Meta (2.20 km/l)',
    motivoTecnico: 'Atendimento às destinações da Base Caxias e acionamentos esporádicos/sob demanda dos CDs Amazon GIG 1 e GIG 7 (São João de Meriti). Como as solicitações da Amazon GIG 1/7 são esporádicas e não fixas, a cota provê saldo de prontidão no Cartão Abank para saídas imediatas quando acionadas.'
  },
  {
    placa: 'FMB-1H09',
    prefixo: 'AMB-110',
    modelo: 'VW 26.280 CRM Hidrovácuo',
    tipo: 'Tanque Sucção 12m³',
    operacao: 'Efluentes Industriais / Emergências Ambientais PAE 24h',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 6205',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 86520,
    kmFinal: 87300,
    kmRodado: 780,
    metaKmL: 1.85,
    diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '07:00',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 240.0,
        precoDiesel: 6.28,
        arlaLitros: 11.0,
        precoArla: 3.79,
        valorTotal: 1548.89,
        kmNoAto: 86900,
        nfNumero: 'NF-e 33100',
        comprovante: 'ABK-981320'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '15:45',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 240.0,
        precoDiesel: 6.28,
        arlaLitros: 11.0,
        precoArla: 3.79,
        valorTotal: 1548.89,
        kmNoAto: 87300,
        nfNumero: 'NF-e 33490',
        comprovante: 'ABK-984330'
      }
    ],
    litrosDieselTotal: 480.0,
    litrosArlaTotal: 22.0,
    valorTotalGasto: 3097.78,
    margemSegurancaRS: 402.22,
    solicitacaoAporteSugerido: 3500.00, // Cota dos 17k
    saldoCartaoAtual: 90.00,
    statusMedia: 'Na Meta (1.86 km/l - PTO Ativo)',
    motivoTecnico: 'Caminhão de hidrojateamento e vácuo. Bomba de sucção anel líquido acionada por tomada de força (PTO) operando por horas sem rodar odômetro, além de plantão permanente 24h para emergências químicas da Ambipar Response.'
  },
  {
    placa: 'RAW-1B54',
    prefixo: 'AMB-101',
    modelo: 'M.Benz Accelo 1016 Baú 3/4',
    tipo: 'Baú 3/4 Urbano',
    operacao: 'Base Duque de Caxias / Coletas Fracionadas RJ',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 1152',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 47680,
    kmFinal: 48500,
    kmRodado: 820,
    metaKmL: 4.50,
    diasAbastecimento: ['Ter (20/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '08:30',
        posto: 'Posto Petrobras Rodovia Washington Luís (km 112)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 105.0,
        precoDiesel: 6.25,
        arlaLitros: 5.0,
        precoArla: 3.75,
        valorTotal: 675.00,
        kmNoAto: 48090,
        nfNumero: 'NF-e 11980',
        comprovante: 'ABK-982110'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '14:45',
        posto: 'Posto Petrobras Rodovia Washington Luís (km 112)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 105.0,
        precoDiesel: 6.25,
        arlaLitros: 5.0,
        precoArla: 3.75,
        valorTotal: 675.00,
        kmNoAto: 48500,
        nfNumero: 'NF-e 12150',
        comprovante: 'ABK-984250'
      }
    ],
    litrosDieselTotal: 210.0,
    litrosArlaTotal: 10.0,
    valorTotalGasto: 1350.00,
    margemSegurancaRS: 150.00,
    solicitacaoAporteSugerido: 1500.00, // Cota dos 17k
    saldoCartaoAtual: 70.00,
    statusMedia: 'Excelente (4.50 km/l)',
    motivoTecnico: 'Coletas urbanas fracionadas de resíduos Classe I e amostras industriais no Grande Rio (Av. Brasil, Linha Vermelha e Dutra). Margem de segurança para retenções de tráfego em marcha lenta.'
  },
  {
    placa: 'GBU-0A23',
    prefixo: 'AMB-108',
    modelo: 'M.Benz Accelo 1016 Baú Plataforma',
    tipo: 'Baú Urbano Plataforma',
    operacao: 'Contrato Jogue Limpo (Barra, Recreio & Jacarepaguá)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 5022',
    recebeAporteAmbipar: true,
    isValeOperation: false,
    kmInicial: 133380,
    kmFinal: 134200,
    kmRodado: 820,
    metaKmL: 4.40,
    diasAbastecimento: ['Ter (20/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '09:00',
        posto: 'Posto Shell Linha Amarela / Inhaúma',
        cidade: 'Rio de Janeiro / RJ',
        dieselLitros: 105.0,
        precoDiesel: 6.34,
        arlaLitros: 5.0,
        precoArla: 3.80,
        valorTotal: 684.70,
        kmNoAto: 133790,
        nfNumero: 'NF-e 55901',
        comprovante: 'ABK-982440'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '16:00',
        posto: 'Posto Ipiranga Av. das Américas (Recreio)',
        cidade: 'Rio de Janeiro / RJ',
        dieselLitros: 100.0,
        precoDiesel: 6.36,
        arlaLitros: 5.0,
        precoArla: 3.80,
        valorTotal: 655.00,
        kmNoAto: 134200,
        nfNumero: 'NF-e 56120',
        comprovante: 'ABK-984380'
      }
    ],
    litrosDieselTotal: 205.0,
    litrosArlaTotal: 10.0,
    valorTotalGasto: 1339.70,
    margemSegurancaRS: 160.30,
    solicitacaoAporteSugerido: 1500.00, // Cota dos 17k
    saldoCartaoAtual: 60.00,
    statusMedia: 'Na Meta (4.45 km/l)',
    motivoTecnico: 'Circuito de logística reversa de embalagens plásticas na Zona Oeste do Rio (Barra, Recreio, Vargens) com acionamento diário de plataforma eletro-hidráulica em rotas urbanas.'
  },

  // 2. VEÍCULOS NA VALE (COTA R$ 0,00 - ABASTECIMENTO FORNECIDO DIRETO PELA VALE)
  {
    placa: 'RHU-6I87',
    prefixo: 'AMB-104',
    modelo: 'VW 26.280 CRM Poli Duplo (6x4)',
    tipo: 'Poliguindaste Duplo Articulado',
    operacao: 'Contrato Vale S.A. (TIG Guaíba / CPBS)',
    cartaoTipo: 'Sem Cartão Abank',
    cartaoNumero: 'Abastecimento Interno Vale',
    recebeAporteAmbipar: false,
    isValeOperation: true,
    kmInicial: 141230,
    kmFinal: 142350,
    kmRodado: 1120,
    metaKmL: 2.10,
    diasAbastecimento: ['Interno Vale (Seg)', 'Interno Vale (Qua)'],
    abastecimentosDetalhe: [],
    litrosDieselTotal: 0,
    litrosArlaTotal: 0,
    valorTotalGasto: 0.00,
    margemSegurancaRS: 0.00,
    solicitacaoAporteSugerido: 0.00, // Cota ZERO
    saldoCartaoAtual: 0.00,
    statusMedia: 'Operação Vale S.A.',
    motivoTecnico: 'Cota R$ 0,00: Veículo dedicado 100% à Operação Vale S.A. (TIG Guaíba / CPBS). O abastecimento é fornecido diretamente pelo cliente dentro do terminal/mina, não recebendo cartão e não consumindo saldo do Aporte Abank da Ambipar.'
  },
  {
    placa: 'GEB-8C37',
    prefixo: 'AMB-107',
    modelo: 'VW Delivery 9.170 Baú 3/4',
    tipo: 'Baú 3/4 Urbano',
    operacao: 'Contrato Vale S.A. (Leste Fluminense / Niterói)',
    cartaoTipo: 'Sem Cartão Abank',
    cartaoNumero: 'Abastecimento Interno Vale',
    recebeAporteAmbipar: false,
    isValeOperation: true,
    kmInicial: 97920,
    kmFinal: 98700,
    kmRodado: 780,
    metaKmL: 4.40,
    diasAbastecimento: ['Interno Vale'],
    abastecimentosDetalhe: [],
    litrosDieselTotal: 0,
    litrosArlaTotal: 0,
    valorTotalGasto: 0.00,
    margemSegurancaRS: 0.00,
    solicitacaoAporteSugerido: 0.00, // Cota ZERO
    saldoCartaoAtual: 0.00,
    statusMedia: 'Operação Vale S.A.',
    motivoTecnico: 'Cota R$ 0,00: Veículo dedicado 100% à Operação Vale S.A. (Leste Fluminense). O abastecimento é fornecido diretamente pelo cliente, não recebendo cartão e não consumindo saldo do Aporte Abank da Ambipar.'
  }
];

export const INITIAL_WEEKLY_CYCLES = [
  {
    id: 'CICLO-2026-W43',
    nome: 'Ciclo Vigente · Semana 43 (Out/2026)',
    periodoInicio: '2026-10-18', // Domingo
    periodoFim: '2026-10-24',    // Sábado
    dataCorteQuarta: '2026-10-21T17:00:00', // Quarta-feira à tarde
    dataEnvioQuinta: '2026-10-22T08:00:00', // Quinta-feira pela manhã
    status: 'PRONTO_ENVIO',
    statusLabel: 'Fechamento Quarta-feira Concluído · Pronto p/ Quinta-feira',
    valorTotalAporteAlvo: 17000.00,
    margemSegurancaPct: 11.8,
    motivoGeralSolicitacao: 'Aporte semanal de R$ 17.000,00 no Cartão Abank Frota para a frota ativa atendida pela Ambipar. Os veículos dedicados à Vale S.A. (RHU-6I87 e GEB-8C37) estão com cota R$ 0,00 pois o abastecimento é fornecido diretamente pelo cliente. As rotas dos CDs Amazon GIG 1 e GIG 7 são esporádicas/sob demanda, com cota de prontidão alocada no FVV-0E16.',
    veiculosAbastecidos: AUDITED_REAL_FLEET_PROVISION
  },
  {
    id: 'CICLO-2026-W42',
    nome: 'Ciclo Anterior · Semana 42 (Out/2026)',
    periodoInicio: '2026-10-11',
    periodoFim: '2026-10-17',
    dataCorteQuarta: '2026-10-14T17:00:00',
    dataEnvioQuinta: '2026-10-15T08:00:00',
    status: 'APROVADO_CREDITADO',
    statusLabel: 'Aporte Concluído · Saldo de R$ 17.000,00 Creditado nos Cartões Abank',
    valorTotalAporteAlvo: 17000.00,
    margemSegurancaPct: 11.8,
    motivoGeralSolicitacao: 'Aporte regular semana 42 aprovado pelo Gestor em 15/10/2026 às 08:35. Recargas nos 5 cartões Abank ativas sem registro de falta de combustível.',
    veiculosAbastecidos: AUDITED_REAL_FLEET_PROVISION
  }
];

export const INITIAL_APORTE_DOCUMENTS_HISTORY = [
  {
    id: 'DOC-APORTE-ABK-2026-W43',
    numeroProtocolo: 'AMB-APORTE-2026-W43/001',
    cicloId: 'CICLO-2026-W43',
    dataFechamento: '2026-10-21T17:00:00',
    dataSolicitacao: '2026-10-22T08:00:00',
    gestorNome: 'Eng. Roberto Albuquerque',
    gestorCargo: 'Gerente Geral de Logística & Operações RJ',
    analistaNome: 'Carlos dos Santos',
    analistaCargo: 'Analista de Logística & CCO Ambipar',
    convenio: 'Cartão Abank Frota Corporativa',
    valorTotalSolicitado: 17000.00,
    valorGastoReal: 15133.98,
    valorMargemSeguranca: 1866.02,
    margemPct: 11.8,
    totalVeiculos: 7,
    veiculosComCota: 5,
    veiculosValeZero: 2,
    status: 'PRONTO_ENVIO',
    statusLabel: 'Aguardando Aprovação do Gestor (Quinta-feira Manhã)',
    motivoResumido: 'Liberação de R$ 17.000,00 para os 5 cartões Abank da frota ativa. Carros da Vale com cota R$ 0,00 (abastecimento pelo cliente). Rotas Amazon GIG 1/7 esporádicas.'
  }
];

/**
 * Pesos Históricos Auditados da Frota Ativa Ambipar (Base de R$ 17.000,00)
 * Veículos da Vale: 0% (Abastecimento fornecido diretamente pelo cliente)
 */
export const HISTORICAL_ACTIVE_FLEET_WEIGHTS = {
  'EWX-0I82': 0.36470588, // 36.47% -> R$ 6.200,00 de R$ 17.000,00
  'FVV-0E16': 0.25294118, // 25.29% -> R$ 4.300,00 de R$ 17.000,00
  'FMB-1H09': 0.20588235, // 20.59% -> R$ 3.500,00 de R$ 17.000,00
  'RAW-1B54': 0.08823529, // 8.82%  -> R$ 1.500,00 de R$ 17.000,00
  'GBU-0A23': 0.08823529, // 8.82%  -> R$ 1.500,00 de R$ 17.000,00
  'RHU-6I87': 0.0,        // 0.00%  -> Operação Vale (R$ 0,00)
  'GEB-8C37': 0.0         // 0.00%  -> Operação Vale (R$ 0,00)
};

/**
 * Helper de Ajuste Automático 1: Proporcional ao Consumo Histórico Auditado
 */
export function distributeByHistoricalWeight(targetTotal, vehicles = AUDITED_REAL_FLEET_PROVISION) {
  const result = {};
  const activeVehicles = vehicles.filter(v => v.recebeAporteAmbipar);
  if (activeVehicles.length === 0) return result;

  let allocatedSum = 0;
  activeVehicles.forEach((v, index) => {
    if (index === activeVehicles.length - 1) {
      // Último veículo ativo absorve o resíduo para fechar 100% no centavo
      const remainder = Number((targetTotal - allocatedSum).toFixed(2));
      result[v.placa] = remainder;
    } else {
      const weight = HISTORICAL_ACTIVE_FLEET_WEIGHTS[v.placa] || (1 / activeVehicles.length);
      const val = Math.round((targetTotal * weight) / 50) * 50; // arredondamento amigável de múltiplos de 50
      result[v.placa] = val;
      allocatedSum += val;
    }
  });

  // Carros da Vale sempre recebem R$ 0,00
  vehicles.forEach(v => {
    if (!v.recebeAporteAmbipar) {
      result[v.placa] = 0;
    }
  });

  return result;
}

/**
 * Helper de Ajuste Automático 2: Divisão Igualitária entre Veículos Ativos
 */
export function distributeEqually(targetTotal, vehicles = AUDITED_REAL_FLEET_PROVISION) {
  const result = {};
  const activeVehicles = vehicles.filter(v => v.recebeAporteAmbipar);
  if (activeVehicles.length === 0) return result;

  const equalVal = Math.floor((targetTotal / activeVehicles.length) / 50) * 50;
  let allocatedSum = 0;

  activeVehicles.forEach((v, index) => {
    if (index === activeVehicles.length - 1) {
      result[v.placa] = Number((targetTotal - allocatedSum).toFixed(2));
    } else {
      result[v.placa] = equalVal;
      allocatedSum += equalVal;
    }
  });

  vehicles.forEach(v => {
    if (!v.recebeAporteAmbipar) {
      result[v.placa] = 0;
    }
  });

  return result;
}

/**
 * Helper de Ajuste Automático 3: Proporcional aos KMs Rodados na Semana
 */
export function distributeByKm(targetTotal, vehicles = AUDITED_REAL_FLEET_PROVISION) {
  const result = {};
  const activeVehicles = vehicles.filter(v => v.recebeAporteAmbipar);
  if (activeVehicles.length === 0) return result;

  const totalActiveKm = activeVehicles.reduce((acc, v) => acc + (Number(v.kmRodado) || 0), 0);
  if (totalActiveKm === 0) return distributeEqually(targetTotal, vehicles);

  let allocatedSum = 0;
  activeVehicles.forEach((v, index) => {
    if (index === activeVehicles.length - 1) {
      result[v.placa] = Number((targetTotal - allocatedSum).toFixed(2));
    } else {
      const kmRatio = (Number(v.kmRodado) || 0) / totalActiveKm;
      const val = Math.round((targetTotal * kmRatio) / 50) * 50;
      result[v.placa] = val;
      allocatedSum += val;
    }
  });

  vehicles.forEach(v => {
    if (!v.recebeAporteAmbipar) {
      result[v.placa] = 0;
    }
  });

  return result;
}

/**
 * Função utilitária para calcular o resumo consolidado de um ciclo
 * Suporta cotas customizadas (edição manual/ajuste automático) e modalidade global
 */
export function calculateCycleTotals(cycle, marginPct = 11.8, customQuotas = null, isGlobalAporte = false, targetGlobalTotal = 17000.00) {
  if (!cycle || !cycle.veiculosAbastecidos) {
    return {
      totalVeiculos: 7,
      veiculosComCota: 5,
      veiculosValeZero: 2,
      totalGasto: 15133.98,
      totalKm: 5540,
      totalDiesel: 2335,
      totalArla: 109,
      mediaFrotaKmL: '2.37',
      totalAporteSugerido: 17000.00,
      precoMedioDiesel: '6.30',
      margemTotalRS: 1866.02
    };
  }

  let totalGasto = 0;
  let totalKm = 0;
  let totalDiesel = 0;
  let totalArla = 0;
  let totalAporteSugerido = 0;
  let veiculosComCota = 0;
  let veiculosValeZero = 0;

  cycle.veiculosAbastecidos.forEach(v => {
    if (v.recebeAporteAmbipar) {
      veiculosComCota++;
      totalGasto += Number(v.valorTotalGasto) || 0;
      totalKm += Number(v.kmRodado) || 0;
      totalDiesel += Number(v.litrosDieselTotal) || 0;
      totalArla += Number(v.litrosArlaTotal) || 0;

      if (customQuotas && customQuotas[v.placa] !== undefined) {
        totalAporteSugerido += Number(customQuotas[v.placa]) || 0;
      } else {
        totalAporteSugerido += Number(v.solicitacaoAporteSugerido) || 0;
      }
    } else {
      veiculosValeZero++;
    }
  });

  // Se estiver em modo aporte global unificado sem divisão
  if (isGlobalAporte && targetGlobalTotal) {
    totalAporteSugerido = Number(targetGlobalTotal) || 17000.00;
  }

  const mediaFrotaKmL = totalDiesel > 0 ? (totalKm / totalDiesel).toFixed(2) : '2.37';
  const precoMedioDiesel = totalDiesel > 0 ? (totalGasto / totalDiesel).toFixed(2) : '6.30';
  const margemTotalRS = totalAporteSugerido - totalGasto;

  return {
    totalVeiculos: cycle.veiculosAbastecidos.length,
    veiculosComCota,
    veiculosValeZero,
    totalGasto,
    totalKm,
    totalDiesel,
    totalArla,
    mediaFrotaKmL,
    totalAporteSugerido: totalAporteSugerido || 17000.00,
    precoMedioDiesel,
    margemTotalRS
  };
}

/**
 * Gera mensagem estruturada executiva pronta para copiar para o WhatsApp / E-mail do Gestor
 * Suporta:
 * - withTechnicalMotives: true (completo com pilares) | false (simplificado)
 * - isGlobalAporte: true (saldo global sem divisão) | false (divisão por veículo)
 * - customQuotas: valores editados manualmente ou via assistente automático
 */
export function generateManagerWhatsAppMessage(
  cycle,
  settings = DEFAULT_CYCLE_SETTINGS,
  marginPct = 11.8,
  withTechnicalMotives = true,
  isGlobalAporte = false,
  customQuotas = null
) {
  const totals = calculateCycleTotals(cycle, marginPct, customQuotas, isGlobalAporte);

  const lines = [
    `*📋 SOLICITAÇÃO SEMANAL DE APORTE DE COMBUSTÍVEL · AMBIPAR RJ*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Gestor:* ${settings.gestorNome} (${settings.gestorCargo})`,
    `👨‍💻 *Analista Solicitante:* ${settings.analistaResponsavel} (${settings.analistaCargo})`,
    `📅 *Ciclo:* Fechamento Quarta-feira (17h) | Envio Quinta-feira (08h)`,
    `💳 *Convênio:* ${settings.convenioPadrao}`,
    `⚙️ *Modalidade:* ${isGlobalAporte ? '🏢 APORTE GLOBAL UNIFICADO (Saldo Master Abank)' : '🚛 APORTE COM DIVISÃO POR VEÍCULO (Cotas nos Cartões)'}`,
    ``,
    `💰 *VALOR TOTAL DO APORTE SOLICITADO: R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
    `• Gasto Real Previsto no Período: R$ ${totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `• Margem Técnica de Segurança: R$ ${totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (+${marginPct}%)`
  ];

  if (withTechnicalMotives) {
    lines.push(
      ``,
      `🎯 *JUSTIFICATIVA TÉCNICA OPERACIONAL DO VALOR:*`,
      `1. *Veículos da Vale (Cota R$ 0,00):* Os veículos dedicados à Vale S.A. (RHU-6I87 e GEB-8C37) NÃO consomem este aporte pois o combustível é fornecido diretamente pelo cliente.`,
      `2. *Amazon CD Meriti (GIG 1 / GIG 7):* Atendimento esporádico/sob demanda. A cota provê prontidão para saídas imediatas assim que a solicitação for acionada.`,
      `3. *Consumo por Tomada de Força (PTO):* Caminhões de Hidrovácuo (FMB-1H09) operam com sucção ligada sem rodar KM de odômetro.`,
      `4. *Margem Significativa de Segurança:* Garante que nenhum caminhão com resíduos perigosos sofra pane seca em trânsito no RJ.`
    );
  }

  if (isGlobalAporte) {
    // MODALIDADE GLOBAL SEM DIVISÃO
    lines.push(
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏢 *SALDO GLOBAL UNIFICADO NA CONTA MASTER ABANK:*`,
      `• *Valor Solicitado:* *R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* na Conta Master Corporativa.`,
      `• *Critério de Uso:* Disponibilização flexível para a frota ativa atendida pela Ambipar (5 veículos: EWX-0I82, FVV-0E16, FMB-1H09, RAW-1B54, GBU-0A23) conforme a dinâmica real da semana, sem travas rígidas individuais.`,
      `• *Veículos da Vale:* RHU-6I87 e GEB-8C37 têm *R$ 0,00* pois são abastecidos no terminal da Vale.`,
      `• *Amazon GIG 1/7:* Cobertura sob demanda assegurada pelo saldo unificado.`
    );
  } else {
    // MODALIDADE COM DIVISÃO POR VEÍCULO
    lines.push(
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔍 *DISTRIBUIÇÃO POR VEÍCULO / CARTÃO ABANK:*`
    );

    cycle.veiculosAbastecidos.forEach((v, index) => {
      const quota = customQuotas && customQuotas[v.placa] !== undefined
        ? customQuotas[v.placa]
        : v.solicitacaoAporteSugerido;

      if (v.recebeAporteAmbipar) {
        lines.push(
          `${index + 1}) *${v.placa}* (${v.modelo.split(' ')[0]} ${v.modelo.split(' ')[1] || ''}) · ${v.operacao.split('/')[0]}`,
          `   • Cartão Abank: *${v.cartaoNumero}*`,
          `   👉 *COTA DE APORTE ALOCADA: R$ ${Number(quota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`
        );
        if (withTechnicalMotives) {
          lines.push(`   • Motivo: ${v.motivoTecnico.slice(0, 95)}...`);
        }
        lines.push(``);
      } else {
        // Veículo da Vale
        lines.push(
          `${index + 1}) *${v.placa}* (${v.modelo.split(' ')[0]} ${v.modelo.split(' ')[1] || ''}) · ${v.operacao}`,
          `   • Cartão: *Sem Cartão Abank* (Abastecimento Direto Vale)`,
          `   👉 *COTA DE APORTE: R$ 0,00*`
        );
        if (withTechnicalMotives) {
          lines.push(`   • Motivo: 100% abastecido internamente pela Vale S.A. Não consome saldo Ambipar.`);
        }
        lines.push(``);
      }
    });
  }

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ *Ação Solicitada:* Autorização e liberação de R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} na plataforma Abank Frota.`,
    `Sistema CCO Ambipar Logistics · Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`
  );

  return lines.join('\n');
}

/**
 * Exporta dados do Aporte Semanal em formato CSV compatível com Excel
 */
export function exportCycleToCSV(cycle, marginPct = 11.8, isGlobalAporte = false, customQuotas = null) {
  const totals = calculateCycleTotals(cycle, marginPct, customQuotas, isGlobalAporte);
  
  const headers = [
    'Placa',
    'Prefixo',
    'Modelo',
    'Operacao',
    'Recebe_Aporte_Ambipar',
    'Cartao_Abank',
    'KM_Rodado',
    'Diesel_Litros',
    'Gasto_Real_RS',
    'Margem_Seguranca_RS',
    'Cota_Aporte_RS',
    'Modalidade_Aporte',
    'Motivo_Tecnico'
  ];

  const rows = cycle.veiculosAbastecidos.map(v => {
    const quota = customQuotas && customQuotas[v.placa] !== undefined
      ? customQuotas[v.placa]
      : v.solicitacaoAporteSugerido;

    return [
      v.placa,
      v.prefixo,
      `"${v.modelo}"`,
      `"${v.operacao}"`,
      v.recebeAporteAmbipar ? 'SIM' : 'NAO (VALE)',
      `"${v.cartaoNumero}"`,
      v.kmRodado,
      v.litrosDieselTotal,
      v.valorTotalGasto.toFixed(2),
      (v.margemSegurancaRS || 0).toFixed(2),
      isGlobalAporte ? (v.recebeAporteAmbipar ? 'SALDO_GLOBAL' : '0.00') : Number(quota).toFixed(2),
      isGlobalAporte ? 'GLOBAL_UNIFICADO_ABANK' : 'COM_DIVISAO_INDIVIDUAL',
      `"${v.motivoTecnico}"`
    ].join(';');
  });

  const totalsRow = [
    'TOTAL_GERAL',
    '-',
    '-',
    '-',
    '5 VEICULOS ATIVOS',
    isGlobalAporte ? 'CONTA MASTER ABANK' : '5 CARTOES ABANK',
    totals.totalKm,
    totals.totalDiesel.toFixed(1),
    totals.totalGasto.toFixed(2),
    totals.margemTotalRS.toFixed(2),
    totals.totalAporteSugerido.toFixed(2),
    isGlobalAporte ? 'SALDO_GLOBAL_UNIFICADO' : 'DISTRIBUICAO_INDIVIDUAL',
    `"${isGlobalAporte ? 'Aporte Global unificado na Conta Master Abank sem divisao previa.' : 'Divisao de cotas individuais nos cartoes Abank. Veiculos Vale com cota R$ 0,00.'}"`
  ].join(';');

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows, totalsRow].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Aporte_Semanal_Abank_${isGlobalAporte ? 'Global_' : 'Divisao_'}${totals.totalAporteSugerido.toFixed(0)}k_${cycle.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * GERADOR DE PDF / IMPRESSÃO EM JANELA LIMPA ISOLADA
 * Resolve 100% o bug onde o PDF ficava desconfigurado/cortado.
 * Renderiza em janela limpa independente de qualquer elemento do layout React.
 */
export function printAporteDossierCleanWindow(doc, isGlobalAporte = false, withTechnicalMotives = true, customQuotas = null) {
  const win = window.open('', '_blank', 'width=1050,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (!win) {
    alert('Por favor, autorize a abertura de pop-ups no seu navegador para visualizar e salvar o PDF limpo.');
    return;
  }

  const veiculos = doc.veiculos || AUDITED_REAL_FLEET_PROVISION;
  const isWithMotives = doc.withTechnicalMotives !== undefined ? doc.withTechnicalMotives : withTechnicalMotives;
  const isGlobal = doc.isGlobalAporte !== undefined ? doc.isGlobalAporte : isGlobalAporte;
  const totalGeral = doc.valorTotalSolicitado || 17000.00;

  const htmlRows = veiculos.map(v => {
    const isVale = !v.recebeAporteAmbipar;
    const quota = customQuotas && customQuotas[v.placa] !== undefined
      ? customQuotas[v.placa]
      : v.solicitacaoAporteSugerido;

    return `
      <tr class="${isVale ? 'tr-vale' : ''}">
        <td class="bold-cell">
          <strong>${v.placa}</strong><br>
          <span class="sub-label">${v.prefixo}</span>
        </td>
        <td>
          <div class="model-title">${v.modelo}</div>
          <div class="op-desc">${v.operacao} ${v.isSporadicGIG ? '<span class="pill-gig">ESPORÁDICO</span>' : ''}</div>
        </td>
        <td class="center-cell">
          ${isVale 
            ? '<span class="pill-vale">Abastecido pela Vale (R$ 0,00)</span>' 
            : `<strong class="card-num">${v.cartaoNumero}</strong>`}
        </td>
        <td class="right-cell">${Number(v.kmRodado || 0).toLocaleString('pt-BR')} km</td>
        <td class="right-cell">${isVale ? '-' : `${v.litrosDieselTotal} L`}</td>
        <td class="right-cell">${isVale ? 'R$ 0,00' : `R$ ${Number(v.valorTotalGasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</td>
        <td class="right-cell ${isVale ? '' : 'text-emerald'}">
          ${isVale ? '-' : `+ R$ ${Number(v.margemSegurancaRS || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        </td>
        <td class="right-cell highlight-cell">
          ${isVale 
            ? '<strong class="text-vale">R$ 0,00 (Vale)</strong>' 
            : (isGlobal 
                ? '<span class="text-global">Saldo Global Master</span>' 
                : `<strong>R$ ${Number(quota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>`)}
        </td>
      </tr>
    `;
  }).join('');

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Solicitação de Aporte Semanal · Ambipar CCO RJ · ${doc.numeroProtocolo || 'AMB-APORTE'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
    }
    .print-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 20px;
    }
    .btn-print {
      background: #166534;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-print:hover {
      background: #15803d;
    }
    @media print {
      .print-controls { display: none !important; }
      body { padding: 0 !important; }
    }
    .doc-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      padding: 24px;
      border-radius: 8px;
      background: #ffffff;
    }
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #166534;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .logo-badge {
      display: inline-block;
      background: #166534;
      color: #ffffff;
      font-weight: 900;
      font-size: 16px;
      letter-spacing: 2px;
      padding: 4px 12px;
      border-radius: 4px;
    }
    .header-subtext h2 {
      margin: 6px 0 2px 0;
      font-size: 13px;
      color: #166534;
      text-transform: uppercase;
      font-weight: 800;
    }
    .header-subtext p {
      margin: 0;
      font-size: 10px;
      color: #64748b;
    }
    .protocol-box {
      text-align: right;
      font-size: 10px;
      color: #334155;
    }
    .protocol-box strong {
      display: block;
      font-size: 11px;
      color: #1e293b;
      font-family: monospace;
    }
    .title-banner {
      background: #f8fafc;
      border-left: 4px solid #166534;
      padding: 10px 14px;
      margin-bottom: 16px;
      border-radius: 0 6px 6px 0;
    }
    .title-banner h1 {
      margin: 0 0 4px 0;
      font-size: 15px;
      color: #0f172a;
      font-weight: 800;
    }
    .title-banner p {
      margin: 0;
      font-size: 11px;
      color: #475569;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .info-card label {
      display: block;
      font-size: 9px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
    }
    .info-card strong {
      display: block;
      font-size: 12px;
      color: #0f172a;
      margin-top: 2px;
    }
    .info-card span {
      display: block;
      font-size: 9.5px;
      color: #64748b;
    }
    .highlight-card strong {
      color: #166534;
      font-size: 13px;
    }
    .motivo-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .motivo-box h3 {
      margin: 0 0 8px 0;
      font-size: 11.5px;
      color: #166534;
      font-weight: 800;
      text-transform: uppercase;
    }
    .motivo-item {
      margin-bottom: 6px;
      font-size: 10.5px;
      color: #1e293b;
    }
    .motivo-item strong {
      color: #0f172a;
    }
    .global-mode-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .global-mode-box h3 {
      margin: 0 0 6px 0;
      font-size: 11.5px;
      color: #1d4ed8;
      font-weight: 800;
      text-transform: uppercase;
    }
    .global-mode-box p {
      margin: 0 0 6px 0;
      font-size: 10.5px;
      color: #1e3a8a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 7px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-size: 10px;
      vertical-align: middle;
    }
    .tr-vale {
      background: #fffbeb;
    }
    .bold-cell strong {
      font-family: monospace;
      font-size: 11px;
    }
    .sub-label {
      font-size: 8.5px;
      color: #64748b;
      font-weight: 600;
    }
    .model-title {
      font-weight: 600;
      color: #0f172a;
    }
    .op-desc {
      font-size: 9px;
      color: #64748b;
    }
    .pill-gig {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 7.5px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      margin-left: 4px;
    }
    .pill-vale {
      background: #fef3c7;
      color: #92400e;
      font-size: 8.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }
    .card-num {
      color: #0369a1;
      font-family: monospace;
      font-size: 10px;
    }
    .center-cell { text-align: center; }
    .right-cell { text-align: right; font-family: monospace; }
    .highlight-cell {
      background: #f0fdf4;
      font-weight: 700;
      color: #166534;
      font-size: 10.5px;
    }
    .text-emerald { color: #16a34a; }
    .text-vale { color: #b45309; }
    .text-global { color: #2563eb; font-size: 9px; }
    tfoot td {
      background: #f8fafc;
      font-weight: 800;
      border-top: 2px solid #0f172a;
    }
    .signatures-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 28px;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
    }
    .sig-box strong {
      display: block;
      font-size: 11px;
      color: #0f172a;
    }
    .sig-box span {
      display: block;
      font-size: 9.5px;
      color: #64748b;
    }
    .footer-stamp {
      margin-top: 20px;
      text-align: center;
      font-size: 8.5px;
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <div>
      <strong>Visualização Executiva de Impressão · Ambipar Logistics CCO</strong><br>
      <span style="font-size: 11px; color: #64748b;">Este documento é gerado em layout padrão A4 certificado para impressão e salvamento em PDF sem bugs visuais.</span>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  </div>

  <div class="doc-container">
    <div class="doc-header">
      <div>
        <span class="logo-badge">AMBIPAR</span>
        <div class="header-subtext">
          <h2>Ambipar Logistics & Environmental Solutions</h2>
          <p>Gestão Integrada de Frotas & Torre de Controle CCO · Base Duque de Caxias / RJ</p>
        </div>
      </div>
      <div class="protocol-box">
        PROTOCOLO OFICIAL
        <strong>${doc.numeroProtocolo || 'AMB-APORTE-2026-W43/001'}</strong>
        <span>Fechamento: Quarta 17h | Envio: Quinta 08h</span>
      </div>
    </div>

    <div class="title-banner">
      <h1>SOLICITAÇÃO OFICIAL DE APORTE SEMANAL · CARTÃO ABANK FROTA</h1>
      <p>
        Demonstrativo corporativo de solicitação de saldo de <strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
        Modalidade: <strong>${isGlobal ? 'Aporte Global Unificado (Saldo na Conta Master Abank)' : 'Aporte com Divisão por Veículo (Cotas nos Cartões Abank)'}</strong>.
      </p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <label>Gestor Aprovador:</label>
        <strong>${doc.gestorNome || 'Eng. Roberto Albuquerque'}</strong>
        <span>${doc.gestorCargo || 'Gerente Geral Logística RJ'}</span>
      </div>
      <div class="info-card">
        <label>Analista CCO:</label>
        <strong>${doc.analistaNome || 'Carlos dos Santos'}</strong>
        <span>${doc.analistaCargo || 'Analista de Operações'}</span>
      </div>
      <div class="info-card">
        <label>Convênio de Abastecimento:</label>
        <strong>${doc.convenio || 'Cartão Abank Frota'}</strong>
        <span>Recargas Corporativas</span>
      </div>
      <div class="info-card highlight-card">
        <label>Total do Aporte Solicitado:</label>
        <strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        <span>5 Veículos Ativos | 2 Veículos Vale (R$ 0,00)</span>
      </div>
    </div>

    ${isGlobal ? `
      <div class="global-mode-box">
        <h3>Modalidade Executiva: Aporte Global Unificado sem Divisão Prévia</h3>
        <p>
          O saldo total de <strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> é solicitado como crédito unificado centralizado na <strong>Conta Master Abank Frota Corporativa</strong>.
          Esta configuração confere flexibilidade dinâmica à Torre CCO para abastecer os 5 caminhões ativos da Ambipar sem travas rígidas de limite individual por cartão, absorvendo variações de viagens e demandas esporádicas.
        </p>
        <p style="margin: 0; font-size: 10px;">
          <em>Nota de Diretriz:</em> Os caminhões dedicados à <strong>Vale S.A. (RHU-6I87 e GEB-8C37) continuam com cota R$ 0,00</strong>, pois são 100% abastecidos nos terminais do cliente.
        </p>
      </div>
    ` : ''}

    ${isWithMotives ? `
      <div class="motivo-box">
        <h3>1. Justificativa Técnica Operacional & Regras de Atendimento</h3>
        <div class="motivo-item">
          <strong>• Veículos da Vale S.A. (Cota R$ 0,00):</strong> Os caminhões RHU-6I87 e GEB-8C37 <em>NÃO recebem abastecimento da nossa parte e não possuem Cartão Abank</em>. O diesel é fornecido diretamente pela Vale em seus terminais/minas e suas cotas constam zeradas no aporte Ambipar.
        </div>
        <div class="motivo-item">
          <strong>• Amazon CD Meriti (GIG 1 / GIG 7 - Solicitação Esporádica):</strong> Atendimento sob demanda e não rota diária fixa. A provisão alocada garante saldo de prontidão para acionamento imediato.
        </div>
        <div class="motivo-item">
          <strong>• Tomada de Força (PTO):</strong> Caminhão de Hidrovácuo (FMB-1H09) opera com motor a 1.400 RPM em sucção contínua e basculamento consumindo combustível estacionado.
        </div>
        <div class="motivo-item">
          <strong>• Margem Significativa de Segurança:</strong> Provisão preventiva contra retenções na Rodovia Presidente Dutra e Linha Vermelha para garantir que nenhum veículo com resíduos perigosos sofra pane seca em trânsito.
        </div>
      </div>
    ` : ''}

    <h3>${isGlobal ? '2. Matriz de Referência Operacional da Frota (Consumo Histórico e KM)' : '2. Matriz de Alocação de Cotas por Veículo / Cartão Abank'}</h3>
    <table>
      <thead>
        <tr>
          <th>Placa / Prefixo</th>
          <th>Modelo & Operação</th>
          <th>Cartão Abank</th>
          <th style="text-align: right;">KM Rodado</th>
          <th style="text-align: right;">Diesel (L)</th>
          <th style="text-align: right;">Gasto Real (R$)</th>
          <th style="text-align: right;">Margem (+11.8%)</th>
          <th style="text-align: right; background: #e2e8f0; color: #0f172a;">${isGlobal ? 'Alocação' : 'Cota Aporte (R$)'}</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>TOTAL CONSOLIDADO (5 AMBIPAR + 2 VALE)</strong></td>
          <td class="right-cell"><strong>${Number(doc.totalKm || 5540).toLocaleString('pt-BR')} km</strong></td>
          <td class="right-cell"><strong>${Number(doc.totalDiesel || 2335).toLocaleString('pt-BR')} L</strong></td>
          <td class="right-cell"><strong>R$ ${Number(doc.valorGastoReal || 15133.98).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
          <td class="right-cell text-emerald"><strong>+ R$ ${Number(doc.valorMargemSeguranca || 1866.02).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
          <td class="right-cell highlight-cell" style="font-size: 12px;"><strong>R$ ${Number(totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div class="signatures-block">
      <div class="sig-box">
        <strong>${doc.analistaNome || 'Carlos dos Santos'}</strong>
        <span>Analista de Operações & CCO Ambipar</span>
        <span style="font-size: 8.5px; color: #94a3b8; margin-top: 3px;">Assinatura Digital / Emissor</span>
      </div>
      <div class="sig-box">
        <strong>${doc.gestorNome || 'Eng. Roberto Albuquerque'}</strong>
        <span>Gerente Geral de Logística & Operações RJ</span>
        <span style="font-size: 8.5px; color: #94a3b8; margin-top: 3px;">Aprovação & Liberação Abank</span>
      </div>
    </div>

    <div class="footer-stamp">
      Ambipar Logistics · CCO Torre de Controle Rio de Janeiro · Documento Oficial Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)} · Protocolo: ${doc.numeroProtocolo || 'AMB-APORTE'}
    </div>
  </div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}
