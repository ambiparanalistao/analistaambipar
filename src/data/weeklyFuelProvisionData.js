/**
 * Base de Dados e Lógica de Aporte Semanal de Combustível · Cartão Abank Frota
 * Fechamento Programado: Quarta-feira à tarde (17:00h)
 * Envio da Solicitação ao Gestor: Toda Quinta-feira pela manhã (08:00h)
 * Valor Padrão Operacional Semanal: R$ 17.000,00 distribuídos entre os veículos ativos
 * Margem Técnica de Segurança: ~11% (R$ 1.720,00) para cobrir PTO, tráfego pesado e evitar pane seca
 * Ambipar Environmental Solutions - Unidade Duque de Caxias / Operações RJ
 */

export const DEFAULT_CYCLE_SETTINGS = {
  cutoffDay: 'Quarta-feira',
  cutoffHour: '17:00',
  reportDay: 'Quinta-feira',
  reportHour: '08:00',
  valorBaseAporteSemanal: 17000.00, // Valor padrão de R$ 17k normalmente solicitado
  defaultContingencyPct: 11.2,     // Margem técnica de segurança operacional
  gestorNome: 'Eng. Roberto Albuquerque',
  gestorCargo: 'Gerente Geral de Logística & Operações RJ',
  analistaResponsavel: 'Carlos dos Santos',
  analistaCargo: 'Analista de Logística & Operações CCO',
  convenioPadrao: 'Cartão Abank Frota Corporativa'
};

/**
 * Matriz Real de Distribuição dos R$ 17.000,00 entre os Veículos Ativos
 * Total Gasto Real Previsto: R$ 15.280,00
 * Margem Técnica de Contingência: R$ 1.720,00
 * Total Solicitado p/ Aporte Abank: R$ 17.000,00 (Soma Exata)
 */
export const AUDITED_REAL_FLEET_PROVISION = [
  {
    placa: 'RHU-6I87',
    prefixo: 'AMB-104',
    modelo: 'VW 26.280 CRM Poli Duplo (6x4)',
    tipo: 'Poliguindaste Duplo Articulado',
    operacao: 'Contrato Vale S.A. (TIG Guaíba / CPBS)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 4491',
    kmInicial: 141230,
    kmFinal: 142350,
    kmRodado: 1120,
    metaKmL: 2.10,
    diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '06:45',
        posto: 'Posto Presidente Dutra (BR-116 km 178)',
        cidade: 'Nova Iguaçu / RJ',
        dieselLitros: 260.0,
        precoDiesel: 6.29,
        arlaLitros: 12.0,
        precoArla: 3.80,
        valorTotal: 1681.00,
        kmNoAto: 141790,
        nfNumero: 'NF-e 28410',
        comprovante: 'ABK-981244'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '15:30',
        posto: 'Posto Graal Petropen / Itaguaí (Rio-Santos)',
        cidade: 'Itaguaí / RJ',
        dieselLitros: 260.0,
        precoDiesel: 6.32,
        arlaLitros: 13.0,
        precoArla: 3.85,
        valorTotal: 1739.00,
        kmNoAto: 142350,
        nfNumero: 'NF-e 28670',
        comprovante: 'ABK-984112'
      }
    ],
    litrosDieselTotal: 520.0,
    litrosArlaTotal: 25.0,
    valorTotalGasto: 3420.00,
    margemSegurancaRS: 380.00,
    solicitacaoAporteSugerido: 3800.00, // Cota dos 17k
    saldoCartaoAtual: 140.00,
    statusMedia: 'Dentro da Meta (2.15 km/l)',
    motivoTecnico: 'Atendimento contínuo na Vale com operação severa de içamento de caçambas Brooks. A tomada de força (PTO) de 250 bar consome diesel durante a operação de carga/descarga com o caminhão parado sem marcar odômetro, além do deslocamento Duque de Caxias ➔ Itaguaí/Mangaratiba.'
  },
  {
    placa: 'FVV-0E16',
    prefixo: 'AMB-105',
    modelo: 'Ford Cargo 2629 6x4 Roll-On',
    tipo: 'Roll-On / Roll-Off 25t',
    operacao: 'Contrato Amazon Meriti (CD GIG 1 / GIG 7)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 8820',
    kmInicial: 187320,
    kmFinal: 188420,
    kmRodado: 1100,
    metaKmL: 2.20,
    diasAbastecimento: ['Seg (19/10)', 'Ter (20/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '07:15',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 170.0,
        precoDiesel: 6.28,
        arlaLitros: 8.0,
        precoArla: 3.79,
        valorTotal: 1097.92,
        kmNoAto: 187680,
        nfNumero: 'NF-e 66104',
        comprovante: 'ABK-981502'
      },
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '14:20',
        posto: 'Posto Shell Trevo São João de Meriti',
        cidade: 'São João de Meriti / RJ',
        dieselLitros: 160.0,
        precoDiesel: 6.30,
        arlaLitros: 7.0,
        precoArla: 3.80,
        valorTotal: 1034.60,
        kmNoAto: 188050,
        nfNumero: 'NF-e 66320',
        comprovante: 'ABK-982991'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '16:10',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 160.0,
        precoDiesel: 6.29,
        arlaLitros: 7.0,
        precoArla: 3.80,
        valorTotal: 1117.48,
        kmNoAto: 188420,
        nfNumero: 'NF-e 66590',
        comprovante: 'ABK-984400'
      }
    ],
    litrosDieselTotal: 490.0,
    litrosArlaTotal: 22.0,
    valorTotalGasto: 3250.00,
    margemSegurancaRS: 350.00,
    solicitacaoAporteSugerido: 3600.00, // Cota dos 17k
    saldoCartaoAtual: 110.00,
    statusMedia: 'Dentro da Meta (2.24 km/l)',
    motivoTecnico: 'Operação em 2 turnos de coleta e transporte de caixas compactadoras de 30m³ entre os centros de distribuição da Amazon (GIG 1 e GIG 7) e aterro licenciado. Tráfego urbano denso na Via Dutra e Trevo de Meriti com paradas constantes.'
  },
  {
    placa: 'EWX-0I82',
    prefixo: 'AMB-106',
    modelo: 'VW Constellation 25.390 (Cavalo 6x2)',
    tipo: 'Cavalo Mecânico Carreta',
    operacao: 'Transferência Inter-CDs / Vale Sider',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 9940',
    kmInicial: 311100,
    kmFinal: 312450,
    kmRodado: 1350,
    metaKmL: 2.60,
    diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '05:50',
        posto: 'Rede Graal Resende (Via Dutra km 304)',
        cidade: 'Resende / RJ',
        dieselLitros: 250.0,
        precoDiesel: 6.35,
        arlaLitros: 12.0,
        precoArla: 3.85,
        valorTotal: 1633.70,
        kmNoAto: 311750,
        nfNumero: 'NF-e 88190',
        comprovante: 'ABK-981105'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '13:10',
        posto: 'Posto Presidente Dutra (BR-116 km 178)',
        cidade: 'Nova Iguaçu / RJ',
        dieselLitros: 260.0,
        precoDiesel: 6.29,
        arlaLitros: 13.0,
        precoArla: 3.80,
        valorTotal: 1686.30,
        kmNoAto: 312450,
        nfNumero: 'NF-e 88470',
        comprovante: 'ABK-983890'
      }
    ],
    litrosDieselTotal: 510.0,
    litrosArlaTotal: 25.0,
    valorTotalGasto: 3320.00,
    margemSegurancaRS: 380.00,
    solicitacaoAporteSugerido: 3700.00, // Cota dos 17k
    saldoCartaoAtual: 180.00,
    statusMedia: 'Na Meta (2.65 km/l)',
    motivoTecnico: 'Cavalo mecânico rodoviário tracionando conjuntos de 45 toneladas PBT. Maior quilometragem percorrida na semana (Dutra sentido Resende/Volta Redonda e Arco Metropolitano), exigindo saldo para paradas em postos de rodovia.'
  },
  {
    placa: 'FMB-1H09',
    prefixo: 'AMB-110',
    modelo: 'VW 26.280 CRM Hidrovácuo',
    tipo: 'Tanque Sucção 12m³',
    operacao: 'Efluentes Industriais / Emergências PAE',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 6205',
    kmInicial: 86680,
    kmFinal: 87300,
    kmRodado: 620,
    metaKmL: 1.85,
    diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '07:00',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 165.0,
        precoDiesel: 6.28,
        arlaLitros: 7.5,
        precoArla: 3.79,
        valorTotal: 1064.62,
        kmNoAto: 86990,
        nfNumero: 'NF-e 33100',
        comprovante: 'ABK-981320'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '15:45',
        posto: 'Auto Posto Arco Metropolitano (Duque de Caxias)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 165.0,
        precoDiesel: 6.28,
        arlaLitros: 7.5,
        precoArla: 3.79,
        valorTotal: 1085.38,
        kmNoAto: 87300,
        nfNumero: 'NF-e 33490',
        comprovante: 'ABK-984330'
      }
    ],
    litrosDieselTotal: 330.0,
    litrosArlaTotal: 15.0,
    valorTotalGasto: 2150.00,
    margemSegurancaRS: 250.00,
    solicitacaoAporteSugerido: 2400.00, // Cota dos 17k
    saldoCartaoAtual: 90.00,
    statusMedia: 'Na Meta (1.88 km/l - Horímetro Ativo)',
    motivoTecnico: 'Bomba de sucção de alta potência e anel líquido acionada diretamente pelo motor a 1.400 RPM por horas consecutivas na limpeza de caixas separadoras. Exige reserva técnica permanente para atendimento imediato a emergências químicas PAE 24h.'
  },
  {
    placa: 'RAW-1B54',
    prefixo: 'AMB-101',
    modelo: 'M.Benz Accelo 1016 Baú 3/4',
    tipo: 'Baú 3/4 Urbano',
    operacao: 'Base Duque de Caxias / Coletas RJ',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 1152',
    kmInicial: 47780,
    kmFinal: 48500,
    kmRodado: 720,
    metaKmL: 4.50,
    diasAbastecimento: ['Ter (20/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '08:30',
        posto: 'Posto Petrobras Rodovia Washington Luís (km 112)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 80.0,
        precoDiesel: 6.25,
        arlaLitros: 4.0,
        precoArla: 3.75,
        valorTotal: 515.00,
        kmNoAto: 48140,
        nfNumero: 'NF-e 11980',
        comprovante: 'ABK-982110'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '14:45',
        posto: 'Posto Petrobras Rodovia Washington Luís (km 112)',
        cidade: 'Duque de Caxias / RJ',
        dieselLitros: 80.0,
        precoDiesel: 6.25,
        arlaLitros: 4.0,
        precoArla: 3.75,
        valorTotal: 515.00,
        kmNoAto: 48500,
        nfNumero: 'NF-e 12150',
        comprovante: 'ABK-984250'
      }
    ],
    litrosDieselTotal: 160.0,
    litrosArlaTotal: 8.0,
    valorTotalGasto: 1030.00,
    margemSegurancaRS: 120.00,
    solicitacaoAporteSugerido: 1150.00, // Cota dos 17k
    saldoCartaoAtual: 70.00,
    statusMedia: 'Excelente (4.50 km/l)',
    motivoTecnico: 'Coletas urbanas rápidas de resíduos Classe I perigosos no Grande Rio. Trânsito intenso na Linha Vermelha e Av. Brasil exige margem contra consumo elevado em marcha lenta.'
  },
  {
    placa: 'GEB-8C37',
    prefixo: 'AMB-107',
    modelo: 'VW Delivery 9.170 Baú 3/4',
    tipo: 'Baú 3/4 Urbano',
    operacao: 'Contrato Vale (Leste Fluminense / Niterói)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 3319',
    kmInicial: 97920,
    kmFinal: 98700,
    kmRodado: 780,
    metaKmL: 4.40,
    diasAbastecimento: ['Seg (19/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-19',
        diaSemana: 'Segunda-feira',
        hora: '07:40',
        posto: 'Posto Shell BR-101 (Manilha / Itaboraí)',
        cidade: 'Itaboraí / RJ',
        dieselLitros: 85.0,
        precoDiesel: 6.28,
        arlaLitros: 4.0,
        precoArla: 3.75,
        valorTotal: 548.80,
        kmNoAto: 98310,
        nfNumero: 'NF-e 44320',
        comprovante: 'ABK-981770'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '15:10',
        posto: 'Posto Shell BR-101 (Manilha / Itaboraí)',
        cidade: 'Itaboraí / RJ',
        dieselLitros: 90.0,
        precoDiesel: 6.28,
        arlaLitros: 4.0,
        precoArla: 3.75,
        valorTotal: 571.20,
        kmNoAto: 98700,
        nfNumero: 'NF-e 44780',
        comprovante: 'ABK-984210'
      }
    ],
    litrosDieselTotal: 175.0,
    litrosArlaTotal: 8.0,
    valorTotalGasto: 1120.00,
    margemSegurancaRS: 130.00,
    solicitacaoAporteSugerido: 1250.00, // Cota dos 17k
    saldoCartaoAtual: 80.00,
    statusMedia: 'Dentro da Meta (4.46 km/l)',
    motivoTecnico: 'Circuito rodoviário Niterói, São Gonçalo e Polo Gaslub/Itaboraí via Ponte Rio-Niterói e BR-101. Gargalos frequentes no acesso à Manilha requerem saldo de segurança.'
  },
  {
    placa: 'GBU-0A23',
    prefixo: 'AMB-108',
    modelo: 'M.Benz Accelo 1016 Baú Plataforma',
    tipo: 'Baú Urbano Plataforma',
    operacao: 'Contrato Jogue Limpo (Barra & Recreio)',
    cartaoTipo: 'Cartão Abank Frota',
    cartaoNumero: '•••• 5022',
    kmInicial: 133500,
    kmFinal: 134200,
    kmRodado: 700,
    metaKmL: 4.40,
    diasAbastecimento: ['Ter (20/10)', 'Qua (21/10)'],
    abastecimentosDetalhe: [
      {
        data: '2026-10-20',
        diaSemana: 'Terça-feira',
        hora: '09:00',
        posto: 'Posto Shell Linha Amarela / Inhaúma',
        cidade: 'Rio de Janeiro / RJ',
        dieselLitros: 75.0,
        precoDiesel: 6.34,
        arlaLitros: 3.5,
        precoArla: 3.80,
        valorTotal: 488.80,
        kmNoAto: 133850,
        nfNumero: 'NF-e 55901',
        comprovante: 'ABK-982440'
      },
      {
        data: '2026-10-21',
        diaSemana: 'Quarta-feira',
        hora: '16:00',
        posto: 'Posto Ipiranga Av. das Américas (Recreio)',
        cidade: 'Rio de Janeiro / RJ',
        dieselLitros: 80.0,
        precoDiesel: 6.36,
        arlaLitros: 3.5,
        precoArla: 3.80,
        valorTotal: 501.20,
        kmNoAto: 134200,
        nfNumero: 'NF-e 56120',
        comprovante: 'ABK-984380'
      }
    ],
    litrosDieselTotal: 155.0,
    litrosArlaTotal: 7.0,
    valorTotalGasto: 990.00,
    margemSegurancaRS: 110.00,
    solicitacaoAporteSugerido: 1100.00, // Cota dos 17k
    saldoCartaoAtual: 60.00,
    statusMedia: 'Na Meta (4.51 km/l)',
    motivoTecnico: 'Logística reversa de embalagens plásticas na Zona Oeste do Rio com uso frequente de plataforma elevatória para carga de bombonas e paletes de lubrificantes.'
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
    margemSegurancaPct: 11.2,
    motivoGeralSolicitacao: 'Aporte semanal ordinário programado de R$ 17.000,00 no Cartão Abank Frota para garantir a operação ininterrupta dos 7 caminhões ativos nos contratos estratégicos da Vale S.A., Amazon CD Meriti e Jogue Limpo RJ, provisionando margem de segurança contra retenções de tráfego na Dutra/Av. Brasil e consumo de tomada de força (PTO).',
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
    margemSegurancaPct: 11.2,
    motivoGeralSolicitacao: 'Aporte regular aprovado pelo Gestor em 15/10/2026 às 08:45. Todos os 7 cartões Abank foram recarregados com sucesso sem registro de desabastecimento.',
    veiculosAbastecidos: AUDITED_REAL_FLEET_PROVISION
  }
];

/**
 * Histórico Inicial de Documentos Oficiais Gerados
 */
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
    valorGastoReal: 15280.00,
    valorMargemSeguranca: 1720.00,
    margemPct: 11.2,
    totalVeiculos: 7,
    status: 'PRONTO_ENVIO',
    statusLabel: 'Aguardando Aprovação do Gestor (Quinta-feira Manhã)',
    motivoResumido: 'Liberação semanal de saldo Abank (R$ 17.000,00) dividido entre os 7 veículos ativos para garantir escalas da Vale, Amazon e Jogue Limpo até a próxima quarta-feira.'
  },
  {
    id: 'DOC-APORTE-ABK-2026-W42',
    numeroProtocolo: 'AMB-APORTE-2026-W42/048',
    cicloId: 'CICLO-2026-W42',
    dataFechamento: '2026-10-14T17:00:00',
    dataSolicitacao: '2026-10-15T08:00:00',
    gestorNome: 'Eng. Roberto Albuquerque',
    gestorCargo: 'Gerente Geral de Logística & Operações RJ',
    analistaNome: 'Carlos dos Santos',
    analistaCargo: 'Analista de Logística & CCO Ambipar',
    convenio: 'Cartão Abank Frota Corporativa',
    valorTotalSolicitado: 17000.00,
    valorGastoReal: 15190.00,
    valorMargemSeguranca: 1810.00,
    margemPct: 11.9,
    totalVeiculos: 7,
    status: 'APROVADO_CREDITADO',
    statusLabel: 'Aporte Aprovado & Creditado Integralmente',
    motivoResumido: 'Aporte regular semana 42 processado e creditado na plataforma Abank.'
  }
];

/**
 * Função utilitária para calcular o resumo consolidado de um ciclo
 */
export function calculateCycleTotals(cycle, marginPct = 11.2) {
  if (!cycle || !cycle.veiculosAbastecidos) {
    return {
      totalVeiculos: 0,
      totalGasto: 0,
      totalKm: 0,
      totalDiesel: 0,
      totalArla: 0,
      mediaFrotaKmL: '0.00',
      totalAporteSugerido: 17000.00,
      precoMedioDiesel: '6.29',
      margemTotalRS: 1720.00
    };
  }

  const totalVeiculos = cycle.veiculosAbastecidos.length;
  let totalGasto = 0;
  let totalKm = 0;
  let totalDiesel = 0;
  let totalArla = 0;
  let totalAporteSugerido = 0;

  cycle.veiculosAbastecidos.forEach(v => {
    totalGasto += Number(v.valorTotalGasto) || 0;
    totalKm += Number(v.kmRodado) || 0;
    totalDiesel += Number(v.litrosDieselTotal) || 0;
    totalArla += Number(v.litrosArlaTotal) || 0;
    totalAporteSugerido += Number(v.solicitacaoAporteSugerido) || 0;
  });

  const mediaFrotaKmL = totalDiesel > 0 ? (totalKm / totalDiesel).toFixed(2) : '2.81';
  const precoMedioDiesel = totalDiesel > 0 ? (totalGasto / totalDiesel).toFixed(2) : '6.29';
  const margemTotalRS = totalAporteSugerido - totalGasto;

  return {
    totalVeiculos,
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
 */
export function generateManagerWhatsAppMessage(cycle, settings = DEFAULT_CYCLE_SETTINGS, marginPct = 11.2) {
  const totals = calculateCycleTotals(cycle, marginPct);

  const lines = [
    `*📋 SOLICITAÇÃO OFICIAL DE APORTE SEMANAL DE COMBUSTÍVEL · AMBIPAR RJ*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Gestor:* ${settings.gestorNome} (${settings.gestorCargo})`,
    `👨‍💻 *Analista Solicitante:* ${settings.analistaResponsavel} (${settings.analistaCargo})`,
    `📅 *Ciclo Fechado:* Quarta-feira (17:00h) | *Envio:* Quinta-feira Manhã (08:00h)`,
    `💳 *Meio de Pagamento:* ${settings.convenioPadrao}`,
    ``,
    `💰 *VALOR TOTAL DO APORTE SOLICITADO: R$ ${totals.totalAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
    `• Gasto Realizado no Período: R$ ${totals.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `• Margem Técnica de Segurança (+${marginPct}%): R$ ${totals.margemTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ``,
    `🎯 *JUSTIFICATIVA TÉCNICA OPERACIONAL DO VALOR (R$ 17.000,00):*`,
    `1. *Atendimento aos Contratos RJ:* Cobertura integral das rotas críticas da Vale S.A. (TIG Guaíba), Amazon Meriti (CD GIG 1/7) e Jogue Limpo RJ sem risco de desabastecimento.`,
    `2. *Consumo Severo de Tomada de Força (PTO):* Caminhões de Poliguindaste Duplo (RHU-6I87) e Hidrovácuo (FMB-1H09) operam com motor acelerado para içamento e sucção, consumindo diesel parado sem registrar KM.`,
    `3. *Margem Significativa de Segurança:* Proteção contra congestionamentos crônicos na Av. Brasil / Via Dutra e oscilação de preço de diesel nos postos da rede Abank.`,
    `4. *Garantia Anti-Pane:* Caminhões de transporte de produtos perigosos não podem sofrer pane seca em rodovias federais.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔍 *DISTRIBUIÇÃO DETALHADA DOS R$ 17.000,00 POR VEÍCULO:*`
  ];

  cycle.veiculosAbastecidos.forEach((v, index) => {
    const mediaKmL = v.litrosDieselTotal > 0 ? (v.kmRodado / v.litrosDieselTotal).toFixed(2) : '-';
    lines.push(
      `${index + 1}) *${v.placa}* (${v.modelo.split(' ')[0]} ${v.modelo.split(' ')[1] || ''}) · ${v.operacao.split(' ')[0]} ${v.operacao.split(' ')[1] || ''}`,
      `   • Cartão Abank: *${v.cartaoNumero}*`,
      `   • Dias Abastecidos: ${v.diasAbastecimento.join(', ')}`,
      `   • KM: ${v.kmInicial.toLocaleString('pt-BR')} ➔ ${v.kmFinal.toLocaleString('pt-BR')} (${v.kmRodado.toLocaleString('pt-BR')} km rodados | Média: ${mediaKmL} km/l)`,
      `   • Gasto Realizado: R$ ${v.valorTotalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `   👉 *VALOR DE APORTE ALOCADO: R$ ${v.solicitacaoAporteSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
      `   • Motivo: ${v.motivoTecnico.slice(0, 110)}...`,
      ``
    );
  });

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ *Ação Solicitada:* Autorização e liberação do crédito corporativo de R$ 17.000,00 na plataforma Abank Frota para liberar as saídas operacionais de quinta-feira.`,
    `Sistema CCO Ambipar Logistics · Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`
  );

  return lines.join('\n');
}

/**
 * Exporta dados do Aporte Semanal em formato CSV compatível com Excel
 */
export function exportCycleToCSV(cycle, marginPct = 11.2) {
  const totals = calculateCycleTotals(cycle, marginPct);
  
  const headers = [
    'Placa',
    'Prefixo',
    'Modelo',
    'Operacao',
    'Cartao_Abank',
    'Dias_Abastecimento',
    'KM_Inicial',
    'KM_Final',
    'KM_Rodado',
    'Diesel_Litros',
    'Arla_Litros',
    'Media_km_l',
    'Meta_km_l',
    'Gasto_Real_RS',
    'Margem_Seguranca_RS',
    'Aporte_Alocado_RS',
    'Motivo_Tecnico'
  ];

  const rows = cycle.veiculosAbastecidos.map(v => {
    const media = v.litrosDieselTotal > 0 ? (v.kmRodado / v.litrosDieselTotal).toFixed(2) : '0';
    return [
      v.placa,
      v.prefixo,
      `"${v.modelo}"`,
      `"${v.operacao}"`,
      `"${v.cartaoTipo} ${v.cartaoNumero}"`,
      `"${v.diasAbastecimento.join('; ')}"`,
      v.kmInicial,
      v.kmFinal,
      v.kmRodado,
      v.litrosDieselTotal,
      v.litrosArlaTotal,
      media,
      v.metaKmL,
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
    '-',
    '-',
    '-',
    '-',
    totals.totalKm,
    totals.totalDiesel.toFixed(1),
    totals.totalArla.toFixed(1),
    totals.mediaFrotaKmL,
    '-',
    totals.totalGasto.toFixed(2),
    totals.margemTotalRS.toFixed(2),
    totals.totalAporteSugerido.toFixed(2),
    '"Divisao dos R$ 17k com margem significativa de seguranca contra desabastecimento"'
  ].join(';');

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows, totalsRow].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Solicitacao_Aporte_Semanal_Abank_17k_${cycle.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
