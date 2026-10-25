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
 * Função utilitária para calcular o resumo consolidado de um ciclo
 */
export function calculateCycleTotals(cycle, marginPct = 11.8) {
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
      totalAporteSugerido += Number(v.solicitacaoAporteSugerido) || 0;
    } else {
      veiculosValeZero++;
    }
  });

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
 * Suporta o parâmetro withTechnicalMotives (true = detalhado | false = sem motivo / direto aos valores)
 */
export function generateManagerWhatsAppMessage(cycle, settings = DEFAULT_CYCLE_SETTINGS, marginPct = 11.8, withTechnicalMotives = true) {
  const totals = calculateCycleTotals(cycle, marginPct);

  const lines = [
    `*📋 SOLICITAÇÃO SEMANAL DE APORTE DE COMBUSTÍVEL · AMBIPAR RJ*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Gestor:* ${settings.gestorNome} (${settings.gestorCargo})`,
    `👨‍💻 *Analista Solicitante:* ${settings.analistaResponsavel} (${settings.analistaCargo})`,
    `📅 *Ciclo:* Fechamento Quarta-feira (17h) | Envio Quinta-feira (08h)`,
    `💳 *Convênio:* ${settings.convenioPadrao}`,
    ``,
    `💰 *VALOR TOTAL DO APORTE SOLICITADO: R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
    `• Gasto Real Previsto no Período: R$ ${totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `• Margem Técnica de Segurança: R$ ${totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (+${marginPct}%)`
  ];

  if (withTechnicalMotives) {
    lines.push(
      ``,
      `🎯 *JUSTIFICATIVA TÉCNICA OPERACIONAL DO VALOR (R$ 17.000,00):*`,
      `1. *Veículos da Vale (Cota R$ 0,00):* Os veículos dedicados à Vale S.A. (RHU-6I87 e GEB-8C37) NÃO consomem este aporte pois o combustível é fornecido diretamente pelo cliente.`,
      `2. *Amazon CD Meriti (GIG 1 / GIG 7):* Atendimento esporádico/sob demanda. A cota do FVV-0E16 (R$ 4.300) cobre saídas extras assim que a solicitação pontual for acionada.`,
      `3. *Consumo por Tomada de Força (PTO):* Caminhões de Hidrovácuo (FMB-1H09) operam com sucção ligada sem rodar KM de odômetro.`,
      `4. *Margem Significativa de Segurança:* Garante que nenhum caminhão com resíduos perigosos sofra pane seca em trânsito no RJ.`
    );
  }

  lines.push(
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔍 *DISTRIBUIÇÃO DOS R$ 17.000,00 POR VEÍCULO / CARTÃO ABANK:*`
  );

  cycle.veiculosAbastecidos.forEach((v, index) => {
    if (v.recebeAporteAmbipar) {
      lines.push(
        `${index + 1}) *${v.placa}* (${v.modelo.split(' ')[0]} ${v.modelo.split(' ')[1] || ''}) · ${v.operacao.split('/')[0]}`,
        `   • Cartão Abank: *${v.cartaoNumero}*`,
        `   👉 *COTA DE APORTE ALOCADA: R$ ${v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`
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

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ *Ação Solicitada:* Autorização e liberação dos R$ 17.000,00 na plataforma Abank Frota.`,
    `Sistema CCO Ambipar Logistics · Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`
  );

  return lines.join('\n');
}

/**
 * Exporta dados do Aporte Semanal em formato CSV compatível com Excel
 */
export function exportCycleToCSV(cycle, marginPct = 11.8) {
  const totals = calculateCycleTotals(cycle, marginPct);
  
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
    'Motivo_Tecnico'
  ];

  const rows = cycle.veiculosAbastecidos.map(v => {
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
      v.solicitacaoAporteSugerido.toFixed(2),
      `"${v.motivoTecnico}"`
    ].join(';');
  });

  const totalsRow = [
    'TOTAL_GERAL',
    '-',
    '-',
    '-',
    '5 VEICULOS ATIVOS',
    '-',
    totals.totalKm,
    totals.totalDiesel.toFixed(1),
    totals.totalGasto.toFixed(2),
    totals.margemTotalRS.toFixed(2),
    totals.totalAporteSugerido.toFixed(2),
    '"Divisao dos R$ 17.000,00 nos cartoes Abank. Veiculos Vale com cota R$ 0,00."'
  ].join(';');

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows, totalsRow].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Aporte_Semanal_Abank_17k_${cycle.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
